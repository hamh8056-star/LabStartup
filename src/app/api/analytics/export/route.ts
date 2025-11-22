import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { buildExportDataset } from "@/lib/data/analytics"
import { recordAuditLog } from "@/lib/security/audit"
import type { UserRole } from "@/lib/roles"

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non autorisé." }, { status: 401 })
  }

  if ((session.user.role as UserRole | undefined) === "student") {
    return NextResponse.json({ message: "Export réservé aux enseignants / administrateurs." }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const format = (searchParams.get("format") ?? "csv") as "csv" | "xlsx" | "pdf"

  const dataset = buildExportDataset(format)
  const buffer = Buffer.from(dataset.content)

  await recordAuditLog({
    userId: session.user.id,
    email: session.user.email ?? null,
    action: "analytics.export",
    severity: "warning",
    metadata: { format },
  })

  return NextResponse.json({
    fileName: dataset.fileName,
    mime: dataset.mime,
    base64: buffer.toString("base64"),
  })
}




