"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { AccessibilitySettings } from "@/lib/accessibility-db"
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation"
import { useScreenReader } from "@/hooks/use-screen-reader"

type AccessibilityContextType = {
  settings: AccessibilitySettings | null
  updateSettings: (settings: Partial<AccessibilitySettings>) => Promise<void>
  isLoading: boolean
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Charger les paramètres au démarrage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/accessibility/settings")
        if (response.ok) {
          const data = await response.json()
          if (data.settings) {
            setSettings(data.settings)
            applySettings(data.settings)
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des paramètres:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Appliquer les paramètres d'accessibilité
  const applySettings = (settings: AccessibilitySettings) => {
    if (typeof document === "undefined") return

    const root = document.documentElement

    // Taille de police
    root.style.fontSize = {
      small: "14px",
      medium: "16px",
      large: "18px",
      xlarge: "20px",
    }[settings.fontSize]

    // Contraste
    if (settings.contrast === "high") {
      root.classList.add("high-contrast")
    } else {
      root.classList.remove("high-contrast")
    }

    // Réduction de mouvement
    if (settings.reducedMotion) {
      root.style.setProperty("--motion-reduce", "1")
    } else {
      root.style.removeProperty("--motion-reduce")
    }

    // Mode daltonien
    if (settings.colorBlindMode !== "none") {
      root.setAttribute("data-color-blind", settings.colorBlindMode)
    } else {
      root.removeAttribute("data-color-blind")
    }

    // Langue
    if (settings.language) {
      root.setAttribute("lang", settings.language)
    }
  }

  const updateSettings = async (newSettings: Partial<AccessibilitySettings>) => {
    try {
      const response = await fetch("/api/accessibility/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setSettings(data.settings)
          applySettings(data.settings)
        }
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour des paramètres:", error)
      throw error
    }
  }

  // Utiliser les hooks d'accessibilité
  useKeyboardNavigation(settings?.keyboardNavigation ?? false)
  useScreenReader(settings?.screenReader ?? false)

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider")
  }
  return context
}



