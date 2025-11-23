import { randomBytes, createHash } from "crypto"
import type { ObjectId } from "mongodb"

import { getDatabase } from "@/lib/mongodb"
import { recordAuditLog } from "@/lib/security/audit"

export type ApiKeyDocument = {
  _id: ObjectId
  userId: string
  name: string
  hashedKey: string
  lastUsedAt?: Date | null
  createdAt: Date
  revokedAt?: Date | null
}

export type PublicApiKey = {
  id: string
  name: string
  createdAt: string
  lastUsedAt?: string | null
  revokedAt?: string | null
}

function hashKey(key: string) {
  return createHash("sha256").update(key).digest("hex")
}

export async function generateApiKey(userId: string, name: string) {
  const rawKey = `lab_${randomBytes(24).toString("hex")}`
  const db = await getDatabase()
  const doc: ApiKeyDocument = {
    _id: new (await import("mongodb")).ObjectId(),
    userId,
    name,
    hashedKey: hashKey(rawKey),
    createdAt: new Date(),
  }
  await db.collection<ApiKeyDocument>("api_keys").insertOne(doc)
  await recordAuditLog({
    userId,
    action: "api_key.created",
    severity: "info",
    metadata: { keyId: doc._id.toString(), name },
  })
  return { id: doc._id.toString(), secret: rawKey }
}

export async function listApiKeys(userId: string): Promise<PublicApiKey[]> {
  const db = await getDatabase()
  const keys = await db
    .collection<ApiKeyDocument>("api_keys")
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray()

  return keys.map(key => ({
    id: key._id.toString(),
    name: key.name,
    createdAt: key.createdAt.toISOString(),
    lastUsedAt: key.lastUsedAt ? key.lastUsedAt.toISOString() : null,
    revokedAt: key.revokedAt ? key.revokedAt.toISOString() : null,
  }))
}

export async function revokeApiKey(userId: string, keyId: string) {
  const db = await getDatabase()
  const { ObjectId } = await import("mongodb")
  const result = await db
    .collection<ApiKeyDocument>("api_keys")
    .findOneAndUpdate(
      { _id: new ObjectId(keyId), userId },
      { $set: { revokedAt: new Date() } },
      { returnDocument: "after" },
    )

  if (result) {
    await recordAuditLog({
      userId,
      action: "api_key.revoked",
      severity: "warning",
      metadata: { keyId, name: result.name },
    })
    return true
  }

  return false
}




