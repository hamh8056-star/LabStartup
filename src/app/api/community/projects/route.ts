import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { ObjectId } from "mongodb"

import { authOptions } from "@/lib/auth"
import { createProject, incrementProjectDownloads } from "@/lib/community-db"
import { ensureCommunityIndexes } from "@/lib/community-db"
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

const createProjectSchema = z.object({
  title: z.string().min(5).max(200),
  discipline: z.enum(["physics", "biology", "electronics", "informatics"]),
  summary: z.string().min(10).max(500),
  description: z.string().max(5000).optional(),
  fileUrl: z.string().url().optional(),
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 })
  }

  await ensureCommunityIndexes()

  const body = await request.json()
  const parsed = createProjectSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Données invalides.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const project = await createProject({
      title: parsed.data.title,
      authorId: session.user.id || session.user.email || "",
      authorName: session.user.name || "Utilisateur",
      discipline: parsed.data.discipline,
      summary: parsed.data.summary,
      description: parsed.data.description,
      fileUrl: parsed.data.fileUrl,
    })

    return NextResponse.json({
      project: {
        id: idToString(project._id),
        title: project.title,
        author: project.authorName,
        disciplineLabel: project.disciplineLabel,
        publishedAt: dateToISOString(project.createdAt),
        summary: project.summary,
        downloads: project.downloads,
        peerReviews: project.peerReviews,
      },
    })
  } catch (error) {
    console.error("Error creating project:", error)
    return NextResponse.json(
      { message: "Erreur lors de la création du projet." },
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
  const { projectId, action } = body

  if (action === "download" && projectId) {
    try {
      await incrementProjectDownloads(projectId)
      return NextResponse.json({ message: "Téléchargement enregistré." })
    } catch (error) {
      return NextResponse.json(
        { message: "Erreur lors de l'enregistrement du téléchargement." },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ message: "Action inconnue." }, { status: 400 })
}

