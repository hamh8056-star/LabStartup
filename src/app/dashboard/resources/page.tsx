import { Suspense } from "react"
import { DashboardTopbar } from "@/components/dashboard/topbar"
import { ResourcesWorkspace } from "@/components/dashboard/resources/resources-workspace"
import { searchResources, searchGlossary } from "@/lib/resources-db"
import type { SimulationDiscipline } from "@/lib/data/seed"

export default async function DashboardResourcesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const disciplineParam = typeof searchParams.discipline === 'string' ? searchParams.discipline : undefined
  const discipline = disciplineParam as SimulationDiscipline | "all" | undefined
  const instrument = typeof searchParams.instrument === 'string' ? searchParams.instrument : undefined
  const type = typeof searchParams.type === 'string' ? searchParams.type : undefined

  const [resourceResult, glossaryResult] = await Promise.all([
    searchResources({ discipline, query: instrument }),
    searchGlossary(),
  ])

  return (
    <div className="flex h-full flex-col">
      <DashboardTopbar
        title="Ressources pédagogiques"
        subtitle="Guides, vidéos, exercices interactifs et glossaire scientifique connectés aux laboratoires virtuels."
      />
      <div className="flex-1 space-y-6 p-6">
        <Suspense fallback={<div>Chargement...</div>}>
          <ResourcesWorkspace
            initialResources={resourceResult.resources}
            initialStats={resourceResult.stats}
            initialGlossary={glossaryResult.entries}
            initialDiscipline={discipline}
            initialInstrument={instrument}
            initialType={type}
          />
        </Suspense>
      </div>
    </div>
  )
}


