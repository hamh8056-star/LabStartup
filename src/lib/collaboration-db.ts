import { ObjectId } from "mongodb"

import { getDatabase } from "@/lib/mongodb"
import type { CollaborationRoom as SampleRoom } from "@/lib/data/collaboration"

export type DbCollaborationRoom = {
  _id: ObjectId
  title: string
  simulationId: string
  ownerId: string
  active: boolean
  startedAt: Date
  notes: string[]
  createdAt: Date
  updatedAt: Date
}

export type DbCollaborationMember = {
  _id: ObjectId
  roomId: ObjectId
  userId: string
  name: string
  role: "student" | "teacher"
  status: "online" | "offline" | "in-sim"
  approved: boolean // Nouveau : si l'étudiant est approuvé
  createdAt: Date
  updatedAt: Date
}

export type DbCollaborationJoinRequest = {
  _id: ObjectId
  roomId: ObjectId
  userId: string
  userName: string
  userRole: "student" | "teacher"
  status: "pending" | "approved" | "rejected"
  requestedAt: Date
  reviewedAt?: Date
  reviewedBy?: string
}

export type DbCollaborationMessage = {
  _id: ObjectId
  roomId: ObjectId
  authorId: string
  authorName: string
  role: "teacher" | "student" | "assistant"
  message: string
  createdAt: Date
}

export type DbScreenShare = {
  _id: ObjectId
  roomId: ObjectId
  ownerId: string
  ownerName: string
  type: "simulation" | "tableau" | "resultats"
  title: string
  url: string
  active: boolean
  createdAt: Date
}

export type DbBreakoutGroup = {
  _id: ObjectId
  roomId: ObjectId
  name: string
  participants: string[]
  active: boolean
  voiceChannel: boolean
  createdAt: Date
  updatedAt: Date
}

export type CollaborationRoomDto = {
  id: string
  title: string
  simulationId: string
  active: boolean
  startedAt: string
  notes: string[]
  ownerId?: string
  members: { id: string; name: string; role: "student" | "teacher"; status: "online" | "offline" | "in-sim"; approved: boolean }[]
  pendingRequests: { id: string; userId: string; userName: string; userRole: "student" | "teacher"; requestedAt: string }[]
  chatLog: {
    id: string
    authorId: string
    authorName: string
    role: "teacher" | "student" | "assistant"
    message: string
    timestamp: string
  }[]
  screenShares: {
    id: string
    ownerId: string
    ownerName: string
    type: "simulation" | "tableau" | "resultats"
    title: string
    url: string
    active: boolean
  }[]
  breakoutGroups: {
    id: string
    name: string
    participants: string[]
    active: boolean
    voiceChannel: boolean
  }[]
}

export async function ensureCollaborationIndexes() {
  const db = await getDatabase()
  await Promise.all([
    db.collection<DbCollaborationRoom>("collaboration_rooms").createIndex({ ownerId: 1 }),
    db.collection<DbCollaborationMember>("collaboration_room_members").createIndex({ roomId: 1 }),
    db.collection<DbCollaborationMessage>("collaboration_messages").createIndex({ roomId: 1, createdAt: 1 }),
    db.collection<DbScreenShare>("collaboration_screen_shares").createIndex({ roomId: 1 }),
    db.collection<DbBreakoutGroup>("collaboration_groups").createIndex({ roomId: 1 }),
  ])
}

export async function listCollaborationRooms(): Promise<CollaborationRoomDto[]> {
  const db = await getDatabase()
  const rooms = await db
    .collection<DbCollaborationRoom>("collaboration_rooms")
    .find({})
    .sort({ updatedAt: -1 })
    .toArray()

  if (!rooms.length) {
    return []
  }

  const roomIds = rooms.map(room => room._id)

  const [members, messages, shares, groups, pendingRequests] = await Promise.all([
    db.collection<DbCollaborationMember>("collaboration_room_members").find({ roomId: { $in: roomIds } }).toArray(),
    db.collection<DbCollaborationMessage>("collaboration_messages").find({ roomId: { $in: roomIds } }).sort({ createdAt: 1 }).toArray(),
    db.collection<DbScreenShare>("collaboration_screen_shares").find({ roomId: { $in: roomIds } }).toArray(),
    db.collection<DbBreakoutGroup>("collaboration_groups").find({ roomId: { $in: roomIds } }).toArray(),
    db.collection<DbCollaborationJoinRequest>("collaboration_join_requests").find({ roomId: { $in: roomIds }, status: "pending" }).toArray(),
  ])

  const membersByRoom = new Map<string, DbCollaborationMember[]>()
  members.forEach(member => {
    const key = member.roomId.toHexString()
    if (!membersByRoom.has(key)) {
      membersByRoom.set(key, [])
    }
    membersByRoom.get(key)!.push(member)
  })

  const messagesByRoom = new Map<string, DbCollaborationMessage[]>()
  messages.forEach(message => {
    const key = message.roomId.toHexString()
    if (!messagesByRoom.has(key)) {
      messagesByRoom.set(key, [])
    }
    messagesByRoom.get(key)!.push(message)
  })

  const sharesByRoom = new Map<string, DbScreenShare[]>()
  shares.forEach(share => {
    const key = share.roomId.toHexString()
    if (!sharesByRoom.has(key)) {
      sharesByRoom.set(key, [])
    }
    sharesByRoom.get(key)!.push(share)
  })

  const groupsByRoom = new Map<string, DbBreakoutGroup[]>()
  groups.forEach(group => {
    const key = group.roomId.toHexString()
    if (!groupsByRoom.has(key)) {
      groupsByRoom.set(key, [])
    }
    groupsByRoom.get(key)!.push(group)
  })

  const requestsByRoom = new Map<string, DbCollaborationJoinRequest[]>()
  pendingRequests.forEach(request => {
    const key = request.roomId.toHexString()
    if (!requestsByRoom.has(key)) {
      requestsByRoom.set(key, [])
    }
    requestsByRoom.get(key)!.push(request)
  })

  return rooms.map(room => {
    const roomKey = room._id.toHexString()
    const roomMembers = membersByRoom.get(roomKey) ?? []
    const roomRequests = requestsByRoom.get(roomKey) ?? []
    
    return {
      id: roomKey,
      title: room.title,
      simulationId: room.simulationId,
      active: room.active,
      startedAt: room.startedAt.toISOString(),
      notes: room.notes,
      ownerId: room.ownerId,
      members: roomMembers.map(member => ({
        id: member.userId,
        name: member.name,
        role: member.role,
        status: member.status,
        approved: member.approved ?? true, // Par défaut approuvé pour rétrocompatibilité
      })),
      pendingRequests: roomRequests.map(request => ({
        id: request._id.toHexString(),
        userId: request.userId,
        userName: request.userName,
        userRole: request.userRole,
        requestedAt: request.requestedAt.toISOString(),
      })),
      chatLog: (messagesByRoom.get(roomKey) ?? []).map(message => ({
        id: message._id.toHexString(),
        authorId: message.authorId,
        authorName: message.authorName,
        role: message.role,
        message: message.message,
        timestamp: message.createdAt.toISOString(),
      })),
      screenShares: (sharesByRoom.get(roomKey) ?? []).map(share => ({
        id: share._id.toHexString(),
        ownerId: share.ownerId,
        ownerName: share.ownerName,
        type: share.type,
        title: share.title,
        url: share.url,
        active: share.active,
      })),
      breakoutGroups: (groupsByRoom.get(roomKey) ?? []).map(group => ({
        id: group._id.toHexString(),
        name: group.name,
        participants: group.participants,
        active: group.active,
        voiceChannel: group.voiceChannel,
      })),
    }
  })
}

export async function createCollaborationRoom(data: { title: string; simulationId: string; ownerId: string; ownerName: string; active?: boolean }) {
  const db = await getDatabase()
  const now = new Date()
  const room: DbCollaborationRoom = {
    _id: new ObjectId(),
    title: data.title,
    simulationId: data.simulationId,
    ownerId: data.ownerId,
    active: data.active ?? true, // Par défaut active si non spécifié
    startedAt: now,
    notes: [],
    createdAt: now,
    updatedAt: now,
  }

  await db.collection<DbCollaborationRoom>("collaboration_rooms").insertOne(room)
  await db.collection<DbCollaborationMember>("collaboration_room_members").insertOne({
    _id: new ObjectId(),
    roomId: room._id,
    userId: data.ownerId,
    name: data.ownerName,
    role: "teacher",
    status: "in-sim",
    approved: true, // Le propriétaire est toujours approuvé
    createdAt: now,
    updatedAt: now,
  })

  return room
}

export async function getCollaborationMessages(roomId: string, limit: number = 100) {
  const db = await getDatabase()
  const roomObjectId = new ObjectId(roomId)

  const messages = await db
    .collection<DbCollaborationMessage>("collaboration_messages")
    .find({ roomId: roomObjectId })
    .sort({ createdAt: 1 }) // Plus ancien en premier
    .limit(limit)
    .toArray()

  return messages.map((msg) => ({
    id: msg._id.toHexString(),
    authorId: msg.authorId,
    authorName: msg.authorName,
    role: msg.role,
    message: msg.message,
    timestamp: msg.createdAt.toISOString(),
  }))
}

export async function addCollaborationMessage(roomId: string, payload: Omit<DbCollaborationMessage, "_id" | "roomId" | "createdAt">) {
  const db = await getDatabase()
  const now = new Date()
  const doc: DbCollaborationMessage = {
    _id: new ObjectId(),
    roomId: new ObjectId(roomId),
    authorId: payload.authorId,
    authorName: payload.authorName,
    role: payload.role,
    message: payload.message,
    createdAt: now,
  }
  await db.collection<DbCollaborationMessage>("collaboration_messages").insertOne(doc)
  await db
    .collection<DbCollaborationRoom>("collaboration_rooms")
    .updateOne({ _id: new ObjectId(roomId) }, { $set: { updatedAt: now } })
  return doc
}

export async function requestJoinCollaborationRoom(roomId: string, userId: string, userName: string, userRole: "student" | "teacher") {
  const db = await getDatabase()
  const now = new Date()
  const roomObjectId = new ObjectId(roomId)

  // Vérifier si l'utilisateur est déjà membre
  const existingMember = await db.collection<DbCollaborationMember>("collaboration_room_members").findOne({
    roomId: roomObjectId,
    userId: userId,
  })

  if (existingMember) {
    // Si déjà membre et approuvé, retourner le membre
    if (existingMember.approved) {
      return { type: "already_member" as const, member: existingMember }
    }
    // Si déjà membre mais pas approuvé, retourner une demande existante
    const existingRequest = await db.collection<DbCollaborationJoinRequest>("collaboration_join_requests").findOne({
      roomId: roomObjectId,
      userId: userId,
      status: "pending",
    })
    if (existingRequest) {
      return { type: "pending_request" as const, request: existingRequest }
    }
  }

  // Si c'est un enseignant, rejoindre directement
  if (userRole === "teacher") {
    const doc: DbCollaborationMember = {
      _id: new ObjectId(),
      roomId: roomObjectId,
      userId: userId,
      name: userName,
      role: userRole,
      status: "online",
      approved: true, // Les enseignants sont toujours approuvés
      createdAt: now,
      updatedAt: now,
    }
    await db.collection<DbCollaborationMember>("collaboration_room_members").insertOne(doc)
    await db
      .collection<DbCollaborationRoom>("collaboration_rooms")
      .updateOne({ _id: roomObjectId }, { $set: { updatedAt: now } })
    return { type: "joined" as const, member: doc }
  }

  // Si c'est un étudiant, créer une demande d'approbation
  const request: DbCollaborationJoinRequest = {
    _id: new ObjectId(),
    roomId: roomObjectId,
    userId: userId,
    userName: userName,
    userRole: userRole,
    status: "pending",
    requestedAt: now,
  }

  // Vérifier si une demande existe déjà
  const existingRequest = await db.collection<DbCollaborationJoinRequest>("collaboration_join_requests").findOne({
    roomId: roomObjectId,
    userId: userId,
    status: "pending",
  })

  if (existingRequest) {
    return { type: "pending_request" as const, request: existingRequest }
  }

  await db.collection<DbCollaborationJoinRequest>("collaboration_join_requests").insertOne(request)
  await db
    .collection<DbCollaborationRoom>("collaboration_rooms")
    .updateOne({ _id: roomObjectId }, { $set: { updatedAt: now } })

  return { type: "request_created" as const, request }
}

export async function approveJoinRequest(roomId: string, requestId: string, reviewedBy: string) {
  const db = await getDatabase()
  const now = new Date()
  const roomObjectId = new ObjectId(roomId)
  const requestObjectId = new ObjectId(requestId)

  // Récupérer la demande
  const request = await db.collection<DbCollaborationJoinRequest>("collaboration_join_requests").findOne({
    _id: requestObjectId,
    roomId: roomObjectId,
    status: "pending",
  })

  if (!request) {
    throw new Error("Demande introuvable ou déjà traitée")
  }

  // Mettre à jour la demande
  await db.collection<DbCollaborationJoinRequest>("collaboration_join_requests").updateOne(
    { _id: requestObjectId },
    {
      $set: {
        status: "approved",
        reviewedAt: now,
        reviewedBy: reviewedBy,
      },
    }
  )

  // Créer ou mettre à jour le membre
  const existingMember = await db.collection<DbCollaborationMember>("collaboration_room_members").findOne({
    roomId: roomObjectId,
    userId: request.userId,
  })

  if (existingMember) {
    await db.collection<DbCollaborationMember>("collaboration_room_members").updateOne(
      { _id: existingMember._id },
      { $set: { approved: true, status: "online", updatedAt: now } }
    )
  } else {
    const member: DbCollaborationMember = {
      _id: new ObjectId(),
      roomId: roomObjectId,
      userId: request.userId,
      name: request.userName,
      role: request.userRole,
      status: "online",
      approved: true,
      createdAt: now,
      updatedAt: now,
    }
    await db.collection<DbCollaborationMember>("collaboration_room_members").insertOne(member)
  }

  await db
    .collection<DbCollaborationRoom>("collaboration_rooms")
    .updateOne({ _id: roomObjectId }, { $set: { updatedAt: now } })

  return { success: true }
}

export async function rejectJoinRequest(roomId: string, requestId: string, reviewedBy: string) {
  const db = await getDatabase()
  const now = new Date()
  const requestObjectId = new ObjectId(requestId)

  // Mettre à jour la demande
  await db.collection<DbCollaborationJoinRequest>("collaboration_join_requests").updateOne(
    { _id: requestObjectId },
    {
      $set: {
        status: "rejected",
        reviewedAt: now,
        reviewedBy: reviewedBy,
      },
    }
  )

  return { success: true }
}

// Fonction de compatibilité pour les appels existants
export async function joinCollaborationRoom(roomId: string, member: Omit<DbCollaborationMember, "_id" | "roomId" | "createdAt" | "updatedAt" | "approved">) {
  const result = await requestJoinCollaborationRoom(roomId, member.userId, member.name, member.role)
  
  if (result.type === "joined" || result.type === "already_member") {
    return result.member
  }
  
  // Si c'est une demande, retourner null (l'utilisateur devra attendre l'approbation)
  return null
}

export async function createScreenShare(roomId: string, payload: Omit<DbScreenShare, "_id" | "roomId" | "createdAt">) {
  const db = await getDatabase()
  const now = new Date()
  const doc: DbScreenShare = {
    _id: new ObjectId(),
    roomId: new ObjectId(roomId),
    ownerId: payload.ownerId,
    ownerName: payload.ownerName,
    type: payload.type,
    title: payload.title,
    url: payload.url,
    active: payload.active,
    createdAt: now,
  }
  await db.collection<DbScreenShare>("collaboration_screen_shares").insertOne(doc)
  return doc
}

export async function createBreakoutGroup(roomId: string, payload: Omit<DbBreakoutGroup, "_id" | "roomId" | "createdAt" | "updatedAt">) {
  const db = await getDatabase()
  const now = new Date()
  const doc: DbBreakoutGroup = {
    _id: new ObjectId(),
    roomId: new ObjectId(roomId),
    name: payload.name,
    participants: payload.participants,
    active: payload.active,
    voiceChannel: payload.voiceChannel,
    createdAt: now,
    updatedAt: now,
  }
  await db.collection<DbBreakoutGroup>("collaboration_groups").insertOne(doc)
  return doc
}

export async function getBreakoutGroups(roomId: string) {
  const db = await getDatabase()
  const roomObjectId = new ObjectId(roomId)
  const groups = await db
    .collection<DbBreakoutGroup>("collaboration_groups")
    .find({ roomId: roomObjectId })
    .sort({ createdAt: 1 })
    .toArray()
  
  return groups.map(group => ({
    id: group._id.toHexString(),
    name: group.name,
    participants: group.participants,
    active: group.active,
    voiceChannel: group.voiceChannel,
  }))
}

export async function updateBreakoutGroup(groupId: string, updates: Partial<Omit<DbBreakoutGroup, "_id" | "roomId" | "createdAt">>) {
  const db = await getDatabase()
  const groupObjectId = new ObjectId(groupId)
  const now = new Date()
  
  const updateData: any = { ...updates, updatedAt: now }
  
  const result = await db.collection<DbBreakoutGroup>("collaboration_groups").findOneAndUpdate(
    { _id: groupObjectId },
    { $set: updateData },
    { returnDocument: "after" }
  )
  
  if (!result) {
    throw new Error("Groupe introuvable")
  }
  
  return result
}

export async function deleteBreakoutGroup(groupId: string) {
  const db = await getDatabase()
  const groupObjectId = new ObjectId(groupId)
  
  const result = await db.collection<DbBreakoutGroup>("collaboration_groups").deleteOne({ _id: groupObjectId })
  
  if (result.deletedCount === 0) {
    throw new Error("Groupe introuvable")
  }
  
  return { success: true }
}

export async function seedSampleCollaborationRooms(samples: SampleRoom[]) {
  if (!samples.length) return
  const db = await getDatabase()
  const now = new Date()

  const roomCollection = db.collection<DbCollaborationRoom>("collaboration_rooms")
  const memberCollection = db.collection<DbCollaborationMember>("collaboration_room_members")
  const messageCollection = db.collection<DbCollaborationMessage>("collaboration_messages")
  const shareCollection = db.collection<DbScreenShare>("collaboration_screen_shares")
  const groupCollection = db.collection<DbBreakoutGroup>("collaboration_groups")

  for (const sample of samples) {
    const roomId = new ObjectId()
    await roomCollection.insertOne({
      _id: roomId,
      title: sample.title,
      simulationId: sample.simulationId,
      ownerId: sample.members.find(member => member.role === "teacher")?.id ?? "teacher",
      active: sample.active,
      startedAt: new Date(sample.startedAt),
      notes: sample.notes,
      createdAt: now,
      updatedAt: now,
    })

    if (sample.members?.length) {
      await memberCollection.insertMany(
        sample.members.map(member => ({
          _id: new ObjectId(),
          roomId,
          userId: member.id,
          name: member.name,
          role: member.role,
          status: member.status,
          createdAt: now,
          updatedAt: now,
        })),
      )
    }

    if (sample.chatLog?.length) {
      await messageCollection.insertMany(
        sample.chatLog.map(message => ({
          _id: new ObjectId(),
          roomId,
          authorId: message.authorId ?? message.authorName,
          authorName: message.authorName,
          role: message.role ?? "student",
          message: message.message,
          createdAt: new Date(message.timestamp),
        })),
      )
    }

    if (sample.screenShares?.length) {
      await shareCollection.insertMany(
        sample.screenShares.map(share => ({
          _id: new ObjectId(),
          roomId,
          ownerId: share.ownerId ?? share.ownerName,
          ownerName: share.ownerName,
          type: share.type,
          title: share.title,
          url: share.url,
          active: share.active,
          createdAt: now,
        })),
      )
    }

    if (sample.breakoutGroups?.length) {
      await groupCollection.insertMany(
        sample.breakoutGroups.map(group => ({
          _id: new ObjectId(),
          roomId,
          name: group.name,
          participants: group.participants,
          active: group.active,
          voiceChannel: group.voiceChannel,
          createdAt: now,
          updatedAt: now,
        })),
      )
    }
  }
}

