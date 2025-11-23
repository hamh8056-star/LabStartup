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

  // Configuration STUN/TURN (utilise des serveurs publics gratuits)
  const rtcConfiguration: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  }

  const createPeerConnection = useCallback((targetSocketId: string, targetUserId: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection(rtcConfiguration)

    // Ajouter le stream local si disponible
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }

    // Gérer les tracks distants
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams
      setState(prev => {
        const newRemoteStreams = new Map(prev.remoteStreams)
        newRemoteStreams.set(targetUserId, remoteStream)
        return { ...prev, remoteStreams: newRemoteStreams }
      })
    }

    // Gérer les candidats ICE
    pc.onicecandidate = (event) => {
      if (event.candidate && socket?.connected) {
        socket.emit("webrtc-ice-candidate", {
          roomId,
          to: targetSocketId,
          candidate: event.candidate,
        })
      }
    }

    // Gérer les changements de connexion
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${targetUserId}:`, pc.connectionState)
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        setState(prev => {
          const newRemoteStreams = new Map(prev.remoteStreams)
          newRemoteStreams.delete(targetUserId)
          return { ...prev, remoteStreams: newRemoteStreams }
        })
      }
    }

    return pc
  }, [roomId, socket])


  const startLocalStream = useCallback(async (video: boolean = true, audio: boolean = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: 1280, height: 720 } : false,
        audio: audio,
      })

      localStreamRef.current = stream
      setState(prev => ({
        ...prev,
        localStream: stream,
        isVideoEnabled: video,
        isAudioEnabled: audio,
        error: null,
      }))

      // Ajouter le stream à toutes les connexions existantes
      peerConnectionsRef.current.forEach((pc) => {
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream)
        })
      })

      return stream
    } catch (error) {
      console.error("Error accessing media devices:", error)
      setState(prev => ({
        ...prev,
        error: "Impossible d'accéder à la caméra/microphone. Vérifiez les permissions.",
      }))
      return null
    }
  }, [])

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
      await startLocalStream(true, state.isAudioEnabled)
    }
  }, [state.isAudioEnabled, startLocalStream])

  const toggleAudio = useCallback(async () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setState(prev => ({ ...prev, isAudioEnabled: audioTrack.enabled }))
      }
    } else if (!state.isAudioEnabled) {
      await startLocalStream(state.isVideoEnabled, true)
    }
  }, [state.isVideoEnabled, startLocalStream])

  const startScreenShare = useCallback(async () => {
    try {
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

  // Nettoyage à la déconnexion
  useEffect(() => {
    return () => {
      leaveRoom()
    }
  }, [leaveRoom])

  return {
    ...state,
    startLocalStream,
    stopLocalStream,
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
    leaveRoom,
  }
}

