import { NextResponse } from "next/server"
import { z } from "zod"

import { simulateMoodleSync, simulateGoogleClassroomSync, recordSyncAttempt, type LmsPlatform } from "@/lib/lms/connectors"

const syncSchema = z.object({
  platform: z.enum(["moodle", "google-classroom", "teams", "scorm"]),
  courseId: z.string().min(2),
  courseName: z.string().min(2),
  userId: z.string().min(2),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        type: z.enum(["simulation", "quiz", "resource"]),
        score: z.number().optional(),
        completed: z.boolean(),
        timestamp: z.string(),
      }),
    )
    .min(1),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const parsed = syncSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Payload invalide.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const payload = parsed.data
  let result: { status: string; message: string }

  switch (payload.platform as LmsPlatform) {
    case "moodle":
      result = await simulateMoodleSync(payload)
      break
    case "google-classroom":
      result = await simulateGoogleClassroomSync(payload)
      break
    case "teams":
      await recordSyncAttempt(payload)
      result = {
        status: "pending",
        message: "Connecteur Microsoft Teams en version bêta. Notre équipe vous contactera pour l'activation.",
      }
      break
    case "scorm":
      await recordSyncAttempt(payload)
      result = {
        status: "success",
        message: "Archive SCORM en cours de génération. Vous recevrez un lien de téléchargement par courriel.",
      }
      break
    default:
      result = { status: "error", message: "Plateforme non supportée." }
  }

  return NextResponse.json(result)
}




