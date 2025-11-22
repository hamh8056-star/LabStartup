import { NextResponse } from "next/server"
import { z } from "zod"
import { createHash, randomBytes } from "crypto"

import { getDatabase } from "@/lib/mongodb"

const requestSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Adresse email invalide.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const db = await getDatabase()
  const usersCollection = db.collection("users")
  const resetsCollection = db.collection("password_resets")

  const user = await usersCollection.findOne({ email: parsed.data.email.toLowerCase() })

  if (!user) {
    // Ne pas divulguer l'existence de l'utilisateur
    return NextResponse.json({ message: "Si l'email existe, un lien de réinitialisation sera envoyé." })
  }

  const token = randomBytes(32).toString("hex")
  const tokenHash = createHash("sha256").update(token).digest("hex")
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60) // 1 heure

  await resetsCollection.deleteMany({ userId: user._id.toString() })
  await resetsCollection.insertOne({
    userId: user._id.toString(),
    tokenHash,
    expiresAt,
    createdAt: new Date(),
  })

  const resetUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/auth/reset-password?token=${token}`
  console.info(`[taalimia:reset-password] Lien de réinitialisation pour ${user.email}: ${resetUrl}`)

  return NextResponse.json({
    message: "Si l'email existe, un lien de réinitialisation sera envoyé.",
  })
}






