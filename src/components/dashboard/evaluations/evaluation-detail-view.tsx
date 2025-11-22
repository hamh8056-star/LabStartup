"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ChevronLeft, ChevronRight, History, Sparkles, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { formatDateTime } from "@/lib/utils"
import type { EvaluationSummary } from "@/lib/evaluations-db"

type EvaluationAttemptHistory = {
  id: string
  mode: "pre" | "post"
  score: number
  maxScore: number
  badgesAwarded: string[]
  pointsAwarded: number
  createdAt: string
  userId: string
  userName: string
}

type EvaluationHistoryPayload = {
  attempts: EvaluationAttemptHistory[]
  participants: Array<{
    userId: string
    userName: string
    lastScore: number
    lastAttemptAt: string
  }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

type EvaluationDetailViewProps = {
  evaluation: EvaluationSummary
}

export function EvaluationDetailView({ evaluation }: EvaluationDetailViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyData, setHistoryData] = useState<EvaluationHistoryPayload | null>(null)
  const pageFromUrl = parseInt(searchParams.get("page") || "1", 10)
  const [currentPage, setCurrentPage] = useState(pageFromUrl)
  const limit = 10

  // Synchroniser avec l'URL si elle change
  useEffect(() => {
    const urlPage = parseInt(searchParams.get("page") || "1", 10)
    if (urlPage !== currentPage) {
      setCurrentPage(urlPage)
    }
  }, [searchParams, currentPage])

  useEffect(() => {
    let ignore = false
    const fetchHistory = async () => {
      try {
        setHistoryLoading(true)
        const response = await fetch(`/api/evaluations/history?evaluationId=${evaluation.id}&page=${currentPage}&limit=${limit}`)
        if (!response.ok) {
          throw new Error("history fetch failed")
        }
        const payload = (await response.json()) as EvaluationHistoryPayload
        if (!ignore) {
          setHistoryData(payload)
        }
      } catch (error) {
        console.error(error)
        if (!ignore) {
          toast.error("Impossible de charger l'historique de l'évaluation.")
        }
      } finally {
        if (!ignore) {
          setHistoryLoading(false)
        }
      }
    }

    fetchHistory()

    return () => {
      ignore = true
    }
  }, [evaluation.id, currentPage, limit])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    // Mettre à jour l'URL sans recharger la page
    const url = new URL(window.location.href)
    url.searchParams.set("page", newPage.toString())
    router.push(url.pathname + url.search, { scroll: false })
    // Scroll vers le haut de la section historique
    const historySection = document.getElementById("history-section")
    if (historySection) {
      historySection.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/evaluations")} className="gap-2">
          <ArrowLeft className="size-4" />
          Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{evaluation.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="uppercase tracking-[0.3em]">
              {evaluation.discipline}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {evaluation.difficulty}
            </Badge>
            <Badge variant="outline">Durée {evaluation.duration} min</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-white/80 backdrop-blur dark:bg-slate-950/70">
          <CardContent className="space-y-2 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Progression moyenne</p>
            <p className="text-lg font-semibold text-foreground">
              +{evaluation.postQuizScore - evaluation.preQuizScore} pts
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-white/80 backdrop-blur dark:bg-slate-950/70">
          <CardContent className="space-y-2 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Complétion</p>
            <p className="text-lg font-semibold text-foreground">{Math.round(evaluation.completion * 100)}%</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-white/80 backdrop-blur dark:bg-slate-950/70">
          <CardContent className="space-y-2 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Temps moyen</p>
            <p className="text-lg font-semibold text-foreground">{evaluation.averageTime ?? "--"} min</p>
          </CardContent>
        </Card>
      </div>

      <Card id="history-section" className="border-border/60 bg-white/85 backdrop-blur dark:bg-slate-950/70">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <History className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Historique des tentatives</h2>
            </div>
            {historyData?.pagination && (
              <p className="text-sm text-muted-foreground">
                {historyData.pagination.total} tentative{historyData.pagination.total > 1 ? "s" : ""}
              </p>
            )}
          </div>
          <ScrollArea className="max-h-[400px] pr-4">
            {historyLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : historyData?.attempts?.length ? (
              <div className="space-y-3">
                {historyData.attempts.map(attempt => (
                  <div key={attempt.id} className="rounded-xl border border-border/50 bg-background/60 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-foreground">{attempt.userName}</span>
                      <Badge variant="outline" className="capitalize">
                        {attempt.mode === "pre" ? "Pré-quiz" : "Post-quiz"}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">Score {attempt.score}/100</Badge>
                      <Badge variant="outline">Points +{attempt.pointsAwarded}</Badge>
                      <span>{formatDateTime(attempt.createdAt, { dateStyle: "medium", timeStyle: "short" })}</span>
                    </div>
                    {attempt.badgesAwarded.length ? (
                      <p className="mt-2 text-xs text-primary">Badges : {attempt.badgesAwarded.join(", ")}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune tentative enregistrée pour le moment.</p>
            )}
          </ScrollArea>
          {historyData?.pagination && historyData.pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
              <div className="text-sm text-muted-foreground">
                Page {historyData.pagination.page} sur {historyData.pagination.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || historyLoading}
                  className="gap-1"
                >
                  <ChevronLeft className="size-4" />
                  Précédent
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, historyData.pagination.totalPages) }, (_, i) => {
                    let pageNum: number
                    if (historyData.pagination.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= historyData.pagination.totalPages - 2) {
                      pageNum = historyData.pagination.totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        disabled={historyLoading}
                        className="min-w-[2.5rem]"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === historyData.pagination.totalPages || historyLoading}
                  className="gap-1"
                >
                  Suivant
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-white/85 backdrop-blur dark:bg-slate-950/70">
        <CardContent className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <h2 className="text-lg font-semibold">Participants</h2>
          </div>
          {historyLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : historyData?.participants?.length ? (
            <div className="space-y-2">
              {historyData.participants.map(participant => (
                <div key={participant.userId} className="flex items-center justify-between gap-2 rounded-lg border border-border/50 p-3">
                  <span className="text-sm font-medium">{participant.userName}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{participant.lastScore}/100</span>
                    <span>•</span>
                    <span>{formatDateTime(participant.lastAttemptAt, { dateStyle: "medium" })}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">En attente des premières participations.</p>
          )}
        </CardContent>
      </Card>

      {evaluation.rubric?.length ? (
        <Card className="border-border/60 bg-white/85 backdrop-blur dark:bg-slate-950/70">
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Grille de notation</h2>
            <ul className="space-y-2 text-sm">
              {evaluation.rubric.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/60 bg-primary/5 dark:bg-primary/10">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 size-5 text-primary" />
            <div className="flex-1">
              <h3 className="mb-2 font-semibold text-foreground">Recommandation IA</h3>
              <p className="text-sm text-muted-foreground">
                Les apprenants ayant obtenu moins de 70% au post-quiz devraient relancer la simulation avec guidage
                pas à pas et refaire le quiz adaptatif.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/dashboard/evaluations")}>
          Retour à la liste
        </Button>
        <Button
          onClick={() => {
            toast.message("Rappel envoyé", {
              description: `Un rappel vient d'être transmis aux apprenants pour ${evaluation.title}.`,
            })
          }}
          className="gap-2"
        >
          <Sparkles className="size-4" />
          Envoyer un rappel
        </Button>
      </div>
    </div>
  )
}

