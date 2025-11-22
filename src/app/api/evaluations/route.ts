import { NextResponse } from "next/server"

import { getSampleEvaluations } from "@/lib/data/evaluations"

export async function GET() {
  const evaluations = getSampleEvaluations()

  return NextResponse.json({
    data: evaluations,
  })
}

