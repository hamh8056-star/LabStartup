"use client"

import { useEffect } from "react"

export function useScreenReader(enabled: boolean = false) {
  useEffect(() => {
    if (!enabled) return

    const root = document.documentElement

    // Ajouter des attributs ARIA améliorés
    root.setAttribute("aria-live", "polite")
    root.setAttribute("aria-atomic", "true")

    // Améliorer les éléments interactifs
    const interactiveElements = document.querySelectorAll("button, a, input, select, textarea")
    interactiveElements.forEach(element => {
      if (!element.getAttribute("aria-label") && !element.getAttribute("aria-labelledby")) {
        const text = element.textContent?.trim()
        if (text) {
          element.setAttribute("aria-label", text)
        }
      }
    })

    // Ajouter des landmarks ARIA
    const main = document.querySelector("main")
    if (main && !main.getAttribute("role")) {
      main.setAttribute("role", "main")
      main.setAttribute("aria-label", "Contenu principal")
    }

    const header = document.querySelector("header")
    if (header && !header.getAttribute("role")) {
      header.setAttribute("role", "banner")
    }

    const nav = document.querySelector("nav")
    if (nav && !nav.getAttribute("role")) {
      nav.setAttribute("role", "navigation")
      nav.setAttribute("aria-label", "Navigation principale")
    }

    const footer = document.querySelector("footer")
    if (footer && !footer.getAttribute("role")) {
      footer.setAttribute("role", "contentinfo")
    }

    // Améliorer les formulaires
    const forms = document.querySelectorAll("form")
    forms.forEach(form => {
      if (!form.getAttribute("aria-label") && !form.getAttribute("aria-labelledby")) {
        const legend = form.querySelector("legend")
        if (legend) {
          form.setAttribute("aria-labelledby", legend.id || `legend-${Math.random().toString(36).slice(2, 9)}`)
          if (!legend.id) {
            legend.id = form.getAttribute("aria-labelledby") || ""
          }
        }
      }
    })

    // Améliorer les images
    const images = document.querySelectorAll("img:not([alt])")
    images.forEach(img => {
      if (!img.getAttribute("alt")) {
        img.setAttribute("alt", "")
        img.setAttribute("aria-hidden", "true")
      }
    })

    // Annoncer les changements de page
    const announcePageChange = () => {
      const announcement = document.createElement("div")
      announcement.setAttribute("role", "status")
      announcement.setAttribute("aria-live", "polite")
      announcement.setAttribute("aria-atomic", "true")
      announcement.className = "sr-only"
      announcement.textContent = `Page chargée: ${document.title}`
      document.body.appendChild(announcement)

      setTimeout(() => {
        document.body.removeChild(announcement)
      }, 1000)
    }

    // Observer les changements de titre
    const titleObserver = new MutationObserver(() => {
      announcePageChange()
    })

    const titleElement = document.querySelector("title")
    if (titleElement) {
      titleObserver.observe(titleElement, { childList: true, characterData: true, subtree: true })
    }

    return () => {
      titleObserver.disconnect()
    }
  }, [enabled])
}



