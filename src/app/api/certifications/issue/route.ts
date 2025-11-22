import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { ensureEvaluationIndexes, issueCertificate, seedEvaluationData } from "@/lib/evaluations-db"

const issueSchema = z.object({
  evaluationId: z.string().min(1),
  simulationId: z.string().min(1),
  simulationTitle: z.string().min(1),
  owner: z.string().min(1),
  email: z.string().email().optional(),
  discipline: z.string().min(1),
  badge: z.enum(["explorateur", "innovateur", "mentor"]),
  score: z.number().min(0).max(100),
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  // Seuls les enseignants et admins peuvent émettre des certificats
  if (!session?.user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 })
  }

  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    return NextResponse.json({ message: "Accès refusé. Seuls les enseignants peuvent émettre des certificats." }, { status: 403 })
  }

  const payload = await request.json()
  const parsed = issueSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Les données reçues sont invalides.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  await ensureEvaluationIndexes()
  await seedEvaluationData()

  const certificate = await issueCertificate(parsed.data)

  return NextResponse.json({
    certificate: {
      id: certificate.id,
      badge: certificate.badge,
      score: certificate.score,
      issuedAt: certificate.issuedAt.toISOString(),
    },
  })
}
