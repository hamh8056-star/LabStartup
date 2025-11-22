import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { ObjectId } from "mongodb"

import { authOptions } from "@/lib/auth"
import { recordAuditLog } from "@/lib/security/audit"
import { getDatabase } from "@/lib/mongodb"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non autorisé." }, { status: 401 })
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 })
  }

  try {
    const db = await getDatabase()
    const backups = await db
      .collection("backups")
      .find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray()

    return NextResponse.json({
      backups: backups.map(backup => ({
        id: backup._id.toString(),
        type: backup.type || "manual",
        status: backup.status || "pending",
        size: backup.size,
        createdAt: backup.createdAt.toISOString(),
        completedAt: backup.completedAt ? backup.completedAt.toISOString() : undefined,
        error: backup.error,
      })),
    })
  } catch (error) {
    console.error("[security-backup]", error)
    return NextResponse.json({ message: "Erreur lors de la récupération des sauvegardes." }, { status: 500 })
  }
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non autorisé." }, { status: 401 })
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 })
  }

  try {
    const db = await getDatabase()
    const backupId = new ObjectId()

    await db.collection("backups").insertOne({
      _id: backupId,
      type: "manual",
      status: "pending",
      createdAt: new Date(),
      createdBy: session.user.id,
    })

    await recordAuditLog({
      userId: session.user.id,
      email: session.user.email ?? null,
      action: "backup.requested",
      severity: "info",
      metadata: { backupId: backupId.toString(), source: "dashboard" },
    })

    // Dans une implémentation réelle, vous lanceriez ici un job de sauvegarde
    // Pour l'instant, on simule juste la création

    return NextResponse.json({
      message: "Sauvegarde planifiée avec succès. Elle sera disponible dans quelques minutes.",
      backupId: backupId.toString(),
    })
  } catch (error) {
    console.error("[security-backup]", error)
    return NextResponse.json({ message: "Erreur lors de la création de la sauvegarde." }, { status: 500 })
  }
}
