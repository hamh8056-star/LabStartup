import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { ObjectId } from "mongodb"

import { DashboardTopbar } from "@/components/dashboard/topbar"
import { ProfileForm } from "@/components/dashboard/profile/profile-form"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"

export default async function DashboardProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/auth/login?callbackUrl=/dashboard/profile")
  }

  const db = await getDatabase()
  const user = await db.collection("users").findOne(
    { _id: new ObjectId(session.user.id) },
    {
      projection: {
        name: 1,
        email: 1,
        role: 1,
        institution: 1,
        createdAt: 1,
      },
    },
  )

  const profile = await db.collection("profiles").findOne(
    { userId: session.user.id },
    {
      projection: {
        bio: 1,
        avatarUrl: 1,
        interests: 1,
        collaborationStyle: 1,
      },
    },
  )

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex h-full flex-col">
      <DashboardTopbar title="Mon profil" subtitle="Mettez à jour vos informations personnelles et préférences." />
      <div className="flex-1 p-6">
        <ProfileForm
          initialData={{
            name: user.name ?? "",
            email: user.email ?? "",
            role: user.role ?? "student",
            institution: user.institution ?? "",
            bio: profile?.bio ?? "",
            avatarUrl: profile?.avatarUrl ?? "",
            interests: "",
            interestsList: profile?.interests ?? [],
            collaborationStyle: profile?.collaborationStyle ?? "hybride",
            createdAt: user.createdAt?.toString(),
          }}
        />
      </div>
    </div>
  )
}


