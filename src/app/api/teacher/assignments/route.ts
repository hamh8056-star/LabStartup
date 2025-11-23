import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import {
  createAssignment,
  listAssignments,
} from "@/lib/teaching-db"

const createAssignmentSchema = z.object({
  classId: z.string().min(1),
  simulationId: z.string().min(1),
  title: z.string().min(2).max(180),
  instructions: z.string().max(2_000).optional(),
  dueDate: z.string().optional().nullable(),
  status: z.enum(["draft", "active", "closed"]).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      console.warn("[api/teacher/assignments] No session found")
      return NextResponse.json({ message: "Accès refusé. Session non trouvée." }, { status: 403 })
    }

    if (!session.user?.id) {
      console.warn("[api/teacher/assignments] No user ID in session", { session: { user: session.user } })
      return NextResponse.json({ message: "Accès refusé. ID utilisateur manquant." }, { status: 403 })
    }

    // Les admins peuvent aussi accéder aux fonctionnalités enseignantes
    if (session.user.role !== "teacher" && session.user.role !== "admin") {
      console.warn("[api/teacher/assignments] Invalid role", { userId: session.user.id, role: session.user.role })
      return NextResponse.json(
        { message: `Accès refusé. Rôle requis: teacher ou admin, rôle actuel: ${session?.user?.role || "non défini"}.` },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("classId") ?? undefined

    const assignments = await listAssignments(session.user.id, { classId })
    return NextResponse.json({ assignments })
  } catch (error) {
    console.error("[api/teacher/assignments] Error fetching assignments:", error)
    return NextResponse.json(
      { message: "Impossible de récupérer les assignations.", error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  // Les admins peuvent aussi accéder aux fonctionnalités enseignantes
  if (!session?.user?.id || (session.user.role !== "teacher" && session.user.role !== "admin")) {
    return NextResponse.json(
      { message: `Accès refusé. Rôle requis: teacher ou admin, rôle actuel: ${session?.user?.role || "non défini"}.` },
      { status: 403 }
    )
  }

  const body = await request.json()
  const parsed = createAssignmentSchema.safeParse(body)

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
    const assignment = await createAssignment(session.user.id, {
      ...parsed.data,
      instructions: parsed.data.instructions ?? "",
      status: parsed.data.status ?? "draft",
    })
    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Impossible de créer l'assignation.",
      },
      { status: 400 },
    )
  }
}
