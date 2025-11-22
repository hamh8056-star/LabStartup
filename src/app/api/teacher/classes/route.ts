import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { createClass, listClassesByTeacher } from "@/lib/teaching-db"

const createClassSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(400).optional(),
  discipline: z.string().min(2).max(80),
  level: z.string().min(2).max(80),
  studentIds: z.array(z.string()).max(200).optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      console.warn("[api/teacher/classes] No session found")
      return NextResponse.json({ message: "Accès refusé. Session non trouvée." }, { status: 403 })
    }

    if (!session.user?.id) {
      console.warn("[api/teacher/classes] No user ID in session", { session: { user: session.user } })
      return NextResponse.json({ message: "Accès refusé. ID utilisateur manquant." }, { status: 403 })
    }

    // Les admins peuvent aussi accéder aux fonctionnalités enseignantes
    if (session.user.role !== "teacher" && session.user.role !== "admin") {
      console.warn("[api/teacher/classes] Invalid role", { userId: session.user.id, role: session.user.role })
      return NextResponse.json(
        { message: `Accès refusé. Rôle requis: teacher ou admin, rôle actuel: ${session.user.role || "non défini"}.` },
        { status: 403 }
      )
    }

    const classes = await listClassesByTeacher(session.user.id)
    return NextResponse.json({ classes })
  } catch (error) {
    console.error("[api/teacher/classes] Error fetching classes:", error)
    return NextResponse.json(
      { message: "Impossible de récupérer les classes.", error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  // Les admins peuvent aussi accéder aux fonctionnalités enseignantes
  if (!session?.user?.id || (session.user.role !== "teacher" && session.user.role !== "admin")) {
    return NextResponse.json(
      { message: `Accès refusé. Rôle requis: teacher ou admin, rôle actuel: ${session.user.role || "non défini"}.` },
      { status: 403 }
    )
  }

  const payload = await request.json()
  const parsed = createClassSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Les informations fournies ne sont pas valides.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const klass = await createClass(session.user.id, parsed.data)
  return NextResponse.json({ class: klass }, { status: 201 })
}


