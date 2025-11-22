import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { generateApiKey, listApiKeys } from "@/lib/security/api-keys"
import type { UserRole } from "@/lib/roles"

const createSchema = z.object({
  name: z.string().min(3).max(64),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non autorisé." }, { status: 401 })
  }

  // Pour les admins, on récupère toutes les clés, sinon seulement celles de l'utilisateur
  if (session.user.role === "admin") {
    // Pour l'admin, on peut récupérer toutes les clés via la nouvelle fonction
    const db = await import("@/lib/mongodb").then(m => m.getDatabase())
    const keys = await db.collection("api_keys")
      .find({})
      .sort({ createdAt: -1 })
      .toArray()
    
    return NextResponse.json({
      keys: keys.map(key => ({
        id: key._id.toString(),
        name: key.name,
        prefix: key.prefix || key.hashedKey?.substring(0, 12) || "***",
        createdAt: key.createdAt.toISOString(),
        revokedAt: key.revokedAt ? key.revokedAt.toISOString() : null,
        lastUsedAt: key.lastUsedAt ? key.lastUsedAt.toISOString() : undefined,
      }))
    })
  }

  const keys = await listApiKeys(session.user.id)
  return NextResponse.json({ keys: keys.map(k => ({ ...k, prefix: "***" })) })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non autorisé." }, { status: 401 })
  }

  if ((session.user.role as UserRole | undefined) === "student") {
    return NextResponse.json({ message: "Accès réservé aux enseignants / administrateurs." }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = createSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ message: "Nom invalide", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const result = await generateApiKey(session.user.id, parsed.data.name)
  return NextResponse.json({ id: result.id, secret: result.secret })
}
