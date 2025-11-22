"use client"

import { Atom, LineChart, Trophy, Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/i18n/language-provider"

type StatCardsProps = {
  simulations: number
  activeClasses: number
  certifications: number
  engagement: number
}

const icons = {
  simulations: Atom,
  classes: Users,
  certifications: Trophy,
  analytics: LineChart,
}

export function StatCards({
  simulations,
  activeClasses,
  certifications,
  engagement,
}: StatCardsProps) {
  const { t } = useLanguage()
  
  const data = [
    {
      label: t("dashboard.main.statCards.simulationsAvailable"),
      value: simulations,
      icon: icons.simulations,
      trend: t("dashboard.main.statCards.trendSimulations"),
    },
    {
      label: t("dashboard.main.statCards.activeClasses"),
      value: activeClasses,
      icon: icons.classes,
      trend: t("dashboard.main.statCards.trendClasses"),
    },
    {
      label: t("dashboard.main.statCards.certificationsIssued"),
      value: certifications,
      icon: icons.certifications,
      trend: t("dashboard.main.statCards.trendCertifications"),
    },
    {
      label: t("dashboard.main.statCards.averageEngagement"),
      value: `${Math.round(engagement * 100)}%`,
      icon: icons.analytics,
      trend: t("dashboard.main.statCards.trendEngagement"),
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {data.map(item => (
        <Card
          key={item.label}
          className="border-border/60 bg-white/70 backdrop-blur dark:bg-slate-950/70"
        >
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
            <item.icon className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-slate-900 dark:text-white">
              {item.value}
            </div>
            <p className="text-xs text-emerald-500">{item.trend}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

