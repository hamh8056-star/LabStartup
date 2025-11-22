"use client"

import { useEffect, useState } from "react"

export function ServiceWorkerRegistrar() {
  const [registered, setRegistered] = useState(false)

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/service-worker.js", { scope: "/" })
        if (registration) {
          setRegistered(true)
        }
      } catch (error) {
        console.error("Service worker registration failed", error)
      }
    }

    register()
  }, [])

  if (!registered) return null
  return null
}




