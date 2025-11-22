import "next-auth"

import type { DefaultSession } from "next-auth"

import type { UserRole } from "@/lib/roles"

declare module "next-auth" {
  interface User {
    role: UserRole
    institution?: string | null
  }

  interface Session {
    user: {
      id: string
      role: UserRole
      institution?: string | null
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole
    institution?: string | null
  }
}

