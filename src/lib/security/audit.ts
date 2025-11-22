import type { Document, WithId } from "mongodb"

import { getDatabase } from "@/lib/mongodb"

type AuditLog = {
  userId?: string | null
  email?: string | null
  action: string
  severity: "info" | "warning" | "critical"
  metadata?: Record<string, unknown>
  createdAt: Date
}

export type AuditLogEntry = WithId<Document> & AuditLog

export async function recordAuditLog(entry: Omit<AuditLog, "createdAt">) {
  const db = await getDatabase()
  await db.collection<AuditLog>("audit_logs").insertOne({
    ...entry,
    createdAt: new Date(),
  })
}

export async function getRecentAuditLogs(limit = 20) {
  const db = await getDatabase()
  const logs = await db
    .collection<AuditLog>("audit_logs")
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()

  return logs
}




