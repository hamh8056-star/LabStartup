import { MongoClient, type Db, type MongoClientOptions, ObjectId } from "mongodb"

import { getEnv, extractDatabaseName } from "@/lib/env"

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

const env = getEnv()

const options: MongoClientOptions = {
  maxPoolSize: 10,
}

const client = new MongoClient(env.MONGODB_URI, options)

export function getMongoClient(): Promise<MongoClient> {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = client.connect()
  }

  return global._mongoClientPromise
}

export async function getDatabase(): Promise<Db> {
  const mongoClient = await getMongoClient()
  // Extraire le nom de la base directement depuis l'URI
  const dbName = extractDatabaseName(env.MONGODB_URI)
  return mongoClient.db(dbName)
}

/**
 * Convertit un _id (ObjectId ou string) en chaîne de caractères de manière sécurisée
 * Gère les cas où l'ObjectId peut être sérialisé/désérialisé par Next.js
 */
export function idToString(id: ObjectId | string | undefined | null | any): string {
  if (!id) {
    return ""
  }
  if (typeof id === "string") {
    return id
  }
  // Handle MongoDB ObjectId instances
  if (id && typeof id === "object") {
    // Check if it's a MongoDB ObjectId with toHexString method
    if (typeof id.toHexString === "function") {
      try {
        return id.toHexString()
      } catch {
        // Fall through to other checks
      }
    }
    // Handle serialized ObjectId (from Next.js serialization)
    if (id.$oid) {
      return id.$oid
    }
    // Handle ObjectId-like objects with id property
    if (id.id && Buffer.isBuffer(id.id)) {
      return id.id.toString("hex")
    }
    // If it's already a string-like object, try to extract it
    if (id.toString && typeof id.toString === "function" && id.toString !== Object.prototype.toString) {
      const str = id.toString()
      // Check if it looks like a valid ObjectId hex string (24 hex characters)
      if (/^[0-9a-fA-F]{24}$/.test(str)) {
        return str
      }
    }
  }
  // Fallback: convertir en chaîne
  return String(id)
}

/**
 * Convertit une Date en chaîne ISO de manière sécurisée
 * Gère les cas où la Date peut être sérialisée/désérialisée par Next.js
 */
export function dateToISOString(date: Date | string | undefined | null | any): string {
  if (!date) {
    return new Date().toISOString()
  }
  // Si c'est déjà une chaîne ISO, la retourner telle quelle
  if (typeof date === "string") {
    // Vérifier si c'est déjà une chaîne ISO valide
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(date)) {
      return date
    }
    // Sinon, essayer de la convertir en Date puis en ISO
    try {
      return new Date(date).toISOString()
    } catch {
      return date
    }
  }
  // Si c'est une instance Date avec toISOString
  if (date instanceof Date || (date && typeof date === "object" && typeof date.toISOString === "function")) {
    try {
      return date.toISOString()
    } catch {
      // Fall through
    }
  }
  // Handle serialized Date (from Next.js serialization)
  if (date && typeof date === "object") {
    if (date.$date) {
      return new Date(date.$date).toISOString()
    }
    // Try to construct a Date from common properties
    if (typeof date.getTime === "function") {
      try {
        return new Date(date.getTime()).toISOString()
      } catch {
        // Fall through
      }
    }
  }
  // Fallback: essayer de créer une Date puis convertir
  try {
    return new Date(date).toISOString()
  } catch {
    return new Date().toISOString()
  }
}

