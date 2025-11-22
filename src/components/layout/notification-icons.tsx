"use client"

import { Bell, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useNotifications } from "@/contexts/notification-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

type NotificationIconsProps = {
  variant?: "default" | "inverted"
}

export function NotificationIcons({ variant = "default" }: NotificationIconsProps) {
  const router = useRouter()
  const {
    messages,
    notifications,
    unreadMessagesCount,
    unreadNotificationsCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications()

  const isInverted = variant === "inverted"
  const buttonClassName = isInverted
    ? "rounded-full border border-white/40 bg-white/15 text-white hover:bg-white/25"
    : "rounded-full"

  // Log pour déboguer (uniquement en développement, côté client, après hydratation)
  useEffect(() => {
    // S'assurer que nous sommes côté client et après l'hydratation
    if (typeof window === "undefined") return
    
    // Attendre que React ait fini l'hydratation (utiliser requestIdleCallback si disponible)
    const logDebug = () => {
      if (process.env.NODE_ENV === "development" && unreadMessagesCount > 0) {
        console.log(`🔔 Header - Messages non lus: ${unreadMessagesCount}`, {
          totalMessages: messages.length,
          unreadCount: unreadMessagesCount,
          badgeVisible: unreadMessagesCount > 0
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

  const handleMessageClick = (messageId: string, link?: string) => {
    // Marquer le message comme lu (cela mettra à jour automatiquement le compteur)
    markAsRead(messageId)
    if (link) {
      router.push(link)
    }
  }

  const handleNotificationClick = (notificationId: string, link?: string) => {
    markAsRead(notificationId)
    if (link) {
      router.push(link)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Icône Messages */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className={cn("relative", buttonClassName)}>
            <MessageSquare className="size-4" />
            {unreadMessagesCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px] font-bold"
              >
                {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between px-2 py-1.5">
            <DropdownMenuLabel className="px-0">Messages</DropdownMenuLabel>
            {unreadMessagesCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead("message")}
                className="h-6 text-xs"
              >
                Tout marquer comme lu
              </Button>
            )}
          </div>
          <DropdownMenuSeparator />
          <ScrollArea className="h-[300px]">
            {messages.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Aucun message
              </div>
            ) : (
              <div className="space-y-1 p-1">
                {messages.slice(0, 10).map((message) => (
                  <DropdownMenuItem
                    key={message.id}
                    className={cn(
                      "flex flex-col items-start gap-1 p-3 cursor-pointer",
                      !message.read && "bg-primary/5"
                    )}
                    onClick={() => handleMessageClick(message.id, message.link)}
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <span className="text-sm font-semibold">{message.title}</span>
                      {!message.read && (
                        <span className="size-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {message.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {format(message.timestamp, "PPp", { locale: fr })}
                    </span>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </ScrollArea>
          {messages.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/collaboration" className="cursor-pointer">
                  Voir tous les messages
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Icône Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className={cn("relative", buttonClassName)}>
            <Bell className="size-4" />
            {unreadNotificationsCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px] font-bold"
              >
                {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <div className="flex items-center justify-between px-2 py-1.5">
            <DropdownMenuLabel className="px-0">Notifications</DropdownMenuLabel>
            {unreadNotificationsCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead("notification")}
                className="h-6 text-xs"
              >
                Tout marquer comme lu
              </Button>
            )}
          </div>
          <DropdownMenuSeparator />
          <ScrollArea className="h-[300px]">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Aucune notification
              </div>
            ) : (
              <div className="space-y-1 p-1">
                {notifications.slice(0, 10).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      "flex flex-col items-start gap-1 p-3 cursor-pointer",
                      !notification.read && "bg-primary/5"
                    )}
                    onClick={() => handleNotificationClick(notification.id, notification.link)}
                  >
                    <div className="flex w-full items-start justify-between gap-2">
                      <span className="text-sm font-semibold">{notification.title}</span>
                      {!notification.read && (
                        <span className="size-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground">
                      {format(notification.timestamp, "PPp", { locale: fr })}
                    </span>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </ScrollArea>
          {notifications.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => markAllAsRead("notification")} className="cursor-pointer">
                Tout marquer comme lu
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}


