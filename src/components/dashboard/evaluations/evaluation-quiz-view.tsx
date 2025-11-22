"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Target } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import type { EvaluationSummary, EvaluationAttemptMode } from "@/lib/evaluations-db"

type EvaluationQuizViewProps = {
  evaluation: EvaluationSummary
  initialMode?: EvaluationAttemptMode
}

export function EvaluationQuizView({ evaluation, initialMode = "pre" }: EvaluationQuizViewProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [quizMode, setQuizMode] = useState<EvaluationAttemptMode>(initialMode)
  const [quizSelections, setQuizSelections] = useState<Record<string, string[]>>({})
  const [isSubmittingQuiz, startQuizTransition] = useTransition()

  const quizQuestions = useMemo(() => {
    return quizMode === "pre" ? evaluation.quiz.pre : evaluation.quiz.post
  }, [evaluation.quiz, quizMode])

  const maxQuizScore = useMemo(() => {
    return quizQuestions.reduce((acc, question) => {
      const max = question.options
        .filter(option => option.correct)
        .reduce((sum, option) => sum + option.points, 0)
      return acc + (max || 1)
    }, 0)
  }, [quizQuestions])

  const handleSelectOption = (questionId: string, optionId: string) => {
    setQuizSelections(prev => ({
      ...prev,
      [questionId]: [optionId],
    }))
  }

  const handleSubmitQuiz = () => {
    if (!quizQuestions.length) {
      toast.error("Aucune question disponible pour ce quiz.")
      return
    }

    const answers = quizQuestions.map(question => {
      const selected = quizSelections[question.id] ?? []
      const gainedPoints = question.options
        .filter(option => selected.includes(option.id))
        .reduce((acc, option) => acc + option.points, 0)
      return {
        questionId: question.id,
        selectedOptionIds: selected,
        gainedPoints,
      }
    })

    if (answers.some(answer => answer.selectedOptionIds.length === 0)) {
      toast.error("Veuillez répondre à toutes les questions.")
      return
    }

    startQuizTransition(async () => {
      try {
        const response = await fetch("/api/evaluations/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            evaluationId: evaluation.id,
            mode: quizMode,
            userId: session?.user?.id || "user",
            userName: session?.user?.name || "Utilisateur",
            userEmail: session?.user?.email || undefined,
            answers,
            maxScore: maxQuizScore || 100,
          }),
        })
        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          throw new Error(payload?.message ?? "Erreur lors de l'envoi du quiz")
        }
        const payload = (await response.json()) as {
          score: number
          badgesAwarded: string[]
          pointsAwarded: number
          certificate: { id: string; badge: string; score: number; issuedAt: string } | null
        }
        toast.success("Quiz enregistré", {
          description: `Score ${payload.score}/100 • ${payload.badgesAwarded.join(", ") || "badge explorateur"}`,
        })
        if (payload.certificate) {
          toast.message("Certificat émis", {
            description: `Badge ${payload.certificate.badge} — ${payload.certificate.id}`,
          })
        }
        router.push(`/dashboard/evaluations/${evaluation.id}`)
      } catch (error) {
        console.error(error)
        toast.error("Impossible d'enregistrer le quiz.")
      }
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/evaluations/${evaluation.id}`)} className="gap-2">
          <ArrowLeft className="size-4" />
          Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Quiz - {evaluation.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="uppercase tracking-[0.3em]">
              {evaluation.discipline}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {evaluation.difficulty}
            </Badge>
          </div>
        </div>
      </div>

      <Card className="border-border/60 bg-white/85 backdrop-blur dark:bg-slate-950/70">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>Quiz adaptatif</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={quizMode === "pre" ? "default" : "outline"}
                size="sm"
                onClick={() => setQuizMode("pre")}
              >
                Pré-quiz
              </Button>
              <Button
                variant={quizMode === "post" ? "default" : "outline"}
                size="sm"
                onClick={() => setQuizMode("post")}
              >
                Post-quiz
              </Button>
              <Badge variant="outline" className="text-xs uppercase">
                Score max {maxQuizScore || 100}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[600px] pr-4">
            <div className="space-y-6">
              {quizQuestions.length ? (
                quizQuestions.map((question, index) => (
                  <div key={question.id} className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-foreground">
                        Q{index + 1}. {question.prompt}
                      </p>
                      <Badge variant="outline">
                        {question.options.filter(option => option.correct).length} réponse(s)
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {question.options.map(option => {
                        const selected = quizSelections[question.id]?.includes(option.id)
                        return (
                          <Button
                            key={option.id}
                            type="button"
                            variant={selected ? "default" : "outline"}
                            className="w-full justify-between"
                            onClick={() => handleSelectOption(question.id, option.id)}
                          >
                            <span>{option.label}</span>
                            <Badge variant="outline" className="ml-2 text-xs">
                              +{option.points} pts
                            </Badge>
                          </Button>
                        )
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">{question.explanation}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Aucune question disponible pour ce mode.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push(`/dashboard/evaluations/${evaluation.id}`)}>
          Annuler
        </Button>
        <Button className="gap-2" onClick={handleSubmitQuiz} disabled={isSubmittingQuiz}>
          {isSubmittingQuiz ? <Loader2 className="size-4 animate-spin" /> : <Target className="size-4" />}
          {isSubmittingQuiz ? "Enregistrement..." : "Valider le quiz"}
        </Button>
      </div>
    </div>
  )
}



