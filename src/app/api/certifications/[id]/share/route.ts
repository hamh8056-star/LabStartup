import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { listCertifications } from "@/lib/evaluations-db"

const shareSchema = z.object({
  shareWith: z.array(z.string().email()).optional(),
  makePublic: z.boolean().default(false),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Récupérer la certification
  const certifications = await listCertifications()
  const certification = certifications.find(cert => cert.id === id)

  if (!certification) {
    return NextResponse.json({ message: "Certification introuvable." }, { status: 404 })
  }

  const db = await getDatabase()
  
  // Vérifier si un lien de partage existe déjà
  const existingShare = await db.collection("certification_shares").findOne({
    certificationId: id,
  })

  let shareToken: string
  let shareUrl: string

  if (existingShare) {
    shareToken = existingShare.shareToken
  } else {
    // Générer un token unique pour le partage
    shareToken = `share-${id}-${Math.random().toString(36).substring(2, 15)}`
    
    // Créer l'entrée de partage
    await db.collection("certification_shares").insertOne({
      certificationId: id,
      shareToken,
      isPublic: false,
      createdAt: new Date(),
      views: 0,
    })
  }

  // Construire l'URL de partage
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  shareUrl = `${baseUrl}/certifications/share/${shareToken}`

  return NextResponse.json({
    shareUrl,
    shareToken,
    certification: {
      id: certification.id,
      owner: certification.owner,
      simulationTitle: certification.simulationTitle,
      badge: certification.badge,
      score: certification.score,
    },
  })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  const { id } = await params

  if (!session?.user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 })
  }

  const body = await request.json()
  const parsed = shareSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Données invalides.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  // Récupérer la certification
  const certifications = await listCertifications()
  const certification = certifications.find(cert => cert.id === id)

  if (!certification) {
    return NextResponse.json({ message: "Certification introuvable." }, { status: 404 })
  }

  const db = await getDatabase()
  const shareToken = `share-${id}-${Math.random().toString(36).substring(2, 15)}`
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  const shareUrl = `${baseUrl}/certifications/share/${shareToken}`

  // Créer ou mettre à jour le partage
  await db.collection("certification_shares").updateOne(
    { certificationId: id },
    {
      $set: {
        shareToken,
        isPublic: parsed.data.makePublic,
        sharedWith: parsed.data.shareWith || [],
        sharedBy: session.user.id || session.user.email,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
        views: 0,
      },
    },
    { upsert: true }
  )

  return NextResponse.json({
    shareUrl,
    shareToken,
    message: "Lien de partage créé avec succès.",
  })
}

