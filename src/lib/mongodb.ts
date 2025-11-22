import { MongoClient, type Db, type MongoClientOptions } from "mongodb"

import { getEnv } from "@/lib/env"

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
  return mongoClient.db(env.MONGODB_DB)
}

