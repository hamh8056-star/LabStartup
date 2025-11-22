import { getServerSession } from "next-auth"

import { DashboardTopbar } from "@/components/dashboard/topbar"
import { AssistantWorkspace } from "@/components/dashboard/assistant/assistant-workspace"
import { authOptions } from "@/lib/auth"
import { getLearnerProfile, buildDiagnostics, buildRecommendations } from "@/lib/ai/personalization"
import type { UserRole } from "@/lib/roles"

export default async function AssistantDashboardPage() {
  const session = await getServerSession(authOptions)
  const profile = getLearnerProfile(session?.user?.id ?? "student-demo", {
    name: session?.user?.name ?? undefined,
    role: (session?.user?.role as UserRole | undefined) ?? "student",
  })
  const diagnostics = buildDiagnostics(profile)
  const recommendations = buildRecommendations(profile)

  return (
    <div className="flex h-full flex-col">
      <DashboardTopbar
        title="Assistant IA éducatif"
        subtitle="Analyse vos progrès, détecte vos erreurs et vous propose des expériences adaptées en temps réel."
      />
      <div className="flex-1 space-y-6 p-6">
        <AssistantWorkspace
          initialProfile={profile}
          initialDiagnostics={diagnostics}
          initialRecommendations={recommendations}
        />
      </div>
    </div>
  )
}
