#!/usr/bin/env node

import "dotenv/config"
import { MongoClient, ObjectId } from "mongodb"
import { hash } from "bcryptjs"

const ROLE_DEFAULTS = {
  admin: {
    name: "Administrateur Taalimia",
    email: "admin@univ-setif.dz",
    password: "Taalimia#2025",
    institution: "Université Ferhat Abbas Sétif 1",
  },
  teacher: {
    name: "Pr Karim Benali",
    email: "enseignant@univ-setif.dz",
    password: "Taalimia#2025",
    institution: "Université Ferhat Abbas Sétif 1",
  },
  student: {
    name: "Sara Kaci",
    email: "etudiant@univ-setif.dz",
    password: "Taalimia#2025",
    institution: "Université Ferhat Abbas Sétif 1",
  },
}

async function upsertUser({ db, role, force = false }) {
  const defaults = ROLE_DEFAULTS[role]
  const email = defaults.email.toLowerCase()
  const now = new Date()

  const usersCollection = db.collection("users")
  const profilesCollection = db.collection("profiles")

  const existingUser = await usersCollection.findOne({ email })

  const hashedPassword = await hash(defaults.password, 12)

  if (existingUser) {
    if (!force) {
      console.log(`ℹ️  ${role} déjà présent (${email}). Aucun changement.`)
      return
    }

    await usersCollection.updateOne(
      { _id: existingUser._id },
      {
        $set: {
          name: defaults.name,
          password: hashedPassword,
          role,
          institution: defaults.institution,
          updatedAt: now,
        },
      },
    )

    await profilesCollection.updateOne(
      { userId: existingUser._id.toString() },
      {
        $setOnInsert: {
          preferences: {
            disciplines: ["physique"],
            simulationHistory: [],
            collaborationStyle: role === "student" ? "distanciel" : "hybride",
          },
          createdAt: now,
        },
        $set: { updatedAt: now },
      },
      { upsert: true },
    )

    console.log(`✅ ${role} mis à jour (${email}).`)
    return
  }

  const insertResult = await usersCollection.insertOne({
    _id: new ObjectId(),
    name: defaults.name,
    email,
    password: hashedPassword,
    role,
    institution: defaults.institution,
    emailVerified: now,
    createdAt: now,
    updatedAt: now,
  })

  await profilesCollection.insertOne({
    userId: insertResult.insertedId.toString(),
    preferences: {
      disciplines: ["physique"],
      simulationHistory: [],
      collaborationStyle: role === "student" ? "distanciel" : "hybride",
    },
    createdAt: now,
    updatedAt: now,
  })

  console.log(`✅ ${role} créé (${email}).`)
}

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

    await upsertUser({ db, role: "admin" })
    await upsertUser({ db, role: "teacher", force: true })
    await upsertUser({ db, role: "student" })

    console.log("🏁 Population des comptes par défaut terminée.")
  } catch (error) {
    console.error("❌ Erreur lors de la création des comptes par défaut.")
    console.error(error)
    process.exitCode = 1
  } finally {
    await client.close().catch(() => null)
  }
}

main()


