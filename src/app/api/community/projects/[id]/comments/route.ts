import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { ObjectId } from "mongodb"

import { authOptions } from "@/lib/auth"
import { addProjectComment } from "@/lib/community-db"
import { recordAuditLog } from "@/lib/security/audit"
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

const commentSchema = z.object({
  content: z.string().min(3).max(1000),
  rating: z.number().min(1).max(5).default(5),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ message: "Non autorisé." }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const parsed = commentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "Commentaire invalide", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  try {
    const comment = await addProjectComment({
      projectId: id,
      authorId: session.user.id || session.user.email || "",
      authorName: session.user.name || "Utilisateur",
      content: parsed.data.content,
      rating: parsed.data.rating,
    })

    await recordAuditLog({
      userId: session.user.id || session.user.email || "",
      email: session.user.email ?? null,
      action: "community.comment",
      severity: "info",
      metadata: { projectId: id, preview: parsed.data.content.slice(0, 80) },
    })

    return NextResponse.json({
      comment: {
        id: idToString(comment._id),
        author: comment.authorName,
        content: comment.content,
        rating: comment.rating,
        createdAt: dateToISOString(comment.createdAt),
      },
    })
  } catch (error) {
    console.error("Error adding comment:", error)
    return NextResponse.json(
      { message: "Erreur lors de l'ajout du commentaire." },
      { status: 500 }
    )
  }
}




