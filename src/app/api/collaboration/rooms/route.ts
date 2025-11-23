import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { ObjectId } from "mongodb"

import { authOptions } from "@/lib/auth"
import {
  addCollaborationMessage,
  createBreakoutGroup,
  createCollaborationRoom,
  createScreenShare,
  ensureCollaborationIndexes,
  joinCollaborationRoom,
  requestJoinCollaborationRoom,
  approveJoinRequest,
  rejectJoinRequest,
  listCollaborationRooms,
  seedSampleCollaborationRooms,
  getCollaborationMessages,
  getBreakoutGroups,
  updateBreakoutGroup,
  deleteBreakoutGroup,
} from "@/lib/collaboration-db"
import { getSampleRooms } from "@/lib/data/collaboration"
import { getDatabase } from "@/lib/mongodb"

/**
 * Convertit un _id (ObjectId ou string) en chaîne de caractères de manière sécurisée
 */
function idToString(id: ObjectId | string | undefined | null): string {
  if (!id) {
    return ""
  }
  if (typeof id === "string") {
    return id
  }
  if (id && typeof id === "object" && "toHexString" in id && typeof id.toHexString === "function") {
    return id.toHexString()
  }
  // Fallback: convertir en chaîne
  return String(id)
}

const createRoomSchema = z.object({
  title: z.string().min(4),
  simulationId: z.string().min(2),
  ownerId: z.string().min(1),
  ownerName: z.string().min(1),
  active: z.boolean().default(true), // Par défaut, la salle est active (live)
})

const joinSchema = z.object({
  userId: z.string().min(1),
  name: z.string().min(1),
  role: z.enum(["teacher", "student"]),
  status: z.enum(["online", "offline", "in-sim"]).default("online"),
})

const chatSchema = z.object({
  authorId: z.string().min(1),
  authorName: z.string().min(1),
  role: z.enum(["teacher", "student", "assistant"]).default("student"),
  message: z.string().min(1),
})

const screenShareSchema = z.object({
  ownerId: z.string().min(1),
  ownerName: z.string().min(1),
  type: z.enum(["simulation", "tableau", "resultats"]).default("simulation"),
  title: z.string().min(1),
  url: z.string().url(),
  active: z.boolean().default(true),
})

const breakoutSchema = z.object({
  name: z.string().min(1),
  participants: z.array(z.string().min(1)).min(1),
  active: z.boolean().default(true),
  voiceChannel: z.boolean().default(true),
})

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const roomId = searchParams.get("roomId")
  const action = searchParams.get("action")

  // Si on demande les messages d'une salle
  if (action === "messages" && roomId) {
    const messages = await getCollaborationMessages(roomId, 100)
    return NextResponse.json({ messages })
  }

  // Si on demande les groupes d'une salle
  if (action === "groups" && roomId) {
    const groups = await getBreakoutGroups(roomId)
    return NextResponse.json({ groups })
  }

  await ensureCollaborationIndexes()
  let rooms = await listCollaborationRooms()

  if (!rooms.length) {
    await seedSampleCollaborationRooms(getSampleRooms())
    rooms = await listCollaborationRooms()
  }

  return NextResponse.json({ rooms })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 })
  }

  // Seuls les enseignants et admins peuvent créer des salles
  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    return NextResponse.json({ message: "Accès refusé. Seuls les enseignants peuvent créer des salles." }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createRoomSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Les informations fournies ne sont pas valides.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  // Utiliser les informations de session pour le propriétaire
  const room = await createCollaborationRoom({
    ...parsed.data,
    ownerId: session.user.id || parsed.data.ownerId,
    ownerName: session.user.name || parsed.data.ownerName,
  })
  const rooms = await listCollaborationRooms()
  return NextResponse.json({ roomId: idToString(room._id), rooms }, { status: 201 })
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const roomId = searchParams.get("roomId")
  const action = searchParams.get("action")

  if (!roomId || !action) {
    return NextResponse.json({ message: "Paramètres roomId et action requis." }, { status: 400 })
  }

  const body = await request.json().catch(() => ({}))

  switch (action) {
    case "join": {
      const parsed = joinSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ message: "Informations utilisateur invalides.", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
      }
      // Utiliser les informations de session
      const userId = session.user.id || parsed.data.userId
      const userName = session.user.name || parsed.data.name
      const userRole = (session.user.role === "teacher" || session.user.role === "admin" ? "teacher" : "student") as "teacher" | "student"
      
      const result = await requestJoinCollaborationRoom(roomId, userId, userName, userRole)
      
      if (result.type === "request_created") {
        return NextResponse.json({ 
          message: "Demande de participation envoyée. En attente d'approbation.",
          requestId: idToString(result.request._id),
          status: "pending"
        })
      } else if (result.type === "pending_request") {
        return NextResponse.json({ 
          message: "Vous avez déjà une demande en attente.",
          requestId: idToString(result.request._id),
          status: "pending"
        })
      } else if (result.type === "already_member") {
        return NextResponse.json({ 
          message: "Vous êtes déjà membre de cette salle.",
          status: "member"
        })
      }
      // result.type === "joined" - continuer normalement
      break
    }
    case "approve-request": {
      if (session.user.role !== "teacher" && session.user.role !== "admin") {
        return NextResponse.json({ message: "Accès refusé. Seuls les enseignants peuvent approuver les demandes." }, { status: 403 })
      }
      const { requestId } = body
      if (!requestId) {
        return NextResponse.json({ message: "requestId requis." }, { status: 400 })
      }
      await approveJoinRequest(roomId, requestId, session.user.id || session.user.email || "")
      return NextResponse.json({ message: "Demande approuvée." })
    }
    case "reject-request": {
      if (session.user.role !== "teacher" && session.user.role !== "admin") {
        return NextResponse.json({ message: "Accès refusé. Seuls les enseignants peuvent refuser les demandes." }, { status: 403 })
      }
      const { requestId } = body
      if (!requestId) {
        return NextResponse.json({ message: "requestId requis." }, { status: 400 })
      }
      await rejectJoinRequest(roomId, requestId, session.user.id || session.user.email || "")
      return NextResponse.json({ message: "Demande refusée." })
    }
    case "message": {
      const parsed = chatSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ message: "Message invalide.", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
      }
      
      // Vérifier que l'utilisateur est membre approuvé de la salle
      const db = await getDatabase()
      const roomObjectId = new ObjectId(roomId)
      const member = await db.collection("collaboration_room_members").findOne({
        roomId: roomObjectId,
        userId: session.user.id || parsed.data.authorId,
        approved: true,
      })
      
      if (!member) {
        return NextResponse.json({ message: "Vous devez être membre approuvé de cette salle pour envoyer des messages." }, { status: 403 })
      }
      
      // Utiliser les informations de session
      const savedMessage = await addCollaborationMessage(roomId, {
        ...parsed.data,
        authorId: session.user.id || parsed.data.authorId,
        authorName: session.user.name || parsed.data.authorName,
        role: (session.user.role === "teacher" || session.user.role === "admin" ? "teacher" : "student") as "teacher" | "student" | "assistant",
      })
      
      // Retourner le message sauvegardé avec son ID pour que le client puisse le mettre à jour
      return NextResponse.json({
        message: {
          id: idToString(savedMessage._id),
          authorId: savedMessage.authorId,
          authorName: savedMessage.authorName,
          role: savedMessage.role,
          message: savedMessage.message,
          timestamp: savedMessage.createdAt.toISOString(),
        },
      })
    }
    case "screenshare": {
      const parsed = screenShareSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ message: "Partage d'écran invalide.", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
      }
      // Utiliser les informations de session
      await createScreenShare(roomId, {
        ...parsed.data,
        ownerId: session.user.id || parsed.data.ownerId,
        ownerName: session.user.name || parsed.data.ownerName,
      })
      break
    }
    case "breakout": {
      // Seuls les enseignants peuvent créer des groupes
      if (session.user.role !== "teacher" && session.user.role !== "admin") {
        return NextResponse.json({ message: "Accès refusé. Seuls les enseignants peuvent créer des groupes." }, { status: 403 })
      }
      const parsed = breakoutSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ message: "Configuration de groupe invalide.", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
      }
      const group = await createBreakoutGroup(roomId, parsed.data)
      return NextResponse.json({
        group: {
          id: idToString(group._id),
          name: group.name,
          participants: group.participants,
          active: group.active,
          voiceChannel: group.voiceChannel,
        },
      })
    }
    case "update-breakout": {
      // Seuls les enseignants peuvent modifier des groupes
      if (session.user.role !== "teacher" && session.user.role !== "admin") {
        return NextResponse.json({ message: "Accès refusé. Seuls les enseignants peuvent modifier des groupes." }, { status: 403 })
      }
      const { groupId, ...updates } = body
      if (!groupId) {
        return NextResponse.json({ message: "groupId requis." }, { status: 400 })
      }
      const parsed = breakoutSchema.partial().safeParse(updates)
      if (!parsed.success) {
        return NextResponse.json({ message: "Données invalides.", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
      }
      const group = await updateBreakoutGroup(groupId, parsed.data)
      return NextResponse.json({
        group: {
          id: idToString(group._id),
          name: group.name,
          participants: group.participants,
          active: group.active,
          voiceChannel: group.voiceChannel,
        },
      })
    }
    case "delete-breakout": {
      // Seuls les enseignants peuvent supprimer des groupes
      if (session.user.role !== "teacher" && session.user.role !== "admin") {
        return NextResponse.json({ message: "Accès refusé. Seuls les enseignants peuvent supprimer des groupes." }, { status: 403 })
      }
      const { groupId } = body
      if (!groupId) {
        return NextResponse.json({ message: "groupId requis." }, { status: 400 })
      }
      await deleteBreakoutGroup(groupId)
      return NextResponse.json({ message: "Groupe supprimé avec succès." })
    }
    case "remove-member": {
      // Seuls les propriétaires et enseignants peuvent retirer des membres
      if (session.user.role !== "teacher" && session.user.role !== "admin") {
        return NextResponse.json({ message: "Accès refusé. Seuls les enseignants peuvent retirer des membres." }, { status: 403 })
      }
      const { memberId } = body
      if (!memberId) {
        return NextResponse.json({ message: "memberId requis." }, { status: 400 })
      }
      
      const db = await getDatabase()
      const roomObjectId = new ObjectId(roomId)
      
      // Vérifier que l'utilisateur est propriétaire ou enseignant de la salle
      const room = await db.collection("collaboration_rooms").findOne({ _id: roomObjectId })
      if (!room) {
        return NextResponse.json({ message: "Salle introuvable." }, { status: 404 })
      }
      
      const isOwner = room.ownerId === (session.user.id || session.user.email)
      const isTeacher = session.user.role === "teacher" || session.user.role === "admin"
      
      if (!isOwner && !isTeacher) {
        return NextResponse.json({ message: "Accès refusé. Vous devez être propriétaire ou enseignant de la salle." }, { status: 403 })
      }
      
      // Retirer le membre
      await db.collection("collaboration_room_members").deleteOne({
        roomId: roomObjectId,
        userId: memberId,
      })
      
      return NextResponse.json({ message: "Membre retiré avec succès." })
    }
    case "change-role": {
      // Seuls les propriétaires et enseignants peuvent changer les rôles
      if (session.user.role !== "teacher" && session.user.role !== "admin") {
        return NextResponse.json({ message: "Accès refusé. Seuls les enseignants peuvent changer les rôles." }, { status: 403 })
      }
      const { memberId, newRole } = body
      if (!memberId || !newRole) {
        return NextResponse.json({ message: "memberId et newRole requis." }, { status: 400 })
      }
      
      if (newRole !== "teacher" && newRole !== "student") {
        return NextResponse.json({ message: "newRole doit être 'teacher' ou 'student'." }, { status: 400 })
      }
      
      const db = await getDatabase()
      const roomObjectId = new ObjectId(roomId)
      
      // Vérifier que l'utilisateur est propriétaire ou enseignant de la salle
      const room = await db.collection("collaboration_rooms").findOne({ _id: roomObjectId })
      if (!room) {
        return NextResponse.json({ message: "Salle introuvable." }, { status: 404 })
      }
      
      const isOwner = room.ownerId === (session.user.id || session.user.email)
      const isTeacher = session.user.role === "teacher" || session.user.role === "admin"
      
      if (!isOwner && !isTeacher) {
        return NextResponse.json({ message: "Accès refusé. Vous devez être propriétaire ou enseignant de la salle." }, { status: 403 })
      }
      
      // Changer le rôle du membre
      await db.collection("collaboration_room_members").updateOne(
        {
          roomId: roomObjectId,
          userId: memberId,
        },
        {
          $set: {
            role: newRole,
            updatedAt: new Date(),
          },
        }
      )
      
      return NextResponse.json({ message: "Rôle modifié avec succès." })
    }
    case "add-note": {
      // Seuls les enseignants peuvent ajouter des notes
      if (session.user.role !== "teacher" && session.user.role !== "admin") {
        return NextResponse.json({ message: "Accès refusé. Seuls les enseignants peuvent ajouter des notes." }, { status: 403 })
      }
      
      const { note } = body
      if (!note || typeof note !== "string" || !note.trim()) {
        return NextResponse.json({ message: "Note requise et ne doit pas être vide." }, { status: 400 })
      }
      
      const db = await getDatabase()
      const roomObjectId = new ObjectId(roomId)
      
      // Vérifier que l'utilisateur est propriétaire ou enseignant membre de la salle
      const room = await db.collection("collaboration_rooms").findOne({ _id: roomObjectId })
      if (!room) {
        return NextResponse.json({ message: "Salle introuvable." }, { status: 404 })
      }
      
      const member = await db.collection("collaboration_room_members").findOne({
        roomId: roomObjectId,
        userId: session.user.id || session.user.email || "",
        role: { $in: ["teacher", "admin"] },
        approved: true,
      })
      
      if (!member && room.ownerId !== (session.user.id || session.user.email || "")) {
        return NextResponse.json({ message: "Accès refusé. Vous devez être enseignant de cette salle." }, { status: 403 })
      }
      
      // Ajouter la note
      await db.collection("collaboration_rooms").updateOne(
        { _id: roomObjectId },
        { 
          $push: { notes: note.trim() } as any,
          $set: { updatedAt: new Date() }
        }
      )
      
      return NextResponse.json({ message: "Note ajoutée avec succès." })
    }
    case "remove-note": {
      // Seuls les enseignants peuvent supprimer des notes
      if (session.user.role !== "teacher" && session.user.role !== "admin") {
        return NextResponse.json({ message: "Accès refusé. Seuls les enseignants peuvent supprimer des notes." }, { status: 403 })
      }
      
      const { noteIndex } = body
      if (typeof noteIndex !== "number" || noteIndex < 0) {
        return NextResponse.json({ message: "noteIndex requis et doit être un nombre positif." }, { status: 400 })
      }
      
      const db = await getDatabase()
      const roomObjectId = new ObjectId(roomId)
      
      // Vérifier que l'utilisateur est enseignant
      const member = await db.collection("collaboration_room_members").findOne({
        roomId: roomObjectId,
        userId: session.user.id || session.user.email || "",
        role: { $in: ["teacher", "admin"] },
        approved: true,
      })
      
      const room = await db.collection("collaboration_rooms").findOne({ _id: roomObjectId })
      if (!member && room?.ownerId !== (session.user.id || session.user.email || "")) {
        return NextResponse.json({ message: "Accès refusé. Vous devez être enseignant de cette salle." }, { status: 403 })
      }
      
      // Récupérer la salle pour vérifier l'index
      const currentRoom = await db.collection("collaboration_rooms").findOne({ _id: roomObjectId })
      if (!currentRoom || !currentRoom.notes || noteIndex >= currentRoom.notes.length) {
        return NextResponse.json({ message: "Note introuvable." }, { status: 404 })
      }
      
      // Supprimer la note à l'index spécifié
      const updatedNotes = [...currentRoom.notes]
      updatedNotes.splice(noteIndex, 1)
      
      await db.collection("collaboration_rooms").updateOne(
        { _id: roomObjectId },
        { 
          $set: { 
            notes: updatedNotes,
            updatedAt: new Date()
          }
        }
      )
      
      return NextResponse.json({ message: "Note supprimée avec succès." })
    }
    default:
      return NextResponse.json({ message: "Action inconnue." }, { status: 400 })
  }

  const rooms = await listCollaborationRooms()
  return NextResponse.json({ rooms })
}

