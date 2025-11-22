import { SimulationsHub } from "@/components/dashboard/simulations/simulations-hub"
import { DashboardTopbar } from "@/components/dashboard/topbar"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getSimulations } from "@/lib/data/service"
import { listAssignmentsByStudent } from "@/lib/teaching-db"
import { baseSimulations } from "@/lib/data/seed"
import { withFallback } from "@/lib/data/helpers"

export default async function DashboardSimulationsPage() {
  const session = await getServerSession(authOptions)
  
  let simulations: typeof baseSimulations = []
  
  // Si l'utilisateur est un étudiant, filtrer les simulations selon ses assignations
  if (session?.user?.role === "student" && session.user.id) {
    try {
      const assignments = await listAssignmentsByStudent(session.user.id)
      const allSimulations = await withFallback(
        () => getSimulations(),
        () => baseSimulations,
        "simulations",
      )
      
      // Extraire les IDs des simulations assignées
      const assignedSimulationIds = new Set(assignments.map(a => a.simulationId))
      
      // Filtrer pour ne garder que les simulations assignées
      simulations = allSimulations.filter(sim => 
        assignedSimulationIds.has(sim.id)
      )
    } catch (error) {
      console.error("[dashboard/simulations] Error filtering for student:", error)
      // En cas d'erreur, retourner une liste vide pour les étudiants
      simulations = []
    }
  } else {
    // Pour les enseignants et admins, retourner toutes les simulations
    simulations = await withFallback(
      () => getSimulations(),
      () => baseSimulations,
      "simulations",
    )
  }
  
  const subtitle = session?.user?.role === "student"
    ? "Accédez aux simulations assignées par votre enseignant."
    : "Manipulez des environnements 3D temps réel avec instrumentation virtuelle et scénarios guidés."

  return (
    <div className="flex h-full flex-col">
      <DashboardTopbar
        title="Simulations immersives"
        subtitle={subtitle}
      />
      <div className="flex-1 space-y-6 p-6">
        <SimulationsHub simulations={simulations} />
      </div>
    </div>
  )
}

