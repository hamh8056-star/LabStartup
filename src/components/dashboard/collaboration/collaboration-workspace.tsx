"use client"

import { useMemo, useState, useTransition, useEffect } from "react"
import {
  Headphones,
  Loader2,
  Mic,
  Monitor,
  Rocket,
  Share2,
  Users,
  Video,
  Plus,
  X,
  MessageSquare,
  Clock,
  Calendar,
  Settings,
  UserPlus,
  FileText,
  History,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  UserMinus,
  UserCog,
  Eye,
  Ban,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import useSWR from "swr"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

import type { CollaborationRoom } from "@/lib/data/collaboration"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { VirtualClassroom } from "@/components/collaboration/virtual-classroom"
import { ChatPanel } from "@/components/collaboration/chat-panel"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then(res => res.json())

type Props = {
  rooms: CollaborationRoom[]
}

const simulationOptions = [
  { value: "sim-quantum-diffraction", label: "Diffraction quantique" },
  { value: "sim-bio-cell", label: "Cellules animales" },
  { value: "sim-physics-optics", label: "Optique physique" },
  { value: "sim-chemistry-reaction", label: "Réactions chimiques" },
  { value: "sim-electronics-circuit", label: "Circuits électroniques" },
]

export function CollaborationWorkspace({ rooms }: Props) {
  const { data: session } = useSession()
  const currentUser = useMemo(() => {
    const user = session?.user as { id?: string; role?: string; email?: string; name?: string } | undefined
    return {
      id: user?.id ?? user?.email ?? "guest",
      name: user?.name ?? user?.email ?? "Utilisateur",
      role: (user?.role as "teacher" | "student" | "admin" | undefined) ?? "student",
    }
  }, [session])

  const canCreateRoom = currentUser.role === "teacher" || currentUser.role === "admin"

  const { data, mutate } = useSWR<{ rooms: CollaborationRoom[] }>("/api/collaboration/rooms", fetcher, {
    fallbackData: { rooms },
    refreshInterval: 5000, // Rafraîchissement toutes les 5 secondes
  })

  const currentRooms = data?.rooms ?? rooms

  const [selectedRoomId, setSelectedRoomId] = useState<string>(currentRooms[0]?.id ?? "")
  const [isCreatingRoom, startCreatingRoom] = useTransition()
  const [isRemovingParticipant, startRemovingTransition] = useTransition()
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [openRemoveParticipantDialog, setOpenRemoveParticipantDialog] = useState(false)
  const [openPromoteDialog, setOpenPromoteDialog] = useState(false)
  const [selectedParticipant, setSelectedParticipant] = useState<{ id: string; name: string; role: string } | null>(null)
  const [newRoomData, setNewRoomData] = useState({
    title: "",
    simulationId: "",
    active: true, // Par défaut, la salle est "live" (active)
  })
  const [isInVideoRoom, setIsInVideoRoom] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "video">("grid")
  const [activeTab, setActiveTab] = useState<"overview" | "chat" | "screens" | "groups" | "notes" | "history">("overview")
  const [openGroupDialog, setOpenGroupDialog] = useState(false)
  const [editingGroup, setEditingGroup] = useState<{ id: string; name: string; participants: string[]; active: boolean; voiceChannel: boolean } | null>(null)
  const [groupFormData, setGroupFormData] = useState({
    name: "",
    participants: [] as string[],
    active: true,
    voiceChannel: true,
  })
  const [openDeleteGroupDialog, setOpenDeleteGroupDialog] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<{ id: string; name: string } | null>(null)
  const [newNote, setNewNote] = useState("")
  const [isAddingNote, startAddingNote] = useTransition()

  const effectiveSelectedRoomId = useMemo(() => {
    if (!currentRooms.length) return ""
    return selectedRoomId && currentRooms.some(room => room.id === selectedRoomId)
      ? selectedRoomId
      : currentRooms[0]?.id ?? ""
  }, [currentRooms, selectedRoomId])

  const selectedRoom = useMemo(
    () => currentRooms.find(room => room.id === effectiveSelectedRoomId),
    [currentRooms, effectiveSelectedRoomId],
  )

  const isMemberOfSelectedRoom = useMemo(() => {
    if (!selectedRoom || !session?.user) return false
    const member = selectedRoom.members.find(m => m.id === currentUser.id)
    return member !== undefined && (member.approved !== false) // Approuvé par défaut si non spécifié
  }, [selectedRoom, session, currentUser.id])

  const isOwner = useMemo(() => {
    if (!selectedRoom) return false
    return selectedRoom.ownerId === currentUser.id || selectedRoom.members.some(m => m.id === currentUser.id && m.role === "teacher")
  }, [selectedRoom, currentUser.id])

  const pendingRequests = selectedRoom?.pendingRequests || []
  const approvedMembers = selectedRoom?.members.filter(m => m.approved !== false) || []
  const hasPendingRequest = useMemo(() => {
    if (!selectedRoom || currentUser.role === "teacher" || currentUser.role === "admin") return false
    return pendingRequests.some(r => r.userId === currentUser.id)
  }, [selectedRoom, pendingRequests, currentUser.id, currentUser.role])

  const ensureAuthenticated = () => {
    if (!session?.user) {
      toast.error("Connectez-vous pour utiliser cette fonctionnalité.")
      return false
    }
    return true
  }

  const handleCreateRoom = () => {
    if (!ensureAuthenticated()) return
    if (!newRoomData.title.trim() || !newRoomData.simulationId) {
      toast.error("Veuillez remplir tous les champs.")
      return
    }

    startCreatingRoom(async () => {
      try {
        const response = await fetch("/api/collaboration/rooms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            title: newRoomData.title,
            simulationId: newRoomData.simulationId,
            ownerId: currentUser.id,
            ownerName: currentUser.name,
            active: newRoomData.active,
          }),
        })

        if (!response.ok) {
          const error = await response.json().catch(() => null)
          throw new Error(error?.message || "Erreur lors de la création de la salle")
        }

        const result = await response.json()
        toast.success("Salle créée avec succès")
        setOpenCreateDialog(false)
        setNewRoomData({ title: "", simulationId: "", active: true })
        setSelectedRoomId(result.roomId)
        await mutate()
      } catch (error) {
        console.error(error)
        toast.error(error instanceof Error ? error.message : "Impossible de créer la salle.")
      }
    })
  }

  const handleJoin = async () => {
    if (!ensureAuthenticated()) return
    if (!selectedRoom) return

    try {
      const response = await fetch(`/api/collaboration/rooms?action=join&roomId=${selectedRoom.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          name: currentUser.name,
          role: currentUser.role === "teacher" || currentUser.role === "admin" ? "teacher" : "student",
          status: "online",
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.message || "Erreur lors de la connexion")
      }

      const result = await response.json()
      
      if (result.status === "pending") {
        toast.info("Demande envoyée", {
          description: "Votre demande de participation est en attente d'approbation par l'enseignant.",
        })
      } else {
        toast.success("Vous avez rejoint la salle.")
      }
      
      await mutate()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Impossible de rejoindre la salle.")
    }
  }

  const handleApproveRequest = async (requestId: string) => {
    if (!selectedRoom) return

    try {
      const response = await fetch(`/api/collaboration/rooms?action=approve-request&roomId=${selectedRoom.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.message || "Erreur lors de l'approbation")
      }

      toast.success("Demande approuvée")
      await mutate()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Impossible d'approuver la demande.")
    }
  }

  const handleRejectRequest = async (requestId: string) => {
    if (!selectedRoom) return

    try {
      const response = await fetch(`/api/collaboration/rooms?action=reject-request&roomId=${selectedRoom.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.message || "Erreur lors du refus")
      }

      toast.success("Demande refusée")
      await mutate()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Impossible de refuser la demande.")
    }
  }

  const handleRemoveParticipantClick = (memberId: string, memberName: string, memberRole: string) => {
    setSelectedParticipant({ id: memberId, name: memberName, role: memberRole })
    setOpenRemoveParticipantDialog(true)
  }

  const handleRemoveParticipant = async () => {
    if (!selectedRoom || !selectedParticipant) return

    startRemovingTransition(async () => {
      try {
        const response = await fetch(`/api/collaboration/rooms?roomId=${selectedRoom.id}&action=remove-member`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: selectedParticipant.id }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Impossible de retirer le participant.")
        }

        toast.success(`${selectedParticipant.name} a été retiré de la salle.`)
        setOpenRemoveParticipantDialog(false)
        setSelectedParticipant(null)
        mutate() // Rafraîchir les données
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Impossible de retirer le participant.")
      }
    })
  }

  const handlePromoteClick = (memberId: string, memberName: string, memberRole: string) => {
    setSelectedParticipant({ id: memberId, name: memberName, role: memberRole })
    setOpenPromoteDialog(true)
  }

  const handleChangeRole = async () => {
    if (!selectedRoom || !selectedParticipant) return

    startRemovingTransition(async () => {
      try {
        const response = await fetch(`/api/collaboration/rooms?roomId=${selectedRoom.id}&action=change-role`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberId: selectedParticipant.id, newRole: "teacher" }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Impossible de changer le rôle.")
        }

        toast.success(`${selectedParticipant.name} a été promu en enseignant.`)
        setOpenPromoteDialog(false)
        setSelectedParticipant(null)
        mutate() // Rafraîchir les données
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Impossible de changer le rôle.")
      }
    })
  }

  const handleViewParticipant = (memberId: string) => {
    const member = selectedRoom?.members.find(m => m.id === memberId)
    if (!member) return
    
    toast.info(`${member.name} - ${member.role === "teacher" ? "Enseignant" : "Étudiant"} - ${member.status === "online" ? "En ligne" : member.status === "in-sim" ? "En simulation" : "Hors ligne"}`)
  }

  const handleAddNote = async () => {
    if (!selectedRoom || !newNote.trim()) return
    if (!isOwner) {
      toast.error("Seul l'enseignant peut ajouter des notes")
      return
    }

    startAddingNote(async () => {
      try {
        const response = await fetch(`/api/collaboration/rooms?roomId=${selectedRoom.id}&action=add-note`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: newNote.trim() }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || "Impossible d'ajouter la note.")
        }

        toast.success("Note ajoutée avec succès")
        setNewNote("")
        mutate() // Rafraîchir les données
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Impossible d'ajouter la note.")
      }
    })
  }

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return
    if (!ensureAuthenticated()) return
    if (!selectedRoom) return

    try {
      const response = await fetch(`/api/collaboration/rooms?action=message&roomId=${selectedRoom.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: currentUser.id,
          authorName: currentUser.name,
          role: currentUser.role === "teacher" || currentUser.role === "admin" ? "teacher" : "student",
          message: message,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.message || "Erreur lors de l'envoi")
      }

      await mutate()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Impossible d'envoyer le message.")
      throw error
    }
  }

  const handleOpenGroupDialog = (group?: { id: string; name: string; participants: string[]; active: boolean; voiceChannel: boolean }) => {
    if (group) {
      setEditingGroup(group)
      setGroupFormData({
        name: group.name,
        participants: group.participants,
        active: group.active,
        voiceChannel: group.voiceChannel,
      })
    } else {
      setEditingGroup(null)
      setGroupFormData({
        name: "",
        participants: [],
        active: true,
        voiceChannel: true,
      })
    }
    setOpenGroupDialog(true)
  }

  const handleSaveGroup = async () => {
    if (!ensureAuthenticated()) return
    if (!selectedRoom) return
    if (!groupFormData.name.trim()) {
      toast.error("Le nom du groupe est requis.")
      return
    }
    if (groupFormData.participants.length === 0) {
      toast.error("Sélectionnez au moins un participant.")
      return
    }

    try {
      if (editingGroup) {
        // Mettre à jour le groupe
        const response = await fetch(`/api/collaboration/rooms?action=update-breakout&roomId=${selectedRoom.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupId: editingGroup.id,
            ...groupFormData,
          }),
        })

        if (!response.ok) {
          const error = await response.json().catch(() => null)
          throw new Error(error?.message || "Erreur lors de la mise à jour")
        }

        toast.success("Groupe mis à jour", { description: `${groupFormData.name} a été modifié.` })
      } else {
        // Créer un nouveau groupe
        const response = await fetch(`/api/collaboration/rooms?action=breakout&roomId=${selectedRoom.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(groupFormData),
        })

        if (!response.ok) {
          const error = await response.json().catch(() => null)
          throw new Error(error?.message || "Erreur lors de la création")
        }

        toast.success("Groupe créé", { description: `${groupFormData.name} est prêt.` })
      }

      setOpenGroupDialog(false)
      await mutate()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Impossible de sauvegarder le groupe.")
    }
  }

  const handleDeleteGroupClick = (groupId: string, groupName: string) => {
    setGroupToDelete({ id: groupId, name: groupName })
    setOpenDeleteGroupDialog(true)
  }

  const handleConfirmDeleteGroup = async () => {
    if (!ensureAuthenticated()) return
    if (!selectedRoom || !groupToDelete) return

    try {
      const response = await fetch(`/api/collaboration/rooms?action=delete-breakout&roomId=${selectedRoom.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: groupToDelete.id }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.message || "Erreur lors de la suppression")
      }

      toast.success("Groupe supprimé", { description: `${groupToDelete.name} a été supprimé.` })
      setOpenDeleteGroupDialog(false)
      setGroupToDelete(null)
      await mutate()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Impossible de supprimer le groupe.")
    }
  }

  const handleAutoAssignGroups = () => {
    if (!selectedRoom) return

    const students = selectedRoom.members.filter(m => m.role === "student" && m.approved)
    if (students.length < 2) {
      toast.error("Pas assez d'étudiants pour créer des groupes.")
      return
    }

    const groupSize = 2 // Taille par défaut des groupes
    const numGroups = Math.ceil(students.length / groupSize)
    const shuffled = [...students].sort(() => Math.random() - 0.5)

    // Créer les groupes automatiquement
    const createGroups = async () => {
      for (let i = 0; i < numGroups; i++) {
        const start = i * groupSize
        const end = Math.min(start + groupSize, shuffled.length)
        const participants = shuffled.slice(start, end).map(s => s.id)

        try {
          await fetch(`/api/collaboration/rooms?action=breakout&roomId=${selectedRoom.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: `Groupe ${i + 1}`,
              participants,
              active: true,
              voiceChannel: true,
            }),
          })
        } catch (error) {
          console.error(`Erreur lors de la création du groupe ${i + 1}:`, error)
        }
      }

      toast.success(`${numGroups} groupes créés automatiquement`)
      await mutate()
    }

    createGroups()
  }

  const handleScreenShare = () => {
    if (!ensureAuthenticated()) return
    if (!selectedRoom) return

    const title = prompt("Titre du partage ?")
    if (!title) return
    const url = prompt("Lien ou ressource partagée ?")
    if (!url) return

    fetch(`/api/collaboration/rooms?action=screenshare&roomId=${selectedRoom.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerId: currentUser.id,
        ownerName: currentUser.name,
        type: "simulation",
        title,
        url,
        active: true,
      }),
    })
      .then(async response => {
        if (!response.ok) {
          const error = await response.json().catch(() => null)
          throw new Error(error?.message || "Erreur lors du partage")
        }
        toast.success("Partage enregistré.")
        await mutate()
      })
      .catch(error => {
        console.error(error)
        toast.error(error instanceof Error ? error.message : "Impossible de démarrer le partage.")
      })
  }

  // Mode classe virtuelle (fenêtre comme Zoom)
  if (isInVideoRoom && viewMode === "video") {
    return (
      <VirtualClassroom
        roomId={selectedRoom?.id || ""}
        userId={currentUser.id}
        userName={currentUser.name}
        userRole={currentUser.role === "teacher" || currentUser.role === "admin" ? "teacher" : "student"}
        onClose={() => {
          setIsInVideoRoom(false)
          setViewMode("grid")
        }}
      />
    )
  }

  if (!selectedRoom && currentRooms.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center space-y-4 rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-6">
        <Users className="size-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Aucune salle disponible. {canCreateRoom ? "Créez une nouvelle session de collaboration pour commencer." : "Attendez qu'un enseignant crée une salle."}
        </p>
        {canCreateRoom && (
          <Button onClick={() => setOpenCreateDialog(true)} className="gap-2">
            <Plus className="size-4" />
            Créer une salle
          </Button>
        )}
      </div>
    )
  }

  if (!selectedRoom) {
    return null
  }

  const onlineMembers = approvedMembers.filter(m => m.status === "online" || m.status === "in-sim")
  const offlineMembers = approvedMembers.filter(m => m.status === "offline")

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Panneau latéral - Liste des salles */}
        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Salles virtuelles</CardTitle>
              {canCreateRoom && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setOpenCreateDialog(true)}
                  className="gap-1"
                >
                  <Plus className="size-3.5" />
                  Nouvelle
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-280px)] pr-4">
              <div className="space-y-3">
                {currentRooms.map(room => {
                  const isSelected = room.id === effectiveSelectedRoomId
                  const isActive = room.active
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => {
                        setSelectedRoomId(room.id)
                        setActiveTab("overview")
                      }}
                      className={cn(
                        "w-full rounded-2xl border px-4 py-3 text-left transition hover:border-primary",
                        isSelected ? "border-primary bg-primary/10" : "border-border/60 bg-muted/20"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">{room.title}</p>
                        <Badge variant={isActive ? "default" : "outline"} className="text-xs">
                          {isActive ? "Live" : "Planifiée"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {room.members.length} participant{room.members.length > 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(room.startedAt), "PPPp", { locale: fr })}
                      </p>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
            {selectedRoom && (
              <div className="mt-4 space-y-2">
                <Button
                  onClick={handleJoin}
                  variant={isMemberOfSelectedRoom ? "secondary" : "default"}
                  size="sm"
                  className="w-full gap-2"
                  disabled={isMemberOfSelectedRoom}
                >
                  {isMemberOfSelectedRoom ? (
                    <>
                      <CheckCircle2 className="size-4" />
                      Déjà membre
                    </>
                  ) : (
                    <>
                      <UserPlus className="size-4" />
                      Rejoindre cette salle
                    </>
                  )}
                </Button>
                {isMemberOfSelectedRoom && approvedMembers.some(m => m.id === currentUser.id) && (
                  <Button
                    onClick={() => {
                      setIsInVideoRoom(true)
                      setViewMode("video")
                    }}
                    variant="default"
                    size="sm"
                    className="w-full gap-2"
                  >
                    <Video className="size-4" />
                    Lancer la classe virtuelle
                  </Button>
                )}
                {hasPendingRequest && (
                  <div className="rounded-lg border border-amber-500/50 bg-amber-500/5 p-3 text-center">
                    <Clock className="mx-auto mb-2 size-5 text-amber-500" />
                    <p className="text-xs text-muted-foreground">En attente d'approbation</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Zone principale - Détails de la salle */}
        <div className="space-y-6">
          {/* En-tête de la salle */}
          <Card className="border-border/60 bg-card/90">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl">{selectedRoom.title}</CardTitle>
                  <CardDescription className="mt-1">
                    Simulation {selectedRoom.simulationId} • Créée le {format(new Date(selectedRoom.startedAt), "PPP", { locale: fr })}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={selectedRoom.active ? "default" : "outline"} className="gap-1">
                    {selectedRoom.active ? (
                      <>
                        <PlayCircle className="size-3" />
                        En cours
                      </>
                    ) : (
                      <>
                        <PauseCircle className="size-3" />
                        Planifiée
                      </>
                    )}
                  </Badge>
                  {!isMemberOfSelectedRoom && !hasPendingRequest && (
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-2"
                      onClick={handleJoin}
                    >
                      <UserPlus className="size-4" />
                      Rejoindre cette salle
                    </Button>
                  )}
                  {hasPendingRequest && (
                    <Badge variant="outline" className="gap-2 border-amber-500/50 text-amber-600">
                      <Clock className="size-3" />
                      Demande en attente
                    </Badge>
                  )}
                  {isMemberOfSelectedRoom && approvedMembers.some(m => m.id === currentUser.id) && (
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        setIsInVideoRoom(true)
                        setViewMode("video")
                      }}
                    >
                      <Video className="size-4" />
                      Classe virtuelle
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Onglets de fonctionnalités */}
          <Card className="border-border/60 bg-card/90">
            <CardHeader>
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview" className="gap-2">
                    <Users className="size-4" />
                    Vue d'ensemble
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="gap-2">
                    <MessageSquare className="size-4" />
                    Chat
                  </TabsTrigger>
                  <TabsTrigger value="screens" className="gap-2">
                    <Monitor className="size-4" />
                    Partage
                  </TabsTrigger>
                  <TabsTrigger value="groups" className="gap-2">
                    <Users className="size-4" />
                    Groupes
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="gap-2">
                    <FileText className="size-4" />
                    Notes
                  </TabsTrigger>
                </TabsList>

                {/* Vue d'ensemble */}
                <TabsContent value="overview" className="mt-6 space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Participants</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{approvedMembers.length}</div>
                        <p className="text-xs text-muted-foreground">
                          {onlineMembers.length} en ligne
                          {pendingRequests.length > 0 && ` • ${pendingRequests.length} en attente`}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Messages</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedRoom.chatLog.length}</div>
                        <p className="text-xs text-muted-foreground">Dans le chat</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Partages</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{selectedRoom.screenShares.length}</div>
                        <p className="text-xs text-muted-foreground">Écrans partagés</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  {/* Bouton pour rejoindre (si pas encore membre) */}
                  {!isMemberOfSelectedRoom && !hasPendingRequest && (
                    <div className="mb-6">
                      <Card className="border-primary/50 bg-primary/5">
                        <CardContent className="p-6">
                          <div className="flex flex-col items-center justify-center gap-4 text-center">
                            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
                              <UserPlus className="size-8 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">Rejoindre cette salle de collaboration</h3>
                              <p className="mt-2 text-sm text-muted-foreground">
                                Cliquez sur le bouton ci-dessous pour demander à rejoindre cette salle. L'enseignant devra approuver votre demande.
                              </p>
                            </div>
                            <Button
                              onClick={handleJoin}
                              size="lg"
                              className="gap-2"
                            >
                              <UserPlus className="size-5" />
                              Rejoindre cette salle
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      <Separator className="my-6" />
                    </div>
                  )}

                  {/* Demandes en attente (pour les enseignants) */}
                  {isOwner && pendingRequests.length > 0 && (
                    <div className="mb-6">
                      <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
                        <Clock className="size-5 text-amber-500" />
                        Demandes en attente ({pendingRequests.length})
                      </h3>
                      <div className="space-y-2">
                        {pendingRequests.map((request) => (
                          <Card key={request.id} className="border-amber-500/50 bg-amber-500/5">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-600">
                                    {request.userName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">{request.userName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Demande le {format(new Date(request.requestedAt), "PPP 'à' p", { locale: fr })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleApproveRequest(request.id)}
                                    className="gap-2"
                                  >
                                    <CheckCircle2 className="size-4" />
                                    Approuver
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRejectRequest(request.id)}
                                    className="gap-2"
                                  >
                                    <X className="size-4" />
                                    Refuser
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <Separator className="my-6" />
                    </div>
                  )}

                  {/* Indicateur de demande en attente (pour les étudiants) */}
                  {hasPendingRequest && (
                    <div className="mb-6">
                      <Card className="border-amber-500/50 bg-amber-500/5">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Clock className="size-5 text-amber-500" />
                            <div>
                              <p className="text-sm font-medium">Demande en attente d'approbation</p>
                              <p className="text-xs text-muted-foreground">
                                Votre demande de participation a été envoyée. L'enseignant vous notifiera une fois approuvé.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Separator className="my-6" />
                    </div>
                  )}

                  {/* Liste des participants */}
                  <div>
                    <h3 className="mb-4 text-lg font-semibold">Participants ({approvedMembers.length})</h3>
                    <div className="space-y-3">
                      {approvedMembers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucun participant pour le moment.</p>
                      ) : (
                        <>
                          {onlineMembers.length > 0 && (
                            <div>
                              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">En ligne ({onlineMembers.length})</p>
                              <div className="space-y-2">
                                {onlineMembers.map((member) => (
                                  <div
                                    key={member.id}
                                    className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="relative">
                                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                          {member.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-background bg-green-500" />
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">{member.name}</p>
                                        <div className="flex items-center gap-2">
                                          <Badge variant={member.role === "teacher" ? "default" : "secondary"} className="text-xs">
                                            {member.role === "teacher" ? "Enseignant" : "Étudiant"}
                                          </Badge>
                                          <Badge variant="outline" className="text-xs">
                                            {member.status === "in-sim" ? "En simulation" : "En ligne"}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                    {isOwner && member.id !== currentUser.id && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" disabled={isRemovingParticipant}>
                                            <Settings className="size-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem onClick={() => handleViewParticipant(member.id)}>
                                            <Eye className="mr-2 size-4" />
                                            Voir les détails
                                          </DropdownMenuItem>
                                          {member.role === "student" && (
                                            <DropdownMenuItem onClick={() => handlePromoteClick(member.id, member.name, member.role)}>
                                              <UserCog className="mr-2 size-4" />
                                              Promouvoir en enseignant
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuItem 
                                            onClick={() => handleRemoveParticipantClick(member.id, member.name, member.role)}
                                            className="text-destructive focus:text-destructive"
                                          >
                                            <UserMinus className="mr-2 size-4" />
                                            Retirer de la salle
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {offlineMembers.length > 0 && (
                            <div>
                              <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">Hors ligne ({offlineMembers.length})</p>
                              <div className="space-y-2">
                                {offlineMembers.map((member) => (
                                  <div
                                    key={member.id}
                                    className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/10 p-3 opacity-60"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                        {member.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium">{member.name}</p>
                                        <Badge variant="outline" className="text-xs">
                                          {member.role === "teacher" ? "Enseignant" : "Étudiant"}
                                        </Badge>
                                      </div>
                                    </div>
                                    {isOwner && member.id !== currentUser.id && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" disabled={isRemovingParticipant}>
                                            <Settings className="size-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem onClick={() => handleViewParticipant(member.id)}>
                                            <Eye className="mr-2 size-4" />
                                            Voir les détails
                                          </DropdownMenuItem>
                                          {member.role === "student" && (
                                            <DropdownMenuItem onClick={() => handlePromoteClick(member.id, member.name, member.role)}>
                                              <UserCog className="mr-2 size-4" />
                                              Promouvoir en enseignant
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuItem 
                                            onClick={() => handleRemoveParticipantClick(member.id, member.name, member.role)}
                                            className="text-destructive focus:text-destructive"
                                          >
                                            <UserMinus className="mr-2 size-4" />
                                            Retirer de la salle
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Chat */}
                <TabsContent value="chat" className="mt-6">
                  {isMemberOfSelectedRoom ? (
                    <div className="h-[600px]">
                      <ChatPanel
                        roomId={selectedRoom.id}
                        userId={currentUser.id}
                        userName={currentUser.name}
                        userRole={currentUser.role === "teacher" || currentUser.role === "admin" ? "teacher" : "student"}
                        initialMessages={selectedRoom.chatLog.map(msg => ({
                          id: msg.id,
                          authorId: msg.authorId,
                          authorName: msg.authorName,
                          role: msg.role,
                          message: msg.message,
                          timestamp: msg.timestamp,
                        }))}
                        onSendMessage={handleSendMessage}
                      />
                    </div>
                  ) : (
                    <div className="flex h-[600px] items-center justify-center rounded-lg border border-dashed border-border/60">
                      <div className="text-center">
                        <MessageSquare className="mx-auto mb-4 size-12 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Rejoignez la salle pour accéder au chat</p>
                        <Button onClick={handleJoin} className="mt-4 gap-2">
                          <UserPlus className="size-4" />
                          Rejoindre la salle
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Partage d'écran */}
                <TabsContent value="screens" className="mt-6">
                  <div className="space-y-4">
                    {isMemberOfSelectedRoom && (
                      <Button onClick={handleScreenShare} className="gap-2" variant="outline">
                        <Monitor className="size-4" />
                        Partager un nouvel écran
                      </Button>
                    )}
                    {selectedRoom.screenShares.length === 0 ? (
                      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed border-border/60">
                        <div className="text-center">
                          <Monitor className="mx-auto mb-4 size-12 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Aucun écran partagé pour le moment.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {selectedRoom.screenShares.map((share, shareIndex) => (
                          <Card key={`share-${shareIndex}-${share.id}`} className="border-border/60">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{share.title}</CardTitle>
                                <Badge variant={share.active ? "default" : "outline"}>
                                  {share.active ? "En direct" : "Disponible"}
                                </Badge>
                              </div>
                              <CardDescription>
                                {share.ownerName} • {share.type === "simulation" ? "Simulation" : share.type === "resultats" ? "Résultats" : "Tableau"}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full gap-2"
                                onClick={() => {
                                  window.open(share.url, "_blank", "noopener,noreferrer")
                                }}
                              >
                                <Share2 className="size-4" />
                                Rejoindre le partage
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Groupes de travail */}
                <TabsContent value="groups" className="mt-6">
                  <div className="space-y-4">
                    {canCreateRoom && isMemberOfSelectedRoom && (
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => handleOpenGroupDialog()} className="gap-2" variant="outline">
                          <Users className="size-4" />
                          Créer un groupe
                        </Button>
                        <Button onClick={handleAutoAssignGroups} className="gap-2" variant="outline">
                          <Users className="size-4" />
                          Assigner automatiquement
                        </Button>
                      </div>
                    )}
                    {selectedRoom.breakoutGroups.length === 0 ? (
                      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed border-border/60">
                        <div className="text-center">
                          <Users className="mx-auto mb-4 size-12 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Aucun groupe configuré.
                          </p>
                          {canCreateRoom && isMemberOfSelectedRoom && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Créez un groupe ou assignez automatiquement les participants.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {selectedRoom.breakoutGroups.map((group, groupIndex) => (
                          <Card key={`group-${groupIndex}-${group.id}`} className="border-border/60">
                            <CardHeader>
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{group.name}</CardTitle>
                                <Badge variant={group.active ? "default" : "outline"}>
                                  {group.active ? "Actif" : "Inactif"}
                                </Badge>
                              </div>
                              <CardDescription>
                                {group.participants.length} participant{group.participants.length > 1 ? "s" : ""}
                                {group.voiceChannel && " • Canal vocal activé"}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div>
                                  <p className="mb-2 text-xs font-medium text-muted-foreground">Participants :</p>
                                  <div className="flex flex-wrap gap-2">
                                    {group.participants.map((participantId, participantIndex) => {
                                      const participant = selectedRoom.members.find(member => member.id === participantId)
                                      return participant ? (
                                        <Badge key={`participant-${participantIndex}-${participant.id}`} variant="outline">
                                          {participant.name}
                                        </Badge>
                                      ) : null
                                    })}
                                  </div>
                                </div>
                                {canCreateRoom && (
                                  <div className="flex gap-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="flex-1 gap-2"
                                      onClick={() => handleOpenGroupDialog(group)}
                                    >
                                      <Settings className="size-4" />
                                      Modifier
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      size="sm" 
                                      className="gap-2"
                                      onClick={() => handleDeleteGroupClick(group.id, group.name)}
                                    >
                                      <X className="size-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Notes partagées */}
                <TabsContent value="notes" className="mt-6">
                  <div className="space-y-4">
                    {/* Formulaire d'ajout de note (enseignant uniquement) */}
                    {isOwner && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Ajouter une note</CardTitle>
                          <CardDescription>
                            Les notes seront visibles par tous les participants de la salle
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="new-note">Nouvelle note</Label>
                            <Textarea
                              id="new-note"
                              placeholder="Saisissez votre note ou consigne..."
                              value={newNote}
                              onChange={(e) => setNewNote(e.target.value)}
                              className="min-h-[100px] resize-none"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                  e.preventDefault()
                                  handleAddNote()
                                }
                              }}
                            />
                          </div>
                          <Button
                            onClick={handleAddNote}
                            disabled={isAddingNote || !newNote.trim()}
                            className="w-full gap-2"
                          >
                            {isAddingNote ? (
                              <>
                                <Loader2 className="size-4 animate-spin" />
                                Ajout...
                              </>
                            ) : (
                              <>
                                <Plus className="size-4" />
                                Ajouter la note
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* Liste des notes */}
                    {selectedRoom.notes.length === 0 ? (
                      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed border-border/60">
                        <div className="text-center">
                          <FileText className="mx-auto mb-4 size-12 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            {isOwner 
                              ? "Aucune note partagée pour le moment. Ajoutez votre première note ci-dessus."
                              : "Aucune note partagée pour le moment."}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Card className="border-primary/30 bg-primary/5">
                        <CardHeader>
                          <CardTitle className="text-base">Notes partagées ({selectedRoom.notes.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-3">
                            {selectedRoom.notes.map((note, noteIndex) => (
                              <li key={`note-${noteIndex}`} className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-3">
                                <span className="mt-1 text-primary font-bold">•</span>
                                <span className="flex-1 text-sm">{note}</span>
                                {isOwner && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={async () => {
                                      try {
                                        const response = await fetch(`/api/collaboration/rooms?roomId=${selectedRoom.id}&action=remove-note`, {
                                          method: "PUT",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ noteIndex }),
                                        })
                                        if (!response.ok) throw new Error("Impossible de supprimer la note")
                                        toast.success("Note supprimée")
                                        mutate()
                                      } catch (error) {
                                        toast.error("Impossible de supprimer la note")
                                      }
                                    }}
                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  >
                                    <X className="size-3" />
                                  </Button>
                                )}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Dialog pour créer une nouvelle salle */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer une nouvelle salle de collaboration</DialogTitle>
            <DialogDescription>
              Créez une salle pour organiser une session de travail collaboratif avec vos étudiants.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="room-title">Titre de la salle *</Label>
              <Input
                id="room-title"
                placeholder="Ex: TP Physique quantique - Groupe A"
                value={newRoomData.title}
                onChange={e => setNewRoomData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room-simulation">Simulation associée *</Label>
              <Select
                value={newRoomData.simulationId}
                onValueChange={value => setNewRoomData(prev => ({ ...prev, simulationId: value }))}
              >
                <SelectTrigger id="room-simulation">
                  <SelectValue placeholder="Sélectionnez une simulation" />
                </SelectTrigger>
                <SelectContent>
                  {simulationOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="room-active" className="text-sm font-medium">Statut de la salle</Label>
                  <p className="text-xs text-muted-foreground">
                    {newRoomData.active 
                      ? "La salle sera active (Live) dès sa création" 
                      : "La salle sera planifiée et pourra être activée plus tard"}
                  </p>
                </div>
                <Switch
                  id="room-active"
                  checked={newRoomData.active}
                  onCheckedChange={(checked) => setNewRoomData(prev => ({ ...prev, active: checked }))}
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {newRoomData.active ? (
                  <>
                    <PlayCircle className="size-4 text-green-500" />
                    <span className="font-medium text-green-600">Classe Live (En cours)</span>
                  </>
                ) : (
                  <>
                    <PauseCircle className="size-4 text-amber-500" />
                    <span className="font-medium text-amber-600">Classe Planifiée</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreateDialog(false)} disabled={isCreatingRoom}>
              Annuler
            </Button>
            <Button onClick={handleCreateRoom} disabled={isCreatingRoom || !newRoomData.title.trim() || !newRoomData.simulationId}>
              {isCreatingRoom ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="mr-2 size-4" />
                  Créer la salle
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour créer/modifier un groupe */}
      <Dialog open={openGroupDialog} onOpenChange={setOpenGroupDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingGroup ? "Modifier le groupe" : "Créer un nouveau groupe"}</DialogTitle>
            <DialogDescription>
              {editingGroup 
                ? "Modifiez les paramètres du groupe de travail."
                : "Créez un groupe de travail pour organiser les participants en sous-groupes."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Nom du groupe *</Label>
              <Input
                id="group-name"
                placeholder="Ex: Groupe A, Binôme 1..."
                value={groupFormData.name}
                onChange={e => setGroupFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Participants *</Label>
              <div className="max-h-[300px] overflow-y-auto rounded-lg border border-border/60 p-3">
                {selectedRoom?.members.filter(m => m.approved).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun participant approuvé dans cette salle.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedRoom?.members.filter(m => m.approved).map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`participant-${member.id}`}
                          checked={groupFormData.participants.includes(member.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setGroupFormData(prev => ({
                                ...prev,
                                participants: [...prev.participants, member.id],
                              }))
                            } else {
                              setGroupFormData(prev => ({
                                ...prev,
                                participants: prev.participants.filter(id => id !== member.id),
                              }))
                            }
                          }}
                        />
                        <label
                          htmlFor={`participant-${member.id}`}
                          className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {member.name}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {member.role === "teacher" ? "Enseignant" : "Étudiant"}
                          </Badge>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
              <div className="space-y-0.5">
                <Label htmlFor="group-active" className="text-sm font-medium">Groupe actif</Label>
                <p className="text-xs text-muted-foreground">Le groupe est actif et peut être utilisé</p>
              </div>
              <Switch
                id="group-active"
                checked={groupFormData.active}
                onCheckedChange={checked => setGroupFormData(prev => ({ ...prev, active: checked }))}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
              <div className="space-y-0.5">
                <Label htmlFor="group-voice" className="text-sm font-medium">Canal vocal</Label>
                <p className="text-xs text-muted-foreground">Activer le canal vocal pour ce groupe</p>
              </div>
              <Switch
                id="group-voice"
                checked={groupFormData.voiceChannel}
                onCheckedChange={checked => setGroupFormData(prev => ({ ...prev, voiceChannel: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenGroupDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveGroup}>
              {editingGroup ? "Enregistrer les modifications" : "Créer le groupe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation pour supprimer un groupe */}
      <Dialog open={openDeleteGroupDialog} onOpenChange={setOpenDeleteGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le groupe</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le groupe <strong>&quot;{groupToDelete?.name}&quot;</strong> ?
              <br />
              <span className="mt-2 block text-xs text-muted-foreground">
                Cette action est irréversible. Les participants du groupe ne seront pas supprimés de la salle.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setOpenDeleteGroupDialog(false)
              setGroupToDelete(null)
            }}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteGroup}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation pour promouvoir un participant */}
      <Dialog open={openPromoteDialog} onOpenChange={setOpenPromoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promouvoir en enseignant</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir promouvoir <strong>&quot;{selectedParticipant?.name}&quot;</strong> en enseignant ?
              <br />
              <span className="mt-2 block text-xs text-muted-foreground">
                Cette personne pourra alors approuver les demandes de participation, créer des groupes et gérer les participants de cette salle.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setOpenPromoteDialog(false)
              setSelectedParticipant(null)
            }}>
              Annuler
            </Button>
            <Button onClick={handleChangeRole} disabled={isRemovingParticipant}>
              {isRemovingParticipant ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Promotion...
                </>
              ) : (
                <>
                  <UserCog className="mr-2 size-4" />
                  Promouvoir
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmation pour retirer un participant */}
      <Dialog open={openRemoveParticipantDialog} onOpenChange={setOpenRemoveParticipantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirer un participant</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir retirer <strong>&quot;{selectedParticipant?.name}&quot;</strong> de cette salle ?
              <br />
              <span className="mt-2 block text-xs text-muted-foreground">
                Cette action est irréversible. La personne devra faire une nouvelle demande pour rejoindre la salle.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setOpenRemoveParticipantDialog(false)
              setSelectedParticipant(null)
            }}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleRemoveParticipant} disabled={isRemovingParticipant}>
              {isRemovingParticipant ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Retrait...
                </>
              ) : (
                <>
                  <UserMinus className="mr-2 size-4" />
                  Retirer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
