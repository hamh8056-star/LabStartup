#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"

import dotenv from "dotenv"
import { MongoClient, ObjectId } from "mongodb"
import { hash } from "bcryptjs"

const envCandidates = [".env.local", ".env"]
let envLoaded = false

for (const candidate of envCandidates) {
  const fullPath = path.resolve(process.cwd(), candidate)

  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath })
    envLoaded = true
    break
  }
}

if (!envLoaded) {
  dotenv.config()
}

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

function parseArguments(argv) {
  const options = {}

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]

    if (!token.startsWith("--")) {
      continue
    }

    const key = token.slice(2)

    if (key === "help") {
      options.help = true
      continue
    }

    if (key === "force") {
      options.force = true
      continue
    }

    const value = argv[index + 1]

    if (!value || value.startsWith("--")) {
      throw new Error(`L'option "--${key}" nécessite une valeur.`)
    }

    options[key] = value
    index += 1
  }

  return options
}

async function main() {
  const args = parseArguments(process.argv.slice(2))

  if (args.help) {
    console.log(HELP_MESSAGE)
    process.exit(0)
  }

  const mongoUri = process.env.MONGODB_URI

  if (!mongoUri) {
    console.error("❌ MONGODB_URI doit être défini (vérifiez votre fichier .env.local ou .env).")
    if (!envLoaded) {
      console.error("ℹ️  Aucun fichier .env*. localisé automatiquement. Placez vos variables dans .env.local à la racine du projet.")
    } else {
      console.error("ℹ️  Fichier environnement chargé mais variable manquante. Assurez-vous de la ligne suivante :")
      console.error("    MONGODB_URI=mongodb://<utilisateur>:<motdepasse>@<hôte>:<port>/<database>")
      console.error("    ou")
      console.error("    MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority")
    }
    process.exit(1)
  }

  // Extraire le nom de la base depuis l'URI
  function extractDatabaseName(uri) {
    try {
      const url = new URL(uri);
      const pathname = url.pathname;
      const dbName = pathname.split('/').filter(p => p)[0];
      if (dbName) return dbName;
    } catch (error) {
      const match = uri.match(/\/([^\/\?]+)(?:\?|$)/);
      if (match && match[1] && match[1] !== '') return match[1];
    }
    return process.env.MONGODB_DB || 'taalimia'; // Fallback
  }

  const mongoDbName = extractDatabaseName(mongoUri)

const role = (args.role ?? "admin").toLowerCase()

if (!["admin", "teacher", "student"].includes(role)) {
  console.error("❌ Option --role invalide. Utilisez admin, teacher ou student.")
  process.exit(1)
}

const defaults = ROLE_DEFAULTS[role]

const email = (args.email ?? defaults.email).toLowerCase()
const password = args.password ?? defaults.password
const name = args.name ?? defaults.name
const institution = args.institution ?? defaults.institution
  const force = Boolean(args.force)

  const client = new MongoClient(mongoUri)

  try {
    await client.connect()
    const db = client.db(mongoDbName)
    const usersCollection = db.collection("users")
    const profilesCollection = db.collection("profiles")

const existingUser = await usersCollection.findOne({ email })
    const now = new Date()

    if (existingUser) {
      if (!force) {
        console.log(`ℹ️  Un utilisateur avec l'email ${email} existe déjà. Aucune modification (ajoutez --force pour mettre à jour le mot de passe).`)
        process.exit(0)
      }

      const hashedPassword = await hash(password, 12)

      await usersCollection.updateOne(
        { _id: existingUser._id },
        {
          $set: {
            name,
            password: hashedPassword,
            role,
            institution,
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

      console.log(`✅ Compte ${role} mis à jour pour ${email}.`)
      return
    }

    const hashedPassword = await hash(password, 12)

    const insertResult = await usersCollection.insertOne({
      _id: new ObjectId(),
      name,
      email,
      password: hashedPassword,
      role,
      institution,
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

    console.log(`✅ Compte ${role} créé avec succès (${email}).`)
    console.log("   Utilisez les identifiants configurés pour vous connecter via /auth/login.")
  } catch (error) {
    console.error("❌ Impossible de créer l'utilisateur.")
    console.error(error)
    process.exitCode = 1
  } finally {
    await client.close().catch(() => null)
  }
}

main()

