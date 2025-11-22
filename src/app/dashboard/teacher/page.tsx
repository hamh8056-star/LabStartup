import { DashboardTopbar } from "@/components/dashboard/topbar"
import { TeacherDashboard } from "@/components/dashboard/teacher/teacher-dashboard"
import { getSimulations } from "@/lib/data/service"
import { baseSimulations } from "@/lib/data/seed"
import { withFallback } from "@/lib/data/helpers"

export default async function TeacherDashboardPage() {
  const simulations = await withFallback(() => getSimulations(), () => baseSimulations, "simulations")

  return (
    <div className="flex h-full flex-col">
      <DashboardTopbar
        title="Espace pédagogique"
        subtitle="Attribuez des expériences, suivez la progression et partagez vos scénarios."
      />
      <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8">
        <TeacherDashboard simulations={simulations} />
      </div>
    </div>
  )
}
