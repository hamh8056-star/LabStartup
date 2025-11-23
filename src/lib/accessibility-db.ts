import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export type AccessibilitySettings = {
  _id?: ObjectId
  userId: string
  language: "fr" | "en" | "ar"
  fontSize: "small" | "medium" | "large" | "xlarge"
  contrast: "normal" | "high" | "dark"
  reducedMotion: boolean
  screenReader: boolean
  keyboardNavigation: boolean
  colorBlindMode: "none" | "protanopia" | "deuteranopia" | "tritanopia"
  captions: boolean
  audioDescriptions: boolean
  offlineMode: boolean
  lmsIntegration?: {
    platform: "moodle" | "google-classroom" | "microsoft-teams" | "canvas" | "blackboard" | "other"
    apiKey?: string
    apiUrl?: string
    enabled: boolean
  }
  createdAt: Date
  updatedAt: Date
}

export async function getUserAccessibilitySettings(userId: string): Promise<AccessibilitySettings | null> {
  const db = await getDatabase()
  const settings = await db.collection<AccessibilitySettings>("accessibility_settings").findOne({ userId })
  return settings
}

export async function updateUserAccessibilitySettings(
  userId: string,
  updates: Partial<Omit<AccessibilitySettings, "_id" | "userId" | "createdAt" | "updatedAt">>
): Promise<AccessibilitySettings> {
  const db = await getDatabase()
  const now = new Date()
  
  const result = await db.collection<AccessibilitySettings>("accessibility_settings").findOneAndUpdate(
    { userId },
    {
      $set: {
        ...updates,
        updatedAt: now,
      },
      $setOnInsert: {
        userId,
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: "after" }
  )

  if (!result) {
    throw new Error("Failed to update accessibility settings")
  }

  return result
}



