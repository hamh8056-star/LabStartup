import { ObjectId } from "mongodb"

import { getDatabase } from "@/lib/mongodb"

import {
  baseLabs,
  baseResources,
  baseSimulations,
  baseUsers,
  baseGlossary,
  type LearningResource,
  type Simulation,
  type VirtualLab,
  type GlossaryEntry,
} from "./seed"

async function ensureSeed<T extends { id: string }>(
  collectionName: string,
  dataset: T[],
) {
  const db = await getDatabase()
  const collection = db.collection(collectionName)
  const existingCount = await collection.estimatedDocumentCount()

  if (existingCount === 0) {
    await collection.insertMany(
      dataset.map(item => ({
        ...item,
        createdAt: new Date(),
        updatedAt: new Date(),
        _id: new ObjectId(),
      })),
    )
  }
}

export async function ensureBaseContent() {
  await Promise.all([
    ensureSeed<Simulation>("simulations", baseSimulations),
    ensureSeed<VirtualLab>("labs", baseLabs),
    ensureSeed<LearningResource>("resources", baseResources),
    ensureSeed<GlossaryEntry>("glossary", baseGlossary),
  ])
  await ensureSeedUsers()
}

export async function getSimulations(): Promise<Simulation[]> {
  const db = await getDatabase()
  await ensureBaseContent()

  const simulations = await db
    .collection<Simulation>("simulations")
    .find({})
    .project<Simulation>({
      _id: 0,
      id: 1,
      title: 1,
      discipline: 1,
      description: 1,
      objectives: 1,
      estimatedDuration: 1,
      difficulty: 1,
      tags: 1,
      assets: 1,
    })
    .toArray()

  return simulations
}

export async function getLabs(): Promise<VirtualLab[]> {
  const db = await getDatabase()
  await ensureBaseContent()
  const labs = await db
    .collection<VirtualLab>("labs")
    .find({})
    .project<VirtualLab>({
      _id: 0,
      id: 1,
      name: 1,
      discipline: 1,
      description: 1,
      safetyLevel: 1,
      icon: 1,
      features: 1,
    })
    .toArray()

  // Dédoublonner par discipline - garder seulement UN labo par discipline
  const uniqueLabs = new Map<string, VirtualLab>()
  
  // Ordre de priorité des IDs pour chaque discipline
  const priorityIds = ['lab-bio', 'lab-physique', 'lab-chimie']
  
  for (const lab of labs) {
    const existingLab = uniqueLabs.get(lab.discipline)
    
    // Si pas de labo pour cette discipline OU si l'ID actuel est prioritaire
    if (!existingLab || priorityIds.indexOf(lab.id) < priorityIds.indexOf(existingLab.id)) {
      uniqueLabs.set(lab.discipline, lab)
    }
  }

  return Array.from(uniqueLabs.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export async function getResources(): Promise<LearningResource[]> {
  const db = await getDatabase()
  await ensureBaseContent()
  const resources = await db
    .collection<LearningResource>("resources")
    .find({})
    .project<LearningResource>({ _id: 0 })
    .toArray()

  return resources
}

export async function getGlossaryEntries(): Promise<GlossaryEntry[]> {
  const db = await getDatabase()
  await ensureBaseContent()
  const entries = await db
    .collection<GlossaryEntry>("glossary")
    .find({})
    .project<GlossaryEntry>({ _id: 0 })
    .toArray()
  return entries
}

type SeedUserDocument = {
  _id: ObjectId
  name: string
  email: string
  password: string
  role: "student" | "teacher" | "admin"
  institution: string | null
  createdAt: Date
  updatedAt: Date
  emailVerified: Date | null
}

async function ensureSeedUsers() {
  const db = await getDatabase()
  const usersCollection = db.collection<SeedUserDocument>("users")

  await Promise.all(
    baseUsers.map(async ({ preferences, passwordHash, ...user }) => {
      const email = user.email.toLowerCase()
      const existing = await usersCollection.findOne({ email })

      if (existing) {
        return
      }

      const now = new Date()
      const insertResult = await usersCollection.insertOne({
        _id: new ObjectId(),
        name: user.name,
        email,
        password: passwordHash,
        role: user.role,
        institution: user.institution,
        createdAt: now,
        updatedAt: now,
        emailVerified: now,
      })

      await db.collection("profiles").insertOne({
        userId: insertResult.insertedId.toString(),
        preferences,
        createdAt: now,
        updatedAt: now,
      })
    }),
  )
}

