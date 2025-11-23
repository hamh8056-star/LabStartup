import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { DashboardTopbar } from "@/components/dashboard/topbar"
import { CollaborationWorkspace } from "@/components/dashboard/collaboration/collaboration-workspace"
import { ensureCollaborationIndexes, listCollaborationRooms, seedSampleCollaborationRooms } from "@/lib/collaboration-db"
import { getSampleRooms } from "@/lib/data/collaboration"

export default async function DashboardCollaborationPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/dashboard/collaboration")
  }

  await ensureCollaborationIndexes()
  let rooms = await listCollaborationRooms()

  if (!rooms.length) {
    await seedSampleCollaborationRooms(getSampleRooms())
    rooms = await listCollaborationRooms()
  }

  return (
    <div className="flex h-full flex-col">
      <DashboardTopbar
        title="Collaboration en temps réel"
        subtitle="Organisez des TP synchrones, chats vocaux et sessions VR pour vos classes."
      />
      <div className="flex-1 space-y-4 p-4 sm:space-y-6 sm:p-6">
        <CollaborationWorkspace rooms={rooms} />
      </div>
    </div>
  )
}
