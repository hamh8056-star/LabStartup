import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { ObjectId } from "mongodb"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"

const updateProfileSchema = z.object({
  name: z.string().min(2).max(80),
  institution: z.string().min(2).max(120).optional().nullable(),
  bio: z.string().max(280).optional().nullable(),
  avatarUrl: z.string().url().max(300).optional().nullable(),
  interests: z.array(z.string().max(40)).max(8).optional(),
  collaborationStyle: z.enum(["distanciel", "hybride", "presentiel"]).optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non autorisé." }, { status: 401 })
  }

  const db = await getDatabase()
  const userId = new ObjectId(session.user.id)

  const user = await db.collection("users").findOne(
    { _id: userId },
    {
      projection: {
        name: 1,
        email: 1,
        role: 1,
        institution: 1,
        createdAt: 1,
      },
    },
  )

  if (!user) {
    return NextResponse.json({ message: "Utilisateur introuvable." }, { status: 404 })
  }

  const profile = await db.collection("profiles").findOne(
    { userId: session.user.id },
    {
      projection: {
        preferences: 1,
        bio: 1,
        avatarUrl: 1,
        interests: 1,
        collaborationStyle: 1,
        updatedAt: 1,
      },
    },
  )

  return NextResponse.json({
    name: user.name,
    email: user.email,
    role: user.role,
    institution: user.institution,
    createdAt: user.createdAt,
    bio: profile?.bio ?? "",
    avatarUrl: profile?.avatarUrl ?? "",
    interests: profile?.interests ?? [],
    collaborationStyle: profile?.collaborationStyle ?? profile?.preferences?.collaborationStyle ?? "hybride",
  })
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non autorisé." }, { status: 401 })
  }

  const json = await request.json()
  const parsed = updateProfileSchema.safeParse(json)

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Les informations fournies ne sont pas valides.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    )
  }

  const db = await getDatabase()
  const userId = new ObjectId(session.user.id)
  const { name, institution, bio, avatarUrl, interests = [], collaborationStyle = "hybride" } = parsed.data

  await db.collection("users").updateOne(
    { _id: userId },
    {
      $set: {
        name,
        institution: institution ?? null,
        updatedAt: new Date(),
      },
    },
  )

  await db.collection("profiles").updateOne(
    { userId: session.user.id },
    {
      $set: {
        bio: bio ?? "",
        avatarUrl: avatarUrl ?? "",
        interests,
        collaborationStyle,
        preferences: {
          collaborationStyle,
          disciplines: interests,
          simulationHistory: [],
        },
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    },
    { upsert: true },
  )

  return NextResponse.json({ message: "Profil mis à jour." })
}






