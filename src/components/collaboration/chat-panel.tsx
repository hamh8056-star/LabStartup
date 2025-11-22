"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { Send, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useSocket } from "@/hooks/use-socket"
import type { Socket } from "socket.io-client"

export type ChatMessage = {
  id: string
  authorId: string
  authorName: string
  role: "teacher" | "student" | "assistant"
  message: string
  timestamp: string
}

type ChatPanelProps = {
  roomId: string
  userId: string
  userName: string
  userRole: "teacher" | "student" | "admin"
  initialMessages?: ChatMessage[]
  onSendMessage: (message: string) => Promise<void>
}

export function ChatPanel({
  roomId,
  userId,
  userName,
  userRole,
  initialMessages = [],
  onSendMessage,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [messageDraft, setMessageDraft] = useState("")
  const [isSending, startSending] = useTransition()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { socket, isConnected } = useSocket(roomId, userId, userName, userRole)

  // Synchroniser les messages initiaux
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(prev => {
        // Fusionner avec les messages existants, éviter les doublons
        const existingIds = new Set(prev.map(m => m.id))
        const newMessages = initialMessages.filter(m => !existingIds.has(m.id))
        if (newMessages.length > 0) {
          return [...prev, ...newMessages].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
        }
        return prev
      })
    }
  }, [initialMessages])

  // Scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Écouter les messages en temps réel via Socket.io
  useEffect(() => {
    if (!socket) return

    const handleChatMessage = (message: ChatMessage) => {
      setMessages((prev) => {
        // Éviter les doublons par ID
        if (prev.some((m) => m.id === message.id)) {
          return prev
        }
        // Remplacer les messages temporaires par le message réel si c'est le même auteur et contenu
        const tempMessageIndex = prev.findIndex(
          (m) => m.id.startsWith("temp-") && 
                 m.authorId === message.authorId && 
                 m.message === message.message &&
                 Math.abs(new Date(m.timestamp).getTime() - new Date(message.timestamp).getTime()) < 10000
        )
        if (tempMessageIndex !== -1) {
          const newMessages = [...prev]
          newMessages[tempMessageIndex] = message
          return newMessages.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )
        }
        return [...prev, message].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
      })
    }

    socket.on("chat-message", handleChatMessage)

    return () => {
      socket.off("chat-message", handleChatMessage)
    }
  }, [socket])

  const handleSend = () => {
    if (!messageDraft.trim() || isSending) return

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const tempMessage: ChatMessage = {
      id: tempId,
      authorId: userId,
      authorName: userName,
      role: userRole === "teacher" || userRole === "admin" ? "teacher" : "student",
      message: messageDraft,
      timestamp: new Date().toISOString(),
    }

    // Ajouter le message optimistiquement
    setMessages(prev => [...prev, tempMessage])
    const messageToSend = messageDraft
    setMessageDraft("")

    startSending(async () => {
      try {
        // Sauvegarder le message dans la base de données via l'API avec timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 secondes timeout
        
        const apiResponse = await fetch(`/api/collaboration/rooms?action=message&roomId=${roomId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authorId: userId,
            authorName: userName,
            role: userRole === "teacher" || userRole === "admin" ? "teacher" : "student",
            message: messageToSend,
          }),
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json().catch(() => ({ message: "Erreur lors de la sauvegarde du message" }))
          throw new Error(errorData.message || "Erreur lors de la sauvegarde du message")
        }

        // Récupérer le message sauvegardé depuis la réponse
        const responseData = await apiResponse.json().catch(() => null)
        
        // Si l'API retourne le message sauvegardé, remplacer le message temporaire
        if (responseData?.message) {
          const savedMessage: ChatMessage = {
            id: responseData.message.id || tempId,
            authorId: responseData.message.authorId || userId,
            authorName: responseData.message.authorName || userName,
            role: responseData.message.role || (userRole === "teacher" || userRole === "admin" ? "teacher" : "student"),
            message: responseData.message.message || messageToSend,
            timestamp: responseData.message.timestamp || new Date().toISOString(),
          }
          
          // Remplacer le message temporaire par le message sauvegardé
          setMessages(prev => {
            const filtered = prev.filter(m => m.id !== tempId)
            // Vérifier qu'on n'a pas déjà ce message (éviter les doublons)
            if (!filtered.some(m => m.id === savedMessage.id)) {
              return [...filtered, savedMessage].sort((a, b) => 
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
              )
            }
            return filtered
          })
        } else {
          // Si pas de réponse détaillée, convertir le message temporaire en permanent
          // (il sera mis à jour quand il arrivera via Socket.io ou lors du rafraîchissement)
          setMessages(prev => prev.map(m => 
            m.id === tempId ? { ...m, id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}` } : m
          ))
        }

        // Envoyer aussi via Socket.io pour la diffusion en temps réel (si disponible)
        if (socket && isConnected) {
          socket.emit("chat-message", {
            roomId,
            message: messageToSend,
            authorId: userId,
            authorName: userName,
            role: userRole === "teacher" || userRole === "admin" ? "teacher" : "student",
          })
        }

        // Ne pas retirer le message temporaire automatiquement - il sera remplacé par le message réel
        // ou gardé s'il n'y a pas de Socket.io
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error("Error sending message:", error)
          // Retirer le message temporaire en cas d'erreur
          setMessages(prev => prev.filter(m => m.id !== tempId))
          // Afficher une notification d'erreur
          alert(error instanceof Error ? error.message : "Erreur lors de l'envoi du message. Veuillez réessayer.")
        } else if (error instanceof Error && error.name === 'AbortError') {
          // Timeout - retirer le message temporaire
          setMessages(prev => prev.filter(m => m.id !== tempId))
          alert("Le message a pris trop de temps à envoyer. Veuillez réessayer.")
        }
      }
    })
  }

  return (
    <div className="flex h-full flex-col">
      <ScrollArea 
        className="flex-1 p-4" 
        ref={scrollAreaRef}
      >
        <div className="space-y-3 pr-2">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">Aucun message pour le moment.</p>
          ) : (
            messages.map((message, index) => {
              const isOwnMessage = message.authorId === userId
              return (
                <div
                  key={`${message.id}-${index}`}
                  className={cn(
                    "flex flex-col gap-1",
                    isOwnMessage ? "items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                    "flex items-center gap-2 text-xs",
                    isOwnMessage ? "flex-row-reverse" : "flex-row"
                  )}>
                    <span className="font-medium text-foreground">{message.authorName}</span>
                    <Badge
                      variant={message.role === "teacher" ? "default" : message.role === "assistant" ? "secondary" : "outline"}
                      className="text-[10px]"
                    >
                      {message.role === "teacher" ? "Enseignant" : message.role === "assistant" ? "IA" : "Étudiant"}
                    </Badge>
                    <span className="text-muted-foreground">
                      {format(new Date(message.timestamp), "HH:mm", { locale: fr })}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                      isOwnMessage
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {message.message}
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <Textarea
            placeholder="Tapez votre message..."
            value={messageDraft}
            onChange={(e) => setMessageDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            className="min-h-[60px] resize-none"
          />
          <Button onClick={handleSend} disabled={isSending || !messageDraft.trim()} size="icon" className="h-[60px] w-[60px]">
            {isSending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

