import { Server as HTTPServer } from "http"
import { Server as SocketIOServer, Socket } from "socket.io"

let io: SocketIOServer | null = null

export function initializeSocketIO(httpServer: HTTPServer) {
  if (io) {
    return io
  }

  io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  })

  io.on("connection", (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`)

    // Rejoindre une salle
    socket.on("join-room", async (data: { roomId: string; userId: string; userName: string; userRole: string }) => {
      const { roomId, userId, userName, userRole } = data
      socket.join(roomId)
      socket.data.roomId = roomId
      socket.data.userId = userId
      socket.data.userName = userName
      socket.data.userRole = userRole

      console.log(`[Socket] ${userName} (${userId}) joined room ${roomId}`)

      // Notifier les autres utilisateurs dans la salle
      socket.to(roomId).emit("user-joined", {
        userId,
        userName,
        userRole,
        socketId: socket.id,
      })

      // Envoyer la liste des utilisateurs déjà dans la salle
      const roomSockets = await io!.in(roomId).fetchSockets()
      const users = roomSockets
        .filter(s => s.id !== socket.id)
        .map(s => ({
          userId: s.data.userId,
          userName: s.data.userName,
          userRole: s.data.userRole,
          socketId: s.id,
        }))

      socket.emit("room-users", users)
    })

    // Quitter une salle
    socket.on("leave-room", (data: { roomId: string }) => {
      const { roomId } = data
      socket.leave(roomId)

      if (socket.data.userId) {
        socket.to(roomId).emit("user-left", {
          userId: socket.data.userId,
          socketId: socket.id,
        })
      }

      console.log(`[Socket] User left room ${roomId}`)
    })

    // WebRTC Signaling - Offre
    socket.on("webrtc-offer", (data: { roomId: string; to: string; offer: RTCSessionDescriptionInit }) => {
      socket.to(data.to).emit("webrtc-offer", {
        from: socket.id,
        offer: data.offer,
      })
    })

    // WebRTC Signaling - Réponse
    socket.on("webrtc-answer", (data: { roomId: string; to: string; answer: RTCSessionDescriptionInit }) => {
      socket.to(data.to).emit("webrtc-answer", {
        from: socket.id,
        answer: data.answer,
      })
    })

    // WebRTC Signaling - Candidat ICE
    socket.on("webrtc-ice-candidate", (data: { roomId: string; to: string; candidate: RTCIceCandidateInit }) => {
      socket.to(data.to).emit("webrtc-ice-candidate", {
        from: socket.id,
        candidate: data.candidate,
      })
    })

    // Chat - Nouveau message
    socket.on("chat-message", async (data: { roomId: string; message: string; authorId: string; authorName: string; role: string }) => {
      const { roomId, message, authorId, authorName, role } = data

      // Sauvegarder le message dans la base de données
      try {
        const response = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/collaboration/rooms?action=message&roomId=${roomId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authorId,
            authorName,
            role,
            message,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          const savedMessage = result.message || {
            id: `msg-${Date.now()}`,
            authorId,
            authorName,
            role,
            message,
            timestamp: new Date().toISOString(),
          }

          // Diffuser le message à tous les utilisateurs de la salle
          io!.to(roomId).emit("chat-message", savedMessage)
        }
      } catch (error) {
        console.error("[Socket] Error saving chat message:", error)
      }
    })

    // Déconnexion
    socket.on("disconnect", () => {
      const roomId = socket.data.roomId
      if (roomId && socket.data.userId) {
        socket.to(roomId).emit("user-left", {
          userId: socket.data.userId,
          socketId: socket.id,
        })
      }
      console.log(`[Socket] Client disconnected: ${socket.id}`)
    })
  })

  return io
}

export function getSocketIO(): SocketIOServer | null {
  return io
}



