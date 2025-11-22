import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { chatService, type ChatMessage } from "@/lib/ai/chat-service"
import type { UserRole } from "@/lib/roles"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const parameterSchema = z.object({
  min: z.number(),
  max: z.number(),
  value: z.number(),
  label: z.string(),
  unit: z.string().optional(),
})

const instrumentAdviceSchema = z.object({
  instrument: z
    .string()
    .min(1, "Le nom de l'instrument est requis.")
    .catch("Instrument inconnu"),
  description: z.string().optional().default(""),
  parameters: z
    .record(parameterSchema)
    .catch((val, ctx) => {
      console.warn("Paramètres invalides reçus, utilisation d'une valeur vide.", val)
      return {}
    })
    .default({}),
  discipline: z.string().default("physique"),
  question: z.string().optional().default("Comment utiliser cet instrument ?"),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional()
    .default([]),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    let body: any = {}
    try {
      body = await request.json()
    } catch (e) {
      console.error("Failed to parse request body:", e)
      return NextResponse.json(
        { message: "Corps de la requête invalide (JSON attendu)." },
        { status: 400 },
      )
    }

    console.log("Received request body:", JSON.stringify(body, null, 2))
    
    const parsed = instrumentAdviceSchema.safeParse(body)

    if (!parsed.success) {
      console.error("Validation error:", {
        errors: parsed.error.flatten().fieldErrors,
        issues: parsed.error.issues,
        received: body,
      })
      return NextResponse.json(
        { 
          message: "Requête invalide.", 
          issues: parsed.error.flatten().fieldErrors,
          received: body 
        },
        { status: 400 },
      )
    }

    const { instrument: instrumentName, description, parameters, discipline, question, conversationHistory } = parsed.data
    console.log("Processing request for instrument:", instrumentName, "discipline:", discipline)

    // Construire le contexte de l'instrument
    const instrumentContext = {
      name: instrumentName,
      description: description || "",
      parameters: parameters || {},
      discipline: discipline || "physique",
    }

    // Construire l'historique de conversation
    const chatMessages: ChatMessage[] = [
      ...conversationHistory.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: question || "Comment utiliser cet instrument ?" },
    ]

    // Construire le contexte pour l'IA
    const context = {
      instrument: instrumentContext,
      discipline: discipline || "physique",
      userRole: (session?.user?.role as UserRole | undefined) ?? "student",
      userName: session?.user?.name ?? undefined,
    }

    // Générer la réponse avec l'IA conversationnelle
    const response = await chatService.generateResponse(chatMessages, context)

    // Détecter si la configuration nécessite des corrections
    let needsCorrection = false
    if (parameters && typeof parameters === 'object') {
      Object.entries(parameters).forEach(([key, param]) => {
        if (!param || typeof param !== 'object') return
        const { value, min, max } = param
        if (typeof value !== 'number' || typeof min !== 'number' || typeof max !== 'number') return
        const range = max - min
        if (range === 0) return
        const percentage = ((value - min) / range) * 100
        if (percentage > 90 || (percentage < 10 && value > min)) {
          needsCorrection = true
        }
      })
    }

    return NextResponse.json({
      ...response,
      needsCorrection,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in instrument-advice API:", error)
    return NextResponse.json(
      { 
        message: "Erreur serveur lors du traitement de la requête.",
        error: error instanceof Error ? error.message : "Erreur inconnue"
      },
      { status: 500 },
    )
  }
}

