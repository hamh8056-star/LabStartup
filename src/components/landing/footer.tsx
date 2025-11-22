"use client"

import Link from "next/link"
import { Github, Globe2, Linkedin } from "lucide-react"

import { Separator } from "@/components/ui/separator"
import { useLanguage } from "@/components/i18n/language-provider"

export function LandingFooter() {
  const { t } = useLanguage()
  return (
    <footer className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-12 text-sm text-muted-foreground">
      <Separator className="bg-border/60" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Taalimia. {t("landing.footer.copyright")}</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/legal/privacy" className="hover:text-primary">
            {t("landing.footer.privacy")}
          </Link>
          <Link href="/legal/terms" className="hover:text-primary">
            {t("landing.footer.terms")}
          </Link>
          <Link href="/legal/accessibility" className="hover:text-primary">
            {t("landing.footer.accessibility")}
          </Link>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          <Link href="https://github.com" className="hover:text-primary">
            <Github className="size-5" />
          </Link>
          <Link href="https://www.linkedin.com" className="hover:text-primary">
            <Linkedin className="size-5" />
          </Link>
          <Link href="https://taalimia.education" className="hover:text-primary">
            <Globe2 className="size-5" />
          </Link>
        </div>
      </div>
    </footer>
  )
}

