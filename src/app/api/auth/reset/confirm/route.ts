import { NextResponse } from "next/server"
import { createHash } from "crypto"
import { hash } from "bcryptjs"
import { z } from "zod"
import { ObjectId } from "mongodb"

import { getDatabase } from "@/lib/mongodb"

const confirmSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = confirmSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Les données fournies ne sont pas valides.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { token, password } = parsed.data

  const db = await getDatabase()
  const resetsCollection = db.collection("password_resets")
  const usersCollection = db.collection("users")

  const tokenHash = createHash("sha256").update(token).digest("hex")
  const resetRecord = await resetsCollection.findOne({ tokenHash })

  if (!resetRecord || (resetRecord.expiresAt && resetRecord.expiresAt < new Date())) {
    return NextResponse.json(
      { message: "Lien de réinitialisation invalide ou expiré." },
      { status: 400 },
    )
  }

  const hashedPassword = await hash(password, 12)

  await usersCollection.updateOne(
    { _id: new ObjectId(resetRecord.userId) },
    {
      $set: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    },
  )

  await resetsCollection.deleteMany({ userId: resetRecord.userId })

  return NextResponse.json({ message: "Mot de passe mis à jour." })
}






