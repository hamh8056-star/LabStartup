import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { ObjectId } from "mongodb"

import { authOptions } from "@/lib/auth"
import {
  ensureCommunityIndexes,
  listDiscussions,
  listProjects,
  getLeaderboard,
  listContests,
  getDiscussionReplies,
  getProjectComments,
} from "@/lib/community-db"
import { getCommunityData } from "@/lib/data/community"
import { getDatabase, dateToISOString } from "@/lib/mongodb"

/**
 * Convertit un _id (ObjectId ou string) en chaîne de caractères de manière sécurisée
 * Gère les cas où l'ObjectId peut être sérialisé/désérialisé par Next.js
 */
function idToString(id: ObjectId | string | undefined | null | any): string {
  if (!id) {
    return ""
  }
  if (typeof id === "string") {
    return id
  }
  // Handle MongoDB ObjectId instances
  if (id && typeof id === "object") {
    // Check if it's a MongoDB ObjectId with toHexString method
    if (typeof id.toHexString === "function") {
      try {
        return id.toHexString()
      } catch {
        // Fall through to other checks
      }
    }
    // Handle serialized ObjectId (from Next.js serialization)
    if (id.$oid) {
      return id.$oid
    }
    // Handle ObjectId-like objects with id property
    if (id.id && Buffer.isBuffer(id.id)) {
      return id.id.toString("hex")
    }
    // If it's already a string-like object, try to extract it
    if (id.toString && typeof id.toString === "function" && id.toString !== Object.prototype.toString) {
      const str = id.toString()
      // Check if it looks like a valid ObjectId hex string (24 hex characters)
      if (/^[0-9a-fA-F]{24}$/.test(str)) {
        return str
      }
    }
  }
  // Fallback: convertir en chaîne
  return String(id)
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  const { searchParams } = new URL(request.url)
  const discipline = searchParams.get("discipline") || undefined
  const threadId = searchParams.get("threadId")
  const projectId = searchParams.get("projectId")

  await ensureCommunityIndexes()

  // Si on demande les réponses d'une discussion
  if (threadId) {
    const replies = await getDiscussionReplies(threadId)
    return NextResponse.json({ 
      replies: replies.map(reply => ({
        id: idToString(reply._id),
        author: reply.authorName,
        content: reply.content,
        createdAt: dateToISOString(reply.createdAt),
        upvotes: reply.upvotes.length,
      }))
    })
  }

  // Si on demande les commentaires d'un projet
  if (projectId) {
    const comments = await getProjectComments(projectId)
    return NextResponse.json({ comments })
  }

  // Récupérer les données depuis la base de données
  const disciplineParam = discipline as "physics" | "biology" | "electronics" | "informatics" | undefined
  const [dbDiscussions, dbProjects, dbLeaderboard, dbContests] = await Promise.all([
    listDiscussions(disciplineParam),
    listProjects(disciplineParam),
    getLeaderboard(disciplineParam),
    listContests(),
  ])

  // Si pas de données en base, utiliser les données de fallback
  const fallbackData = getCommunityData()
  
  const discussions = dbDiscussions.length > 0
    ? dbDiscussions.map(d => ({
        id: idToString(d._id),
        title: d.title,
        author: d.authorName,
        discipline: d.discipline,
        disciplineLabel: d.disciplineLabel,
        createdAt: dateToISOString(d.createdAt),
        preview: d.preview,
        replies: d.replies,
        upvotes: d.upvotes.length,
        tags: d.tags,
      }))
    : fallbackData.discussions

  const projects = dbProjects.length > 0
    ? await Promise.all(
        dbProjects.map(async (p) => {
          const comments = await getProjectComments(idToString(p._id))
          return {
            id: idToString(p._id),
            title: p.title,
            disciplineLabel: p.disciplineLabel,
            author: p.authorName,
            publishedAt: dateToISOString(p.createdAt),
            summary: p.summary,
            downloads: p.downloads,
            peerReviews: p.peerReviews,
            comments: comments.map(c => ({
              id: idToString(c._id),
              author: c.authorName,
              content: c.content,
              rating: c.rating,
              createdAt: dateToISOString(c.createdAt),
            })),
          }
        })
      )
    : fallbackData.projects

  const leaderboard = dbLeaderboard.length > 0
    ? dbLeaderboard.map(l => ({
        teamId: l.teamId,
        teamName: l.teamName,
        projectTitle: l.projectTitle,
        score: l.score,
        disciplineLabel: l.disciplineLabel,
      }))
    : fallbackData.leaderboard

  const currentUserId = session?.user?.id || session?.user?.email || ""

  return NextResponse.json({
    discussions,
    projects,
    leaderboard,
    contests: dbContests.map(c => ({
      id: idToString(c._id),
      title: c.title || "Concours VR — Novembre 2024",
      description: c.description || "Thème : concevoir une expérience immersive simulant la photosynthèse. Prix : casque VR + certification.",
      deadline: dateToISOString(c.deadline),
      teamSize: c.teamSize,
      requirements: c.requirements,
      prizes: c.prizes,
      participants: c.participants.length,
      isJoined: currentUserId ? c.participants.includes(currentUserId) : false,
    })),
  })
}

