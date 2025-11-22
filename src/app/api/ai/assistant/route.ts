import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { chatService, type ChatMessage } from "@/lib/ai/chat-service"
import type { UserRole } from "@/lib/roles"

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const messageSchema = z.object({
  message: z.string().min(1),
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
    const body = await request.json().catch(() => ({}))
    const parsed = messageSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Requête invalide.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 },
      )
    }

    const { message, conversationHistory } = parsed.data

    // Construire l'historique de conversation
    const chatMessages: ChatMessage[] = [
      ...conversationHistory.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ]

    // Construire le contexte
    const context = {
      userRole: (session?.user?.role as UserRole | undefined) ?? "student",
      userName: session?.user?.name ?? undefined,
    }

    // Générer la réponse avec l'IA conversationnelle
    const response = await chatService.generateResponse(chatMessages, context)

    return NextResponse.json({
      ...response,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in assistant API:", error)
    return NextResponse.json(
      {
        message: "Erreur serveur lors du traitement de la requête.",
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}
