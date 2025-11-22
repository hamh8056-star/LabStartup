import { DashboardTopbar } from "@/components/dashboard/topbar"
import { AccessibilityWorkspace } from "@/components/dashboard/accessibility/accessibility-workspace"

export default function AccessibilityDashboardPage() {
  return (
    <div className="flex h-full flex-col">
      <DashboardTopbar
        title="Accessibilité & compatibilité"
        subtitle="Paramétrez l'expérience multiplateforme, le multilinguisme et les intégrations LMS."
      />
      <div className="flex-1 space-y-6 p-6">
        <AccessibilityWorkspace />
      </div>
    </div>
  )
}




