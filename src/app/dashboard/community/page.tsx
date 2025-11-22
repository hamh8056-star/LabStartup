import { DashboardTopbar } from "@/components/dashboard/topbar"
import { CommunityWorkspace } from "@/components/dashboard/community/community-workspace"
import { getCommunityData } from "@/lib/data/community"

export default function CommunityDashboardPage() {
  const data = getCommunityData()

  return (
    <div className="flex h-full flex-col">
      <DashboardTopbar
        title="Communauté & partage"
        subtitle="Collaborez, partagez vos expériences et participez aux concours scientifiques."
      />
      <div className="flex-1 space-y-6 p-6">
        <CommunityWorkspace fallback={data} />
      </div>
    </div>
  )
}




