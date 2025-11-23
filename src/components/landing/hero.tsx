"use client"

import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

import { VirtualLabScene } from "@/components/three/virtual-lab-scene"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/components/i18n/language-provider"

export function HeroSection() {
  const { t } = useLanguage()
  return (
    <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-white via-white to-slate-100 p-4 dark:from-slate-900 dark:via-slate-950 dark:to-black sm:gap-8 sm:rounded-3xl sm:p-6 md:flex-row md:gap-12 md:p-8 lg:p-12 lg:items-center">
      <div className="flex flex-1 flex-col gap-4 sm:gap-6">
        <span className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-white px-3 py-1 text-[10px] font-medium uppercase tracking-[0.35em] text-muted-foreground shadow-sm dark:bg-slate-950 sm:px-4 sm:text-xs">
          <Sparkles className="size-3 text-primary sm:size-3.5" />
          {t("landing.hero.badge")}
        </span>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-3xl md:text-4xl lg:text-5xl">
          {t("landing.hero.title")}
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base md:text-lg lg:max-w-xl">
          {t("landing.hero.description")}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
          <Button
            asChild
            size="lg"
            className="h-11 w-full rounded-full px-5 text-sm font-semibold sm:h-12 sm:w-auto sm:px-6 sm:text-base"
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
            className="h-11 w-full rounded-full border border-primary/40 px-5 text-sm font-semibold sm:h-12 sm:w-auto sm:px-6 sm:text-base"
          >
            <Link href="#features">{t("landing.hero.exploreInnovations")}</Link>
          </Button>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:mt-6 sm:grid-cols-3 sm:gap-4 sm:text-sm">
          <div>
            <dt className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:text-xs">
              {t("landing.hero.simulations")}
            </dt>
            <dd className="mt-1 text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">
              150+
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:text-xs">
              {t("landing.hero.institutions")}
            </dt>
            <dd className="mt-1 text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">
              80+
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:text-xs">
              {t("landing.hero.certifications")}
            </dt>
            <dd className="mt-1 text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">
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

