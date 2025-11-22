import { NextResponse } from "next/server"

import { searchGlossary } from "@/lib/resources-db"
import type { SimulationDiscipline } from "@/lib/data/seed"

function parseStringArray(params: URLSearchParams, key: string): string[] {
  const values = params.getAll(key)
  if (values.length > 0) {
    return values.flatMap(value => value.split(",")).map(value => value.trim()).filter(Boolean)
  }
  const single = params.get(key)
  return single ? single.split(",").map(value => value.trim()).filter(Boolean) : []
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q") ?? undefined
  const disciplineParam = (searchParams.get("discipline") ?? undefined) as SimulationDiscipline | "interdisciplinaire" | "all" | undefined
  const tags = parseStringArray(searchParams, "tag")

  const result = await searchGlossary({
    query,
    discipline: disciplineParam,
    tags: tags.length ? tags : undefined,
  })

  return NextResponse.json(result)
}
