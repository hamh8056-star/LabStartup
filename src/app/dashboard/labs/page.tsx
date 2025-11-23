import { LabsBrowser } from "@/components/dashboard/labs/labs-browser"
import { DashboardTopbar } from "@/components/dashboard/topbar"
import { withFallback } from "@/lib/data/helpers"
import { getLabs } from "@/lib/data/service"
import { baseLabs } from "@/lib/data/seed"

// Force dynamic rendering - no cache
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardLabsPage() {
  const labs = await withFallback(() => getLabs(), () => baseLabs, "labs")

  return (
    <div className="flex h-full flex-col">
      <DashboardTopbar
        title="Laboratoires virtuels"
        subtitle="Reproduisez fidèlement les environnements de physique, chimie, biologie ou électronique."
      />
      <div className="flex-1 p-4 sm:p-6">
        <LabsBrowser labs={labs} />
      </div>
    </div>
  )
}
