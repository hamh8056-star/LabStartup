import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { revokeApiKey } from "@/lib/security/api-keys"
import type { UserRole } from "@/lib/roles"

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non autorisé." }, { status: 401 })
  }

  // Pour les admins, on peut révoquer n'importe quelle clé
  if (session.user.role === "admin") {
    const db = await import("@/lib/mongodb").then(m => m.getDatabase())
    const { ObjectId } = await import("mongodb")
    
    const key = await db.collection("api_keys").findOne({ _id: new ObjectId(id) })
    if (!key) {
      return NextResponse.json({ message: "Clé introuvable." }, { status: 404 })
    }

    await db.collection("api_keys").updateOne(
      { _id: new ObjectId(id) },
      { $set: { revokedAt: new Date() } }
    )

    await import("@/lib/security/audit").then(m => m.recordAuditLog({
      userId: session.user.id,
      email: session.user.email ?? null,
      action: `api_key.revoked (admin)`,
      severity: "warning",
      metadata: { keyId: id, keyName: key.name },
    }))

    return NextResponse.json({ revoked: true })
  }

  if ((session.user.role as UserRole | undefined) === "student") {
    return NextResponse.json({ message: "Accès réservé." }, { status: 403 })
  }

  const success = await revokeApiKey(session.user.id, id)
  if (!success) {
    return NextResponse.json({ message: "Clé introuvable." }, { status: 404 })
  }

  return NextResponse.json({ revoked: true })
}
