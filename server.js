// Serveur personnalisé pour Socket.io avec Next.js
// Utilisez: node server.js au lieu de npm run dev
// Ou configurez votre déploiement pour utiliser ce serveur

const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")
const { Server } = require("socket.io")

const dev = process.env.NODE_ENV !== "production"
const hostname = process.env.HOSTNAME || "localhost"
const port = parseInt(process.env.PORT || "3000", 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error("Error occurred handling", req.url, err)
      res.statusCode = 500
      res.end("internal server error")
    }
  })

  // Initialiser Socket.io avec le handler
  // Note: On ne peut pas utiliser les imports ES6 dans server.js, donc on garde la logique ici
  const io = new Server(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: dev ? `http://${hostname}:${port}` : process.env.NEXTAUTH_URL || `http://${hostname}:${port}`,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["polling", "websocket"], // Polling d'abord pour éviter les problèmes de connexion
    allowEIO3: true, // Compatibilité avec les anciennes versions
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  // Gérer les connexions Socket.io
  io.on("connection", (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`)

    // Rejoindre une salle
    socket.on("join-room", async (data) => {
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
      const roomSockets = await io.in(roomId).fetchSockets()
      const users = roomSockets
        .filter((s) => s.id !== socket.id)
        .map((s) => ({
          userId: s.data.userId,
          userName: s.data.userName,
          userRole: s.data.userRole,
          socketId: s.id,
        }))

      socket.emit("room-users", users)
    })

    // Quitter une salle
    socket.on("leave-room", (data) => {
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
    socket.on("webrtc-offer", (data) => {
      console.log(`[Socket] WebRTC offer from ${socket.id} to ${data.to}`)
      socket.to(data.to).emit("webrtc-offer", {
        from: socket.id,
        offer: data.offer,
      })
    })

    // WebRTC Signaling - Réponse
    socket.on("webrtc-answer", (data) => {
      console.log(`[Socket] WebRTC answer from ${socket.id} to ${data.to}`)
      socket.to(data.to).emit("webrtc-answer", {
        from: socket.id,
        answer: data.answer,
      })
    })

    // WebRTC Signaling - Candidat ICE
    socket.on("webrtc-ice-candidate", (data) => {
      if (data.candidate) {
        socket.to(data.to).emit("webrtc-ice-candidate", {
          from: socket.id,
          candidate: data.candidate,
        })
      }
    })

    // Autorisation d'enregistrement (enseignant uniquement)
    socket.on("recording-authorized", (data) => {
      const { roomId, authorized } = data
      console.log(`[Socket] Recording authorized in room ${roomId}: ${authorized}`)
      // Diffuser l'autorisation à tous les participants de la salle
      io.to(roomId).emit("recording-authorized", { roomId, authorized })
    })

    // Chat - Nouveau message
    socket.on("chat-message", async (data) => {
      const { roomId, message, authorId, authorName, role } = data

      console.log(`[Socket] Chat message received in room ${roomId} from ${authorName}`)

      // Sauvegarder le message dans la base de données
      try {
        const baseUrl = dev
          ? `http://${hostname}:${port}`
          : process.env.NEXTAUTH_URL || `http://${hostname}:${port}`

        const response = await fetch(
          `${baseUrl}/api/collaboration/rooms?action=message&roomId=${roomId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              authorId,
              authorName,
              role,
              message,
            }),
          }
        )

        if (response.ok) {
          const result = await response.json()
          const savedMessage = result.message || {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            authorId,
            authorName,
            role,
            message,
            timestamp: new Date().toISOString(),
          }

          // Diffuser le message à tous les utilisateurs de la salle
          console.log(`[Socket] Broadcasting chat message to room ${roomId}`)
          io.to(roomId).emit("chat-message", savedMessage)
        } else {
          console.error(`[Socket] Failed to save message: ${response.status}`)
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

  httpServer
    .once("error", (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
      console.log(`> Socket.io server running on /api/socket`)
    })
})



