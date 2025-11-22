import { NextResponse } from "next/server"

import { ensureEvaluationIndexes, listCertifications, seedEvaluationData } from "@/lib/evaluations-db"

export async function GET() {
  await ensureEvaluationIndexes()
  await seedEvaluationData()

  const certifications = await listCertifications()
  return NextResponse.json({ certifications })
}

