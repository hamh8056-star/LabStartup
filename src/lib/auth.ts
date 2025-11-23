import { MongoDBAdapter } from "@auth/mongodb-adapter"
import type { Adapter } from "next-auth/adapters"
import type { NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import GithubProvider from "next-auth/providers/github"
import { compare } from "bcryptjs"
import { ObjectId } from "mongodb"
import { z } from "zod"

import { getEnv } from "@/lib/env"
import { getMongoClient, getDatabase } from "@/lib/mongodb"
import { USER_ROLES, type UserRole } from "@/lib/roles"
import { recordAuditLog } from "@/lib/security/audit"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export type UserDocument = {
  _id: ObjectId
  name: string
  email: string
  password: string
  role: UserRole
  institution?: string
  createdAt: Date
  updatedAt: Date
}

const env = getEnv()

const clientPromise = getMongoClient()

const adapter = MongoDBAdapter(clientPromise, {
  databaseName: env.MONGODB_DB,
}) as Adapter

const providers: NextAuthOptions["providers"] = [
  Credentials({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Mot de passe", type: "password" },
    },
    authorize: async credentials => {
      const parsed = credentialsSchema.safeParse(credentials)

      if (!parsed.success) {
        return null
      }

      const { email, password } = parsed.data

      const db = await getDatabase()
      const user = await db.collection<UserDocument>("users").findOne({
        email: email.toLowerCase(),
      })

      if (!user) {
        return null
      }

      const passwordMatch = await compare(password, user.password)

      if (!passwordMatch) {
        return null
      }

      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        institution: user.institution,
      }
    },
  }),
]

if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  providers.push(
    GithubProvider({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    }),
  )
}

export const authOptions: NextAuthOptions = {
  adapter,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  providers,
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        session.user.role = (token.role as UserRole) ?? "student"
        session.user.institution = (token.institution as string) ?? null
      }

      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: UserRole }).role ?? "student"
        token.institution = (user as { institution?: string | null }).institution
      }

      if (!token.role || !USER_ROLES.includes(token.role as UserRole)) {
        token.role = "student"
      }

      return token
    },
  },
  theme: {
    colorScheme: "auto",
  },
  events: {
    async createUser({ user }) {
      const db = await getDatabase()
      await db.collection("profiles").insertOne({
        userId: user.id,
        preferences: {
          discipline: "physics",
          collaborations: [],
          simulationHistory: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      await recordAuditLog({
        userId: user.id,
        email: user.email,
        action: "auth.user_created",
        severity: "info",
      })
    },
    async signIn({ user }) {
      await recordAuditLog({
        userId: user.id,
        email: user.email,
        action: "auth.signed_in",
        severity: "info",
      })
    },
  },
}

