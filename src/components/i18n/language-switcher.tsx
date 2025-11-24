"use client"

import { useEffect, useState } from "react"
import { Languages } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const LOCALE_LABELS: Record<string, string> = {
  fr: "Français",
  en: "English",
  ar: "العربية",
}

type LanguageSwitcherProps = {
  variant?: "default" | "inverted"
  className?: string
}

export function LanguageSwitcher({ variant = "default", className }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage()
  const [mounted, setMounted] = useState(false)

  // Éviter les erreurs d'hydratation en rendant uniquement côté client
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Rendre un placeholder pendant l'hydratation
    return (
      <div
        className={`flex items-center gap-2 text-sm ${
          variant === "inverted" ? "text-white" : "text-muted-foreground"
        } ${className ?? ""}`.trim()}
      >
        <Languages
          className={`size-4 ${variant === "inverted" ? "text-white" : "text-muted-foreground"}`}
          aria-hidden
        />
        <div className="h-9 w-[150px] rounded-md border bg-background" />
      </div>
    )
  }

  return (
    <div
      className={`flex items-center gap-2 text-sm ${
        variant === "inverted" ? "text-white" : "text-muted-foreground"
      } ${className ?? ""}`.trim()}
    >
      <Languages
        className={`size-4 ${variant === "inverted" ? "text-white" : "text-muted-foreground"}`}
        aria-hidden
      />
      <Select value={locale} onValueChange={value => setLocale(value as typeof locale)}>
        <SelectTrigger
          className={`w-[150px] ${
            variant === "inverted"
              ? "border-white/40 bg-white/10 text-white placeholder:text-white/70 hover:bg-white/15 focus:ring-white/40"
              : ""
          }`}
        >
          <SelectValue placeholder="Langue" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(LOCALE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

