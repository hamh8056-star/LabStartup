import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { createDiscussion, upvoteDiscussion } from "@/lib/community-db"
import { ensureCommunityIndexes } from "@/lib/community-db"

const createDiscussionSchema = z.object({
  title: z.string().min(5, "Le titre doit contenir au moins 5 caractères").max(200, "Le titre ne peut pas dépasser 200 caractères"),
  discipline: z.enum(["physics", "biology", "electronics", "informatics"], {
    message: "Discipline invalide. Choisissez parmi: Physique, Biologie, Électronique, Informatique"
  }),
  content: z.string().min(10, "Le contenu doit contenir au moins 10 caractères").max(5000, "Le contenu ne peut pas dépasser 5000 caractères"),
  tags: z.array(z.string()).max(10, "Maximum 10 tags autorisés").optional().default([]),
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 })
  }

  await ensureCommunityIndexes()

  let body
  try {
    body = await request.json()
  } catch (error) {
    return NextResponse.json(
      { message: "Corps de la requête invalide (JSON attendu)." },
      { status: 400 }
    )
  }

  // Normaliser les tags si nécessaire
  if (body.tags && !Array.isArray(body.tags)) {
    if (typeof body.tags === "string") {
      body.tags = body.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
    } else {
      body.tags = []
    }
  } else if (!body.tags) {
    body.tags = []
  }

  const parsed = createDiscussionSchema.safeParse(body)

  if (!parsed.success) {
    console.error("Validation error:", parsed.error.flatten().fieldErrors)
    return NextResponse.json(
      { 
        message: "Données invalides.", 
        issues: parsed.error.flatten().fieldErrors,
        received: body
      },
      { status: 400 }
    )
  }

  try {
    const discussion = await createDiscussion({
      title: parsed.data.title,
      authorId: session.user.id || session.user.email || "",
      authorName: session.user.name || "Utilisateur",
      discipline: parsed.data.discipline,
      content: parsed.data.content,
      tags: parsed.data.tags,
    })

    return NextResponse.json({
      discussion: {
        id: discussion._id.toHexString(),
        title: discussion.title,
        author: discussion.authorName,
        discipline: discussion.discipline,
        disciplineLabel: discussion.disciplineLabel,
        createdAt: discussion.createdAt.toISOString(),
        preview: discussion.preview,
        replies: discussion.replies,
        upvotes: discussion.upvotes.length,
        tags: discussion.tags,
      },
    })
  } catch (error) {
    console.error("Error creating discussion:", error)
    return NextResponse.json(
      { message: "Erreur lors de la création de la discussion." },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 })
  }

  const body = await request.json()
  const { threadId } = body

  if (!threadId) {
    return NextResponse.json({ message: "threadId requis." }, { status: 400 })
  }

  try {
    const userId = session.user.id || session.user.email || ""
    const result = await upvoteDiscussion(threadId, userId)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error upvoting discussion:", error)
    return NextResponse.json(
      { message: "Erreur lors du vote." },
      { status: 500 }
    )
  }
}

