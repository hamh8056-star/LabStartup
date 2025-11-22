import { NextRequest } from "next/server"
import { Server as SocketIOServer } from "socket.io"
import { Server as HTTPServer } from "http"
import { initializeSocketIO } from "@/lib/socket-handler"

// Pour Next.js App Router, nous devons utiliser un serveur HTTP personnalisé
// Cette route sert de point d'entrée pour Socket.io

let httpServer: HTTPServer | null = null
let io: SocketIOServer | null = null

// Note: Dans Next.js App Router, nous ne pouvons pas créer un serveur HTTP directement
// Il faut utiliser le serveur personnalisé (server.js) ou une alternative
// Cette route est un placeholder qui indique que Socket.io doit être initialisé via server.js

export async function GET(request: NextRequest) {
  return new Response(
    JSON.stringify({
      message: "Socket.io endpoint. Utilisez 'node server.js' ou 'npm run dev:socket' pour démarrer le serveur avec Socket.io.",
      socketAvailable: io !== null,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
}
