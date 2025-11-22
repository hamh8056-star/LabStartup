"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  ArrowDownCircle,
  BarChartBig,
  Clock,
  FileDown,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import type {
  AnalyticsSummary,
  PerformancePoint,
  ClassPerformance,
  ExperienceMetric,
  ActivityPoint,
} from "@/lib/data/analytics"

const fetcher = (url: string) => fetch(url).then(res => res.json())

const disciplineLabels: Record<string, string> = {
  physique: "Physique",
  biologie: "Biologie",
  electronique: "Électronique",
  informatique: "Informatique",
}

const EXPORT_FORMATS: { label: string; format: "csv" | "xlsx" | "pdf" }[] = [
  { label: "CSV", format: "csv" },
  { label: "Excel", format: "xlsx" },
  { label: "PDF", format: "pdf" },
]

type AnalyticsResponse = {
  summary: AnalyticsSummary
  timeline: PerformancePoint[]
  classes: ClassPerformance[]
  experiences: ExperienceMetric[]
  activity: ActivityPoint[]
}

type TimeWindow = 4 | 6

type DisciplineFilter = "all" | keyof typeof disciplineLabels

function average(array: number[]) {
  return array.length ? array.reduce((acc, value) => acc + value, 0) / array.length : 0
}

export function AnalyticsWorkspace() {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(6)
  const [disciplineFilter, setDisciplineFilter] = useState<DisciplineFilter>("all")
  const [exporting, setExporting] = useState<"csv" | "xlsx" | "pdf" | null>(null)

  const { data } = useSWR<AnalyticsResponse>("/api/analytics", fetcher, { suspense: false })

  const summary = data?.summary
  const timeline = useMemo(() => (data?.timeline ?? []).slice(-(timeWindow ?? 4)), [data?.timeline, timeWindow])
  const classes = useMemo(() => {
    const collection = data?.classes ?? []
    if (disciplineFilter === "all") return collection
    return collection.filter(item => item.discipline === disciplineFilter)
  }, [data?.classes, disciplineFilter])
  const experiences = data?.experiences ?? []
  const activity = data?.activity ?? []

  const averageCompletion = useMemo(
    () => Math.round(average(timeline.map(point => point.completionRate)) * 100),
    [timeline],
  )

  const averageScore = useMemo(
    () => Math.round(average(timeline.map(point => point.averageScore))),
    [timeline],
  )

  const averageTimeSpent = useMemo(
    () => Math.round(average(timeline.map(point => point.timeSpent))),
    [timeline],
  )

  const handleExport = async (format: "csv" | "xlsx" | "pdf") => {
    try {
      setExporting(format)
      const response = await fetch(`/api/analytics/export?format=${format}`)
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        toast.error(payload?.message ?? "Export impossible pour le moment.")
        return
      }
      const payload = (await response.json()) as { fileName: string; mime: string; base64: string }
      const binary = Uint8Array.from(atob(payload.base64), char => char.charCodeAt(0))
      const blob = new Blob([binary], { type: payload.mime })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = payload.fileName
      link.click()
      window.URL.revokeObjectURL(url)
      toast.success("Export généré", { description: `Fichier ${payload.fileName} téléchargé.` })
    } catch (error) {
      console.error(error)
      toast.error("Une erreur est survenue pendant l'export.")
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/90">
        <CardHeader>
          <CardTitle className="text-lg">Synthèse analytique</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <SummaryTile
            icon={<Users className="size-5" />}
            label="Utilisateurs"
            value={summary?.users ?? 0}
            description="Compte total synchronisé"
          />
          <SummaryTile
            icon={<TrendingUp className="size-5" />}
            label="Taux d'achèvement"
            value={`${Math.round((summary?.completionRate ?? 0) * 100)}%`}
            description="Moyenne globale"
          />
          <SummaryTile
            icon={<Clock className="size-5" />}
            label="Durée session"
            value={`${summary?.avgSessionMinutes ?? 0} min`}
            description="Temps moyen investi"
          />
          <SummaryTile
            icon={<BarChartBig className="size-5" />}
            label="Étudiants actifs"
            value={summary?.activeStudents ?? 0}
            description="Sur les 30 derniers jours"
          />
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/90">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">Performance temporelle</CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 font-medium transition ${timeWindow === 4 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
              onClick={() => setTimeWindow(4)}
            >
              4 semaines
            </button>
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 font-medium transition ${timeWindow === 6 ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
              onClick={() => setTimeWindow(6)}
            >
              6 semaines
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric value={`${averageCompletion}%`} label="Taux moyen" icon={<TrendingUp className="size-4 text-primary" />} />
            <Metric value={`${averageScore}/100`} label="Score moyen" icon={<ArrowDownCircle className="size-4 text-primary" />} />
            <Metric value={`${averageTimeSpent} min`} label="Temps investi" icon={<Clock className="size-4 text-primary" />} />
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer>
              <LineChart data={timeline} margin={{ left: 16, right: 16, top: 16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={value => `${Math.round(value * 100)}%`} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <RechartsTooltip
                  formatter={(value: number, name) =>
                    name === "completionRate" ? `${Math.round(value * 100)}%` : `${value}`
                  }
                  labelFormatter={label => `Période : ${label}`}
                />
                <Line yAxisId="left" type="monotone" dataKey="completionRate" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Taux de complétion" />
                <Line yAxisId="right" type="monotone" dataKey="averageScore" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} name="Score moyen" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="border-border/60 bg-card/90">
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg">Performance par classe</CardTitle>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                className={`rounded-full px-3 py-1.5 font-medium transition ${disciplineFilter === "all" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
                onClick={() => setDisciplineFilter("all")}
              >
                Toutes
              </button>
              {Object.entries(disciplineLabels).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`rounded-full px-3 py-1.5 font-medium transition ${disciplineFilter === value ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
                  onClick={() => setDisciplineFilter(value as DisciplineFilter)}
                >
                  {label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={classes} layout="vertical" margin={{ left: 32, right: 16, top: 16, bottom: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                  <XAxis type="number" domain={[0, 1]} tickFormatter={value => `${Math.round(value * 100)}%`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="name" type="category" width={140} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <RechartsTooltip formatter={(value: number) => `${Math.round(value * 100)}%`} />
                  <Bar dataKey="completion" fill="hsl(var(--primary))" radius={[4, 4, 4, 4]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-2 text-sm text-muted-foreground">
                {classes.map(item => (
                  <div key={item.id} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <Badge variant="outline">{disciplineLabels[item.discipline]}</Badge>
                    </div>
                    <div className="mt-3 space-y-1">
                      <Progress value={item.completion * 100} />
                      <p className="text-xs">Achèvement : {Math.round(item.completion * 100)}% • Score moyen {item.avgScore}/100 • {item.learners} apprenants</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90">
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg">Exports & rapports</CardTitle>
            <div className="flex gap-2">
              {EXPORT_FORMATS.map(option => (
                <Button
                  key={option.format}
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => handleExport(option.format)}
                  disabled={exporting !== null}
                >
                  {exporting === option.format ? <Loader2 className="size-3.5 animate-spin" /> : <FileDown className="size-3.5" />}
                  {option.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Générez rapidement des rapports par période, classe ou expérience et transmettez-les à vos parties prenantes.
            </p>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Activité quotidienne</p>
              <div className="h-48">
                <ResponsiveContainer>
                  <AreaChart data={activity} margin={{ left: 0, right: 0, top: 16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/60" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={value => format(new Date(value), "dd MMM", { locale: fr })}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <RechartsTooltip labelFormatter={value => format(new Date(value), "PPP", { locale: fr })} />
                    <Area type="monotone" dataKey="activeUsers" stroke="hsl(var(--primary))" fill="url(#activityGradient)" name="Utilisateurs actifs" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/90">
        <CardHeader>
          <CardTitle className="text-lg">Expériences marquantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {experiences.map(experience => (
              <div key={experience.id} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">{experience.title}</p>
                  <Badge variant="outline">{disciplineLabels[experience.discipline]}</Badge>
                </div>
                <p className="mt-2 text-xs">{experience.completions} complétions • Satisfaction {experience.satisfaction}/5</p>
                <Progress value={experience.avgScore} className="mt-3" />
                <p className="mt-1 text-xs">Score moyen {experience.avgScore}/100 • {experience.timeSpent} min</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryTile({ icon, label, value, description }: { icon: React.ReactNode; label: string; value: string | number; description: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</span>
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-foreground">{value}</p>
    </div>
  )
}

function Metric({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
      <div className="flex items-center gap-2 text-primary">
        <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10">{icon}</span>
        <p className="text-sm font-semibold text-foreground">{label}</p>
      </div>
      <p className="mt-2 text-xl font-bold text-foreground">{value}</p>
    </div>
  )
}
