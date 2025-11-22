"use client"

import { useState, useCallback } from "react"

export type InstrumentContext = {
  name: string
  description: string
  parameters: Record<string, { min: number; max: number; value: number; label: string; unit?: string }>
  discipline: string
}

export type AssistantAdvice = {
  reply: string
  followUps?: string[]
  suggestedActions?: Array<{ label: string; target: string }>
  needsCorrection?: boolean
  correctionTips?: string[]
}

export function useLabAssistant() {
  const [isLoading, setIsLoading] = useState(false)
  const [currentAdvice, setCurrentAdvice] = useState<AssistantAdvice | null>(null)
  const [selectedInstrument, setSelectedInstrument] = useState<InstrumentContext | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: "user" | "assistant"; content: string }>>([])

  const sanitizeParameters = useCallback((parameters: InstrumentContext["parameters"] | null | undefined) => {
    if (!parameters || typeof parameters !== "object") return {}

    return Object.entries(parameters).reduce<
      InstrumentContext["parameters"]
    >((acc, [key, param]) => {
      if (!param || typeof param !== "object") return acc

      const { min, max, value, label, unit } = param

      if (
        typeof min !== "number" ||
        typeof max !== "number" ||
        typeof value !== "number" ||
        isNaN(min) ||
        isNaN(max) ||
        isNaN(value)
      ) {
        console.warn("Paramètre ignoré car non numérique", { key, param })
        return acc
      }

      acc[key] = {
        min,
        max,
        value,
        label: label || key,
        unit,
      }
      return acc
    }, {})
  }, [])

  const askAboutInstrument = useCallback(async (context: InstrumentContext, question?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const safeParameters = sanitizeParameters(context.parameters)

      const payload = {
        instrument: context.name || "",
        description: context.description || "",
        parameters: safeParameters,
        discipline: context.discipline || "physique",
        question: question || "Comment utiliser cet instrument ?",
        conversationHistory: conversationHistory,
      }

      console.log("Sending request to API:", payload)

      let response: Response
      try {
        response = await fetch("/api/ai/instrument-advice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      } catch (networkError) {
        console.error("Network error:", networkError)
        throw new Error("Impossible de se connecter au serveur. Vérifiez votre connexion.")
      }

      if (!response.ok) {
        let errorData: any = {}
        const contentType = response.headers.get("content-type")
        
        try {
          if (contentType && contentType.includes("application/json")) {
            const jsonText = await response.text()
            if (jsonText) {
              errorData = JSON.parse(jsonText)
            } else {
              errorData = { message: `Réponse vide du serveur (HTTP ${response.status})` }
            }
          } else {
            const text = await response.text().catch(() => "")
            errorData = { message: text || `Erreur HTTP ${response.status}: ${response.statusText}` }
          }
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError)
          errorData = { message: `Erreur HTTP ${response.status}: ${response.statusText}` }
        }
        
        const errorMessage = errorData.message || errorData.error || `Erreur HTTP ${response.status}: ${response.statusText}`
        console.error("API Error:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url: response.url,
          contentType,
        })
        throw new Error(errorMessage)
      }

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text()
        console.error("Non-JSON response:", text)
        throw new Error("La réponse du serveur n'est pas au format JSON")
      }

      const data: AssistantAdvice = await response.json()
      
      if (!data || !data.reply) {
        console.error("Invalid response data:", data)
        throw new Error("Réponse invalide de l'assistant")
      }
      
      setCurrentAdvice(data)
      setSelectedInstrument({
        ...context,
        parameters: safeParameters,
      })
      
      // Mettre à jour l'historique de conversation
      const newHistory = [
        ...conversationHistory,
        { role: "user" as const, content: question || "Comment utiliser cet instrument ?" },
        { role: "assistant" as const, content: data.reply },
      ]
      // Garder seulement les 10 derniers échanges pour éviter que l'historique devienne trop long
      setConversationHistory(newHistory.slice(-10))
      
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue"
      setError(errorMessage)
      console.error("Erreur assistant labo:", err)
      // Afficher un message d'erreur plus détaillé dans la console
      if (err instanceof Error) {
        console.error("Stack trace:", err.stack)
      }
      return null
    } finally {
      setIsLoading(false)
    }
  }, [sanitizeParameters])

  const checkConfiguration = useCallback(async (context: InstrumentContext) => {
    return askAboutInstrument(context, "Vérifie ma configuration actuelle et donne-moi des conseils")
  }, [askAboutInstrument])

  const clearAdvice = useCallback(() => {
    setCurrentAdvice(null)
    setSelectedInstrument(null)
    setError(null)
    setConversationHistory([])
  }, [])

  return {
    isLoading,
    currentAdvice,
    selectedInstrument,
    error,
    askAboutInstrument,
    checkConfiguration,
    clearAdvice,
  }
}

