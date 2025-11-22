import { DashboardTopbar } from "@/components/dashboard/topbar"
import { CreatorWorkspace } from "@/components/dashboard/creator/creator-workspace"
import { getExperienceLibrary } from "@/lib/data/creator"

export default function DashboardCreatorPage() {
  const library = getExperienceLibrary()

  return (
    <div className="flex h-full flex-col">
      <DashboardTopbar
        title="Éditeur d’expériences"
        subtitle="Assemblez vos propres simulations 3D, scénarios guidés et ressources pédagogiques."
      />
      <div className="flex-1 space-y-6 p-6">
        <CreatorWorkspace initialLibrary={library} />
      </div>
    </div>
  )
}

