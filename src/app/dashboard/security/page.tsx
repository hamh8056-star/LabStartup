import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { DashboardTopbar } from "@/components/dashboard/topbar"
import { SecurityWorkspace } from "@/components/dashboard/security/security-workspace"

export default async function SecurityDashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/dashboard/security")
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <div className="flex h-full flex-col">
      <DashboardTopbar
        title="Sécurité & gestion des accès"
        subtitle="Supervisez les connexions, les clés API, les sauvegardes et les intégrations sécurisées."
      />
      <div className="flex-1 space-y-6 p-6">
        <SecurityWorkspace />
      </div>
    </div>
  )
}




