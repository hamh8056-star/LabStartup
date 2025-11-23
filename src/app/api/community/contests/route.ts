import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { ObjectId } from "mongodb"

import { authOptions } from "@/lib/auth"
import { listContests, joinContest } from "@/lib/community-db"
import { ensureCommunityIndexes } from "@/lib/community-db"
import { getDatabase, dateToISOString } from "@/lib/mongodb"

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

export async function GET() {
  await ensureCommunityIndexes()
  const contests = await listContests()
  
  return NextResponse.json({
    contests: contests.map(c => ({
      id: idToString(c._id),
      title: c.title,
      description: c.description,
      deadline: dateToISOString(c.deadline),
      teamSize: c.teamSize,
      requirements: c.requirements,
      prizes: c.prizes,
      participants: c.participants.length,
    })),
  })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 })
  }

  const body = await request.json()
  const { contestId, action } = body

  if (action === "join" && contestId) {
    try {
      await joinContest(contestId, session.user.id || session.user.email || "")
      return NextResponse.json({ message: "Inscription réussie." })
    } catch (error) {
      return NextResponse.json(
        { message: "Erreur lors de l'inscription." },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ message: "Action inconnue." }, { status: 400 })
}

