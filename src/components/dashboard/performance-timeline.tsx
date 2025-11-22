"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartTooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/i18n/language-provider"
import type { PerformancePoint } from "@/lib/data/analytics"

type PerformanceTimelineProps = {
  data: PerformancePoint[]
}

export function PerformanceTimeline({ data }: PerformanceTimelineProps) {
  const { t } = useLanguage()
  
  const chartData = data.map(point => ({
    label: point.label,
    completionRate: Math.round(point.completionRate * 100),
    averageScore: point.averageScore,
    timeSpent: point.timeSpent,
  }))

  return (
    <Card className="border-border/60 bg-white/70 backdrop-blur dark:bg-slate-950/70">
      <CardHeader>
        <CardTitle className="text-lg">{t("dashboard.main.timeline.title")}</CardTitle>
      </CardHeader>
      <CardContent className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCompletion" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="label" stroke="currentColor" />
            <YAxis
              stroke="currentColor"
              tickFormatter={value => `${value}%`}
              domain={[0, 100]}
            />
            <RechartTooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                borderRadius: "12px",
                border: "1px solid hsl(var(--border))",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="completionRate"
              name={t("dashboard.main.timeline.completionRate")}
              stroke="#6366f1"
              fillOpacity={1}
              fill="url(#colorCompletion)"
            />
            <Area
              type="monotone"
              dataKey="averageScore"
              name={t("dashboard.main.timeline.averageScore")}
              stroke="#22c55e"
              fillOpacity={0.8}
              fill="url(#colorScore)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

