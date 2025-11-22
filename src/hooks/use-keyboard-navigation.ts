"use client"

import { useEffect, useCallback } from "react"

type KeyboardShortcut = {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  handler: (e: KeyboardEvent) => void
  description?: string
}

export function useKeyboardNavigation(enabled: boolean = true) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: "k",
      ctrlKey: true,
      handler: () => {
        // Ouvrir la recherche globale
        const searchInput = document.querySelector<HTMLInputElement>('input[type="search"], input[placeholder*="recherche" i]')
        if (searchInput) {
          searchInput.focus()
        }
      },
      description: "Ouvrir la recherche",
    },
    {
      key: "h",
      ctrlKey: true,
      handler: () => {
        // Aller à l'accueil
        window.location.href = "/dashboard"
      },
      description: "Aller à l'accueil",
    },
    {
      key: "l",
      ctrlKey: true,
      handler: () => {
        // Aller aux laboratoires
        window.location.href = "/dashboard/labs"
      },
      description: "Aller aux laboratoires",
    },
    {
      key: "r",
      ctrlKey: true,
      handler: () => {
        // Aller aux ressources
        window.location.href = "/dashboard/resources"
      },
      description: "Aller aux ressources",
    },
    {
      key: "e",
      ctrlKey: true,
      handler: () => {
        // Aller aux évaluations
        window.location.href = "/dashboard/evaluations"
      },
      description: "Aller aux évaluations",
    },
    {
      key: "a",
      ctrlKey: true,
      handler: () => {
        // Ouvrir l'assistant AI
        const assistantButton = document.querySelector<HTMLButtonElement>('[aria-label*="assistant" i], button[class*="assistant"]')
        if (assistantButton) {
          assistantButton.click()
        }
      },
      description: "Ouvrir l'assistant AI",
    },
    {
      key: "Escape",
      handler: () => {
        // Fermer les modales et menus
        const modals = document.querySelectorAll('[role="dialog"]')
        modals.forEach(modal => {
          const closeButton = modal.querySelector<HTMLButtonElement>('button[aria-label*="fermer" i], button[aria-label*="close" i]')
          if (closeButton) {
            closeButton.click()
          }
        })
      },
      description: "Fermer les modales",
    },
    {
      key: "Tab",
      handler: (e) => {
        // Améliorer la navigation au clavier
        if (enabled) {
          document.body.classList.add("keyboard-navigation")
        }
      },
    },
  ]

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return

      // Trouver le raccourci correspondant
      const shortcut = shortcuts.find(
        s =>
          s.key.toLowerCase() === e.key.toLowerCase() &&
          (s.ctrlKey === undefined || s.ctrlKey === (e.ctrlKey || e.metaKey)) &&
          (s.shiftKey === undefined || s.shiftKey === e.shiftKey) &&
          (s.altKey === undefined || s.altKey === e.altKey) &&
          (s.metaKey === undefined || s.metaKey === e.metaKey)
      )

      if (shortcut) {
        e.preventDefault()
        shortcut.handler(e)
      }
    },
    [enabled, shortcuts]
  )

  useEffect(() => {
    if (!enabled) return

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [enabled, handleKeyDown])

  // Détecter l'utilisation du clavier
  useEffect(() => {
    if (!enabled) return

    const handleMouseDown = () => {
      document.body.classList.remove("keyboard-navigation")
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        document.body.classList.add("keyboard-navigation")
      }
    }

    window.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [enabled])

  return {
    shortcuts: shortcuts.map(s => ({
      key: s.key,
      ctrlKey: s.ctrlKey,
      shiftKey: s.shiftKey,
      altKey: s.altKey,
      description: s.description,
    })),
  }
}



