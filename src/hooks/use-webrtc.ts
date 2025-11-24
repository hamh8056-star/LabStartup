"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import io from "socket.io-client"

type Socket = ReturnType<typeof io>

export type MediaStreamState = {
  localStream: MediaStream | null
  remoteStreams: Map<string, MediaStream>
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  isScreenSharing: boolean
  error: string | null
}

export type PeerConnection = {
  peerConnection: RTCPeerConnection
  userId: string
}

export function useWebRTC(roomId: string, userId: string, userName: string, socket: Socket | null) {
  const [state, setState] = useState<MediaStreamState>({
    localStream: null,
    remoteStreams: new Map(),
    isVideoEnabled: false,
    isAudioEnabled: false,
    isScreenSharing: false,
    error: null,
  })

  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map())
  const screenStreamRef = useRef<MediaStream | null>(null)
  const socketToUserIdRef = useRef<Map<string, string>>(new Map()) // Map socketId -> userId
  const userIdToSocketIdRef = useRef<Map<string, string>>(new Map()) // Map userId -> socketId

  // Configuration STUN/TURN (utilise des serveurs publics gratuits)
  const rtcConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  }

  const createPeerConnection = useCallback((targetSocketId: string, targetUserId: string, isInitiator: boolean = false): RTCPeerConnection => {
    // Vérifier si une connexion existe déjà
    if (peerConnectionsRef.current.has(targetUserId)) {
      console.log(`[WebRTC] Connection already exists with ${targetUserId}`)
      return peerConnectionsRef.current.get(targetUserId)!
    }

    console.log(`[WebRTC] Creating peer connection with ${targetUserId} (initiator: ${isInitiator})`)
    const pc = new RTCPeerConnection(rtcConfiguration)

    // Ajouter le stream local si disponible
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        const sender = pc.addTrack(track, localStreamRef.current!)
        console.log(`[WebRTC] Added ${track.kind} track to peer connection`)
      })
    }

    // Gérer les tracks distants
    pc.ontrack = (event) => {
      console.log(`[WebRTC] ========== RECEIVED REMOTE TRACK ==========`)
      console.log(`[WebRTC] From user: ${targetUserId}`)
      console.log(`[WebRTC] Track details:`, {
        kind: event.track.kind,
        enabled: event.track.enabled,
        readyState: event.track.readyState,
        id: event.track.id,
        streams: event.streams.length
      })
      
      // Utiliser le stream de l'événement ou créer un nouveau stream
      let remoteStream: MediaStream
      if (event.streams && event.streams.length > 0) {
        remoteStream = event.streams[0]
        console.log(`[WebRTC] Using existing stream from event:`, remoteStream.id)
      } else {
        // Créer un nouveau stream si aucun n'est fourni
        remoteStream = new MediaStream([event.track])
        console.log(`[WebRTC] Created new stream for track:`, remoteStream.id)
      }
      
      // Ajouter tous les tracks du stream
      event.streams.forEach(stream => {
        stream.getTracks().forEach(track => {
          if (!remoteStream.getTracks().some(t => t.id === track.id)) {
            remoteStream.addTrack(track)
            console.log(`[WebRTC] Added track to stream:`, track.kind, track.id)
          }
        })
      })
      
      // S'assurer que le track de l'événement est dans le stream
      if (!remoteStream.getTracks().some(t => t.id === event.track.id)) {
        remoteStream.addTrack(event.track)
        console.log(`[WebRTC] Added event track to stream:`, event.track.kind, event.track.id)
      }
      
      console.log(`[WebRTC] Final remote stream for ${targetUserId}:`, {
        id: remoteStream.id,
        active: remoteStream.active,
        tracks: remoteStream.getTracks().map(t => ({ 
          kind: t.kind, 
          enabled: t.enabled, 
          readyState: t.readyState,
          id: t.id
        }))
      })
      
      setState(prev => {
        const newRemoteStreams = new Map(prev.remoteStreams)
        newRemoteStreams.set(targetUserId, remoteStream)
        console.log(`[WebRTC] ✅ Remote stream added for ${targetUserId}, total streams: ${newRemoteStreams.size}`)
        console.log(`[WebRTC] All remote streams:`, Array.from(newRemoteStreams.keys()))
        return { ...prev, remoteStreams: newRemoteStreams }
      })
      
      // Écouter les changements de tracks
      remoteStream.getTracks().forEach(track => {
        track.onended = () => {
          console.log(`[WebRTC] Track ended for ${targetUserId}:`, track.kind)
          setState(prev => {
            const newRemoteStreams = new Map(prev.remoteStreams)
            newRemoteStreams.delete(targetUserId)
            return { ...prev, remoteStreams: newRemoteStreams }
          })
        }
        track.onmute = () => {
          console.log(`[WebRTC] Track muted for ${targetUserId}:`, track.kind)
        }
        track.onunmute = () => {
          console.log(`[WebRTC] Track unmuted for ${targetUserId}:`, track.kind)
        }
      })
      
      // Écouter les changements du stream
      remoteStream.onaddtrack = (event) => {
        console.log(`[WebRTC] Track added to remote stream for ${targetUserId}:`, event.track.kind)
        setState(prev => {
          const newRemoteStreams = new Map(prev.remoteStreams)
          const existingStream = newRemoteStreams.get(targetUserId)
          if (existingStream && !existingStream.getTracks().some(t => t.id === event.track.id)) {
            existingStream.addTrack(event.track)
            newRemoteStreams.set(targetUserId, existingStream)
            console.log(`[WebRTC] ✅ Updated remote stream with new track`)
          }
          return { ...prev, remoteStreams: newRemoteStreams }
        })
      }
      remoteStream.onremovetrack = (event) => {
        console.log(`[WebRTC] Track removed from remote stream for ${targetUserId}:`, event.track.kind)
      }
    }

    // Gérer les candidats ICE
    pc.onicecandidate = (event) => {
      if (event.candidate && socket?.connected) {
        console.log(`[WebRTC] Sending ICE candidate to ${targetSocketId}`)
        socket.emit("webrtc-ice-candidate", {
          roomId,
          to: targetSocketId,
          candidate: event.candidate,
        })
      }
    }

    // Gérer les changements de connexion
    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state with ${targetUserId}: ${pc.connectionState}`)
      if (pc.connectionState === "connected") {
        console.log(`[WebRTC] ✅ Connected to ${targetUserId}!`)
      } else if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        console.warn(`[WebRTC] ⚠️ Connection ${pc.connectionState} with ${targetUserId}`)
        setState(prev => {
          const newRemoteStreams = new Map(prev.remoteStreams)
          newRemoteStreams.delete(targetUserId)
          return { ...prev, remoteStreams: newRemoteStreams }
        })
      }
    }

    // Gérer les erreurs ICE
    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE connection state with ${targetUserId}: ${pc.iceConnectionState}`)
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        console.log(`[WebRTC] ✅ ICE connected to ${targetUserId}!`)
      } else if (pc.iceConnectionState === "failed") {
        console.error(`[WebRTC] ❌ ICE connection failed with ${targetUserId}`)
      }
    }
    
    // Gérer les changements de signaling
    pc.onsignalingstatechange = () => {
      console.log(`[WebRTC] Signaling state with ${targetUserId}: ${pc.signalingState}`)
    }

    // Stocker la connexion
    peerConnectionsRef.current.set(targetUserId, pc)
    return pc
  }, [roomId, socket])

  // Créer une offre WebRTC et l'envoyer
  const createOffer = useCallback(async (targetSocketId: string, targetUserId: string) => {
    try {
      // Vérifier si une connexion existe déjà et est en cours
      if (peerConnectionsRef.current.has(targetUserId)) {
        const existingPc = peerConnectionsRef.current.get(targetUserId)
        if (existingPc) {
          const state = existingPc.signalingState
          // Si la connexion est en cours de négociation, ne pas créer une nouvelle offre
          if (state === "have-local-offer" || state === "have-remote-offer") {
            console.log(`[WebRTC] ⚠️ Connection already negotiating with ${targetUserId} (state: ${state}), skipping offer`)
            return
          }
          // Si la connexion est fermée, la supprimer
          if (state === "closed") {
            console.log(`[WebRTC] Removing closed connection for ${targetUserId}`)
            existingPc.close()
            peerConnectionsRef.current.delete(targetUserId)
          }
          // Si la connexion est stable mais n'a pas de tracks locaux, ajouter les tracks et créer une nouvelle offre
          if (state === "stable" && localStreamRef.current) {
            const hasLocalTracks = existingPc.getSenders().some(s => s.track !== null)
            if (!hasLocalTracks) {
              console.log(`[WebRTC] Adding local tracks to stable connection with ${targetUserId}`)
              localStreamRef.current.getTracks().forEach(track => {
                existingPc.addTrack(track, localStreamRef.current!)
              })
              // Continuer pour créer une nouvelle offre
            } else {
              // Les tracks sont déjà là, pas besoin de créer une nouvelle offre
              console.log(`[WebRTC] Connection with ${targetUserId} is stable and has tracks, skipping offer`)
              return
            }
          }
        }
      }
      
      console.log(`[WebRTC] ========== CREATING OFFER ==========`)
      console.log(`[WebRTC] For user: ${targetUserId} (socketId: ${targetSocketId})`)
      console.log(`[WebRTC] Local stream available:`, !!localStreamRef.current)
      
      const pc = createPeerConnection(targetSocketId, targetUserId, true)
      
      // S'assurer que le stream local est ajouté
      if (localStreamRef.current) {
        const sendersBefore = pc.getSenders().length
        console.log(`[WebRTC] Adding local stream tracks (senders before: ${sendersBefore})`)
        localStreamRef.current.getTracks().forEach(track => {
          const sender = pc.addTrack(track, localStreamRef.current!)
          console.log(`[WebRTC] Added ${track.kind} track, sender:`, sender)
        })
        console.log(`[WebRTC] Senders after: ${pc.getSenders().length}`)
      } else {
        console.warn(`[WebRTC] ⚠️ No local stream available when creating offer`)
      }
      
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
      
      await pc.setLocalDescription(offer)
      console.log(`[WebRTC] ✅ Local description set, signaling state: ${pc.signalingState}`)
      
      if (!socket?.connected) {
        console.error(`[WebRTC] ❌ Socket not connected, cannot send offer`)
        return
      }
      
      console.log(`[WebRTC] Sending offer to ${targetSocketId} for user ${targetUserId}`)
      socket.emit("webrtc-offer", {
        roomId,
        to: targetSocketId,
        offer: offer,
      })
      console.log(`[WebRTC] ✅ Offer sent successfully to socket ${targetSocketId}`)
    } catch (error) {
      console.error(`[WebRTC] ❌ Error creating offer for ${targetUserId}:`, error)
      if (error instanceof Error) {
        console.error(`[WebRTC] Error stack:`, error.stack)
      }
    }
  }, [roomId, socket, createPeerConnection])

  // Créer une réponse WebRTC et l'envoyer
  const createAnswer = useCallback(async (targetSocketId: string, targetUserId: string, offer: RTCSessionDescriptionInit) => {
    try {
      console.log(`[WebRTC] ========== CREATING ANSWER ==========`)
      console.log(`[WebRTC] For user: ${targetUserId} (socketId: ${targetSocketId})`)
      
      // Vérifier si une connexion existe déjà
      let pc = peerConnectionsRef.current.get(targetUserId)
      if (!pc || pc.signalingState === "closed") {
        console.log(`[WebRTC] Creating new peer connection for answer`)
        pc = createPeerConnection(targetSocketId, targetUserId, false)
      } else {
        const currentState = pc.signalingState
        console.log(`[WebRTC] Using existing peer connection, state: ${currentState}`)
        
        // Si on est déjà en train de créer une offre, on peut quand même répondre
        // WebRTC gère cela en créant une nouvelle connexion si nécessaire
        if (currentState === "have-local-offer") {
          console.log(`[WebRTC] ⚠️ Already have local offer, but will create answer anyway`)
          // On peut créer une réponse même si on a déjà une offre locale
          // Cela créera une connexion bidirectionnelle
        }
      }
      
      // S'assurer que le stream local est ajouté
      if (localStreamRef.current && pc.getSenders().length === 0) {
        console.log(`[WebRTC] Adding local stream tracks to peer connection for answer`)
        localStreamRef.current.getTracks().forEach(track => {
          const sender = pc.addTrack(track, localStreamRef.current!)
          console.log(`[WebRTC] Added ${track.kind} track for answer, sender:`, sender)
        })
      }
      
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      console.log(`[WebRTC] ✅ Remote description set for ${targetUserId}, signaling state: ${pc.signalingState}`)
      
      const answer = await pc.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
      
      await pc.setLocalDescription(answer)
      console.log(`[WebRTC] ✅ Local description set for answer, signaling state: ${pc.signalingState}`)
      
      if (!socket?.connected) {
        console.error(`[WebRTC] ❌ Socket not connected, cannot send answer`)
        return
      }
      
      console.log(`[WebRTC] Sending answer to ${targetSocketId} for user ${targetUserId}`)
      socket.emit("webrtc-answer", {
        roomId,
        to: targetSocketId,
        answer: answer,
      })
      console.log(`[WebRTC] ✅ Answer sent successfully`)
    } catch (error) {
      console.error(`[WebRTC] Error creating answer for ${targetUserId}:`, error)
    }
  }, [roomId, socket, createPeerConnection])


  const startLocalStream = useCallback(async (video: boolean = true, audio: boolean = true) => {
    try {
      // Vérifier que nous sommes côté client
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        console.warn("[WebRTC] ⚠️ Not in browser environment")
        return null
      }

      // Vérifier que l'API est disponible
      if (!navigator.mediaDevices) {
        const errorMessage = "L'API MediaDevices n'est pas disponible. " +
          "Assurez-vous d'utiliser HTTPS ou localhost (http://localhost:3000), et que votre navigateur supporte cette fonctionnalité."
        console.error("[WebRTC] ❌", errorMessage)
        setState(prev => ({
          ...prev,
          error: errorMessage,
        }))
        return null
      }

      if (typeof navigator.mediaDevices.getUserMedia !== 'function') {
        const errorMessage = "getUserMedia n'est pas disponible. " +
          "Assurez-vous d'utiliser HTTPS ou localhost (http://localhost:3000), et que votre navigateur supporte cette fonctionnalité."
        console.error("[WebRTC] ❌", errorMessage)
        setState(prev => ({
          ...prev,
          error: errorMessage,
        }))
        return null
      }

      // Essayer d'abord avec vidéo et audio
      let stream: MediaStream | null = null
      let hasAudio = false
      
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: video ? { width: 1280, height: 720 } : false,
          audio: audio ? {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } : false,
        })
        hasAudio = stream.getAudioTracks().length > 0
        console.log(`[WebRTC] ✅ Stream obtenu avec ${stream.getAudioTracks().length} track(s) audio et ${stream.getVideoTracks().length} track(s) vidéo`)
      } catch (error: any) {
        // Si l'erreur concerne l'audio et qu'on a demandé la vidéo, essayer sans audio
        if (audio && video && (error.name === "NotFoundError" || error.name === "DevicesNotFoundError")) {
          console.warn(`[WebRTC] ⚠️ Microphone non trouvé, tentative avec vidéo seule...`)
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { width: 1280, height: 720 },
              audio: false,
            })
            hasAudio = false
            console.log(`[WebRTC] ✅ Stream obtenu avec vidéo seule (microphone non disponible)`)
          } catch (videoError: any) {
            // Si même la vidéo échoue, essayer seulement audio
            if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
              console.warn(`[WebRTC] ⚠️ Caméra non trouvée, tentative avec audio seul...`)
              try {
                stream = await navigator.mediaDevices.getUserMedia({
                  video: false,
                  audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                  },
                })
                hasAudio = stream.getAudioTracks().length > 0
                console.log(`[WebRTC] ✅ Stream obtenu avec audio seul (caméra non disponible)`)
              } catch (audioError) {
                // Si tout échoue, relancer l'erreur originale
                throw error
              }
            } else {
              throw videoError
            }
          }
        } else {
          // Si ce n'est pas une erreur de périphérique non trouvé, relancer l'erreur
          throw error
        }
      }
      
      if (!stream) {
        throw new Error("Impossible d'obtenir un stream média")
      }

      // Vérifier que les tracks audio sont bien activés
      const audioTracks = stream.getAudioTracks()
      const videoTracks = stream.getVideoTracks()
      
      console.log(`[WebRTC] ========== LOCAL STREAM STARTED ==========`)
      console.log(`[WebRTC] Audio tracks:`, audioTracks.length, audioTracks.map(t => ({ 
        id: t.id, 
        enabled: t.enabled, 
        readyState: t.readyState,
        label: t.label,
        settings: t.getSettings()
      })))
      console.log(`[WebRTC] Video tracks:`, videoTracks.length, videoTracks.map(t => ({ 
        id: t.id, 
        enabled: t.enabled, 
        readyState: t.readyState,
        label: t.label
      })))
      
      // S'assurer que les tracks audio sont activés
      audioTracks.forEach(track => {
        if (!track.enabled) {
          console.warn(`[WebRTC] ⚠️ Audio track ${track.id} is disabled, enabling it...`)
          track.enabled = true
        }
      })
      
      // Afficher un avertissement si le microphone n'est pas disponible mais était demandé
      if (audio && audioTracks.length === 0) {
        console.warn(`[WebRTC] ⚠️ Microphone demandé mais non disponible. L'utilisateur peut l'activer plus tard.`)
      }

      localStreamRef.current = stream
      setState(prev => ({
        ...prev,
        localStream: stream,
        isVideoEnabled: video && videoTracks.length > 0,
        isAudioEnabled: hasAudio && audioTracks.length > 0 && audioTracks[0].enabled,
        error: null,
      }))

      console.log(`[WebRTC] Stream state:`, {
        hasAudio: audioTracks.length > 0,
        hasVideo: videoTracks.length > 0,
        audioEnabled: audioTracks.length > 0 ? audioTracks[0].enabled : false,
        videoEnabled: videoTracks.length > 0 ? videoTracks[0].enabled : false,
      })
      console.log(`[WebRTC] Existing peer connections:`, Array.from(peerConnectionsRef.current.keys()))
      console.log(`[WebRTC] Known users:`, Array.from(userIdToSocketIdRef.current.entries()))

      // Ajouter le stream à toutes les connexions existantes
      peerConnectionsRef.current.forEach((pc, targetUserId) => {
        console.log(`[WebRTC] Adding tracks to existing connection with ${targetUserId}`)
        stream.getTracks().forEach(track => {
          // Vérifier si le track n'est pas déjà ajouté
          const existingSender = pc.getSenders().find(s => s.track?.kind === track.kind)
          if (!existingSender) {
            const sender = pc.addTrack(track, stream)
            console.log(`[WebRTC] ✅ Added ${track.kind} track to existing connection with ${targetUserId}, sender:`, sender)
          } else {
            // Remplacer le track existant
            existingSender.replaceTrack(track)
            console.log(`[WebRTC] ✅ Replaced ${track.kind} track in existing connection with ${targetUserId}`)
          }
        })
      })

      // Créer des connexions et offres pour TOUS les utilisateurs déjà dans la salle
      // Comme Zoom : dès qu'un participant démarre sa caméra, il doit voir tous les autres
      if (socket?.connected) {
        console.log(`[WebRTC] ========== CREATING CONNECTIONS FOR ALL USERS ==========`)
        console.log(`[WebRTC] Mapped users:`, Array.from(userIdToSocketIdRef.current.entries()))
        
        // Utiliser un délai pour s'assurer que les mappings sont créés
        setTimeout(async () => {
          const usersToConnect = Array.from(userIdToSocketIdRef.current.entries())
          console.log(`[WebRTC] Processing ${usersToConnect.length} users for connection`)
          
          for (const [targetUserId, targetSocketId] of usersToConnect) {
            if (targetUserId !== userId) {
              try {
                // Vérifier si une connexion existe déjà
                if (!peerConnectionsRef.current.has(targetUserId)) {
                  console.log(`[WebRTC] Creating new connection for ${targetUserId} after stream started`)
                  // TOUJOURS créer une offre si on a un stream local
                  // L'autre participant répondra s'il a déjà créé une connexion
                  await createOffer(targetSocketId, targetUserId)
                } else {
                  const existingPc = peerConnectionsRef.current.get(targetUserId)
                  if (existingPc) {
                    // Ajouter les tracks si la connexion existe mais n'a pas de tracks
                    const hasTracks = existingPc.getSenders().some(s => s.track !== null)
                    if (!hasTracks) {
                      console.log(`[WebRTC] Adding tracks to existing connection ${targetUserId}`)
                      stream.getTracks().forEach(track => {
                        existingPc.addTrack(track, stream)
                      })
                      // Si la connexion est stable, créer une nouvelle offre pour mettre à jour
                      if (existingPc.signalingState === "stable") {
                        console.log(`[WebRTC] Connection is stable, creating new offer for ${targetUserId}`)
                        await createOffer(targetSocketId, targetUserId)
                      }
                    } else {
                      // Remplacer les tracks existants pour mettre à jour le stream
                      console.log(`[WebRTC] Replacing tracks in existing connection ${targetUserId}`)
                      stream.getTracks().forEach(track => {
                        const sender = existingPc.getSenders().find(s => s.track?.kind === track.kind)
                        if (sender) {
                          sender.replaceTrack(track)
                          console.log(`[WebRTC] ✅ Replaced ${track.kind} track`)
                        } else {
                          existingPc.addTrack(track, stream)
                          console.log(`[WebRTC] ✅ Added ${track.kind} track`)
                        }
                      })
                      // Créer une nouvelle offre pour mettre à jour la connexion
                      if (existingPc.signalingState === "stable") {
                        console.log(`[WebRTC] Creating new offer to update connection with ${targetUserId}`)
                        await createOffer(targetSocketId, targetUserId)
                      }
                    }
                  }
                }
              } catch (error) {
                console.error(`[WebRTC] ❌ Error handling connection for ${targetUserId}:`, error)
              }
            }
          }
        }, 1000) // Délai pour s'assurer que les mappings sont créés
      } else {
        console.warn(`[WebRTC] ⚠️ Socket not connected, cannot create connections`)
      }

      return stream
    } catch (error: any) {
      console.error("[WebRTC] ❌ Error accessing media devices:", error)
      
      let errorMessage = "Impossible d'accéder à la caméra/microphone."
      
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage = "Permission refusée. Veuillez autoriser l'accès à la caméra/microphone dans les paramètres du navigateur."
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMessage = "Aucune caméra ou microphone détecté. Vérifiez que vos périphériques sont connectés."
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        errorMessage = "Le périphérique est déjà utilisé par une autre application. Fermez les autres applications utilisant la caméra/microphone."
      } else if (error.name === "OverconstrainedError") {
        errorMessage = "Les contraintes demandées ne sont pas supportées par votre périphérique."
      } else if (error.message) {
        errorMessage = `Erreur: ${error.message}`
      }
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
      }))
      return null
    }
  }, [socket, userId, roomId, createPeerConnection])

  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
      setState(prev => ({
        ...prev,
        localStream: null,
        isVideoEnabled: false,
        isAudioEnabled: false,
      }))
    }
  }, [])

  const toggleVideo = useCallback(async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setState(prev => ({ ...prev, isVideoEnabled: videoTrack.enabled }))
      }
    } else if (!state.isVideoEnabled) {
      // Vérifier que l'API est disponible avant d'appeler startLocalStream
      if (typeof window === 'undefined' || typeof navigator === 'undefined' || 
          !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMessage = "L'accès à la caméra n'est pas disponible. " +
          "Assurez-vous d'utiliser HTTPS ou localhost."
        console.error("[WebRTC] ❌", errorMessage)
        setState(prev => ({
          ...prev,
          error: errorMessage,
        }))
        return
      }
      await startLocalStream(true, state.isAudioEnabled)
    }
  }, [state.isAudioEnabled, state.isVideoEnabled, startLocalStream])

  const toggleAudio = useCallback(async () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        // Le track audio existe, on peut juste l'activer/désactiver
        audioTrack.enabled = !audioTrack.enabled
        setState(prev => ({ ...prev, isAudioEnabled: audioTrack.enabled }))
        console.log(`[WebRTC] Audio track ${audioTrack.enabled ? 'enabled' : 'disabled'}`)
      } else {
        // Pas de track audio, essayer d'en ajouter un
        console.log(`[WebRTC] No audio track found, trying to add one...`)
        try {
          // Vérifier que l'API est disponible
          if (typeof window === 'undefined' || typeof navigator === 'undefined' || 
              !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            const errorMessage = "L'accès au microphone n'est pas disponible. " +
              "Assurez-vous d'utiliser HTTPS ou localhost."
            console.error("[WebRTC] ❌", errorMessage)
            setState(prev => ({
              ...prev,
              error: errorMessage,
            }))
            return
          }
          
          // Obtenir seulement l'audio
          const audioStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          })
          
          const newAudioTrack = audioStream.getAudioTracks()[0]
          if (newAudioTrack && localStreamRef.current) {
            localStreamRef.current.addTrack(newAudioTrack)
            setState(prev => ({ ...prev, isAudioEnabled: true }))
            console.log(`[WebRTC] ✅ Audio track added successfully`)
            
            // Ajouter le track aux connexions existantes
            peerConnectionsRef.current.forEach((pc, targetUserId) => {
              const sender = pc.addTrack(newAudioTrack, localStreamRef.current!)
              console.log(`[WebRTC] Added audio track to connection with ${targetUserId}`)
            })
          }
        } catch (error: any) {
          console.error("[WebRTC] ❌ Error adding audio track:", error)
          let errorMessage = "Impossible d'accéder au microphone."
          
          if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
            errorMessage = "Aucun microphone détecté. Vérifiez que votre microphone est connecté et autorisé dans les paramètres système."
            console.warn("[WebRTC] ⚠️ Microphone non trouvé. L'utilisateur peut continuer sans microphone.")
          } else if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
            errorMessage = "Permission refusée. Veuillez autoriser l'accès au microphone dans les paramètres du navigateur."
          } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
            errorMessage = "Le microphone est déjà utilisé par une autre application. Fermez les autres applications utilisant le microphone."
          } else if (error.message) {
            errorMessage = `Erreur: ${error.message}`
          }
          
          // Ne pas bloquer l'utilisateur, juste afficher un message d'erreur temporaire
          setState(prev => ({
            ...prev,
            error: errorMessage,
            isAudioEnabled: false, // S'assurer que l'état reflète que l'audio n'est pas activé
          }))
          
          // Effacer l'erreur après 5 secondes pour ne pas bloquer l'interface
          setTimeout(() => {
            setState(prev => ({
              ...prev,
              error: null,
            }))
          }, 5000)
        }
      }
    } else if (!state.isAudioEnabled) {
      // Pas de stream local, démarrer avec audio
      // Vérifier que l'API est disponible avant d'appeler startLocalStream
      if (typeof window === 'undefined' || typeof navigator === 'undefined' || 
          !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMessage = "L'accès au microphone n'est pas disponible. " +
          "Assurez-vous d'utiliser HTTPS ou localhost."
        console.error("[WebRTC] ❌", errorMessage)
        setState(prev => ({
          ...prev,
          error: errorMessage,
        }))
        return
      }
      await startLocalStream(state.isVideoEnabled, true)
    }
  }, [state.isVideoEnabled, state.isAudioEnabled, startLocalStream])

  const startScreenShare = useCallback(async () => {
    try {
      // Vérifier que nous sommes côté client
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        console.warn("[WebRTC] ⚠️ Not in browser environment")
        return
      }

      // Vérifier que l'API est disponible
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        const errorMessage = "Le partage d'écran n'est pas disponible. " +
          "Assurez-vous d'utiliser HTTPS ou localhost, et que votre navigateur supporte cette fonctionnalité."
        console.error("[WebRTC] ❌", errorMessage)
        setState(prev => ({
          ...prev,
          error: errorMessage,
        }))
        return
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as MediaTrackConstraints,
        audio: true,
      })

      screenStreamRef.current = screenStream

      // Remplacer la vidéo locale par le partage d'écran
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0]
        if (videoTrack) {
          localStreamRef.current.removeTrack(videoTrack)
          videoTrack.stop()
        }
        localStreamRef.current.addTrack(screenStream.getVideoTracks()[0])
      }

      // Mettre à jour toutes les connexions
      peerConnectionsRef.current.forEach((pc) => {
        const sender = pc.getSenders().find(s => s.track?.kind === "video")
        if (sender && screenStream.getVideoTracks()[0]) {
          sender.replaceTrack(screenStream.getVideoTracks()[0])
        }
      })

      setState(prev => ({ ...prev, isScreenSharing: true }))

      // Arrêter le partage d'écran quand l'utilisateur clique sur "Arrêter le partage"
      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare()
      }
    } catch (error) {
      console.error("Error sharing screen:", error)
      setState(prev => ({
        ...prev,
        error: "Impossible de partager l'écran. Vérifiez les permissions.",
      }))
    }
  }, [])

  const stopScreenShare = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop())
      screenStreamRef.current = null
    }

    // Restaurer la caméra si elle était activée
    if (state.isVideoEnabled && localStreamRef.current) {
      try {
        // Vérifier que l'API est disponible
        if (typeof window === 'undefined' || typeof navigator === 'undefined' || 
            !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.warn("[WebRTC] ⚠️ Cannot restore video, API not available")
          return
        }

        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
        })
        const videoTrack = videoStream.getVideoTracks()[0]

        if (localStreamRef.current) {
          const oldVideoTrack = localStreamRef.current.getVideoTracks()[0]
          if (oldVideoTrack) {
            localStreamRef.current.removeTrack(oldVideoTrack)
            oldVideoTrack.stop()
          }
          localStreamRef.current.addTrack(videoTrack)
        }

        // Mettre à jour toutes les connexions
        peerConnectionsRef.current.forEach((pc) => {
          const sender = pc.getSenders().find(s => s.track?.kind === "video")
          if (sender) {
            sender.replaceTrack(videoTrack)
          }
        })
      } catch (error) {
        console.error("Error restoring video:", error)
      }
    }

    setState(prev => ({ ...prev, isScreenSharing: false }))
  }, [state.isVideoEnabled])

  const leaveRoom = useCallback(() => {
    // Fermer toutes les connexions
    peerConnectionsRef.current.forEach((pc) => {
      pc.close()
    })
    peerConnectionsRef.current.clear()

    // Arrêter les streams
    stopLocalStream()
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop())
      screenStreamRef.current = null
    }

    setState({
      localStream: null,
      remoteStreams: new Map(),
      isVideoEnabled: false,
      isAudioEnabled: false,
      isScreenSharing: false,
      error: null,
    })
  }, [stopLocalStream])

  // Gérer les événements Socket.io pour WebRTC
  useEffect(() => {
    if (!socket || !socket.connected) return

    // Écouter les nouveaux utilisateurs qui rejoignent
    const handleUserJoined = (user: { userId: string; socketId: string; userName: string; userRole: string }) => {
      if (user.userId === userId) return // Ignorer soi-même
      
      console.log(`[WebRTC] ========== NEW USER JOINED ==========`)
      console.log(`[WebRTC] User: ${user.userName} (${user.userId}), socketId: ${user.socketId}`)
      console.log(`[WebRTC] My userId: ${userId}`)
      
      socketToUserIdRef.current.set(user.socketId, user.userId)
      userIdToSocketIdRef.current.set(user.userId, user.socketId)
      
      // Créer une connexion avec le nouvel utilisateur
      // Si on a déjà un stream local, créer immédiatement une offre
      // Sinon, attendre que le stream soit disponible
      setTimeout(async () => {
        if (localStreamRef.current) {
          console.log(`[WebRTC] Creating offer for new user ${user.userId} (has local stream)`)
          await createOffer(user.socketId, user.userId)
        } else {
          console.log(`[WebRTC] Waiting for local stream before creating offer for ${user.userId}`)
          // Attendre que le stream local soit disponible
          const checkStream = setInterval(() => {
            if (localStreamRef.current) {
              clearInterval(checkStream)
              console.log(`[WebRTC] Local stream available, creating offer for ${user.userId}`)
              createOffer(user.socketId, user.userId)
            }
          }, 500)
          // Arrêter après 10 secondes
          setTimeout(() => clearInterval(checkStream), 10000)
        }
      }, 1000)
    }

    // Écouter la liste des utilisateurs déjà dans la salle
    const handleRoomUsers = (users: Array<{ userId: string; socketId: string; userName: string; userRole: string }>) => {
      console.log(`[WebRTC] ========== ROOM USERS RECEIVED ==========`)
      console.log(`[WebRTC] Users count:`, users.length)
      console.log(`[WebRTC] Users:`, users.map(u => ({ userId: u.userId, socketId: u.socketId, name: u.userName })))
      console.log(`[WebRTC] My userId: ${userId}`)
      
      users.forEach(user => {
        if (user.userId === userId) return // Ignorer soi-même
        
        console.log(`[WebRTC] Processing existing user: ${user.userName} (${user.userId}), socketId: ${user.socketId}`)
        socketToUserIdRef.current.set(user.socketId, user.userId)
        userIdToSocketIdRef.current.set(user.userId, user.socketId)
        
        // Créer une connexion avec chaque utilisateur existant
        // Si on a déjà un stream local, créer immédiatement une offre
        // Sinon, attendre que le stream soit disponible
        setTimeout(async () => {
          if (localStreamRef.current) {
            console.log(`[WebRTC] Creating offer for existing user ${user.userId} (has local stream)`)
            await createOffer(user.socketId, user.userId)
          } else {
            console.log(`[WebRTC] Waiting for local stream before creating offer for ${user.userId}`)
            // Attendre que le stream local soit disponible
            const checkStream = setInterval(() => {
              if (localStreamRef.current) {
                clearInterval(checkStream)
                console.log(`[WebRTC] Local stream available, creating offer for ${user.userId}`)
                createOffer(user.socketId, user.userId)
              }
            }, 500)
            // Arrêter après 10 secondes
            setTimeout(() => clearInterval(checkStream), 10000)
          }
        }, 1000)
      })
    }

    // Gérer les offres WebRTC reçues
    const handleWebRTCOffer = async (data: { from: string; offer: RTCSessionDescriptionInit }) => {
      console.log(`[WebRTC] ========== RECEIVED OFFER ==========`)
      console.log(`[WebRTC] From socket: ${data.from}`)
      
      const targetUserId = socketToUserIdRef.current.get(data.from)
      if (!targetUserId) {
        console.warn(`[WebRTC] ⚠️ Unknown socket ID: ${data.from}, current mappings:`, {
          socketToUserId: Array.from(socketToUserIdRef.current.entries()),
          userIdToSocket: Array.from(userIdToSocketIdRef.current.entries())
        })
        // Essayer de trouver le userId dans les roomUsers si disponible
        return
      }
      
      console.log(`[WebRTC] ✅ Offer from user: ${targetUserId} (socketId: ${data.from})`)
      console.log(`[WebRTC] Offer type: ${data.offer.type}, sdp length: ${data.offer.sdp?.length || 0}`)
      
      try {
        await createAnswer(data.from, targetUserId, data.offer)
      } catch (error) {
        console.error(`[WebRTC] ❌ Error handling offer from ${targetUserId}:`, error)
      }
    }

    // Gérer les réponses WebRTC reçues
    const handleWebRTCAnswer = async (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      console.log(`[WebRTC] ========== RECEIVED ANSWER ==========`)
      console.log(`[WebRTC] From socket: ${data.from}`)
      
      const targetUserId = socketToUserIdRef.current.get(data.from)
      if (!targetUserId) {
        console.warn(`[WebRTC] ⚠️ Unknown socket ID: ${data.from}`)
        return
      }
      
      console.log(`[WebRTC] ✅ Answer from user: ${targetUserId} (socketId: ${data.from})`)
      console.log(`[WebRTC] Answer type: ${data.answer.type}, sdp length: ${data.answer.sdp?.length || 0}`)
      
      const pc = peerConnectionsRef.current.get(targetUserId)
      if (pc) {
        try {
          const currentState = pc.signalingState
          console.log(`[WebRTC] Current signaling state: ${currentState}`)
          
          if (currentState === "have-local-offer") {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
            console.log(`[WebRTC] ✅ Remote description set, new signaling state: ${pc.signalingState}`)
            console.log(`[WebRTC] Connection state: ${pc.connectionState}, ICE state: ${pc.iceConnectionState}`)
          } else {
            console.warn(`[WebRTC] ⚠️ Unexpected signaling state ${currentState}, expected 'have-local-offer'`)
            // Essayer quand même
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
            console.log(`[WebRTC] Remote description set anyway, new state: ${pc.signalingState}`)
          }
        } catch (error) {
          console.error(`[WebRTC] ❌ Error setting remote description:`, error)
          if (error instanceof Error) {
            console.error(`[WebRTC] Error details:`, error.message, error.stack)
          }
        }
      } else {
        console.error(`[WebRTC] ❌ No peer connection found for ${targetUserId}`)
        console.log(`[WebRTC] Available connections:`, Array.from(peerConnectionsRef.current.keys()))
      }
    }

    // Gérer les candidats ICE reçus
    const handleWebRTCIceCandidate = async (data: { from: string; candidate: RTCIceCandidateInit }) => {
      const targetUserId = socketToUserIdRef.current.get(data.from)
      if (!targetUserId) {
        console.warn(`[WebRTC] Unknown socket ID: ${data.from}`)
        return
      }
      
      console.log(`[WebRTC] Received ICE candidate from ${targetUserId}`)
      const pc = peerConnectionsRef.current.get(targetUserId)
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
      } else {
        // Stocker le candidat pour plus tard si la description distante n'est pas encore définie
        console.log(`[WebRTC] Storing ICE candidate for later (remote description not set yet)`)
      }
    }

    // Gérer les utilisateurs qui quittent
    const handleUserLeft = (data: { userId: string; socketId: string }) => {
      console.log(`[WebRTC] User left: ${data.userId}`)
      const pc = peerConnectionsRef.current.get(data.userId)
      if (pc) {
        pc.close()
        peerConnectionsRef.current.delete(data.userId)
      }
      socketToUserIdRef.current.delete(data.socketId)
      userIdToSocketIdRef.current.delete(data.userId)
      
      setState(prev => {
        const newRemoteStreams = new Map(prev.remoteStreams)
        newRemoteStreams.delete(data.userId)
        return { ...prev, remoteStreams: newRemoteStreams }
      })
    }

    socket.on("user-joined", handleUserJoined)
    socket.on("room-users", handleRoomUsers)
    socket.on("webrtc-offer", handleWebRTCOffer)
    socket.on("webrtc-answer", handleWebRTCAnswer)
    socket.on("webrtc-ice-candidate", handleWebRTCIceCandidate)
    socket.on("user-left", handleUserLeft)

    return () => {
      socket.off("user-joined", handleUserJoined)
      socket.off("room-users", handleRoomUsers)
      socket.off("webrtc-offer", handleWebRTCOffer)
      socket.off("webrtc-answer", handleWebRTCAnswer)
      socket.off("webrtc-ice-candidate", handleWebRTCIceCandidate)
      socket.off("user-left", handleUserLeft)
    }
  }, [socket, userId, roomId, createOffer, createAnswer])

  // Nettoyage à la déconnexion
  useEffect(() => {
    return () => {
      leaveRoom()
    }
  }, [leaveRoom])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    startLocalStream,
    stopLocalStream,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    leaveRoom,
    clearError,
  }
}

