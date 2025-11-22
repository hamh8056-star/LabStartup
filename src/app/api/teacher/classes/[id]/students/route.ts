import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { ObjectId } from "mongodb"
import { hash } from "bcryptjs"
import { nanoid } from "nanoid"
import { z } from "zod"
import { createHash, randomBytes } from "crypto"

import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { getClassById, updateClass } from "@/lib/teaching-db"
import { getEnv } from "@/lib/env"

const addStudentSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(120),
  institution: z.string().max(160).optional(),
  sendInvitationEmail: z.boolean().optional().default(false),
})

type RouteContext = {
  params:
    | {
        id: string
      }
    | Promise<{
        id: string
      }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  // Les admins peuvent aussi accéder aux fonctionnalités enseignantes
  if (!session?.user?.id || (session.user.role !== "teacher" && session.user.role !== "admin")) {
    return NextResponse.json(
      { message: `Accès refusé. Rôle requis: teacher ou admin, rôle actuel: ${session.user.role || "non défini"}.` },
      { status: 403 }
    )
  }

  const classDocument = await getClassById(session.user.id, id)

  if (!classDocument) {
    return NextResponse.json({ message: "Classe introuvable." }, { status: 404 })
  }

  if (!classDocument.studentIds?.length) {
    return NextResponse.json({ students: [] })
  }

  const db = await getDatabase()
  const validIds = classDocument.studentIds
    .filter(id => ObjectId.isValid(id))
    .map(id => new ObjectId(id))

  if (!validIds.length) {
    return NextResponse.json({ students: [] })
  }

  const users = await db
    .collection("users")
    .find(
      { _id: { $in: validIds } },
      {
        projection: {
          name: 1,
          email: 1,
          institution: 1,
        },
      },
    )
    .toArray()

  const students = users.map(user => ({
    id: user._id.toString(),
    name: user.name ?? "",
    email: user.email,
    institution: user.institution ?? null,
  }))

  return NextResponse.json({ students })
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  // Les admins peuvent aussi accéder aux fonctionnalités enseignantes
  if (!session?.user?.id || (session.user.role !== "teacher" && session.user.role !== "admin")) {
    return NextResponse.json(
      { message: `Accès refusé. Rôle requis: teacher ou admin, rôle actuel: ${session.user.role || "non défini"}.` },
      { status: 403 }
    )
  }

  const payload = await request.json()
  const parsed = addStudentSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Les informations fournies ne sont pas valides.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const classDocument = await getClassById(session.user.id, id)

  if (!classDocument) {
    return NextResponse.json({ message: "Classe introuvable." }, { status: 404 })
  }

  const db = await getDatabase()
  const usersCollection = db.collection("users")
  const profilesCollection = db.collection("profiles")

  const email = parsed.data.email.toLowerCase()
  const name = parsed.data.name.trim()
  const institution = parsed.data.institution?.trim() ?? null
  const shouldSendEmail = parsed.data.sendInvitationEmail ?? false

  const existingUser = await usersCollection.findOne({ email })

  let studentId: string
  let created = false
  let temporaryPassword: string | undefined
  let invitationSent = false

  if (existingUser) {
    if (existingUser.role !== "student") {
      return NextResponse.json(
        { message: "Cet utilisateur existe déjà avec un autre rôle." },
        { status: 400 },
      )
    }

    studentId = existingUser._id.toString()
    
    // Si l'utilisateur existe et qu'on veut envoyer une invitation, créer un token de réinitialisation
    if (shouldSendEmail) {
      const resetsCollection = db.collection("password_resets")
      const token = randomBytes(32).toString("hex")
      const tokenHash = createHash("sha256").update(token).digest("hex")
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 jours

      await resetsCollection.deleteMany({ userId: studentId })
      await resetsCollection.insertOne({
        userId: studentId,
        tokenHash,
        expiresAt,
        createdAt: new Date(),
      })

      const env = getEnv()
      const resetUrl = `${env.NEXTAUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/auth/reset-password?token=${token}`
      console.info(`[taalimia:invitation] Lien d'invitation pour ${email}: ${resetUrl}`)
      invitationSent = true
    }
  } else {
    const password = nanoid(12)
    const passwordHash = await hash(password, 12)
    const now = new Date()

    const insertResult = await usersCollection.insertOne({
      _id: new ObjectId(),
      name,
      email,
      password: passwordHash,
      role: "student",
      institution,
      createdAt: now,
      updatedAt: now,
      emailVerified: null,
    })

    await profilesCollection.insertOne({
      userId: insertResult.insertedId.toString(),
      preferences: {
        disciplines: [],
        simulationHistory: [],
        collaborationStyle: "hybride",
      },
      createdAt: now,
      updatedAt: now,
    })

    studentId = insertResult.insertedId.toString()
    created = true
    
    // Si on veut envoyer une invitation, créer un token de réinitialisation au lieu de générer un mot de passe
    if (shouldSendEmail) {
      const resetsCollection = db.collection("password_resets")
      const token = randomBytes(32).toString("hex")
      const tokenHash = createHash("sha256").update(token).digest("hex")
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) // 7 jours

      await resetsCollection.insertOne({
        userId: studentId,
        tokenHash,
        expiresAt,
        createdAt: new Date(),
      })

      const env = getEnv()
      const resetUrl = `${env.NEXTAUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/auth/reset-password?token=${token}`
      console.info(`[taalimia:invitation] Lien d'invitation pour ${email}: ${resetUrl}`)
      invitationSent = true
    } else {
      temporaryPassword = password
    }
  }

  const updatedClass = await updateClass(session.user.id, id, {
    studentIdsToAdd: [studentId],
  })

  if (!updatedClass) {
    return NextResponse.json(
      { message: "Impossible d'ajouter l'étudiant à la classe." },
      { status: 400 },
    )
  }

  const student = existingUser
    ? {
        id: studentId,
        name: existingUser.name ?? name,
        email,
        institution: existingUser.institution ?? institution,
      }
    : {
        id: studentId,
        name,
        email,
        institution,
      }

  return NextResponse.json(
    {
      student,
      created,
      temporaryPassword,
      invitationSent,
    },
    { status: created ? 201 : 200 },
  )
}


