import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { deleteClass, getClassById, updateClass } from "@/lib/teaching-db"

const updateClassSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(400).optional(),
  discipline: z.string().min(2).max(80).optional(),
  level: z.string().min(2).max(80).optional(),
  studentIds: z.array(z.string()).max(200).optional(),
  studentIdsToAdd: z.array(z.string()).max(200).optional(),
  studentIdsToRemove: z.array(z.string()).max(200).optional(),
})

type RouteParams = {
  params: {
    id: string
  }
}

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions)

  // Les admins peuvent aussi accéder aux fonctionnalités enseignantes
  if (!session?.user?.id || (session.user.role !== "teacher" && session.user.role !== "admin")) {
    return NextResponse.json(
      { message: `Accès refusé. Rôle requis: teacher ou admin, rôle actuel: ${session.user.role || "non défini"}.` },
      { status: 403 }
    )
  }

  const klass = await getClassById(session.user.id, params.id)

  if (!klass) {
    return NextResponse.json({ message: "Classe introuvable." }, { status: 404 })
  }

  return NextResponse.json({ class: klass })
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions)

  // Les admins peuvent aussi accéder aux fonctionnalités enseignantes
  if (!session?.user?.id || (session.user.role !== "teacher" && session.user.role !== "admin")) {
    return NextResponse.json(
      { message: `Accès refusé. Rôle requis: teacher ou admin, rôle actuel: ${session.user.role || "non défini"}.` },
      { status: 403 }
    )
  }

  const payload = await request.json()
  const parsed = updateClassSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Les informations fournies ne sont pas valides.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const updated = await updateClass(session.user.id, params.id, parsed.data)

  if (!updated) {
    return NextResponse.json({ message: "Classe introuvable." }, { status: 404 })
  }

  return NextResponse.json({ class: updated })
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getServerSession(authOptions)

  // Les admins peuvent aussi accéder aux fonctionnalités enseignantes
  if (!session?.user?.id || (session.user.role !== "teacher" && session.user.role !== "admin")) {
    return NextResponse.json(
      { message: `Accès refusé. Rôle requis: teacher ou admin, rôle actuel: ${session.user.role || "non défini"}.` },
      { status: 403 }
    )
  }

  const deleted = await deleteClass(session.user.id, params.id)

  if (!deleted) {
    return NextResponse.json({ message: "Classe introuvable." }, { status: 404 })
  }

  return NextResponse.json({ message: "Classe supprimée." })
}


