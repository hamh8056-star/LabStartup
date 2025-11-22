import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { recordAuditLog } from "@/lib/security/audit"
import { getBlueprintById } from "@/lib/data/creator"

const publishSchema = z.object({
  id: z.string().min(3),
  target: z.array(z.string().min(1)).min(1),
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Non autorisé." }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = publishSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: "Requête invalide", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const blueprint = getBlueprintById(parsed.data.id)
  if (!blueprint) {
    return NextResponse.json({ message: "Expérience introuvable" }, { status: 404 })
  }

  await recordAuditLog({
    userId: session.user.id,
    email: session.user.email ?? null,
    action: "creator.publish",
    severity: "info",
    metadata: { blueprintId: parsed.data.id, target: parsed.data.target },
  })

  return NextResponse.json({
    message: "Expérience publiée dans la bibliothèque partagée.",
    blueprint,
  })
}




