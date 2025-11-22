"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { GraduationCap, Microscope, Shield, Sparkle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/components/i18n/language-provider"

type AuthCardProps = {
  title: string
  description: string
  form: ReactNode
  footer?: ReactNode
}

export function AuthCard({ title, description, form, footer }: AuthCardProps) {
  const { t } = useLanguage()
  return (
    <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-3xl border border-border/60 bg-white/80 shadow-2xl backdrop-blur dark:bg-slate-950/70">
      <div className="grid gap-0 md:grid-cols-[1.05fr_0.95fr]">
        <div className="relative flex flex-col justify-between bg-gradient-to-br from-[#0a1630] via-[#1e40af] to-[#051a46] p-8 text-white">
          <div className="space-y-6">
            <Badge variant="secondary" className="bg-white/10 text-white">
              {t("auth.card.platformName")}
            </Badge>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold leading-tight md:text-4xl">{title}</h2>
              <p className="text-sm text-white/80">{description}</p>
            </div>
          </div>
          <div className="mt-10 space-y-6 text-sm text-white/80">
            <div className="flex items-start gap-3">
              <span className="mt-1 flex size-9 items-center justify-center rounded-xl bg-white/12 text-white">
                <Sparkle className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-white">{t("auth.card.immersiveSimulations")}</p>
                <p>{t("auth.card.immersiveSimulationsDesc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 flex size-9 items-center justify-center rounded-xl bg-white/10 text-white">
                <Microscope className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-white">{t("auth.card.intelligentGuidance")}</p>
                <p>{t("auth.card.intelligentGuidanceDesc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 flex size-9 items-center justify-center rounded-xl bg-white/10 text-white">
                <Shield className="size-5" />
              </span>
              <div>
                <p className="font-semibold text-white">{t("auth.card.enhancedSecurity")}</p>
                <p>{t("auth.card.enhancedSecurityDesc")}</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/10 p-4 text-xs uppercase tracking-[0.4em] text-white/70">
              <span className="flex items-center gap-2">
                <GraduationCap className="size-4" />
                {t("auth.card.learnDifferently")}
              </span>
              <Link href="/" className="text-white hover:text-white/80">
                {t("auth.card.discoverPlatform")}
              </Link>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-center bg-background/80 p-8">
          <Card className="border-none bg-transparent shadow-none">
            <CardHeader className="space-y-4 p-0">
              <CardTitle className="text-2xl text-foreground">{title}</CardTitle>
              <CardDescription className="text-muted-foreground">{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-0 pt-6">
              {form}
              {footer ? <div className="pt-4 text-sm text-muted-foreground">{footer}</div> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


