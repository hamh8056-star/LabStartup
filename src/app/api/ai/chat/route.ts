import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { chatService, type ChatMessage } from "@/lib/ai/chat-service"
import type { UserRole } from "@/lib/roles"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }),
  ),
  instrument: z
    .object({
      name: z.string(),
      description: z.string(),
      parameters: z.record(
        z.string(),
        z.object({
          min: z.number(),
          max: z.number(),
          value: z.number(),
          label: z.string(),
          unit: z.string().optional(),
        }),
      ),
      discipline: z.string(),
    })
    .optional(),
  discipline: z.string().optional(),
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

    const parsed = chatRequestSchema.safeParse(body)

    if (!parsed.success) {
      console.error("Validation error:", parsed.error.flatten().fieldErrors)
      return NextResponse.json(
        {
          message: "Requête invalide.",
          issues: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      )
    }

    const { messages, instrument, discipline } = parsed.data

    // Convertir les messages au format attendu par le service
    const chatMessages: ChatMessage[] = messages.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }))

    // Construire le contexte
    const context = {
      instrument,
      discipline: discipline || instrument?.discipline,
      userRole: (session?.user?.role as UserRole | undefined) ?? "student",
      userName: session?.user?.name ?? undefined,
    }

    // Générer la réponse avec l'IA
    const response = await chatService.generateResponse(chatMessages, context)

    return NextResponse.json({
      ...response,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json(
      {
        message: "Erreur serveur lors du traitement de la requête.",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}



