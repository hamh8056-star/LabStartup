import { NextResponse } from "next/server"

import { getSampleRooms } from "@/lib/data/collaboration"

export async function GET() {
  return NextResponse.json({
    data: getSampleRooms(),
  })
}

