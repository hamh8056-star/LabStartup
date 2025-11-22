"use client"

import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

import { VirtualLabScene } from "@/components/three/virtual-lab-scene"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/i18n/language-provider"

export function HeroSection() {
  const { t } = useLanguage()
  return (
    <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-white via-white to-slate-100 p-8 dark:from-slate-900 dark:via-slate-950 dark:to-black md:flex-row md:p-12 lg:items-center">
      <div className="flex flex-1 flex-col gap-6">
        <span className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-white px-4 py-1 text-xs font-medium uppercase tracking-[0.35em] text-muted-foreground shadow-sm dark:bg-slate-950">
          <Sparkles className="size-3.5 text-primary" />
          {t("landing.hero.badge")}
        </span>
        <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white lg:text-5xl">
          {t("landing.hero.title")}
        </h1>
        <p className="text-lg text-muted-foreground lg:max-w-xl">
          {t("landing.hero.description")}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full px-6 text-base font-semibold"
          >
            <Link href="/auth/register">
              {t("landing.hero.startFree")}
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 rounded-full border border-primary/40 px-6 text-base font-semibold"
          >
            <Link href="#features">{t("landing.hero.exploreInnovations")}</Link>
          </Button>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4 text-sm text-muted-foreground sm:grid-cols-3">
          <div>
            <dt className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {t("landing.hero.simulations")}
            </dt>
            <dd className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
              150+
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {t("landing.hero.institutions")}
            </dt>
            <dd className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
              80+
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {t("landing.hero.certifications")}
            </dt>
            <dd className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
              12k
            </dd>
          </div>
        </dl>
      </div>
      <div className="flex-1">
        <VirtualLabScene />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full bg-gradient-to-b from-primary/10 via-transparent to-transparent blur-3xl" />
    </section>
  )
}

