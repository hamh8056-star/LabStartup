"use client"

import {
  Atom,
  BookOpen,
  BrainCircuit,
  ChartBar,
  FlaskConical,
  Globe2,
  GraduationCap,
  Lock,
  PenTool,
  Users2,
  UsersRound,
  Workflow,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/components/i18n/language-provider"

export function FeaturesGrid() {
  const { t } = useLanguage()
  
  const features = [
    {
      icon: Atom,
      key: "interactive3D",
    },
    {
      icon: FlaskConical,
      key: "virtualLabs",
    },
    {
      icon: Users2,
      key: "teacherStudent",
    },
    {
      icon: Workflow,
      key: "realtimeCollab",
    },
    {
      icon: BrainCircuit,
      key: "aiEducation",
    },
    {
      icon: GraduationCap,
      key: "evaluation",
    },
    {
      icon: BookOpen,
      key: "resources",
    },
    {
      icon: Globe2,
      key: "accessibility",
    },
    {
      icon: Lock,
      key: "security",
    },
    {
      icon: ChartBar,
      key: "analytics",
    },
    {
      icon: PenTool,
      key: "editor",
    },
    {
      icon: UsersRound,
      key: "community",
    },
  ]
  return (
    <section
      id="features"
      className="mx-auto flex w-full max-w-6xl flex-col gap-8"
    >
      <div className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.4em] text-primary">
          {t("landing.features.badge")}
        </p>
        <h2 className="text-3xl font-semibold text-slate-900 dark:text-white lg:text-4xl">
          {t("landing.features.title")}
        </h2>
        <p className="text-lg text-muted-foreground">
          {t("landing.features.description")}
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Card
            key={feature.key}
            className={cn(
              "group border-border/60 bg-white/80 backdrop-blur dark:bg-slate-950/60",
              index === 0 || index === 3 ? "lg:col-span-2" : "",
            )}
          >
            <CardHeader className="flex flex-row items-center gap-4">
              <span className="rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary shadow-sm transition group-hover:scale-105 group-hover:bg-primary/20">
                <feature.icon className="size-6" />
              </span>
              <CardTitle className="text-xl">{t(`landing.features.items.${feature.key}.title`)}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {t(`landing.features.items.${feature.key}.description`)}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

