import { hash } from "bcryptjs"
import { ObjectId } from "mongodb"
import { NextResponse } from "next/server"
import { z } from "zod"

import { getDatabase } from "@/lib/mongodb"
import { USER_ROLES } from "@/lib/roles"

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(USER_ROLES).default("student"),
  institution: z.string().min(2).optional(),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Les informations fournies ne sont pas valides.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    )
  }

  const { name, email, password, role, institution } = parsed.data

  const db = await getDatabase()
  const existingUser = await db.collection("users").findOne({ email })

  if (existingUser) {
    return NextResponse.json(
      { message: "Un compte existe déjà avec cet email." },
      { status: 409 },
    )
  }

  const passwordHash = await hash(password, 12)
  const now = new Date()

  const insertResult = await db.collection("users").insertOne({
    _id: new ObjectId(),
    name,
    email: email.toLowerCase(),
    password: passwordHash,
    role,
    institution: institution ?? null,
    createdAt: now,
    updatedAt: now,
    emailVerified: null,
  })

  await db.collection("profiles").insertOne({
    userId: insertResult.insertedId.toString(),
    preferences: {
      disciplines: ["physics"],
      simulationHistory: [],
      collaborationStyle: "hybrid",
    },
    createdAt: now,
    updatedAt: now,
  })

  return NextResponse.json(
    { message: "Compte créé avec succès." },
    { status: 201 },
  )
}

