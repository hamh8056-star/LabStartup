import { ObjectId } from "mongodb"
import { getDatabase } from "@/lib/mongodb"
import type { UserRole } from "@/lib/roles"

/**
 * Convertit un _id (ObjectId ou string) en chaîne de caractères de manière sécurisée
 */
function idToString(id: ObjectId | string | undefined | null): string {
  if (!id) {
    return ""
  }
  if (typeof id === "string") {
    return id
  }
  if (id && typeof id === "object" && "toHexString" in id && typeof id.toHexString === "function") {
    return id.toHexString()
  }
  // Fallback: convertir en chaîne
  return String(id)
}

export type AdminUser = {
  _id: ObjectId
  id: string
  name: string
  email: string
  role: UserRole
  institution?: string
  createdAt: Date
  updatedAt: Date
  emailVerified: Date | null
  lastLogin?: Date
  isActive: boolean
}

export type UserStats = {
  total: number
  byRole: Record<UserRole, number>
  active: number
  inactive: number
  recent: number // Last 7 days
}

export async function getUsers(page: number = 1, limit: number = 20, search?: string, role?: UserRole): Promise<{
  users: AdminUser[]
  total: number
  page: number
  totalPages: number
}> {
  const db = await getDatabase()
  const collection = db.collection("users")

  const query: any = {}
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ]
  }
  if (role) {
    query.role = role
  }

  const skip = (page - 1) * limit
  const total = await collection.countDocuments(query)

  const users = await collection
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray()

  return {
    users: users.map(user => ({
      _id: user._id,
      id: idToString(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      institution: user.institution || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      emailVerified: user.emailVerified || null,
      lastLogin: user.lastLogin || undefined,
      isActive: user.isActive !== false, // Default to true
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

export async function getUserStats(): Promise<UserStats> {
  const db = await getDatabase()
  const collection = db.collection("users")

  const total = await collection.countDocuments({})
  const active = await collection.countDocuments({ isActive: { $ne: false } })
  const inactive = await collection.countDocuments({ isActive: false })

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recent = await collection.countDocuments({ createdAt: { $gte: sevenDaysAgo } })

  const byRole = {
    student: await collection.countDocuments({ role: "student" }),
    teacher: await collection.countDocuments({ role: "teacher" }),
    admin: await collection.countDocuments({ role: "admin" }),
  }

  return {
    total,
    byRole,
    active,
    inactive,
    recent,
  }
}

export async function updateUser(userId: string, updates: {
  name?: string
  email?: string
  role?: UserRole
  institution?: string
  isActive?: boolean
}): Promise<AdminUser | null> {
  const db = await getDatabase()
  const collection = db.collection("users")

  const updateData: any = {
    ...updates,
    updatedAt: new Date(),
  }

  if (updates.email) {
    updateData.email = updates.email.toLowerCase()
  }

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(userId) },
    { $set: updateData },
    { returnDocument: "after" }
  )

  if (!result) {
    return null
  }

  return {
    _id: result._id,
    id: idToString(result._id),
    name: result.name,
    email: result.email,
    role: result.role,
    institution: result.institution || undefined,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    emailVerified: result.emailVerified || null,
    lastLogin: result.lastLogin || undefined,
    isActive: result.isActive !== false,
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  const db = await getDatabase()
  const usersCollection = db.collection("users")
  const profilesCollection = db.collection("profiles")

  const user = await usersCollection.findOne({ _id: new ObjectId(userId) })
  if (!user) {
    return false
  }

  // Ne pas permettre la suppression du dernier admin
  if (user.role === "admin") {
    const adminCount = await usersCollection.countDocuments({ role: "admin", isActive: { $ne: false } })
    if (adminCount <= 1) {
      throw new Error("Impossible de supprimer le dernier administrateur")
    }
  }

  await usersCollection.deleteOne({ _id: new ObjectId(userId) })
  await profilesCollection.deleteOne({ userId })

  return true
}

export async function resetUserPassword(userId: string, newPassword: string): Promise<boolean> {
  const db = await getDatabase()
  const collection = db.collection("users")
  const { hash } = await import("bcryptjs")

  const passwordHash = await hash(newPassword, 12)

  const result = await collection.updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        password: passwordHash,
        updatedAt: new Date(),
      },
    }
  )

  return result.modifiedCount > 0
}



