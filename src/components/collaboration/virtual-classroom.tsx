"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff, Users, X, MessageSquare, Maximize2, Minimize2, Circle, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useWebRTC } from "@/hooks/use-webrtc"
import { useSocket } from "@/hooks/use-socket"
import { ChatPanel, type ChatMessage } from "@/components/collaboration/chat-panel"
import { useNotifications } from "@/contexts/notification-context"
import { cn } from "@/lib/utils"

type VirtualClassroomProps = {
  roomId: string
  userId: string
  userName: string
  userRole: "teacher" | "student" | "admin"
  onClose: () => void
}

export function VirtualClassroom({ roomId, userId, userName, userRole, onClose }: VirtualClassroomProps) {
  const { socket, isConnected, roomUsers } = useSocket(roomId, userId, userName, userRole)
  const { addMessage } = useNotifications()
  
  const {
    localStream,
    remoteStreams,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    error,
    startLocalStream,
    stopLocalStream,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    leaveRoom,
    clearError,
  } = useWebRTC(roomId, userId, userName, socket)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map())
  const [, forceUpdate] = useState({}) // Pour forcer le re-render
  const [showChat, setShowChat] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const audioContextRef = useRef<AudioContext | null>(null)
  const [audioEnabled, setAudioEnabled] = useState(false)
  
  // États pour l'enregistrement vidéo
  const [isRecording, setIsRecording] = useState(false)
  const [recordingAuthorized, setRecordingAuthorized] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  
  const isTeacher = userRole === "teacher" || userRole === "admin"

  // Initialiser l'AudioContext après une interaction utilisateur
  const initAudioContext = useCallback(() => {
    if (audioContextRef.current) return audioContextRef.current

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      audioContextRef.current = audioContext
      setAudioEnabled(true)
      return audioContext
    } catch (error) {
      console.warn("Impossible de créer l'AudioContext:", error)
      return null
    }
  }, [])

  // Initialiser l'AudioContext dès l'ouverture de la classe virtuelle (c'est déjà une interaction utilisateur)
  useEffect(() => {
    // Initialiser immédiatement car l'ouverture de la classe virtuelle est une interaction utilisateur
    initAudioContext()
  }, [initAudioContext])

  // Activer l'audio au premier clic/interaction si pas encore initialisé
  useEffect(() => {
    if (audioContextRef.current) return // Déjà initialisé

    const handleUserInteraction = () => {
      initAudioContext()
    }

    document.addEventListener('click', handleUserInteraction, { once: true })
    document.addEventListener('keydown', handleUserInteraction, { once: true })
    document.addEventListener('touchstart', handleUserInteraction, { once: true })

    return () => {
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
      document.removeEventListener('touchstart', handleUserInteraction)
    }
  }, [initAudioContext])

  // Charger les messages existants depuis la base de données
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null
    let controller: AbortController | null = null
    
    const loadMessages = async () => {
      try {
        controller = new AbortController()
        // Augmenter le timeout à 20 secondes pour les connexions lentes
        timeoutId = setTimeout(() => {
          if (controller) {
            controller.abort()
            console.warn("Timeout lors du chargement des messages")
          }
        }, 20000) // 20 secondes timeout
        
        const response = await fetch(`/api/collaboration/rooms?action=messages&roomId=${roomId}`, {
          signal: controller.signal,
        })
        
        // Nettoyer le timer immédiatement après la réponse
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        if (response.ok) {
          const data = await response.json()
          if (data.messages) {
            setChatMessages(data.messages)
          }
        } else {
          console.warn("Erreur lors du chargement des messages:", response.status, response.statusText)
        }
      } catch (error) {
        // Nettoyer le timer en cas d'erreur
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.warn("Chargement des messages annulé (timeout)")
            // Ne pas afficher d'erreur pour les timeouts, juste continuer sans messages
          } else {
            console.error("Error loading messages:", error)
          }
        }
      } finally {
        setIsLoadingMessages(false)
      }
    }

    if (roomId) {
      loadMessages()
    }

    // Nettoyer le timer lors du démontage du composant
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (controller) {
        controller.abort()
      } 
    }
  }, [roomId])

  // Attacher le stream local à la vidéo
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
      
      // Vérifier que l'audio est bien dans le stream
      const audioTracks = localStream.getAudioTracks()
      const videoTracks = localStream.getVideoTracks()
      
      console.log(`[VirtualClassroom] Local stream attached:`, {
        audioTracks: audioTracks.length,
        videoTracks: videoTracks.length,
        audioEnabled: audioTracks.length > 0 ? audioTracks[0].enabled : false,
        videoEnabled: videoTracks.length > 0 ? videoTracks[0].enabled : false,
      })
      
      // S'assurer que l'audio est activé
      audioTracks.forEach(track => {
        if (!track.enabled) {
          console.warn(`[VirtualClassroom] ⚠️ Audio track disabled, enabling...`)
          track.enabled = true
        }
      })
      
      // Forcer la lecture
      localVideoRef.current.play().catch(err => {
        console.error(`[VirtualClassroom] Error playing local video:`, err)
      })
    }
  }, [localStream])

  // Attacher les streams distants aux vidéos
  useEffect(() => {
    console.log(`[VirtualClassroom] ========== REMOTE STREAMS UPDATE ==========`)
    console.log(`[VirtualClassroom] Remote streams count: ${remoteStreams.size}`)
    console.log(`[VirtualClassroom] Remote stream user IDs:`, Array.from(remoteStreams.keys()))
    
    remoteStreams.forEach((stream, userId) => {
      const videoTracks = stream.getVideoTracks()
      const audioTracks = stream.getAudioTracks()
      
      console.log(`[VirtualClassroom] Processing stream for user ${userId}:`, {
        streamId: stream.id,
        active: stream.active,
        videoTracks: videoTracks.length,
        audioTracks: audioTracks.length,
        tracks: stream.getTracks().map(t => ({ 
          kind: t.kind, 
          enabled: t.enabled, 
          readyState: t.readyState,
          id: t.id
        }))
      })
      
      const videoElement = remoteVideosRef.current.get(userId)
      if (videoElement) {
        if (videoElement.srcObject !== stream) {
          console.log(`[VirtualClassroom] ✅ Attaching stream to video for user ${userId}`)
          videoElement.srcObject = stream
          // Forcer la lecture
          videoElement.play()
            .then(() => {
              console.log(`[VirtualClassroom] ✅ Video playing for user ${userId}`)
              forceUpdate({}) // Forcer le re-render
            })
            .catch(err => {
              console.error(`[VirtualClassroom] ❌ Error playing video for ${userId}:`, err)
            })
        } else {
          // Vérifier que les tracks sont toujours actifs
          const currentVideoTracks = stream.getVideoTracks()
          if (currentVideoTracks.length > 0 && !currentVideoTracks[0].enabled) {
            console.warn(`[VirtualClassroom] ⚠️ Video track disabled for user ${userId}`)
            forceUpdate({})
          }
        }
      } else {
        console.warn(`[VirtualClassroom] ⚠️ No video element found for user ${userId}, will attach when element is created`)
      }
      
      // Écouter les changements de tracks vidéo
      videoTracks.forEach(track => {
        // Supprimer les anciens listeners pour éviter les doublons
        track.onended = () => {
          console.log(`[VirtualClassroom] Video track ended for ${userId}`)
          forceUpdate({})
        }
        track.onmute = () => {
          console.log(`[VirtualClassroom] Video track muted for ${userId}`)
          forceUpdate({})
        }
        track.onunmute = () => {
          console.log(`[VirtualClassroom] Video track unmuted for ${userId}`)
          forceUpdate({})
        }
      })
      
      // Écouter les changements du stream
      stream.onaddtrack = (event) => {
        console.log(`[VirtualClassroom] Track added to stream for ${userId}:`, event.track.kind)
        if (event.track.kind === 'video') {
          forceUpdate({})
        }
      }
      stream.onremovetrack = (event) => {
        console.log(`[VirtualClassroom] Track removed from stream for ${userId}:`, event.track.kind)
        if (event.track.kind === 'video') {
          forceUpdate({})
        }
      }
    })
    
    // Forcer un re-render pour mettre à jour l'affichage
    forceUpdate({})
  }, [remoteStreams])

  // Démarrer automatiquement la vidéo/audio
  useEffect(() => {
    if (!localStream && isConnected) {
      // Vérifier que l'API est disponible avant d'essayer
      if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const timer = setTimeout(() => {
          startLocalStream(true, true).catch(err => {
            console.error("[VirtualClassroom] Error starting local stream:", err)
          })
        }, 500) // Petit délai pour éviter les appels multiples
        return () => clearTimeout(timer)
      } else {
        console.warn("[VirtualClassroom] MediaDevices API not available")
        // L'erreur sera gérée par le hook useWebRTC
      }
    }
  }, [isConnected, localStream, startLocalStream])

  // Fonction pour jouer le son de notification
  const playNotificationSound = useCallback(async () => {
    try {
      console.log("🔊 Tentative de lecture du son de notification...")
      
      // Essayer d'initialiser si pas encore fait
      let audioContext = audioContextRef.current
      if (!audioContext) {
        console.log("🎵 AudioContext non initialisé, initialisation...")
        audioContext = initAudioContext()
        if (!audioContext) {
          console.warn("❌ AudioContext non disponible après initialisation")
          return
        }
      }

      console.log("🎵 AudioContext état:", audioContext.state)

      // Vérifier et réactiver l'AudioContext si suspendu
      if (audioContext.state === 'suspended') {
        console.log("⏸️ AudioContext suspendu, tentative de reprise...")
        try {
          await audioContext.resume()
          console.log("✅ AudioContext repris, nouvel état:", audioContext.state)
        } catch (err) {
          console.warn("❌ Impossible de réactiver l'AudioContext:", err)
          // Continuer quand même, parfois ça fonctionne
        }
      }

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)

      console.log("🔔 Son de notification joué avec succès")
    } catch (error) {
      console.error("❌ Erreur lors de la lecture du son de notification:", error)
    }
  }, [initAudioContext])

  // Écouter les messages du chat via Socket.io
  useEffect(() => {
    console.log("🔍 Vérification du socket pour écouter les messages...", {
      socket: !!socket,
      isConnected,
      userId,
      roomId
    })

    // Attendre que le socket soit disponible
    if (!socket) {
      console.log("⏳ Socket non disponible, attente de la connexion...")
      return
    }

    console.log("🔌 Configuration de l'écoute des messages...")
    console.log("👤 UserId actuel:", userId)
    console.log("🔌 Socket disponible:", !!socket)
    console.log("🔌 Socket connecté:", isConnected)
    if (socket.connected) {
      console.log("🔌 Socket ID:", socket.id)
    } else {
      console.log("⏳ Socket en attente de connexion...")
    }

    const handleChatMessage = (message: ChatMessage) => {
      console.log("📩 ========== MESSAGE REÇU VIA SOCKET ==========")
      console.log("📩 Message complet:", message)
      console.log("📩 Détails:", {
        id: message.id,
        authorId: message.authorId,
        authorName: message.authorName,
        message: message.message?.substring(0, 50) + "..." || "Aucun message",
        currentUserId: userId,
        isFromCurrentUser: message.authorId === userId,
        messageType: typeof message
      })

      setChatMessages((prev) => {
        // Éviter les doublons
        if (prev.some((m) => m.id === message.id)) {
          console.log("⚠️ Message déjà présent, ignoré")
          return prev
        }

        // Si le message n'est pas de l'utilisateur actuel, jouer une notification
        if (message.authorId !== userId) {
          console.log("📨 ========== NOUVEAU MESSAGE D'UN AUTRE UTILISATEUR ==========")
          console.log("📨 Auteur:", message.authorName, "| ID:", message.authorId)
          console.log("📨 Mon ID:", userId)
          console.log("📨 Déclenchement du son et de la notification...")
          
          // Vérifier le contexte de notifications
          console.log("📨 addMessage disponible:", typeof addMessage === "function")
          console.log("📨 playNotificationSound disponible:", typeof playNotificationSound === "function")
          
          // Initialiser l'AudioContext si nécessaire
          if (!audioContextRef.current) {
            console.log("🎵 AudioContext non initialisé, initialisation...")
            const ctx = initAudioContext()
            console.log("🎵 AudioContext initialisé:", !!ctx)
          } else {
            console.log("🎵 AudioContext déjà initialisé, état:", audioContextRef.current.state)
          }
          
          // Ajouter une notification dans le header (cela mettra à jour automatiquement le compteur)
          console.log("➕ Ajout du message au contexte de notifications...")
          try {
            const messageText = message.message || ""
            const truncatedMessage = messageText.length > 100 ? messageText.substring(0, 100) + "..." : messageText
            
            console.log("➕ Titre:", `Nouveau message de ${message.authorName}`)
            console.log("➕ Message:", truncatedMessage)
            console.log("➕ Lien:", `/dashboard/collaboration?roomId=${roomId}`)
            
            addMessage(
              `Nouveau message de ${message.authorName}`,
              truncatedMessage,
              `/dashboard/collaboration?roomId=${roomId}`
            )
            console.log("✅ Message ajouté au contexte de notifications avec succès")
          } catch (error) {
            console.error("❌ ERREUR CRITIQUE lors de l'ajout du message:", error)
            console.error("❌ Stack:", error instanceof Error ? error.stack : "Pas de stack")
          }
          
          // Jouer le son de notification (ne pas attendre)
          console.log("🔊 Tentative de lecture du son de notification...")
          playNotificationSound()
            .then(() => {
              console.log("✅ Son de notification joué avec succès")
            })
            .catch((err) => {
              console.error("❌ ERREUR lors du déclenchement du son:", err)
              console.error("❌ Stack:", err instanceof Error ? err.stack : "Pas de stack")
            })

          // Augmenter le compteur de messages non lus si le chat n'est pas visible
          console.log("📊 État du chat - showChat:", showChat, "| isMinimized:", isMinimized)
          if (!showChat || isMinimized) {
            setUnreadCount(prev => {
              const newCount = prev + 1
              console.log(`📊 Compteur de messages non lus mis à jour: ${prev} -> ${newCount}`)
              return newCount
            })
          } else {
            // Si le chat est visible, réinitialiser le compteur
            console.log("📊 Chat visible, réinitialisation du compteur")
            setUnreadCount(0)
          }
        } else {
          console.log("ℹ️ Message de l'utilisateur actuel (ID:", userId, "), pas de notification")
        }

        // Le message est automatiquement ajouté à la liste et s'affichera dans le ChatPanel
        // Trier les messages par timestamp pour un affichage chronologique
        return [...prev, message].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
      })
    }

    // S'assurer que le socket est disponible avant d'ajouter l'écouteur
    if (socket) {
      socket.on("chat-message", handleChatMessage)
      console.log("✅ Écouteur de messages configuré")

      return () => {
        console.log("🔌 Nettoyage de l'écouteur de messages")
        if (socket) {
          socket.off("chat-message", handleChatMessage)
        }
      }
    } else {
      console.warn("⚠️ Socket non disponible, impossible de configurer l'écouteur")
      return () => {
        // Pas de nettoyage nécessaire si le socket n'existe pas
      }
    }
  }, [socket, isConnected, userId, showChat, isMinimized, playNotificationSound, addMessage, roomId, initAudioContext])

  // Réinitialiser le compteur de messages non lus quand le chat est ouvert
  useEffect(() => {
    if (showChat && !isMinimized) {
      setUnreadCount(0)
    }
  }, [showChat, isMinimized])

  const handleSendMessage = useCallback(async (message: string) => {
    if (!socket || !isConnected) return

    let timeoutId: NodeJS.Timeout | null = null
    let controller: AbortController | null = null

    try {
      // Sauvegarder le message dans la base de données via l'API avec timeout
      controller = new AbortController()
      // Augmenter le timeout à 15 secondes pour les connexions lentes
      timeoutId = setTimeout(() => {
        if (controller) {
          controller.abort()
          console.warn("Timeout lors de la sauvegarde du message")
        }
      }, 15000) // 15 secondes timeout
      
      const apiResponse = await fetch(`/api/collaboration/rooms?action=message&roomId=${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: userId,
          authorName: userName,
          role: userRole === "teacher" || userRole === "admin" ? "teacher" : "student",
          message: message,
        }),
        signal: controller.signal,
      })
      
      // Nettoyer le timer immédiatement après la réponse
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({ message: "Erreur lors de la sauvegarde du message" }))
        throw new Error(errorData.message || "Erreur lors de la sauvegarde du message")
      }

      // Récupérer le message sauvegardé depuis la réponse
      const responseData = await apiResponse.json()
      
      // Envoyer aussi via Socket.io pour la diffusion en temps réel
      if (responseData?.message) {
        socket.emit("chat-message", {
          roomId,
          message: responseData.message.message,
          authorId: responseData.message.authorId,
          authorName: responseData.message.authorName,
          role: responseData.message.role,
        })
      } else {
        // Fallback si pas de réponse détaillée
        socket.emit("chat-message", {
          roomId,
          message,
          authorId: userId,
          authorName: userName,
          role: userRole === "teacher" || userRole === "admin" ? "teacher" : "student",
        })
      }
    } catch (error) {
      // Nettoyer le timer en cas d'erreur
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.warn("Envoi du message annulé (timeout) - envoi via Socket.io uniquement")
          // En cas de timeout, on envoie quand même via Socket.io pour la diffusion en temps réel
          // mais sans sauvegarde en base de données
          socket.emit("chat-message", {
            roomId,
            message,
            authorId: userId,
            authorName: userName,
            role: userRole === "teacher" || userRole === "admin" ? "teacher" : "student",
          })
          // Ne pas lancer l'erreur pour les timeouts, le message est quand même envoyé
          return
        } else {
          console.error("Error sending message:", error)
        }
      } else {
        console.error("Erreur inconnue lors de l'envoi du message:", error)
      }
      // Ne lancer l'erreur que pour les erreurs non-timeout
      throw error
    } finally {
      // S'assurer que le timer est toujours nettoyé
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [socket, isConnected, roomId, userId, userName, userRole])

  const handleLeave = useCallback(() => {
    // Arrêter l'enregistrement si en cours
    if (isRecording) {
      stopRecording()
    }
    leaveRoom()
    onClose()
  }, [leaveRoom, onClose, isRecording])

  // Fonction pour autoriser l'enregistrement (enseignant uniquement)
  const authorizeRecording = useCallback(() => {
    if (!isTeacher) return
    setRecordingAuthorized(true)
    // Notifier les autres participants via socket en temps réel
    if (socket && isConnected) {
      console.log("📹 Autorisation d'enregistrement envoyée aux participants")
      socket.emit("recording-authorized", { roomId, authorized: true })
    }
  }, [isTeacher, socket, isConnected, roomId])

  // Écouter les autorisations d'enregistrement en temps réel
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleRecordingAuthorized = (data: { roomId: string; authorized: boolean }) => {
      if (data.roomId === roomId && data.authorized) {
        console.log("📹 Autorisation d'enregistrement reçue de l'enseignant")
        setRecordingAuthorized(true)
      }
    }

    socket.on("recording-authorized", handleRecordingAuthorized)

    return () => {
      socket.off("recording-authorized", handleRecordingAuthorized)
    }
  }, [socket, isConnected, roomId])

  // Fonction pour arrêter l'enregistrement
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop()
      }
      mediaRecorderRef.current = null
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    if (canvasRef.current) {
      canvasRef.current = null
    }
    
    setIsRecording(false)
  }, [])

  // Fonction pour démarrer l'enregistrement
  const startRecording = useCallback(async () => {
    if (!recordingAuthorized && !isTeacher) {
      alert("L'enregistrement doit être autorisé par l'enseignant")
      return
    }

    try {
      recordedChunksRef.current = []
      
      // Créer un canvas pour combiner les vidéos
      const canvas = document.createElement("canvas")
      canvas.width = 1920
      canvas.height = 1080
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        throw new Error("Impossible de créer le contexte canvas")
      }
      canvasRef.current = canvas

      // Créer un stream combiné depuis le canvas
      const stream = canvas.captureStream(30) // 30 FPS
      
      // Créer le MediaRecorder - Essayer MP4 d'abord, sinon WebM
      let mimeType = "video/webm"
      let fileExtension = "webm"
      
      // Vérifier le support des formats MP4
      if (MediaRecorder.isTypeSupported("video/mp4")) {
        mimeType = "video/mp4"
        fileExtension = "mp4"
      } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
        mimeType = "video/webm;codecs=vp9"
        fileExtension = "webm"
      } else if (MediaRecorder.isTypeSupported("video/webm")) {
        mimeType = "video/webm"
        fileExtension = "webm"
      }
      
      console.log(`📹 Format d'enregistrement sélectionné: ${mimeType}`)
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      })
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType })
        
        // Si le format est WebM et que l'utilisateur veut MP4, on peut essayer de convertir
        // Note: La conversion WebM vers MP4 nécessite généralement ffmpeg.js ou un serveur
        // Pour l'instant, on télécharge dans le format enregistré
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `session-${roomId}-${new Date().toISOString().split("T")[0]}.${fileExtension}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        recordedChunksRef.current = []
        
        if (fileExtension === "webm") {
          console.log("ℹ️ Format WebM enregistré. Pour convertir en MP4, utilisez un outil de conversion vidéo.")
        } else {
          console.log("✅ Fichier MP4 enregistré avec succès")
        }
      }
      
      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000) // Enregistrer des chunks toutes les secondes
      setIsRecording(true)

      // Fonction pour dessiner les vidéos sur le canvas
      let recordingActive = true
      const drawVideos = () => {
        if (!canvasRef.current || !ctx) {
          return
        }
        
        // Vérifier si l'enregistrement est toujours actif
        if (!recordingActive || !mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") {
          return
        }
        
        ctx.fillStyle = "#000000"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // Dessiner la vidéo locale
        if (localVideoRef.current && localVideoRef.current.videoWidth > 0) {
          const video = localVideoRef.current
          const aspectRatio = video.videoWidth / video.videoHeight
          let drawWidth = canvas.width / 2
          let drawHeight = drawWidth / aspectRatio
          if (drawHeight > canvas.height / 2) {
            drawHeight = canvas.height / 2
            drawWidth = drawHeight * aspectRatio
          }
          ctx.drawImage(video, 0, 0, drawWidth, drawHeight)
        }
        
        // Dessiner les vidéos distantes
        let xOffset = canvas.width / 2
        let yOffset = 0
        let count = 0
        remoteStreams.forEach((stream, userId) => {
          const videoElement = remoteVideosRef.current.get(userId)
          if (videoElement && videoElement.videoWidth > 0) {
            const video = videoElement
            const aspectRatio = video.videoWidth / video.videoHeight
            let drawWidth = canvas.width / 4
            let drawHeight = drawWidth / aspectRatio
            if (drawHeight > canvas.height / 2) {
              drawHeight = canvas.height / 2
              drawWidth = drawHeight * aspectRatio
            }
            
            if (count % 2 === 0) {
              yOffset = 0
            } else {
              yOffset = canvas.height / 2
            }
            
            ctx.drawImage(video, xOffset, yOffset, drawWidth, drawHeight)
            
            if (count % 2 === 1) {
              xOffset += drawWidth
            }
            count++
          }
        })
        
        if (recordingActive) {
          animationFrameRef.current = requestAnimationFrame(drawVideos)
        }
      }
      
      // Arrêter l'animation quand l'enregistrement s'arrête
      const originalStop = stopRecording
      const stopWithCleanup = () => {
        recordingActive = false
        originalStop()
      }
      
      drawVideos()
      
    } catch (error) {
      console.error("Erreur lors du démarrage de l'enregistrement:", error)
      alert("Impossible de démarrer l'enregistrement. Vérifiez que votre navigateur supporte cette fonctionnalité.")
      setIsRecording(false)
    }
  }, [recordingAuthorized, isTeacher, roomId, remoteStreams, isRecording])

  const remoteStreamsArray = Array.from(remoteStreams.entries())
  // Inclure tous les participants de la salle, pas seulement ceux avec des streams
  const allParticipants = roomUsers.filter(u => u.userId !== userId) // Exclure l'utilisateur local
  const totalParticipants = allParticipants.length + 1 // +1 pour l'utilisateur local
  
  // Compter les participants avec caméra active
  const participantsWithVideo = allParticipants.filter(p => remoteStreams.has(p.userId)).length + (isVideoEnabled ? 1 : 0)
  
  console.log(`[VirtualClassroom] Total participants: ${totalParticipants}, With video: ${participantsWithVideo}`)
  console.log(`[VirtualClassroom] Remote streams:`, Array.from(remoteStreams.keys()))
  console.log(`[VirtualClassroom] All participants:`, allParticipants.map(p => ({ userId: p.userId, name: p.userName, hasStream: remoteStreams.has(p.userId) })))

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80 shadow-2xl">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium">Classe virtuelle active</span>
                <Badge variant="secondary" className="text-xs">{totalParticipants} participants</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(false)}
                className="h-6 w-6 p-0"
              >
                <Maximize2 className="size-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* En-tête */}
      <div className="flex items-center justify-between border-b border-border/50 bg-card/95 backdrop-blur px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-semibold">Classe virtuelle</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <Badge variant="secondary" className="text-xs">
            <Users className="mr-1 size-3" />
            {totalParticipants} participant{totalParticipants > 1 ? "s" : ""}
          </Badge>
          {!isConnected && (
            <Badge variant="destructive" className="text-xs">Connexion...</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(true)}
            className="h-8 w-8 p-0"
          >
            <Minimize2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Zone vidéo principale */}
        <div className="relative flex-1 bg-black">
          <div className={cn(
            "grid h-full gap-2 p-2 auto-rows-fr",
            // Grille adaptative comme Zoom
            totalParticipants === 1 ? "grid-cols-1" :
            totalParticipants === 2 ? "grid-cols-2" :
            totalParticipants === 3 ? "grid-cols-2" : // 2 colonnes, 2 lignes
            totalParticipants === 4 ? "grid-cols-2" : // 2x2
            totalParticipants <= 6 ? "grid-cols-3" : // 3x2
            totalParticipants <= 9 ? "grid-cols-3" : // 3x3
            totalParticipants <= 12 ? "grid-cols-4" : // 4x3
            totalParticipants <= 16 ? "grid-cols-4" : // 4x4
            "grid-cols-5" // 5 colonnes pour plus de 16 participants
          )}>
            {/* Vidéo locale */}
            <Card className="relative overflow-hidden bg-black border-2 border-primary/50 aspect-video">
              <CardContent className="p-0 h-full">
                {localStream && isVideoEnabled ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted={true}
                    className="h-full w-full object-cover"
                    onLoadedMetadata={() => {
                      console.log(`[VirtualClassroom] Local video metadata loaded`)
                    }}
                    onCanPlay={() => {
                      console.log(`[VirtualClassroom] Local video can play`)
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-900">
                    <div className="flex size-20 items-center justify-center rounded-full bg-gray-700 text-2xl font-semibold text-white">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-lg bg-black/70 px-2 py-1 backdrop-blur">
                  <span className="text-xs font-medium text-white">{userName}</span>
                  {userRole === "teacher" && (
                    <Badge variant="default" className="text-[10px] px-1 py-0">Enseignant</Badge>
                  )}
                  {!isAudioEnabled && <MicOff className="size-3 text-red-400" />}
                  {isScreenSharing && <Monitor className="size-3 text-green-400" />}
                  {!isVideoEnabled && <VideoOff className="size-3 text-gray-400" />}
                </div>
              </CardContent>
            </Card>

            {/* Tous les participants distants (avec ou sans stream) */}
            {allParticipants.map((remoteUser) => {
              const hasStream = remoteStreams.has(remoteUser.userId)
              const stream = remoteStreams.get(remoteUser.userId)
              
              // Vérifier si le stream a des tracks vidéo
              const hasVideoTrack = stream && stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled
              
              console.log(`[VirtualClassroom] Rendering participant ${remoteUser.userName}:`, {
                hasStream,
                hasVideoTrack,
                streamId: stream?.id,
                videoTracks: stream?.getVideoTracks().length || 0
              })
              
              return (
                <Card key={remoteUser.userId} className="relative overflow-hidden bg-black aspect-video">
                  <CardContent className="p-0 h-full">
                    {hasStream && stream && hasVideoTrack ? (
                      <video
                        ref={(el) => {
                          if (el) {
                            remoteVideosRef.current.set(remoteUser.userId, el)
                            // Attacher immédiatement le stream si disponible
                            if (el.srcObject !== stream) {
                              console.log(`[VirtualClassroom] ✅ Attaching stream to video for ${remoteUser.userName}`)
                              el.srcObject = stream
                              el.play()
                                .then(() => {
                                  console.log(`[VirtualClassroom] ✅ Video playing for ${remoteUser.userName}`)
                                  forceUpdate({})
                                })
                                .catch(err => {
                                  console.error(`[VirtualClassroom] ❌ Error playing video for ${remoteUser.userName}:`, err)
                                })
                            }
                          } else {
                            remoteVideosRef.current.delete(remoteUser.userId)
                          }
                        }}
                        autoPlay
                        playsInline
                        muted={false}
                        className="h-full w-full object-cover"
                        onLoadedMetadata={() => {
                          console.log(`[VirtualClassroom] ✅ Video metadata loaded for ${remoteUser.userName}`)
                        }}
                        onCanPlay={() => {
                          console.log(`[VirtualClassroom] ✅ Video can play for ${remoteUser.userName}`)
                        }}
                        onError={(e) => {
                          console.error(`[VirtualClassroom] ❌ Video error for ${remoteUser.userName}:`, e)
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-900">
                        <div className="flex size-20 items-center justify-center rounded-full bg-gray-700 text-2xl font-semibold text-white">
                          {remoteUser.userName.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-lg bg-black/70 px-2 py-1 backdrop-blur">
                      <span className="text-xs font-medium text-white">
                        {remoteUser.userName}
                      </span>
                      {remoteUser.userRole === "teacher" && (
                        <Badge variant="default" className="text-[10px] px-1 py-0">Enseignant</Badge>
                      )}
                      {!hasStream || !hasVideoTrack ? (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 text-gray-400">Sans caméra</Badge>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {error && (
            <div className="absolute top-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-red-500 px-4 py-2 text-sm text-white shadow-lg animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <span>{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearError}
                  className="h-5 w-5 p-0 text-white hover:bg-red-600"
                  aria-label="Fermer le message d'erreur"
                >
                  <X className="size-3" />
                </Button>
              </div>
            </div>
          )}

          {!localStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <div className="text-center text-white">
                <p className="mb-4 text-lg">Initialisation de la classe virtuelle...</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="size-2 animate-pulse rounded-full bg-white" />
                  <div className="size-2 animate-pulse rounded-full bg-white delay-75" />
                  <div className="size-2 animate-pulse rounded-full bg-white delay-150" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Panneau chat (côté droit) */}
        {showChat && (
          <div className="w-80 border-l border-border/50 bg-card/95 backdrop-blur flex flex-col">
            <div className="border-b border-border/50 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">Chat</h3>
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="flex size-5 items-center justify-center rounded-full p-0 text-[10px] font-bold animate-pulse"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowChat(false)
                    setUnreadCount(0)
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X className="size-3" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <ChatPanel
                roomId={roomId}
                userId={userId}
                userName={userName}
                userRole={userRole}
                initialMessages={chatMessages}
                onSendMessage={handleSendMessage}
              />
            </div>
          </div>
        )}
      </div>

      {/* Barre de contrôles (bas) */}
      <div className="border-t border-border/50 bg-card/95 backdrop-blur px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Bouton d'autorisation d'enregistrement (enseignant uniquement) */}
            {isTeacher && !recordingAuthorized && (
              <Button
                variant="outline"
                size="sm"
                onClick={authorizeRecording}
                className="gap-2"
              >
                <Circle className="size-4" />
                Autoriser l'enregistrement
              </Button>
            )}
            
            {/* Indicateur d'enregistrement autorisé */}
            {recordingAuthorized && !isRecording && (
              <Badge variant="outline" className="gap-2">
                <Circle className="size-3 fill-green-500 text-green-500" />
                Enregistrement autorisé
              </Badge>
            )}
            
            {/* Bouton d'enregistrement */}
            {(recordingAuthorized || isTeacher) && (
              <Button
                variant={isRecording ? "destructive" : "default"}
                size="sm"
                onClick={isRecording ? stopRecording : startRecording}
                className="gap-2"
              >
                {isRecording ? (
                  <>
                    <Circle className="size-4 fill-red-500 text-red-500 animate-pulse" />
                    Arrêter
                  </>
                ) : (
                  <>
                    <Circle className="size-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            )}
            
            {isRecording && (
              <Badge variant="destructive" className="animate-pulse">
                <Circle className="size-2 fill-current mr-1" />
                Enregistrement...
              </Badge>
            )}
            
            <Button
              variant={isAudioEnabled ? "default" : "destructive"}
              size="sm"
              onClick={toggleAudio}
              className="gap-2"
            >
              {isAudioEnabled ? <Mic className="size-4" /> : <MicOff className="size-4" />}
            </Button>
            <Button
              variant={isVideoEnabled ? "default" : "destructive"}
              size="sm"
              onClick={toggleVideo}
              className="gap-2"
            >
              {isVideoEnabled ? <Video className="size-4" /> : <VideoOff className="size-4" />}
            </Button>
            <Button
              variant={isScreenSharing ? "default" : "outline"}
              size="sm"
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              className="gap-2"
            >
              {isScreenSharing ? <MonitorOff className="size-4" /> : <Monitor className="size-4" />}
              {isScreenSharing ? "Arrêter" : "Partager"}
            </Button>
            {!showChat && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowChat(true)
                  setUnreadCount(0)
                }}
                className="relative gap-2"
              >
                <MessageSquare className="size-4" />
                Chat
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px] font-bold"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Button>
            )}
          </div>
          <Button variant="destructive" size="sm" onClick={handleLeave} className="gap-2">
            <PhoneOff className="size-4" />
            Quitter
          </Button>
        </div>
      </div>
    </div>
  )
}

