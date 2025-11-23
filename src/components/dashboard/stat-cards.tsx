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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {data.map((item, index) => (
        <Card
          key={index}
          className="border-border/60 bg-white/70 backdrop-blur dark:bg-slate-950/70"
        >
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
              {item.label}
            </CardTitle>
            <item.icon className="size-4 text-primary sm:size-5" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">
              {item.value}
            </div>
            <p className="text-xs text-emerald-500">{item.trend}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

