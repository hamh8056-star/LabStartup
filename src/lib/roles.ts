export const USER_ROLES = ["student", "teacher", "admin"] as const

export type UserRole = (typeof USER_ROLES)[number]

export function isUserRole(role: string | undefined | null): role is UserRole {
  return USER_ROLES.includes((role ?? "").toLowerCase() as UserRole)
}

