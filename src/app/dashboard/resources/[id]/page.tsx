import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { DashboardTopbar } from "@/components/dashboard/topbar"
import { ResourceDetailView } from "@/components/dashboard/resources/resource-detail-view"
import { ensureBaseContent } from "@/lib/data/service"
import { getDatabase } from "@/lib/mongodb"
import type { LearningResource } from "@/lib/data/seed"

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/dashboard/resources")
  }

  const { id } = await params
  await ensureBaseContent()

  const db = await getDatabase()
  const resource = await db.collection<LearningResource>("resources").findOne({ id })

  if (!resource) {
    redirect("/dashboard/resources")
  }

  return (
    <div className="flex h-full flex-col">
      <DashboardTopbar
        title={resource.title}
        subtitle={`${resource.type} • ${resource.discipline} • ${resource.level}`}
      />
      <div className="flex-1 overflow-auto p-6">
        <ResourceDetailView resource={resource} />
      </div>
    </div>
  )
}



