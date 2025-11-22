"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Bot, ChevronDown, ChevronUp, Loader2, MessageCircle, Send, AlertCircle, CheckCircle2, BookOpen } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { useLabInstrument } from "@/contexts/lab-instrument-context"
import { useLabAssistant } from "@/hooks/use-lab-assistant"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

type AssistantPayload = {
  reply: string
  followUps?: string[]
  suggestedActions?: Array<{ label: string; target: string }>
}

type ChatMessageHistory = {
  role: "user" | "assistant"
  content: string
}

export function GlobalAssistantWidget() {
  const { selectedInstrument, clearInstrument } = useLabInstrument()
  const { 
    isLoading: isLabAssistantLoading, 
    currentAdvice: labAdvice, 
    askAboutInstrument,
    error: labError 
  } = useLabAssistant()
  
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Bonjour, je suis l'assistant IA Taalimia. Pose-moi tes questions sur les simulations, les cours, les évaluations ou la plateforme.",
    },
  ])
  const [followUps, setFollowUps] = useState<string[]>([
    "Que devrais-je travailler ensuite ?",
    "Explique-moi un concept clé",
  ])
  const [actions, setActions] = useState<AssistantPayload["suggestedActions"]>([])
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationHistory, setConversationHistory] = useState<ChatMessageHistory[]>([])

  // Ouvrir automatiquement le panneau quand un instrument est sélectionné
  useEffect(() => {
    if (selectedInstrument) {
      setIsPanelOpen(true)
      // Demander automatiquement des conseils sur l'instrument
      askAboutInstrument(selectedInstrument, "Comment utiliser cet instrument ?")
    }
  }, [selectedInstrument, askAboutInstrument])

  // Mettre à jour les messages quand on reçoit une réponse de l'assistant labo
  useEffect(() => {
    if (labAdvice && selectedInstrument) {
      // Vérifier si le message n'existe pas déjà pour éviter les doublons
      const lastMessage = messages[messages.length - 1]
      if (!lastMessage || lastMessage.content !== labAdvice.reply) {
        setMessages(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: labAdvice.reply,
          },
        ])
      }
      setFollowUps(labAdvice.followUps ?? [])
      setActions(labAdvice.suggestedActions ?? [])
    }
  }, [labAdvice, selectedInstrument, messages])

  const canSend = useMemo(() => input.trim().length > 1 && !isSending, [input, isSending])

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      const container = document.querySelector<HTMLDivElement>("[data-global-chat-scroll]")
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    })
  }, [])

  const pushMessage = useCallback(
    (message: ChatMessage) => {
      setMessages(prev => [...prev, message])
      scrollToBottom()
    },
    [scrollToBottom],
  )

  const handleSend = useCallback(
    async (preset?: string) => {
      const text = (preset ?? input).trim()
      if (!text || isSending || isLabAssistantLoading) return

      setInput("")
      setError(null)
      pushMessage({ id: crypto.randomUUID(), role: "user", content: text })
      setIsSending(true)

      try {
        // Si un instrument est sélectionné, utiliser l'API instrument-advice
        if (selectedInstrument) {
          const advice = await askAboutInstrument(selectedInstrument, text)
          // La réponse sera ajoutée automatiquement via l'useEffect qui écoute labAdvice
        } else {
          // Sinon, utiliser l'API assistant général
          const response = await fetch("/api/ai/assistant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              message: text,
              conversationHistory: conversationHistory,
            }),
          })

          if (!response.ok) {
            throw new Error("Une erreur est survenue")
          }

          const payload: AssistantPayload = await response.json()

          pushMessage({
            id: crypto.randomUUID(),
            role: "assistant",
            content: payload.reply,
          })
          setFollowUps(payload.followUps ?? [])
          setActions(payload.suggestedActions ?? [])
          
          // Mettre à jour l'historique
          const newHistory = [
            ...conversationHistory,
            { role: "user" as const, content: text },
            { role: "assistant" as const, content: payload.reply },
          ]
          setConversationHistory(newHistory.slice(-10)) // Garder les 10 derniers échanges
        }
      } catch (err) {
        console.error(err)
        setError("Impossible de contacter l'assistant. Réessayez dans un instant.")
      } finally {
        setIsSending(false)
      }
    },
    [input, isSending, isLabAssistantLoading, pushMessage, selectedInstrument, askAboutInstrument],
  )

  const togglePanel = useCallback(() => setIsPanelOpen(open => !open), [])

  if (!isPanelOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          aria-label="Ouvrir l'assistant IA"
          className="shadow-2xl"
          size="lg"
          variant="secondary"
          onClick={togglePanel}
        >
          <Bot className="mr-2 size-4" />
          Assistant IA
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-full max-w-sm sm:max-w-md">
      <Card className="border-border/70 bg-background/95 shadow-2xl backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="size-4 text-primary" />
              {selectedInstrument ? `Assistant - ${selectedInstrument.name}` : "Assistant IA Taalimia"}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {selectedInstrument ? "Conseils sur l'instrument sélectionné" : "Disponible partout dans l'application"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedInstrument && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => clearInstrument()}
                aria-label="Fermer l'instrument"
                className="h-8 w-8"
              >
                <ChevronUp className="size-4" />
              </Button>
            )}
            <Button size="icon" variant="ghost" onClick={togglePanel} aria-label="Réduire l'assistant IA">
              <ChevronDown className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pb-0">
          {selectedInstrument && (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold">{selectedInstrument.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedInstrument.description}</p>
                </div>
              </div>
              {labAdvice?.needsCorrection && (
                <div className="flex items-start gap-2 p-2 rounded bg-amber-500/20 border border-amber-500/30">
                  <AlertCircle className="size-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-300">Configuration à corriger</p>
                  </div>
                </div>
              )}
              {labAdvice && !labAdvice.needsCorrection && (
                <div className="flex items-start gap-2 p-2 rounded bg-green-500/20 border border-green-500/30">
                  <CheckCircle2 className="size-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-green-300">Configuration correcte</p>
                </div>
              )}
            </div>
          )}
          <ScrollArea
            className="h-[260px] rounded-md border border-border/60 bg-muted/10 p-3"
            data-global-chat-scroll
          >
            <div className="space-y-3">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm shadow-sm whitespace-pre-wrap ${
                      message.role === "assistant"
                        ? "bg-muted text-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {message.content.split('\n').map((line, idx) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={idx} className="font-semibold mb-1">{line.replace(/\*\*/g, '')}</p>
                      }
                      if (line.startsWith('- ')) {
                        return <p key={idx} className="ml-2 mb-1">• {line.substring(2)}</p>
                      }
                      return <p key={idx} className="mb-1">{line || '\u00A0'}</p>
                    })}
                  </div>
                </div>
              ))}
              {(isSending || isLabAssistantLoading) ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  L'assistant réfléchit...
                </div>
              ) : null}
            </div>
          </ScrollArea>
          {(error || labError) ? (
            <p className="text-xs text-destructive">{error || labError}</p>
          ) : null}
          {followUps?.length ? (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Suggestions</p>
              <div className="flex flex-wrap gap-2">
                {followUps.map(followUp => (
                  <Button
                    key={followUp}
                    size="sm"
                    variant="secondary"
                    className="text-xs"
                    onClick={() => handleSend(followUp)}
                    disabled={isSending}
                  >
                    <MessageCircle className="mr-1 size-3" />
                    {followUp}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
          {actions?.length ? (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Actions rapides</p>
              <div className="flex flex-wrap gap-2">
                {actions.map(action => (
                  <Badge
                    key={`${action.label}-${action.target}`}
                    variant="outline"
                    className="cursor-pointer text-xs"
                    onClick={() => {
                      window.location.href = action.target
                    }}
                  >
                    <BookOpen className="mr-1 size-3" />
                    {action.label}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Textarea
            placeholder={selectedInstrument ? "Pose une question sur cet instrument..." : "Pose ta question ici..."}
            value={input}
            onChange={event => setInput(event.target.value)}
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && canSend) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <div className="flex w-full items-center justify-between gap-2">
            <Button onClick={() => setIsPanelOpen(false)} variant="ghost" size="sm">
              <ChevronUp className="mr-1 size-4" />
              Réduire
            </Button>
            <Button onClick={() => handleSend()} disabled={!canSend || isLabAssistantLoading}>
              {(isSending || isLabAssistantLoading) ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
              Envoyer
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}


