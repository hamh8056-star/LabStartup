"use client"

import Link from "next/link"

import { DashboardTopbar } from "@/components/dashboard/topbar"
import { PerformanceTimeline } from "@/components/dashboard/performance-timeline"
import { StatCards } from "@/components/dashboard/stat-cards"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/i18n/language-provider"
import type { UserRole } from "@/lib/roles"

type DashboardPageContentProps = {
  userRole: UserRole
  title: string
  subtitle: string
  summary: any
  timeline: any[]
  evaluations: any[]
  certifications: any[]
  rooms: any[]
  aiTeacher: any[]
  simulations: any[]
  labs: any[]
  resources: any[]
  simulationsCount: number
  activeClasses: number
  certificationsCount: number
  engagement: number
  nextEvents: any[]
  featuredResources: any[]
}

export function DashboardPageContent({
  userRole,
  summary,
  timeline,
  evaluations,
  rooms,
  aiTeacher,
  resources,
  simulationsCount,
  activeClasses,
  certificationsCount,
  engagement,
  nextEvents,
  featuredResources,
}: DashboardPageContentProps) {
  const { t } = useLanguage()

  const roleConfig = {
    admin: {
      title: t("dashboard.main.roleConfig.admin.title"),
      subtitle: t("dashboard.main.roleConfig.admin.subtitle"),
    },
    teacher: {
      title: t("dashboard.main.roleConfig.teacher.title"),
      subtitle: t("dashboard.main.roleConfig.teacher.subtitle"),
    },
    student: {
      title: t("dashboard.main.roleConfig.student.title"),
      subtitle: t("dashboard.main.roleConfig.student.subtitle"),
    },
  }

  const { title, subtitle } = roleConfig[userRole]

  return (
    <div className="flex h-full flex-col">
      <DashboardTopbar title={title} subtitle={subtitle} />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <StatCards
          simulations={simulationsCount}
          activeClasses={activeClasses}
          certifications={certificationsCount}
          engagement={engagement}
        />
        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <PerformanceTimeline data={timeline} />
          <Card className="border-border/60 bg-white/80 backdrop-blur dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle className="text-lg">{t("dashboard.main.analytics.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 text-primary">
                {t("dashboard.main.analytics.averageSuccessRate")}{" "}
                <span className="font-semibold text-primary">
                  {Math.round(engagement * 100)}%
                </span>
              </div>
              <ul className="space-y-3">
                <li>
                  <strong className="text-foreground">{summary.users}</strong>{" "}
                  {t("dashboard.main.analytics.activeAccounts")}
                </li>
                <li>
                  <strong className="text-foreground">{summary.simulations}</strong>{" "}
                  {t("dashboard.main.analytics.simulationsAvailable")}
                </li>
                <li>
                  <strong className="text-foreground">{summary.resources}</strong>{" "}
                  {t("dashboard.main.analytics.resourcesIntegrated")}
                </li>
              </ul>
              <div className="rounded-xl bg-gradient-to-br from-slate-900 to-indigo-900 p-4 text-white shadow-inner">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
                  {t("dashboard.main.analytics.vrReady")}
                </p>
                <p className="mt-2 text-sm text-white/80">
                  {t("dashboard.main.analytics.vrDescription")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Card className="border-border/60 bg-white/80 backdrop-blur dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2 text-lg">
                {t("dashboard.main.aiRecommendations.title")}
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                  {t("dashboard.main.aiRecommendations.badge")}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiTeacher.map(reco => (
                <div
                  key={reco.id}
                  className="rounded-xl border border-border/60 bg-muted/40 p-4"
                >
                  <h3 className="text-sm font-semibold text-foreground">
                    {reco.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {reco.message}
                  </p>
                  <p className="mt-3 text-xs font-medium text-primary">
                    → {reco.suggestedAction}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-white/80 backdrop-blur dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle className="text-lg">{t("dashboard.main.collaborations.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {nextEvents.map(room => (
                <div key={room.id} className="rounded-xl border border-muted-foreground/20 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-foreground">
                      {room.title}
                    </h3>
                    <Badge variant={room.active ? "default" : "outline"}>
                      {room.active ? t("dashboard.main.collaborations.live") : t("dashboard.main.collaborations.scheduled")}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {room.members.length} {t("dashboard.main.collaborations.participants")} • {t("dashboard.main.collaborations.simulation")} {room.simulationId}
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {room.notes.map(note => (
                      <li key={note}>• {note}</li>
                    ))}
                  </ul>
                </div>
              ))}
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/collaboration">{t("dashboard.main.collaborations.manageRooms")}</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-white/80 backdrop-blur dark:bg-slate-950/70">
            <CardHeader>
              <CardTitle className="text-lg">{t("dashboard.main.evaluations.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {evaluations.map(evaluation => (
                <div key={evaluation.id} className="rounded-xl border border-border/50 p-4">
                  <h3 className="text-sm font-semibold text-foreground">
                    {evaluation.title}
                  </h3>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t("dashboard.main.evaluations.preQuiz")} {evaluation.preQuizScore}%</span>
                    <span>{t("dashboard.main.evaluations.postQuiz")} {evaluation.postQuizScore}%</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <Badge variant="outline" className="text-primary">
                      {Math.round(evaluation.completion * 100)}{t("dashboard.main.evaluations.completed")}
                    </Badge>
                    {evaluation.issuedCertId ? (
                      <span className="font-medium text-emerald-500">
                        {t("dashboard.main.evaluations.badge")} {evaluation.issuedCertId}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">{t("dashboard.main.evaluations.inProgress")}</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="border-border/60 bg-white/80 backdrop-blur dark:bg-slate-950/70">
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{t("dashboard.main.resources.title")}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.main.resources.subtitle")}
                </p>
              </div>
              <Badge variant="secondary">{summary.resources} {t("dashboard.main.resources.elements")}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {featuredResources.map(resource => (
                <div
                  key={resource.id}
                  className="flex items-start justify-between rounded-xl border border-border/50 bg-muted/30 p-4"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {resource.title}
                    </p>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      {resource.type} • {resource.discipline}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {resource.summary}
                    </p>
                  </div>
                  <Badge variant="outline">{resource.duration} min</Badge>
                </div>
              ))}
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/resources">{t("dashboard.main.resources.exploreLibrary")}</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-gradient-to-br from-primary via-primary/80 to-indigo-500 text-primary-foreground shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg">{t("dashboard.main.creator.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>
                {t("dashboard.main.creator.description")}
              </p>
              <ul className="text-sm text-primary-foreground/80">
                <li>• {t("dashboard.main.creator.feature1")}</li>
                <li>• {t("dashboard.main.creator.feature2")}</li>
                <li>• {t("dashboard.main.creator.feature3")}</li>
              </ul>
              <Button asChild variant="secondary" className="w-full">
                <Link href="/dashboard/creator">{t("dashboard.main.creator.openCreator")}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}








