"use client"

import Link from "next/link"
import { ArrowRight, Headphones, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/components/i18n/language-provider"

export function CallToAction() {
  const { t } = useLanguage()
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-4 px-4 sm:gap-6 md:gap-8 lg:grid-cols-[1.5fr_1fr]">
      <Card className="overflow-hidden border-none bg-gradient-to-br from-primary/90 via-primary to-primary/70 text-primary-foreground shadow-2xl">
        <CardContent className="flex flex-col gap-4 p-6 sm:gap-6 sm:p-8 md:p-10">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.4em] text-white/70 sm:text-sm">
            <ShieldCheck className="size-3.5 sm:size-4" />
            {t("landing.cta.badge")}
          </span>
          <h3 className="text-2xl font-semibold sm:text-3xl lg:text-4xl">
            {t("landing.cta.title")}
          </h3>
          <p className="max-w-2xl text-sm text-white/80 sm:text-base">
            {t("landing.cta.description")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button
              asChild
              size="lg"
              className="h-11 w-full rounded-full bg-white text-primary hover:bg-white/90 sm:h-12 sm:w-auto"
            >
              <Link href="/dashboard">{t("landing.cta.viewDashboard")}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 w-full rounded-full border-white/30 text-white hover:bg-white/10 sm:h-12 sm:w-auto"
            >
              <Link href="/auth/login">
                {t("landing.cta.signIn")}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/60 bg-white/80 backdrop-blur dark:bg-slate-950/60">
        <CardContent className="flex h-full flex-col justify-between gap-4 p-6 sm:gap-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground sm:text-sm">
              <Headphones className="size-3.5 text-primary sm:size-4" />
              {t("landing.cta.premiumBadge")}
            </span>
            <p className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
              {t("landing.cta.premiumTitle")}
            </p>
          </div>
          <div className="rounded-xl border border-dashed border-primary/40 p-3 text-xs text-primary sm:rounded-2xl sm:p-4 sm:text-sm">
            {(() => {
              const features = t("landing.cta.premiumFeatures")
              const featuresArray = Array.isArray(features) ? features : []
              return featuresArray.map((feature: string, index: number) => (
                <span key={index}>
                  {feature}
                  {index < featuresArray.length - 1 && <br />}
                </span>
              ))
            })()}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

