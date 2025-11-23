import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { getDatabase, dateToISOString } from "@/lib/mongodb"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 })
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 })
  }

  try {
    const db = await getDatabase()
    const apiKeysCollection = db.collection("api_keys")
    const auditLogsCollection = db.collection("audit_logs")
    const backupsCollection = db.collection("backups")

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [
      totalAPIKeys,
      activeAPIKeys,
      revokedAPIKeys,
      totalAuditLogs,
      criticalLogs,
      recentBackups,
      lastBackup,
    ] = await Promise.all([
      apiKeysCollection.countDocuments({}),
      apiKeysCollection.countDocuments({ revokedAt: null }),
      apiKeysCollection.countDocuments({ revokedAt: { $ne: null } }),
      auditLogsCollection.countDocuments({}),
      auditLogsCollection.countDocuments({ severity: "critical" }),
      backupsCollection.countDocuments({ status: "completed", createdAt: { $gte: sevenDaysAgo } }),
      backupsCollection.findOne({ status: "completed" }, { sort: { createdAt: -1 } }),
    ])

    return NextResponse.json({
      stats: {
        totalAPIKeys,
        activeAPIKeys,
        revokedAPIKeys,
        totalAuditLogs,
        criticalLogs,
        recentBackups,
        lastBackup: lastBackup?.completedAt ? dateToISOString(lastBackup.completedAt) : (lastBackup?.createdAt ? dateToISOString(lastBackup.createdAt) : undefined),
      },
    })
  } catch (error) {
    console.error("[security-stats]", error)
    return NextResponse.json({ message: "Erreur lors de la récupération des statistiques." }, { status: 500 })
  }
}
