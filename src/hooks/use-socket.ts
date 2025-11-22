"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { io, Socket } from "socket.io-client"

export type SocketUser = {
  userId: string
  userName: string
  userRole: string
  socketId: string
}

export function useSocket(roomId: string | null, userId: string, userName: string, userRole: string) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [roomUsers, setRoomUsers] = useState<SocketUser[]>([])
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!roomId) return

    // Créer la connexion Socket.io
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
    const newSocket = io(socketUrl, {
      path: "/api/socket",
      transports: ["polling", "websocket"], // Essayer polling d'abord, puis websocket
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      forceNew: false,
      upgrade: true,
      rememberUpgrade: true,
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    newSocket.on("connect", () => {
      console.log("[Socket] ✅ Connected successfully:", newSocket.id)
      console.log("[Socket] Transport:", newSocket.io.engine.transport.name)
      setIsConnected(true)

      // Rejoindre la salle
      newSocket.emit("join-room", {
        roomId,
        userId,
        userName,
        userRole,
      })
    })

    newSocket.on("disconnect", (reason) => {
      console.log("[Socket] ❌ Disconnected:", reason)
      setIsConnected(false)
    })

    newSocket.on("connect_error", (error) => {
      console.error("[Socket] ❌ Connection error:", error.message)
      console.error("[Socket] Error details:", error)
      setIsConnected(false)
    })

    newSocket.on("reconnect", (attemptNumber) => {
      console.log(`[Socket] ✅ Reconnected after ${attemptNumber} attempts`)
      setIsConnected(true)
    })

    newSocket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`[Socket] 🔄 Reconnection attempt ${attemptNumber}`)
    })

    newSocket.on("reconnect_error", (error) => {
      console.error("[Socket] ❌ Reconnection error:", error)
    })

    newSocket.on("reconnect_failed", () => {
      console.error("[Socket] ❌ Reconnection failed after all attempts")
    })

    // Écouter les événements de la salle
    newSocket.on("room-users", (users: SocketUser[]) => {
      // Ajouter l'utilisateur actuel à la liste (il n'est pas inclus par le serveur)
      const allUsers = [
        ...users,
        {
          userId,
          userName,
          userRole,
          socketId: newSocket.id,
        },
      ]
      // Éviter les doublons
      const uniqueUsers = Array.from(
        new Map(allUsers.map((u) => [u.userId, u])).values()
      )
      setRoomUsers(uniqueUsers)
    })

    newSocket.on("user-joined", (user: SocketUser) => {
      setRoomUsers((prev) => {
        // Vérifier si l'utilisateur est déjà dans la liste
        if (prev.some((u) => u.userId === user.userId)) {
          return prev
        }
        // S'assurer que l'utilisateur actuel est toujours dans la liste
        const hasCurrentUser = prev.some((u) => u.userId === userId)
        const newUsers = [...prev, user]
        if (!hasCurrentUser) {
          newUsers.push({
            userId,
            userName,
            userRole,
            socketId: newSocket.id,
          })
        }
        return newUsers
      })
    })

    newSocket.on("user-left", (data: { userId: string; socketId: string }) => {
      setRoomUsers((prev) => prev.filter((u) => u.userId !== data.userId && u.socketId !== data.socketId))
    })

    return () => {
      if (roomId) {
        newSocket.emit("leave-room", { roomId })
      }
      newSocket.disconnect()
      socketRef.current = null
    }
  }, [roomId, userId, userName, userRole])

  const leaveRoom = useCallback(() => {
    if (socketRef.current && roomId) {
      socketRef.current.emit("leave-room", { roomId })
      socketRef.current.disconnect()
      socketRef.current = null
      setSocket(null)
      setIsConnected(false)
      setRoomUsers([])
    }
  }, [roomId])

  return {
    socket,
    isConnected,
    roomUsers,
    leaveRoom,
  }
}

