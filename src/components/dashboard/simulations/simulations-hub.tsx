"use client"

import { useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Users } from "lucide-react"

import type { Simulation } from "@/lib/data/seed"
import { getSimulationDetail } from "@/lib/data/simulations-detail"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { SimulationsBrowser } from "@/components/dashboard/simulations/simulations-browser"
import { SimulationWorkspace } from "@/components/dashboard/simulations/simulation-workspace"

type SimulationsHubProps = {
  simulations: Simulation[]
}

export function SimulationsHub({ simulations }: SimulationsHubProps) {
  const { data: session } = useSession()
  const isStudent = session?.user?.role === "student"
  
  const [selectedSimulationId, setSelectedSimulationId] = useState<string | null>(simulations[0]?.id ?? null)
  const selectedSimulation = useMemo(
    () => simulations.find(simulation => simulation.id === selectedSimulationId) ?? null,
    [simulations, selectedSimulationId],
  )
  const detail = selectedSimulation ? getSimulationDetail(selectedSimulation.id) : null

  // Message pour les étudiants sans simulations assignées
  if (isStudent && simulations.length === 0) {
    return (
      <Card className="border-border/60 bg-card/90">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="mb-4 size-12 text-muted-foreground" />
          <CardTitle className="mb-2 text-xl">Aucune simulation assignée</CardTitle>
          <p className="mb-4 max-w-md text-sm text-muted-foreground">
            Votre enseignant n&apos;a pas encore assigné de simulations à votre classe.
            Contactez votre enseignant pour obtenir l&apos;accès aux simulations.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/90">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Bibliothèque de simulations</CardTitle>
              <p className="text-sm text-muted-foreground">
                {isStudent
                  ? "Simulations assignées par votre enseignant. Choisissez-en une pour commencer."
                  : "Choisissez un scénario pour lancer l&apos;environnement immersif et configurer vos paramètres."}
              </p>
            </div>
            {selectedSimulation ? (
              <Badge variant="secondary" className="uppercase tracking-[0.3em]">
                {selectedSimulation.discipline}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          <SimulationsBrowser simulations={simulations} onLaunch={simulation => setSelectedSimulationId(simulation.id)} />
        </CardContent>
      </Card>
      <SimulationWorkspace key={selectedSimulation?.id ?? "no-simulation"} simulation={selectedSimulation} />
      {detail ? (
        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="text-lg">Résumé de la simulation</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Instruments disponibles</p>
              <ul className="mt-2 space-y-1">
                {detail.instruments.map(instrument => (
                  <li key={instrument.id}>• {instrument.label}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Paramètres ajustables</p>
              <ul className="mt-2 space-y-1">
                {detail.parameters.map(parameter => (
                  <li key={parameter.id}>
                    • {parameter.label} ({parameter.min}-{parameter.max} {parameter.unit})
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}


