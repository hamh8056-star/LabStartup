"use server"

import { nanoid } from "nanoid"
import { z } from "zod"

import { getDatabase } from "@/lib/mongodb"

const classSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(400).optional().default(""),
  discipline: z.string().min(2).max(80),
  level: z.string().min(2).max(80),
  studentIds: z.array(z.string()).max(200).optional().default([]),
})

const classUpdateSchema = classSchema
  .partial()
  .extend({
    studentIdsToAdd: z.array(z.string()).max(200).optional(),
    studentIdsToRemove: z.array(z.string()).max(200).optional(),
  })
  .refine(
    data => {
      if (!data.studentIdsToAdd && !data.studentIdsToRemove) {
        return true
      }
      return true
    },
    { message: "Les listes d'étudiants à ajouter ou retirer doivent être valides." },
  )

const assignmentSchema = z.object({
  classId: z.string().min(1),
  simulationId: z.string().min(1),
  title: z.string().min(2).max(180),
  instructions: z.string().max(2000).optional().default(""),
  dueDate: z.string().optional().nullable(),
  status: z.enum(["draft", "active", "closed"]).optional().default("active"),
})

const assignmentUpdateSchema = assignmentSchema.partial()

type ClassInput = z.infer<typeof classSchema>
type ClassUpdateInput = z.infer<typeof classUpdateSchema>
type AssignmentInput = z.infer<typeof assignmentSchema>
type AssignmentUpdateInput = z.infer<typeof assignmentUpdateSchema>

export type ClassDocument = ClassInput & {
  id: string
  teacherId: string
  studentIds: string[]
  createdAt: Date
  updatedAt: Date
}

export type AssignmentDocument = AssignmentInput & {
  id: string
  teacherId: string
  createdAt: Date
  updatedAt: Date
}

let isInitialized = false

async function getCollections() {
  try {
    const db = await getDatabase()

    if (!isInitialized) {
      try {
        await Promise.all([
          db.collection<ClassDocument>("classes").createIndex({ teacherId: 1 }).catch(() => {}),
          db.collection<ClassDocument>("classes").createIndex({ id: 1 }, { unique: true }).catch(() => {}),
          db.collection<AssignmentDocument>("assignments").createIndex({ teacherId: 1 }).catch(() => {}),
          db.collection<AssignmentDocument>("assignments").createIndex({ classId: 1 }).catch(() => {}),
          db.collection<AssignmentDocument>("assignments").createIndex({ id: 1 }, { unique: true }).catch(() => {}),
        ])
      } catch (indexError) {
        // Les index peuvent déjà exister, on continue
        console.warn("[teaching-db] Index creation warning (may already exist):", indexError)
      }
      isInitialized = true
    }

    return {
      classes: db.collection<ClassDocument>("classes"),
      assignments: db.collection<AssignmentDocument>("assignments"),
    }
  } catch (error) {
    console.error("[teaching-db] Error in getCollections:", error)
    throw new Error(`Erreur de connexion à la base de données: ${error instanceof Error ? error.message : "Erreur inconnue"}`)
  }
}

export async function createClass(teacherId: string, payload: ClassInput) {
  const parsed = classSchema.parse(payload)
  const { classes } = await getCollections()

  const document: ClassDocument = {
    id: nanoid(),
    teacherId,
    studentIds: parsed.studentIds ?? [],
    name: parsed.name,
    description: parsed.description ?? "",
    discipline: parsed.discipline,
    level: parsed.level,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  await classes.insertOne(document)
  return document
}

export async function listClassesByTeacher(teacherId: string) {
  try {
    const { classes } = await getCollections()
    return classes.find({ teacherId }).sort({ createdAt: -1 }).toArray()
  } catch (error) {
    console.error("[teaching-db] Error in listClassesByTeacher:", error)
    throw error
  }
}

export async function listClassesByStudent(studentId: string) {
  try {
    const { classes } = await getCollections()
    // Rechercher les classes où l'étudiant est dans le tableau studentIds
    // MongoDB trouve automatiquement si la valeur est dans le tableau
    return classes.find({ studentIds: studentId }).sort({ createdAt: -1 }).toArray()
  } catch (error) {
    console.error("[teaching-db] Error in listClassesByStudent:", error)
    throw error
  }
}

export async function getClassById(teacherId: string, classId: string) {
  const { classes } = await getCollections()
  return classes.findOne({ id: classId, teacherId })
}

export async function updateClass(teacherId: string, classId: string, payload: ClassUpdateInput) {
  const parsed = classUpdateSchema.parse(payload)
  const { classes } = await getCollections()

  const updates: Partial<ClassDocument> = {}
  if (parsed.name !== undefined) updates.name = parsed.name
  if (parsed.description !== undefined) updates.description = parsed.description
  if (parsed.discipline !== undefined) updates.discipline = parsed.discipline
  if (parsed.level !== undefined) updates.level = parsed.level
  if (Object.prototype.hasOwnProperty.call(payload, "studentIds") && parsed.studentIds !== undefined) {
    updates.studentIds = parsed.studentIds
  }

  const updateOperators: Record<string, unknown> = {
    $set: { ...updates, updatedAt: new Date() },
  }

  if (parsed.studentIdsToAdd?.length) {
    updateOperators.$addToSet = {
      studentIds: { $each: parsed.studentIdsToAdd },
    }
  }

  if (parsed.studentIdsToRemove?.length) {
    updateOperators.$pull = {
      studentIds: { $in: parsed.studentIdsToRemove },
    }
  }

  const result = await classes.findOneAndUpdate(
    { id: classId, teacherId },
    updateOperators,
    { returnDocument: "after" },
  )

  return result
}

export async function deleteClass(teacherId: string, classId: string) {
  const { classes, assignments } = await getCollections()
  const deletion = await classes.deleteOne({ id: classId, teacherId })

  if (deletion.deletedCount) {
    await assignments.deleteMany({ classId, teacherId })
  }

  return deletion.deletedCount > 0
}

export async function createAssignment(teacherId: string, payload: AssignmentInput) {
  const parsed = assignmentSchema.parse(payload)
  const { assignments } = await getCollections()

  const classDocument = await getClassById(teacherId, parsed.classId)
  if (!classDocument) {
    throw new Error("Classe introuvable ou non autorisée.")
  }

  const document: AssignmentDocument = {
    id: nanoid(),
    teacherId,
    classId: parsed.classId,
    simulationId: parsed.simulationId,
    title: parsed.title,
    instructions: parsed.instructions ?? "",
    dueDate: parsed.dueDate ?? null,
    status: parsed.status ?? "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  await assignments.insertOne(document)
  return document
}

export async function listAssignments(teacherId: string, options?: { classId?: string }) {
  try {
    const { assignments } = await getCollections()
    const filter: Partial<AssignmentDocument> = { teacherId }

    if (options?.classId) {
      filter.classId = options.classId
    }

    return assignments.find(filter).sort({ createdAt: -1 }).toArray()
  } catch (error) {
    console.error("[teaching-db] Error in listAssignments:", error)
    throw error
  }
}

export async function getAssignmentById(teacherId: string, assignmentId: string) {
  const { assignments } = await getCollections()
  return assignments.findOne({ id: assignmentId, teacherId })
}

export async function updateAssignment(teacherId: string, assignmentId: string, payload: AssignmentUpdateInput) {
  const parsed = assignmentUpdateSchema.parse(payload)
  const { assignments } = await getCollections()

  const update: Partial<AssignmentDocument> = {}
  if (parsed.classId) {
    const classDocument = await getClassById(teacherId, parsed.classId)
    if (!classDocument) {
      throw new Error("Classe introuvable ou non autorisée.")
    }
    update.classId = parsed.classId
  }
  if (parsed.simulationId) update.simulationId = parsed.simulationId
  if (parsed.title) update.title = parsed.title
  if (parsed.instructions !== undefined) update.instructions = parsed.instructions
  if (parsed.dueDate !== undefined) update.dueDate = parsed.dueDate ?? null
  if (parsed.status) update.status = parsed.status

  const result = await assignments.findOneAndUpdate(
    { id: assignmentId, teacherId },
    {
      $set: { ...update, updatedAt: new Date() },
    },
    { returnDocument: "after" },
  )

  return result
}

export async function deleteAssignment(teacherId: string, assignmentId: string) {
  const { assignments } = await getCollections()
  const deletion = await assignments.deleteOne({ id: assignmentId, teacherId })
  return deletion.deletedCount > 0
}

export async function listAssignmentsByStudent(studentId: string) {
  try {
    const { classes, assignments } = await getCollections()
    
    // Trouver toutes les classes où l'étudiant est inscrit
    const studentClasses = await classes.find({ studentIds: studentId }).toArray()
    const classIds = studentClasses.map(c => c.id)
    
    if (classIds.length === 0) {
      return []
    }
    
    // Trouver toutes les assignations actives pour ces classes
    return assignments
      .find({ 
        classId: { $in: classIds },
        status: "active"
      })
      .sort({ createdAt: -1 })
      .toArray()
  } catch (error) {
    console.error("[teaching-db] Error in listAssignmentsByStudent:", error)
    throw error
  }
}


