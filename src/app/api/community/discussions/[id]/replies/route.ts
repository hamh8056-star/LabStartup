import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { ObjectId } from "mongodb"

import { authOptions } from "@/lib/auth"
import { addDiscussionReply } from "@/lib/community-db"
import { dateToISOString } from "@/lib/mongodb"

/**
 * Convertit un _id (ObjectId ou string) en chaîne de caractères de manière sécurisée
 */
function idToString(id: ObjectId | string | undefined | null): string {
  if (!id) {
    return ""
  }
  if (typeof id === "string") {
    return id
  }
  if (id && typeof id === "object" && "toHexString" in id && typeof id.toHexString === "function") {
    return id.toHexString()
  }
  // Fallback: convertir en chaîne
  return String(id)
}

const replySchema = z.object({
  content: z.string().min(3).max(2000),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const parsed = replySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Réponse invalide.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const reply = await addDiscussionReply({
      threadId: id,
      authorId: session.user.id || session.user.email || "",
      authorName: session.user.name || "Utilisateur",
      content: parsed.data.content,
    })

    return NextResponse.json({
      reply: {
        id: idToString(reply._id),
        author: reply.authorName,
        content: reply.content,
        createdAt: dateToISOString(reply.createdAt),
        upvotes: reply.upvotes.length,
      },
    })
  } catch (error) {
    console.error("Error adding reply:", error)
    return NextResponse.json(
      { message: "Erreur lors de l'ajout de la réponse." },
      { status: 500 }
    )
  }
}

