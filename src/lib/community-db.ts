import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import type { CommunityResponse } from "@/lib/data/community"

export type DbDiscussionThread = {
  _id: ObjectId
  title: string
  authorId: string
  authorName: string
  discipline: "physics" | "biology" | "electronics" | "informatics"
  disciplineLabel: string
  content: string
  preview: string
  tags: string[]
  upvotes: string[] // Array of user IDs who upvoted
  replies: number
  createdAt: Date
  updatedAt: Date
}

export type DbDiscussionReply = {
  _id: ObjectId
  threadId: ObjectId
  authorId: string
  authorName: string
  content: string
  upvotes: string[]
  createdAt: Date
  updatedAt: Date
}

export type DbCommunityProject = {
  _id: ObjectId
  title: string
  authorId: string
  authorName: string
  discipline: "physics" | "biology" | "electronics" | "informatics"
  disciplineLabel: string
  summary: string
  description?: string
  fileUrl?: string
  downloads: number
  peerReviews: number
  createdAt: Date
  updatedAt: Date
}

export type DbProjectComment = {
  _id: ObjectId
  projectId: ObjectId
  authorId: string
  authorName: string
  content: string
  rating: number // 1-5
  createdAt: Date
  updatedAt: Date
}

export type DbContest = {
  _id: ObjectId
  title: string
  description: string
  deadline: Date
  teamSize: { min: number; max: number }
  requirements: string[]
  prizes: string[]
  participants: string[] // Array of user IDs
  createdAt: Date
  updatedAt: Date
}

export type DbLeaderboardEntry = {
  _id: ObjectId
  teamId: string
  teamName: string
  projectTitle: string
  projectId: ObjectId
  score: number
  discipline: "physics" | "biology" | "electronics" | "informatics"
  disciplineLabel: string
  members: string[] // Array of user IDs
  createdAt: Date
  updatedAt: Date
}

// Indexes
export async function ensureCommunityIndexes() {
  const db = await getDatabase()
  await Promise.all([
    db.collection<DbDiscussionThread>("community_discussions").createIndex({ discipline: 1, createdAt: -1 }),
    db.collection<DbDiscussionThread>("community_discussions").createIndex({ authorId: 1 }),
    db.collection<DbDiscussionReply>("community_replies").createIndex({ threadId: 1, createdAt: 1 }),
    db.collection<DbCommunityProject>("community_projects").createIndex({ discipline: 1, createdAt: -1 }),
    db.collection<DbCommunityProject>("community_projects").createIndex({ authorId: 1 }),
    db.collection<DbProjectComment>("community_project_comments").createIndex({ projectId: 1, createdAt: -1 }),
    db.collection<DbContest>("community_contests").createIndex({ deadline: 1 }),
    db.collection<DbLeaderboardEntry>("community_leaderboard").createIndex({ score: -1, discipline: 1 }),
  ])
}

// Discussions
export async function listDiscussions(discipline?: string): Promise<DbDiscussionThread[]> {
  const db = await getDatabase()
  const query = discipline ? { discipline } : {}
  return db
    .collection<DbDiscussionThread>("community_discussions")
    .find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray()
}

export async function getDiscussion(threadId: string): Promise<DbDiscussionThread | null> {
  const db = await getDatabase()
  return db
    .collection<DbDiscussionThread>("community_discussions")
    .findOne({ _id: new ObjectId(threadId) })
}

export async function createDiscussion(data: {
  title: string
  authorId: string
  authorName: string
  discipline: "physics" | "biology" | "electronics" | "informatics"
  content: string
  tags: string[]
}): Promise<DbDiscussionThread> {
  const db = await getDatabase()
  const now = new Date()
  const disciplineLabels: Record<string, string> = {
    physics: "Physique",
    biology: "Biologie",
    electronics: "Électronique",
    informatics: "Informatique",
  }
  
  const thread: DbDiscussionThread = {
    _id: new ObjectId(),
    title: data.title,
    authorId: data.authorId,
    authorName: data.authorName,
    discipline: data.discipline,
    disciplineLabel: disciplineLabels[data.discipline] || data.discipline,
    content: data.content,
    preview: data.content.substring(0, 150) + (data.content.length > 150 ? "..." : ""),
    tags: data.tags,
    upvotes: [],
    replies: 0,
    createdAt: now,
    updatedAt: now,
  }
  
  await db.collection<DbDiscussionThread>("community_discussions").insertOne(thread)
  return thread
}

export async function upvoteDiscussion(threadId: string, userId: string): Promise<{ upvoted: boolean; upvotes: number }> {
  const db = await getDatabase()
  const threadObjectId = new ObjectId(threadId)
  
  const thread = await db.collection<DbDiscussionThread>("community_discussions").findOne({ _id: threadObjectId })
  if (!thread) {
    throw new Error("Discussion introuvable")
  }
  
  const hasUpvoted = thread.upvotes.includes(userId)
  
  if (hasUpvoted) {
    // Retirer le vote
    await db.collection<DbDiscussionThread>("community_discussions").updateOne(
      { _id: threadObjectId },
      { $pull: { upvotes: userId }, $set: { updatedAt: new Date() } }
    )
    return { upvoted: false, upvotes: thread.upvotes.length - 1 }
  } else {
    // Ajouter le vote
    await db.collection<DbDiscussionThread>("community_discussions").updateOne(
      { _id: threadObjectId },
      { $addToSet: { upvotes: userId }, $set: { updatedAt: new Date() } }
    )
    return { upvoted: true, upvotes: thread.upvotes.length + 1 }
  }
}

// Replies
export async function getDiscussionReplies(threadId: string): Promise<DbDiscussionReply[]> {
  const db = await getDatabase()
  return db
    .collection<DbDiscussionReply>("community_replies")
    .find({ threadId: new ObjectId(threadId) })
    .sort({ createdAt: 1 })
    .toArray()
}

export async function addDiscussionReply(data: {
  threadId: string
  authorId: string
  authorName: string
  content: string
}): Promise<DbDiscussionReply> {
  const db = await getDatabase()
  const now = new Date()
  
  const reply: DbDiscussionReply = {
    _id: new ObjectId(),
    threadId: new ObjectId(data.threadId),
    authorId: data.authorId,
    authorName: data.authorName,
    content: data.content,
    upvotes: [],
    createdAt: now,
    updatedAt: now,
  }
  
  await db.collection<DbDiscussionReply>("community_replies").insertOne(reply)
  
  // Mettre à jour le compteur de réponses
  await db.collection<DbDiscussionThread>("community_discussions").updateOne(
    { _id: new ObjectId(data.threadId) },
    { $inc: { replies: 1 }, $set: { updatedAt: now } }
  )
  
  return reply
}

// Projects
export async function listProjects(discipline?: string): Promise<DbCommunityProject[]> {
  const db = await getDatabase()
  const query = discipline ? { discipline } : {}
  return db
    .collection<DbCommunityProject>("community_projects")
    .find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray()
}

export async function getProject(projectId: string): Promise<DbCommunityProject | null> {
  const db = await getDatabase()
  return db
    .collection<DbCommunityProject>("community_projects")
    .findOne({ _id: new ObjectId(projectId) })
}

export async function createProject(data: {
  title: string
  authorId: string
  authorName: string
  discipline: "physics" | "biology" | "electronics" | "informatics"
  summary: string
  description?: string
  fileUrl?: string
}): Promise<DbCommunityProject> {
  const db = await getDatabase()
  const now = new Date()
  const disciplineLabels: Record<string, string> = {
    physics: "Physique",
    biology: "Biologie",
    electronics: "Électronique",
    informatics: "Informatique",
  }
  
  const project: DbCommunityProject = {
    _id: new ObjectId(),
    title: data.title,
    authorId: data.authorId,
    authorName: data.authorName,
    discipline: data.discipline,
    disciplineLabel: disciplineLabels[data.discipline] || data.discipline,
    summary: data.summary,
    description: data.description,
    fileUrl: data.fileUrl,
    downloads: 0,
    peerReviews: 0,
    createdAt: now,
    updatedAt: now,
  }
  
  await db.collection<DbCommunityProject>("community_projects").insertOne(project)
  return project
}

export async function incrementProjectDownloads(projectId: string): Promise<void> {
  const db = await getDatabase()
  await db.collection<DbCommunityProject>("community_projects").updateOne(
    { _id: new ObjectId(projectId) },
    { $inc: { downloads: 1 }, $set: { updatedAt: new Date() } }
  )
}

// Project Comments
export async function getProjectComments(projectId: string): Promise<DbProjectComment[]> {
  const db = await getDatabase()
  return db
    .collection<DbProjectComment>("community_project_comments")
    .find({ projectId: new ObjectId(projectId) })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray()
}

export async function addProjectComment(data: {
  projectId: string
  authorId: string
  authorName: string
  content: string
  rating: number
}): Promise<DbProjectComment> {
  const db = await getDatabase()
  const now = new Date()
  
  const comment: DbProjectComment = {
    _id: new ObjectId(),
    projectId: new ObjectId(data.projectId),
    authorId: data.authorId,
    authorName: data.authorName,
    content: data.content,
    rating: Math.max(1, Math.min(5, data.rating)), // Clamp between 1 and 5
    createdAt: now,
    updatedAt: now,
  }
  
  await db.collection<DbProjectComment>("community_project_comments").insertOne(comment)
  
  // Mettre à jour le compteur de peer reviews
  await db.collection<DbCommunityProject>("community_projects").updateOne(
    { _id: new ObjectId(data.projectId) },
    { $inc: { peerReviews: 1 }, $set: { updatedAt: now } }
  )
  
  return comment
}

// Contests
export async function listContests(): Promise<DbContest[]> {
  const db = await getDatabase()
  return db
    .collection<DbContest>("community_contests")
    .find({ deadline: { $gte: new Date() } }) // Only active contests
    .sort({ deadline: 1 })
    .toArray()
}

export async function joinContest(contestId: string, userId: string): Promise<void> {
  const db = await getDatabase()
  await db.collection<DbContest>("community_contests").updateOne(
    { _id: new ObjectId(contestId) },
    { $addToSet: { participants: userId }, $set: { updatedAt: new Date() } }
  )
}

// Leaderboard
export async function getLeaderboard(discipline?: string): Promise<DbLeaderboardEntry[]> {
  const db = await getDatabase()
  const query = discipline ? { discipline } : {}
  return db
    .collection<DbLeaderboardEntry>("community_leaderboard")
    .find(query)
    .sort({ score: -1 })
    .limit(20)
    .toArray()
}

export async function addLeaderboardEntry(data: {
  teamId: string
  teamName: string
  projectTitle: string
  projectId: string
  score: number
  discipline: "physics" | "biology" | "electronics" | "informatics"
  members: string[]
}): Promise<DbLeaderboardEntry> {
  const db = await getDatabase()
  const now = new Date()
  const disciplineLabels: Record<string, string> = {
    physics: "Physique",
    biology: "Biologie",
    electronics: "Électronique",
    informatics: "Informatique",
  }
  
  const entry: DbLeaderboardEntry = {
    _id: new ObjectId(),
    teamId: data.teamId,
    teamName: data.teamName,
    projectTitle: data.projectTitle,
    projectId: new ObjectId(data.projectId),
    score: data.score,
    discipline: data.discipline,
    disciplineLabel: disciplineLabels[data.discipline] || data.discipline,
    members: data.members,
    createdAt: now,
    updatedAt: now,
  }
  
  await db.collection<DbLeaderboardEntry>("community_leaderboard").insertOne(entry)
  return entry
}

