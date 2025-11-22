import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { getUsers, getUserStats, updateUser, deleteUser, resetUserPassword } from "@/lib/admin-db"
import { USER_ROLES, type UserRole } from "@/lib/roles"

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(USER_ROLES).optional(),
  institution: z.string().optional(),
  isActive: z.boolean().optional(),
})

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8),
})

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 })
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = parseInt(searchParams.get("limit") || "20", 10)
  const search = searchParams.get("search") || undefined
  const role = (searchParams.get("role") as UserRole) || undefined

  try {
    if (searchParams.get("stats") === "true") {
      const stats = await getUserStats()
      return NextResponse.json({ stats })
    }

    const result = await getUsers(page, limit, search, role)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[admin-users]", error)
    return NextResponse.json({ message: "Erreur lors de la récupération des utilisateurs." }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 })
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 })
  }

  const body = await request.json()
  const { userId, ...updates } = body

  if (!userId) {
    return NextResponse.json({ message: "userId est requis." }, { status: 400 })
  }

  const parsed = updateUserSchema.safeParse(updates)
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Les données fournies sont invalides.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const user = await updateUser(userId, parsed.data)
    if (!user) {
      return NextResponse.json({ message: "Utilisateur non trouvé." }, { status: 404 })
    }
    return NextResponse.json({ user })
  } catch (error) {
    console.error("[admin-users]", error)
    return NextResponse.json({ message: "Erreur lors de la mise à jour de l'utilisateur." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 })
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ message: "userId est requis." }, { status: 400 })
  }

  // Ne pas permettre la suppression de son propre compte
  if (userId === session.user.id) {
    return NextResponse.json({ message: "Vous ne pouvez pas supprimer votre propre compte." }, { status: 400 })
  }

  try {
    const success = await deleteUser(userId)
    if (!success) {
      return NextResponse.json({ message: "Utilisateur non trouvé." }, { status: 404 })
    }
    return NextResponse.json({ message: "Utilisateur supprimé avec succès." })
  } catch (error: any) {
    console.error("[admin-users]", error)
    return NextResponse.json({ message: error.message || "Erreur lors de la suppression de l'utilisateur." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 })
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ message: "Accès refusé." }, { status: 403 })
  }

  const body = await request.json()
  const { userId, action } = body

  if (!userId) {
    return NextResponse.json({ message: "userId est requis." }, { status: 400 })
  }

  if (action === "reset-password") {
    const parsed = resetPasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Les données fournies sont invalides.", issues: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    try {
      const success = await resetUserPassword(userId, parsed.data.newPassword)
      if (!success) {
        return NextResponse.json({ message: "Utilisateur non trouvé." }, { status: 404 })
      }
      return NextResponse.json({ message: "Mot de passe réinitialisé avec succès." })
    } catch (error) {
      console.error("[admin-users]", error)
      return NextResponse.json({ message: "Erreur lors de la réinitialisation du mot de passe." }, { status: 500 })
    }
  }

  return NextResponse.json({ message: "Action non reconnue." }, { status: 400 })
}



