import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { DashboardTopbar } from "@/components/dashboard/topbar"
import { AdminWorkspace } from "@/components/dashboard/admin/admin-workspace"

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/dashboard/admin")
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="flex h-full flex-col">
      <DashboardTopbar
        title="Administration"
        subtitle="Gérez les utilisateurs, le contenu et la configuration du système"
      />
      <div className="flex-1 space-y-6 p-6">
        <AdminWorkspace />
      </div>
    </div>
  )
}





