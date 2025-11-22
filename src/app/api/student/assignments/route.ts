import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { listAssignmentsByStudent } from "@/lib/teaching-db"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ message: "Accès refusé. Session non trouvée." }, { status: 403 })
    }

    if (!session.user?.id) {
      return NextResponse.json({ message: "Accès refusé. ID utilisateur manquant." }, { status: 403 })
    }

    if (session.user.role !== "student") {
      return NextResponse.json(
        { message: "Accès refusé. Cette route est réservée aux étudiants." },
        { status: 403 }
      )
    }

    const assignments = await listAssignmentsByStudent(session.user.id)
    return NextResponse.json({ assignments })
  } catch (error) {
    console.error("[api/student/assignments] Error fetching assignments:", error)
    return NextResponse.json(
      { message: "Impossible de récupérer les assignations.", error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    )
  }
}

