import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { ObjectId } from "mongodb"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { getClassById, updateClass } from "@/lib/teaching-db"

const updateStudentSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  institution: z.string().max(160).optional().nullable(),
})

type RouteContext = {
  params:
    | {
        id: string
        studentId: string
      }
    | Promise<{
        id: string
        studentId: string
      }>
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id, studentId } = await params
  const session = await getServerSession(authOptions)

  // Les admins peuvent aussi accéder aux fonctionnalités enseignantes
  if (!session?.user?.id || (session.user.role !== "teacher" && session.user.role !== "admin")) {
    return NextResponse.json(
      { message: `Accès refusé. Rôle requis: teacher ou admin, rôle actuel: ${session.user.role || "non défini"}.` },
      { status: 403 }
    )
  }

  const payload = await request.json()
  const parsed = updateStudentSchema.safeParse(payload)

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

  if (!classDocument.studentIds.includes(studentId)) {
    return NextResponse.json({ message: "Étudiant non associé à cette classe." }, { status: 404 })
  }

  const db = await getDatabase()
  const userId = new ObjectId(studentId)

  const update: Record<string, unknown> = {}

  if (parsed.data.name !== undefined) {
    update.name = parsed.data.name
  }

  if (parsed.data.institution !== undefined) {
    update.institution = parsed.data.institution ?? null
  }

  if (!Object.keys(update).length) {
    return NextResponse.json({ message: "Aucune modification à appliquer." }, { status: 200 })
  }

  await db.collection("users").updateOne(
    { _id: userId, role: "student" },
    {
      $set: {
        ...update,
        updatedAt: new Date(),
      },
    },
  )

  const updatedUser = await db
    .collection("users")
    .findOne(
      { _id: userId },
      {
        projection: {
          name: 1,
          email: 1,
          institution: 1,
        },
      },
    )

  if (!updatedUser) {
    return NextResponse.json({ message: "Étudiant introuvable." }, { status: 404 })
  }

  return NextResponse.json({
    student: {
      id: updatedUser._id.toString(),
      name: updatedUser.name ?? "",
      email: updatedUser.email,
      institution: updatedUser.institution ?? null,
    },
  })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id, studentId } = await params
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

  if (!classDocument.studentIds.includes(studentId)) {
    return NextResponse.json({ message: "Étudiant non associé à cette classe." }, { status: 404 })
  }

  await updateClass(session.user.id, id, {
    studentIdsToRemove: [studentId],
  })

  return NextResponse.json({ message: "Étudiant retiré de la classe." })
}


