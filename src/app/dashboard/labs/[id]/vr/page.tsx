import { notFound } from "next/navigation"
import { getLabs } from "@/lib/data/service"
import { baseLabs } from "@/lib/data/seed"
import { withFallback } from "@/lib/data/helpers"
import { VirtualLabVRView } from "@/components/dashboard/labs/virtual-lab-vr-view"

type PageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function LabVRPage({ params }: PageProps) {
  const { id } = await params
  const labs = await withFallback(() => getLabs(), () => baseLabs, "labs")
  const lab = labs.find(l => l.id === id)

  if (!lab) {
    notFound()
  }

  return <VirtualLabVRView lab={lab} />
}

