import { DashboardTopbar } from "@/components/dashboard/topbar"
import { AnalyticsWorkspace } from "@/components/dashboard/analytics/analytics-workspace"

export default function AnalyticsDashboardPage() {
  return (
    <div className="flex h-full flex-col">
      <DashboardTopbar
        title="Analyse & reporting"
        subtitle="Visualisez les performances, suivez l'activité et exportez vos rapports en un clic."
      />
      <div className="flex-1 space-y-6 p-6">
        <AnalyticsWorkspace />
      </div>
    </div>
  )
}




