"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { dictionaries as DICTIONARIES, type Dictionary, type SupportedLocale } from "@/lib/i18n/dictionary"

type LanguageContextValue = {
  locale: SupportedLocale
  dictionary: Dictionary
  setLocale: (locale: SupportedLocale) => void
  t: (path: string) => string | string[]
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined)

const STORAGE_KEY = "taalimia.locale"

function resolvePath(dictionary: Dictionary, path: string): string | string[] {
  const segments = path.split(".")
  let current: unknown = dictionary
  for (const segment of segments) {
    if (typeof current === "object" && current !== null && segment in current) {
      current = (current as Record<string, unknown>)[segment]
    } else {
      return path
    }
  }
  if (typeof current === "string" || Array.isArray(current)) {
    return current
  }
  return path
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_KEY) as SupportedLocale | null
      if (stored && ["fr", "en", "ar"].includes(stored)) {
        return stored
      }
    }
    return "fr"
  })

  const setLocale = (value: SupportedLocale) => {
    setLocaleState(value)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, value)
    }
  }

  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }
    document.documentElement.lang = locale
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr"
  }, [locale])

  const dictionary = useMemo(() => DICTIONARIES[locale], [locale])

  const value = useMemo<LanguageContextValue>(() => ({
    locale,
    dictionary,
    setLocale,
    t: path => resolvePath(dictionary, path),
  }), [locale, dictionary])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
