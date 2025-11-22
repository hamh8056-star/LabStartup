import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ensureBaseContent } from "@/lib/data/service"
import { searchResources } from "@/lib/resources-db"
import type { SimulationDiscipline } from "@/lib/data/seed"

function parseStringArray(params: URLSearchParams, key: string): string[] {
  const values = params.getAll(key)
  if (values.length > 0) {
    return values.flatMap(value => value.split(",")).map(value => value.trim()).filter(Boolean)
  }
  const single = params.get(key)
  return single ? single.split(",").map(value => value.trim()).filter(Boolean) : []
}

const createResourceSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  type: z.enum(["fiche", "manuel", "video", "animation", "exercice"]),
  discipline: z.enum(["physique", "chimie", "biologie", "electronique", "informatique"]),
  summary: z.string().min(1, "Le résumé est requis"),
  duration: z.number().min(0).default(0),
  level: z.enum(["college", "lycee", "universite"]),
  format: z.enum(["pdf", "video", "interactive", "html"]),
  url: z.string().url("L'URL doit être valide"),
  tags: z.array(z.string()).default([]),
  attachments: z.array(z.object({
    label: z.string(),
    type: z.enum(["pdf", "module", "dataset", "slides", "template", "video"]),
    url: z.string().url(),
  })).optional(),
  manual: z.object({
    sections: z.array(z.object({
      title: z.string(),
      content: z.string(),
    })),
    safety: z.array(z.string()).optional(),
    prerequisites: z.array(z.string()).optional(),
  }).optional(),
  video: z.object({
    platform: z.enum(["youtube", "vimeo", "internal"]),
    aspectRatio: z.string().optional(),
    duration: z.number().optional(),
    chapters: z.array(z.object({
      title: z.string(),
      timecode: z.string(),
    })).optional(),
    downloadUrl: z.string().url().optional(),
    captions: z.array(z.string()).optional(),
  }).optional(),
  interactive: z.object({
    objective: z.string(),
    steps: z.array(z.object({
      title: z.string(),
      action: z.string(),
      hint: z.string().optional(),
      expectedResult: z.string().optional(),
    })),
    correction: z.array(z.string()).optional(),
  }).optional(),
  exercise: z.object({
    difficulty: z.enum(["facile", "intermediaire", "avance"]),
    scoring: z.object({
      maxPoints: z.number().min(0),
      successThreshold: z.number().min(0).max(100),
    }),
  }).optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") ?? undefined
  const types = parseStringArray(searchParams, "type")
  const tags = parseStringArray(searchParams, "tag")
  const disciplineParam = (searchParams.get("discipline") ?? undefined) as SimulationDiscipline | "all" | undefined
  const levelParam = (searchParams.get("level") ?? undefined) as "college" | "lycee" | "universite" | "all" | undefined
  const instrument = searchParams.get("instrument") ?? undefined

  const result = await searchResources({
    query: instrument || query,
    types: types.length ? types : undefined,
    tags: tags.length ? tags : undefined,
    discipline: disciplineParam,
    level: levelParam,
  })

  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  // Seuls les enseignants et admins peuvent créer des ressources
  if (!session?.user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 })
  }

  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    return NextResponse.json(
      { message: "Accès refusé. Seuls les enseignants peuvent créer des ressources." },
      { status: 403 }
    )
  }

  const body = await request.json()
  const parsed = createResourceSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Les données fournies sont invalides.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  await ensureBaseContent()
  const db = await getDatabase()
  const collection = db.collection("resources")

  // Générer un ID unique
  const id = `resource-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  const resource = {
    id,
    ...parsed.data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  await collection.insertOne(resource)

  return NextResponse.json(
    { message: "Ressource créée avec succès.", resource: { id, ...parsed.data } },
    { status: 201 }
  )
}
