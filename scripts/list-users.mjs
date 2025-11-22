#!/usr/bin/env node

import dotenv from "dotenv"
import { MongoClient } from "mongodb"

dotenv.config()

async function main() {
  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB

  if (!uri || !dbName) {
    console.error("❌ MONGODB_URI ou MONGODB_DB manquant.")
    process.exit(1)
  }

  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db(dbName)
    const users = await db.collection("users").find({}).toArray()

    if (!users.length) {
      console.log("ℹ️  Aucun utilisateur trouvé.")
      return
    }

    for (const user of users) {
      console.log("────────────────────────────────────────────")
      console.log(`Nom: ${user.name ?? "⟂"}`)
      console.log(`Email: ${user.email ?? "⟂"}`)
      console.log(`Role: ${user.role ?? "⟂"}`)
      console.log(`Institution: ${user.institution ?? "⟂"}`)
      console.log(`Mot de passe (hashé): ${user.password ?? "⟂"}`)
      console.log(`Créé le: ${user.createdAt ?? "⟂"}`)
      console.log(`Mis à jour le: ${user.updatedAt ?? "⟂"}`)
    }
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des utilisateurs.")
    console.error(error)
    process.exitCode = 1
  } finally {
    await client.close().catch(() => null)
  }
}

main()


