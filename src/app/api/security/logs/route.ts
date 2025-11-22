import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { getRecentAuditLogs } from "@/lib/security/audit"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non autorisé." }, { status: 401 })
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get("limit") || "50", 10)
  const severity = searchParams.get("severity")

  try {
    const logs = await getRecentAuditLogs(limit)
    
    // Filtrer par sévérité si demandé
    const filteredLogs = severity
      ? logs.filter(log => log.severity === severity)
      : logs

    return NextResponse.json({
      logs: filteredLogs.map(log => ({
        id: log._id.toString(),
        action: log.action,
        severity: log.severity,
        metadata: log.metadata ?? {},
        userId: log.userId ?? null,
        email: log.email ?? null,
        createdAt: log.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("[security-logs]", error)
    return NextResponse.json({ message: "Erreur lors de la récupération des logs." }, { status: 500 })
  }
}
