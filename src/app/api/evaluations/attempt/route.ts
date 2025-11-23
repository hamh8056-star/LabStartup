import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import {
  ensureEvaluationIndexes,
  recordEvaluationAttempt,
  seedEvaluationData,
} from "@/lib/evaluations-db"
import { dateToISOString } from "@/lib/mongodb"

const answerSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionIds: z.array(z.string().min(1)),
  gainedPoints: z.number().min(0),
})

const requestSchema = z.object({
  evaluationId: z.string().min(1),
  mode: z.enum(["pre", "post"]),
  userId: z.string().min(1),
  userName: z.string().min(1),
  userEmail: z.string().email().optional(),
  maxScore: z.number().positive().default(100),
  durationSeconds: z.number().min(0).optional(),
  answers: z.array(answerSchema).min(1),
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 })
  }

  const body = await request.json()
  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Les données envoyées sont invalides.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  await ensureEvaluationIndexes()
  await seedEvaluationData()

  try {
    // Utiliser les informations de l'utilisateur connecté
    const attemptData = {
      ...parsed.data,
      userId: session.user.id || parsed.data.userId,
      userName: session.user.name || parsed.data.userName,
      userEmail: session.user.email || parsed.data.userEmail,
    }
    
    const result = await recordEvaluationAttempt(attemptData)
    return NextResponse.json({
      score: result.score,
      badgesAwarded: result.badgesAwarded,
      pointsAwarded: result.pointsAwarded,
      certificate: result.certificate
        ? {
            id: result.certificate.id,
            badge: result.certificate.badge,
            score: result.certificate.score,
            issuedAt: dateToISOString(result.certificate.issuedAt),
          }
        : null,
    })
  } catch (error) {
    console.error("[evaluation-attempt]", error)
    return NextResponse.json({ message: "Impossible d'enregistrer la tentative." }, { status: 500 })
  }
}
