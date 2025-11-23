import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { deleteAssignment, updateAssignment } from "@/lib/teaching-db"

const updateAssignmentSchema = z.object({
  classId: z.string().min(1).optional(),
  simulationId: z.string().min(1).optional(),
  title: z.string().min(2).max(180).optional(),
  instructions: z.string().max(2_000).optional(),
  dueDate: z.string().optional().nullable(),
  status: z.enum(["draft", "active", "closed"]).optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  // Les admins peuvent aussi accéder aux fonctionnalités enseignantes
  if (!session?.user?.id || (session.user.role !== "teacher" && session.user.role !== "admin")) {
    return NextResponse.json(
      { message: `Accès refusé. Rôle requis: teacher ou admin, rôle actuel: ${session?.user?.role || "non défini"}.` },
      { status: 403 }
    )
  }

  const payload = await request.json()
  const parsed = updateAssignmentSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Les informations fournies ne sont pas valides.",
        issues: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    )
  }

  try {
    const updated = await updateAssignment(session.user.id, id, parsed.data)

    if (!updated) {
      return NextResponse.json({ message: "Assignation introuvable." }, { status: 404 })
    }

    return NextResponse.json({ assignment: updated })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Impossible de mettre à jour l'assignation." },
      { status: 400 },
    )
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  // Les admins peuvent aussi accéder aux fonctionnalités enseignantes
  if (!session?.user?.id || (session.user.role !== "teacher" && session.user.role !== "admin")) {
    return NextResponse.json(
      { message: `Accès refusé. Rôle requis: teacher ou admin, rôle actuel: ${session?.user?.role || "non défini"}.` },
      { status: 403 }
    )
  }

  const deleted = await deleteAssignment(session.user.id, id)

  if (!deleted) {
    return NextResponse.json({ message: "Assignation introuvable." }, { status: 404 })
  }

  return NextResponse.json({ message: "Assignation supprimée." })
}


