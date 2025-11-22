import { NextResponse } from "next/server"

import { getLabs } from "@/lib/data/service"

export async function GET() {
  const labs = await getLabs()

  return NextResponse.json({
    data: labs,
  })
}

