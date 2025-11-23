import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { getUserAccessibilitySettings, updateUserAccessibilitySettings } from "@/lib/accessibility-db"

export const dynamic = "force-dynamic"

const updateSettingsSchema = z.object({
  language: z.enum(["fr", "en", "ar"]).optional(),
  fontSize: z.enum(["small", "medium", "large", "xlarge"]).optional(),
  contrast: z.enum(["normal", "high", "dark"]).optional(),
  reducedMotion: z.boolean().optional(),
  screenReader: z.boolean().optional(),
  keyboardNavigation: z.boolean().optional(),
  colorBlindMode: z.enum(["none", "protanopia", "deuteranopia", "tritanopia"]).optional(),
  captions: z.boolean().optional(),
  audioDescriptions: z.boolean().optional(),
  offlineMode: z.boolean().optional(),
  lmsIntegration: z.object({
    platform: z.enum(["moodle", "google-classroom", "microsoft-teams", "canvas", "blackboard", "other"]),
    apiKey: z.string().optional(),
    apiUrl: z.string().url().optional(),
    enabled: z.boolean(),
  }).optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 })
  }

  try {
    const settings = await getUserAccessibilitySettings(session.user.id)
    return NextResponse.json({ settings })
  } catch (error) {
    console.error("[accessibility-settings]", error)
    return NextResponse.json({ message: "Impossible de récupérer les paramètres." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 })
  }

  const body = await request.json()
  const parsed = updateSettingsSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Les données fournies sont invalides.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const settings = await updateUserAccessibilitySettings(session.user.id, parsed.data)
    return NextResponse.json({ settings })
  } catch (error) {
    console.error("[accessibility-settings]", error)
    return NextResponse.json({ message: "Impossible de mettre à jour les paramètres." }, { status: 500 })
  }
}



