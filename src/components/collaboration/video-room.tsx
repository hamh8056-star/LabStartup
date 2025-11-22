"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff, Users, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useWebRTC } from "@/hooks/use-webrtc"
import { useSocket } from "@/hooks/use-socket"
import { cn } from "@/lib/utils"

type VideoRoomProps = {
  roomId: string
  userId: string
  userName: string
  userRole: "teacher" | "student" | "admin"
  onLeave: () => void
}

export function VideoRoom({ roomId, userId, userName, userRole, onLeave }: VideoRoomProps) {
  const { socket, isConnected } = useSocket(roomId, userId, userName, userRole)
  
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
  } = useWebRTC(roomId, userId, userName, socket)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const [remoteVideos, setRemoteVideos] = useState<Map<string, HTMLVideoElement>>(new Map())
  const [showParticipants, setShowParticipants] = useState(false)

  // Attacher le stream local à la vidéo
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  // Attacher les streams distants aux vidéos
  useEffect(() => {
    remoteStreams.forEach((stream, userId) => {
      const videoElement = remoteVideos.get(userId)
      if (videoElement) {
        videoElement.srcObject = stream
      }
    })
  }, [remoteStreams, remoteVideos])

  const handleJoin = useCallback(async () => {
    await startLocalStream(true, true)
  }, [startLocalStream])

  const handleLeave = useCallback(() => {
    leaveRoom()
    onLeave()
  }, [leaveRoom, onLeave])

  const remoteStreamsArray = Array.from(remoteStreams.entries())

  return (
    <div className="flex h-full flex-col">
      {/* Zone de vidéo principale */}
      <div className="relative flex-1 bg-black">
        <div className={cn(
          "grid h-full gap-2 p-2",
          remoteStreamsArray.length === 0 ? "grid-cols-1" :
          remoteStreamsArray.length === 1 ? "grid-cols-2" :
          remoteStreamsArray.length <= 4 ? "grid-cols-2" :
          "grid-cols-3"
        )}>
          {/* Vidéo locale */}
          <Card className="relative overflow-hidden bg-black">
            <CardContent className="p-0">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-lg bg-black/60 px-2 py-1">
                <span className="text-xs text-white">{userName}</span>
                {!isVideoEnabled && (
                  <div className="flex size-8 items-center justify-center rounded-full bg-gray-700">
                    <span className="text-xs text-white">{userName.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                {!isAudioEnabled && <MicOff className="size-3 text-red-500" />}
                {isScreenSharing && <Monitor className="size-3 text-green-500" />}
              </div>
            </CardContent>
          </Card>

          {/* Vidéos distantes */}
          {remoteStreamsArray.map(([remoteUserId, stream]) => (
            <Card key={remoteUserId} className="relative overflow-hidden bg-black">
              <CardContent className="p-0">
                <video
                  ref={(el) => {
                    if (el) {
                      const newMap = new Map(remoteVideos)
                      newMap.set(remoteUserId, el)
                      setRemoteVideos(newMap)
                    }
                  }}
                  autoPlay
                  playsInline
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-lg bg-black/60 px-2 py-1">
                  <span className="text-xs text-white">Participant</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-lg bg-red-500 px-4 py-2 text-sm text-white">
            {error}
          </div>
        )}

        {!localStream && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white">
              <p className="mb-4 text-lg">Prêt à rejoindre la session vidéo</p>
              <Button onClick={handleJoin} className="gap-2">
                <Video className="size-4" />
                Rejoindre avec caméra et micro
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Barre de contrôles */}
      <div className="border-t border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={isAudioEnabled ? "default" : "destructive"}
              size="sm"
              onClick={toggleAudio}
              className="gap-2"
            >
              {isAudioEnabled ? <Mic className="size-4" /> : <MicOff className="size-4" />}
              {isAudioEnabled ? "Micro" : "Micro coupé"}
            </Button>
            <Button
              variant={isVideoEnabled ? "default" : "destructive"}
              size="sm"
              onClick={toggleVideo}
              className="gap-2"
            >
              {isVideoEnabled ? <Video className="size-4" /> : <VideoOff className="size-4" />}
              {isVideoEnabled ? "Caméra" : "Caméra coupée"}
            </Button>
            <Button
              variant={isScreenSharing ? "default" : "outline"}
              size="sm"
              onClick={isScreenSharing ? stopScreenShare : startScreenShare}
              className="gap-2"
            >
              {isScreenSharing ? <MonitorOff className="size-4" /> : <Monitor className="size-4" />}
              {isScreenSharing ? "Arrêter le partage" : "Partager l'écran"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowParticipants(!showParticipants)}
              className="gap-2"
            >
              <Users className="size-4" />
              Participants ({remoteStreamsArray.length + 1})
            </Button>
          </div>
          <Button variant="destructive" size="sm" onClick={handleLeave} className="gap-2">
            <PhoneOff className="size-4" />
            Quitter
          </Button>
        </div>
      </div>

      {/* Panneau des participants */}
      {showParticipants && (
        <div className="absolute right-4 top-4 w-64 rounded-lg border border-border bg-card shadow-lg">
          <div className="border-b border-border p-3">
            <h3 className="font-semibold">Participants ({remoteStreamsArray.length + 1})</h3>
          </div>
          <ScrollArea className="max-h-64">
            <div className="p-2 space-y-2">
              <div className="flex items-center justify-between rounded-lg p-2 hover:bg-muted">
                <span className="text-sm">{userName}</span>
                <div className="flex items-center gap-1">
                  {isAudioEnabled ? <Mic className="size-3" /> : <MicOff className="size-3 text-red-500" />}
                  {isVideoEnabled ? <Video className="size-3" /> : <VideoOff className="size-3 text-red-500" />}
                  <Badge variant="secondary" className="text-xs">Vous</Badge>
                </div>
              </div>
              {remoteStreamsArray.map(([remoteUserId]) => (
                <div key={remoteUserId} className="flex items-center justify-between rounded-lg p-2 hover:bg-muted">
                  <span className="text-sm">Participant {remoteUserId.slice(0, 8)}</span>
                  <div className="flex items-center gap-1">
                    {userRole === "teacher" && (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Settings className="size-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

