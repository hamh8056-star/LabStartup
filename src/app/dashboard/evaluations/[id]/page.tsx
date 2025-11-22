import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { Suspense } from "react"

import { authOptions } from "@/lib/auth"
import { DashboardTopbar } from "@/components/dashboard/topbar"
import { EvaluationDetailView } from "@/components/dashboard/evaluations/evaluation-detail-view"
import { ensureEvaluationIndexes, getEvaluationSummaries } from "@/lib/evaluations-db"
import { getDatabase } from "@/lib/mongodb"
import type { EvaluationTemplate } from "@/lib/data/evaluations"

export default async function EvaluationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/dashboard/evaluations")
  }

  const { id } = await params
  await ensureEvaluationIndexes()

  const db = await getDatabase()
  const template = await db.collection<EvaluationTemplate>("evaluation_templates").findOne({ id })

  if (!template) {
    redirect("/dashboard/evaluations")
  }

  const evaluations = await getEvaluationSummaries()
  const evaluation = evaluations.find(e => e.id === id)

  if (!evaluation) {
    redirect("/dashboard/evaluations")
  }

  return (
    <div className="flex h-full flex-col">
      <DashboardTopbar
        title={evaluation.title}
        subtitle={`Évaluation ${evaluation.discipline} • ${evaluation.difficulty}`}
      />
      <div className="flex-1 overflow-auto p-6">
        <Suspense fallback={<div>Chargement...</div>}>
          <EvaluationDetailView evaluation={evaluation} />
        </Suspense>
      </div>
    </div>
  )
}

