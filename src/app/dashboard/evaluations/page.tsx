import { EvaluationsBrowser } from "@/components/dashboard/evaluations/evaluations-browser"
import { DashboardTopbar } from "@/components/dashboard/topbar"
import { ensureEvaluationIndexes, getEvaluationSummaries, seedEvaluationData } from "@/lib/evaluations-db"

export default async function DashboardEvaluationsPage() {
  await ensureEvaluationIndexes()
  await seedEvaluationData()
  const evaluations = await getEvaluationSummaries()

  return (
    <div className="flex h-full flex-col">
      <DashboardTopbar
        title="Évaluations & badges"
        subtitle="Suivez la progression des apprenants, gérez les certificats et planifiez vos quiz adaptatifs."
      />
      <div className="flex-1 p-6">
        <EvaluationsBrowser evaluations={evaluations} />
      </div>
    </div>
  )
}


