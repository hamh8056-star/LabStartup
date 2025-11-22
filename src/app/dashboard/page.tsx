import { getServerSession } from "next-auth"

import { DashboardPageContent } from "@/components/dashboard/dashboard-page-content"
import { getAiRecommendations } from "@/lib/data/ai"
import { getSampleCertifications } from "@/lib/data/certifications"
import { getSampleRooms } from "@/lib/data/collaboration"
import { getSampleEvaluations } from "@/lib/data/evaluations"
import { withFallback } from "@/lib/data/helpers"
import { getAnalyticsSummary, getPerformanceTimeline } from "@/lib/data/analytics"
import { getLabs, getResources, getSimulations } from "@/lib/data/service"
import { baseLabs, baseResources, baseSimulations } from "@/lib/data/seed"
import { authOptions } from "@/lib/auth"
import type { UserRole } from "@/lib/roles"
import { listAssignmentsByStudent } from "@/lib/teaching-db"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userRole = (session?.user?.role as UserRole | undefined) ?? "teacher"

  // Récupérer toutes les simulations d'abord
  const allSimulations = await withFallback(
    () => getSimulations(),
    () => baseSimulations,
    "simulations",
  )

  // Filtrer les simulations pour les étudiants selon leurs assignations
  let simulations = allSimulations
  if (userRole === "student" && session?.user?.id) {
    try {
      const assignments = await listAssignmentsByStudent(session.user.id)
      const assignedSimulationIds = new Set(assignments.map(a => a.simulationId))
      simulations = allSimulations.filter(sim => assignedSimulationIds.has(sim.id))
    } catch (error) {
      console.error("[dashboard] Error filtering simulations for student:", error)
      simulations = []
    }
  }

  const [summary, timeline, evaluations, certifications, rooms, aiTeacher, labs, resources] =
    await Promise.all([
      getAnalyticsSummary(),
      getPerformanceTimeline(),
      Promise.resolve(getSampleEvaluations()),
      Promise.resolve(getSampleCertifications()),
      Promise.resolve(getSampleRooms()),
      Promise.resolve(getAiRecommendations(userRole === "student" ? "student" : "teacher")),
      withFallback(() => getLabs(), () => baseLabs, "labs"),
      withFallback(() => getResources(), () => baseResources, "resources"),
    ])

  const simulationsCount = simulations.length
  const activeClasses = rooms.filter(room => room.active).length
  const certificationsCount = certifications.length
  const engagement =
    timeline.reduce((acc, point) => acc + point.completionRate, 0) /
    (timeline.length || 1)

  const nextEvents = rooms.slice(0, 2)
  const featuredResources = resources.slice(0, 3)

  return (
    <DashboardPageContent
      userRole={userRole}
      title={""}
      subtitle={""}
      summary={summary}
      timeline={timeline}
      evaluations={evaluations}
      certifications={certifications}
      rooms={rooms}
      aiTeacher={aiTeacher}
      simulations={simulations}
      labs={labs}
      resources={resources}
      simulationsCount={simulationsCount}
      activeClasses={activeClasses || labs.length}
      certificationsCount={certificationsCount}
      engagement={engagement}
      nextEvents={nextEvents}
      featuredResources={featuredResources}
    />
  )
}


