"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

export type NotificationType = "message" | "notification" | "system"

export type Notification = {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  link?: string
}

type NotificationContextType = {
  messages: Notification[]
  notifications: Notification[]
  unreadMessagesCount: number
  unreadNotificationsCount: number
  addMessage: (title: string, message: string, link?: string) => void
  addNotification: (title: string, message: string, link?: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: (type?: NotificationType) => void
  clearAll: (type?: NotificationType) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Notification[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addMessage = useCallback((title: string, message: string, link?: string) => {
    console.log("📬 ========== addMessage APPELÉ ==========")
    console.log("📬 Paramètres reçus:", { title, message: message?.substring(0, 50) + "...", link })
    
    const newMessage: Notification = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: "message",
      title,
      message,
      timestamp: new Date(),
      read: false, // Par défaut, le message est non lu
      link,
    }
    
    console.log("📬 Nouveau message créé:", newMessage)
    
    setMessages(prev => {
      console.log("📬 Messages précédents:", prev.length)
      const updated = [newMessage, ...prev].slice(0, 50) // Garder max 50 messages
      const unreadCount = updated.filter(msg => !msg.read).length
      console.log(`📬 Message ajouté au contexte. Total: ${updated.length}, Non lus: ${unreadCount}`)
      console.log("📬 Liste des messages non lus:", updated.filter(msg => !msg.read).map(m => ({ id: m.id, title: m.title })))
      return updated
    })
  }, [])

  const addNotification = useCallback((title: string, message: string, link?: string) => {
    const newNotification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      type: "notification",
      title,
      message,
      timestamp: new Date(),
      read: false,
      link,
    }
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)) // Garder max 50 notifications
  }, [])

  const markAsRead = useCallback((id: string) => {
    setMessages(prev => prev.map(msg => msg.id === id ? { ...msg, read: true } : msg))
    setNotifications(prev => prev.map(notif => notif.id === id ? { ...notif, read: true } : notif))
  }, [])

  const markAllAsRead = useCallback((type?: NotificationType) => {
    if (type === "message" || !type) {
      setMessages(prev => prev.map(msg => ({ ...msg, read: true })))
    }
    if (type === "notification" || !type) {
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
    }
  }, [])

  const clearAll = useCallback((type?: NotificationType) => {
    if (type === "message" || !type) {
      setMessages([])
    }
    if (type === "notification" || !type) {
      setNotifications([])
    }
  }, [])

  const unreadMessagesCount = messages.filter(msg => !msg.read).length
  const unreadNotificationsCount = notifications.filter(notif => !notif.read).length

  // Log pour déboguer le compteur de messages non lus (uniquement côté client, après hydratation)
  useEffect(() => {
    // S'assurer que nous sommes côté client et après l'hydratation
    if (typeof window === "undefined") return
    
    // Attendre que React ait fini l'hydratation (utiliser requestIdleCallback si disponible)
    const logDebug = () => {
      if (process.env.NODE_ENV === "development" && unreadMessagesCount > 0) {
        console.log(`📊 Compteur de messages non lus mis à jour: ${unreadMessagesCount}`, {
          totalMessages: messages.length,
          messagesNonLus: unreadMessagesCount
        })
      }
    }

    // Utiliser requestIdleCallback pour éviter les problèmes d'hydratation
    if (typeof window.requestIdleCallback !== "undefined") {
      const id = window.requestIdleCallback(logDebug, { timeout: 1000 })
      return () => window.cancelIdleCallback(id)
    } else {
      const timer = setTimeout(logDebug, 100)
      return () => clearTimeout(timer)
    }
  }, [unreadMessagesCount, messages.length])

  return (
    <NotificationContext.Provider
      value={{
        messages,
        notifications,
        unreadMessagesCount,
        unreadNotificationsCount,
        addMessage,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider")
  }
  return context
}


