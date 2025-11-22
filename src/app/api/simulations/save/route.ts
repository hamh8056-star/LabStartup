import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"

const saveSimulationStateSchema = z.object({
  simulationId: z.string().min(1),
  state: z.object({
    gravity: z.number(),
    temperature: z.number(),
    progress: z.number(),
    customNotes: z.string(),
    parameterValues: z.record(z.string(), z.number()),
    activeStageId: z.string().optional(),
    isRunning: z.boolean(),
  }),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Non authentifié." }, { status: 401 })
    }

    const body = await request.json()
    const parsed = saveSimulationStateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Données invalides.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const db = await getDatabase()
    const userId = session.user.id

    // Sauvegarder ou mettre à jour l'état de la simulation
    await db.collection("simulation_states").updateOne(
      {
        userId,
        simulationId: parsed.data.simulationId,
      },
      {
        $set: {
          userId,
          simulationId: parsed.data.simulationId,
          state: parsed.data.state,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    )

    return NextResponse.json({ message: "État de la simulation sauvegardé avec succès." })
  } catch (error) {
    console.error("[api/simulations/save] Error:", error)
    return NextResponse.json(
      { message: "Erreur lors de la sauvegarde.", error: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    )
  }
}

