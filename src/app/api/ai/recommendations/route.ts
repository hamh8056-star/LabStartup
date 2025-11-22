import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { getLearnerProfile, buildDiagnostics, buildRecommendations } from "@/lib/ai/personalization"
import type { UserRole } from "@/lib/roles"

export async function GET() {
  const session = await getServerSession(authOptions)

  const profile = getLearnerProfile(session?.user?.id ?? "student-demo", {
    name: session?.user?.name ?? undefined,
    role: (session?.user?.role as UserRole | undefined) ?? "student",
  })

  const diagnostics = buildDiagnostics(profile)
  const recommendations = buildRecommendations(profile)

  return NextResponse.json({ profile, diagnostics, recommendations })
}

