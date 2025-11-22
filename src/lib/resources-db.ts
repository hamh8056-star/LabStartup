import type { Filter } from "mongodb"

import { getDatabase } from "@/lib/mongodb"
import { ensureBaseContent } from "@/lib/data/service"
import type { LearningResource, GlossaryEntry, SimulationDiscipline } from "@/lib/data/seed"

export type ResourceSearchFilters = {
  query?: string
  types?: string[]
  discipline?: SimulationDiscipline | "all"
  level?: "college" | "lycee" | "universite" | "all"
  tags?: string[]
}

export type ResourceStats = {
  total: number
  countsByType: Record<string, number>
  countsByDiscipline: Record<string, number>
  countsByLevel: Record<string, number>
}

export type ResourceSearchResult = {
  resources: LearningResource[]
  stats: ResourceStats
}

export type GlossarySearchFilters = {
  query?: string
  discipline?: SimulationDiscipline | "interdisciplinaire" | "all"
  tags?: string[]
}

export type GlossarySearchResult = {
  entries: GlossaryEntry[]
  total: number
}

function buildResourceStats(resources: LearningResource[]): ResourceStats {
  const countsByType: Record<string, number> = {}
  const countsByDiscipline: Record<string, number> = {}
  const countsByLevel: Record<string, number> = {}

  resources.forEach(resource => {
    countsByType[resource.type] = (countsByType[resource.type] ?? 0) + 1
    countsByDiscipline[resource.discipline] = (countsByDiscipline[resource.discipline] ?? 0) + 1
    countsByLevel[resource.level] = (countsByLevel[resource.level] ?? 0) + 1
  })

  return {
    total: resources.length,
    countsByType,
    countsByDiscipline,
    countsByLevel,
  }
}

export async function searchResources(filters: ResourceSearchFilters = {}): Promise<ResourceSearchResult> {
  await ensureBaseContent()
  const db = await getDatabase()
  const collection = db.collection<LearningResource>("resources")

  const andConditions: Filter<LearningResource>[] = []

  if (filters.query) {
    const regex = new RegExp(filters.query, "i")
    andConditions.push({
      $or: [
        { title: regex },
        { summary: regex },
        { tags: regex },
        { "manual.sections.content": regex },
        { "manual.sections.title": regex },
        { "interactive.steps.title": regex },
        { "interactive.steps.action": regex },
      ] as unknown as Filter<LearningResource>[],
    })
  }

  if (filters.types?.length) {
    andConditions.push({ type: { $in: filters.types } } as Filter<LearningResource>)
  }

  if (filters.discipline && filters.discipline !== "all") {
    andConditions.push({ discipline: filters.discipline } as Filter<LearningResource>)
  }

  if (filters.level && filters.level !== "all") {
    andConditions.push({ level: filters.level } as Filter<LearningResource>)
  }

  if (filters.tags?.length) {
    andConditions.push({ tags: { $all: filters.tags } } as Filter<LearningResource>)
  }

  const query: Filter<LearningResource> = andConditions.length ? { $and: andConditions } : {}

  const resources = await collection
    .find(query)
    .project<LearningResource>({ _id: 0 })
    .sort({ title: 1 })
    .toArray()

  const stats = buildResourceStats(resources)
  return { resources, stats }
}

export async function searchGlossary(filters: GlossarySearchFilters = {}): Promise<GlossarySearchResult> {
  await ensureBaseContent()
  const db = await getDatabase()
  const collection = db.collection<GlossaryEntry>("glossary")

  const andConditions: Filter<GlossaryEntry>[] = []

  if (filters.query) {
    const regex = new RegExp(filters.query, "i")
    andConditions.push({
      $or: [
        { term: regex },
        { definition: regex },
        { tags: regex },
        { synonyms: regex },
      ] as unknown as Filter<GlossaryEntry>[],
    })
  }

  if (filters.discipline && filters.discipline !== "all") {
    andConditions.push({ discipline: filters.discipline } as Filter<GlossaryEntry>)
  }

  if (filters.tags?.length) {
    andConditions.push({ tags: { $in: filters.tags } } as Filter<GlossaryEntry>)
  }

  const query: Filter<GlossaryEntry> = andConditions.length ? { $and: andConditions } : {}

  const entries = await collection
    .find(query)
    .project<GlossaryEntry>({ _id: 0 })
    .sort({ term: 1 })
    .toArray()

  return {
    entries,
    total: entries.length,
  }
}




