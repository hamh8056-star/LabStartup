import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { getSimulations } from "@/lib/data/service"
import { listAssignmentsByStudent } from "@/lib/teaching-db"
import { baseSimulations } from "@/lib/data/seed"

export async function GET() {
  const session = await getServerSession(authOptions)
  
  // Si l'utilisateur est un étudiant, filtrer les simulations selon ses assignations
  if (session?.user?.role === "student" && session.user.id) {
    try {
      const assignments = await listAssignmentsByStudent(session.user.id)
      const allSimulations = await getSimulations().catch(() => baseSimulations)
      
      // Extraire les IDs des simulations assignées
      const assignedSimulationIds = new Set(assignments.map(a => a.simulationId))
      
      // Filtrer pour ne garder que les simulations assignées
      const filteredSimulations = allSimulations.filter(sim => 
        assignedSimulationIds.has(sim.id)
      )
      
      return NextResponse.json({
        data: filteredSimulations,
      })
    } catch (error) {
      console.error("[api/simulations] Error filtering for student:", error)
      // En cas d'erreur, retourner une liste vide pour les étudiants
      return NextResponse.json({
        data: [],
      })
    }
  }
  
  // Pour les enseignants et admins, retourner toutes les simulations
  const simulations = await getSimulations().catch(() => baseSimulations)

  return NextResponse.json({
    data: simulations,
  })
}

