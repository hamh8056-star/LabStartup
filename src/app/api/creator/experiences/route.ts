import { NextResponse } from "next/server"

import { getExperienceLibrary } from "@/lib/data/creator"

export async function GET() {
  const library = getExperienceLibrary()
  return NextResponse.json({ experiences: library })
}




