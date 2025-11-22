import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { ensureEvaluationIndexes, getEvaluationHistory, seedEvaluationData } from "@/lib/evaluations-db"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const evaluationId = searchParams.get("evaluationId")
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = parseInt(searchParams.get("limit") || "10", 10)

  if (!evaluationId) {
    return NextResponse.json({ message: "Paramètre evaluationId manquant." }, { status: 400 })
  }

  if (page < 1 || limit < 1 || limit > 100) {
    return NextResponse.json({ message: "Paramètres de pagination invalides." }, { status: 400 })
  }

  await ensureEvaluationIndexes()
  await seedEvaluationData()

  try {
    const history = await getEvaluationHistory(evaluationId, { page, limit })
    return NextResponse.json(history)
  } catch (error) {
    console.error("[evaluation-history]", error)
    return NextResponse.json({ message: "Impossible de récupérer l'historique." }, { status: 500 })
  }
}
