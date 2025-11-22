import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { DashboardTopbar } from "@/components/dashboard/topbar"
import { EvaluationQuizView } from "@/components/dashboard/evaluations/evaluation-quiz-view"
import { ensureEvaluationIndexes, getEvaluationSummaries } from "@/lib/evaluations-db"
import { getDatabase } from "@/lib/mongodb"
import type { EvaluationTemplate } from "@/lib/data/evaluations"

export default async function EvaluationQuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ mode?: string }>
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/dashboard/evaluations")
  }

  const { id } = await params
  const { mode } = await searchParams
  const quizMode = (mode === "post" ? "post" : "pre") as "pre" | "post"

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
        title={`Quiz - ${evaluation.title}`}
        subtitle={`Mode ${quizMode === "pre" ? "Pré-quiz" : "Post-quiz"}`}
      />
      <div className="flex-1 overflow-auto p-6">
        <EvaluationQuizView evaluation={evaluation} initialMode={quizMode} />
      </div>
    </div>
  )
}



