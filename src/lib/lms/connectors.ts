import { getDatabase } from "@/lib/mongodb"

export type LmsPlatform = "moodle" | "google-classroom" | "teams" | "scorm"

export type LmsSyncPayload = {
  platform: LmsPlatform
  courseId: string
  courseName: string
  userId: string
  items: Array<{
    id: string
    title: string
    type: "simulation" | "quiz" | "resource"
    score?: number
    completed: boolean
    timestamp: string
  }>
}

export async function recordSyncAttempt(payload: LmsSyncPayload) {
  const db = await getDatabase()
  await db.collection("lms_logs").insertOne({
    ...payload,
    createdAt: new Date(),
  })
}

export async function simulateMoodleSync(payload: LmsSyncPayload) {
  await recordSyncAttempt(payload)
  return {
    status: "success",
    message: `Synchronisation Moodle pour le cours ${payload.courseName} prête à être publiée.`,
  }
}

export async function simulateGoogleClassroomSync(payload: LmsSyncPayload) {
  await recordSyncAttempt(payload)
  return {
    status: "partial",
    message: `Devoirs créés sur Google Classroom. ${payload.items.length} éléments en file d'attente.`,
  }
}

export async function generateScormPackage(courseName: string) {
  const blob = Buffer.from(`SCORM package for ${courseName} generated at ${new Date().toISOString()}`)
  return {
    fileName: `${courseName.replace(/\s+/g, "-").toLowerCase()}-taalimia.zip`,
    content: blob,
  }
}




