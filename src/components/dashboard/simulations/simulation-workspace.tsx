"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Float, OrbitControls, PerspectiveCamera, Stars, Html } from "@react-three/drei"
import { FolderDown, Play, RotateCcw, Save, Pause, Download, Loader2 } from "lucide-react"
import * as THREE from "three"

import type { Simulation } from "@/lib/data/seed"
import { getSimulationDetail, type SimulationDetail } from "@/lib/data/simulations-detail"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

type SimulationWorkspaceProps = {
  simulation: Simulation | null
}

type SimulationState = {
  gravity: number
  temperature: number
  progress: number
  customNotes: string
  parameterValues: Record<string, number>
  activeStageId?: string
  isRunning: boolean
}

function useSimulationState(simulationId: string | null, defaults: SimulationDetail | null) {
  const storageKey = simulationId ? `simulation-state:${simulationId}` : null

  const createInitialState = (): SimulationState => ({
    gravity: defaults?.environment.gravity ?? 9.81,
    temperature: defaults?.environment.temperature ?? 298,
    progress: 0,
    customNotes: "",
    parameterValues:
      defaults?.parameters.reduce<Record<string, number>>((acc, parameter) => {
        acc[parameter.id] = parameter.defaultValue
        return acc
      }, {}) ?? {},
    activeStageId: defaults?.stages[0]?.id,
    isRunning: false,
  })

  const [state, setState] = useState<SimulationState>(() => {
    if (!storageKey || typeof window === "undefined") {
      return createInitialState()
    }

    const stored = window.localStorage.getItem(storageKey)
    if (!stored) {
      return createInitialState()
    }

    try {
      const parsed = JSON.parse(stored) as SimulationState
      return parsed
    } catch {
      return createInitialState()
    }
  })

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return
    window.localStorage.setItem(storageKey, JSON.stringify(state))
  }, [state, storageKey])

  const reset = () => {
    if (!defaults) return
    setState(createInitialState())
    toast.success("Simulation réinitialisée", { description: "Tous les paramètres ont été restaurés." })
  }

  return { state, setState, reset }
}

type ParticleProps = {
  gravity: number
  temperature: number
  parameterValues: Record<string, number>
  progress: number
  isRunning: boolean
}

function EnergyParticleField({ gravity, temperature, parameterValues, progress, isRunning }: ParticleProps) {
  const meshRef = useRef<THREE.Points>(null)
  const [positions] = useState(() => {
    const count = 350
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i += 1) {
      arr[i * 3] = (Math.random() - 0.5) * 8
      arr[i * 3 + 1] = (Math.random() - 0.5) * 4
      arr[i * 3 + 2] = (Math.random() - 0.5) * 6
    }
    return arr
  })

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const positionsArray = meshRef.current.geometry.attributes.position.array as Float32Array
    const time = state.clock.getElapsedTime()
    const speedMultiplier = THREE.MathUtils.lerp(0.2, 1.2, progress / 100)
    for (let i = 0; i < positionsArray.length; i += 3) {
      const wave = Math.sin(time * (isRunning ? 1.5 : 0.8) + positionsArray[i] * temperature * 0.001)
      positionsArray[i + 1] -= gravity * 0.0005 * delta * speedMultiplier
      positionsArray[i] += wave * delta * 0.5 * speedMultiplier
      positionsArray[i + 2] += wave * delta * 0.3 * speedMultiplier
      if (positionsArray[i + 1] < -2) {
        positionsArray[i + 1] = 2
      }
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true
    const emissionStrength = THREE.MathUtils.clamp(parameterValues.wavelength ? parameterValues.wavelength / 700 : 0.6, 0.1, 1.5)
    ;(meshRef.current.material as THREE.PointsMaterial).size = 0.04 + emissionStrength * 0.05 + (isRunning ? 0.02 : 0)
  })

  const color = new THREE.Color().setHSL(0.6 - temperature / 600, 0.7, 0.5)

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.06} transparent depthWrite={false} />
    </points>
  )
}

type InstrumentProps = {
  instrumentId: string
  active?: boolean
  isRunning: boolean
}

function VirtualInstrument({ instrumentId, active, isRunning }: InstrumentProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const color = useMemo(() => new THREE.Color(active ? "#60a5fa" : "#94a3b8"), [active])
  useFrame(() => {
    if (!meshRef.current) return
    meshRef.current.rotation.y += isRunning ? 0.02 : 0.01
  })

  switch (instrumentId) {
    case "laser-azur":
      return (
        <mesh ref={meshRef} position={[2, 0.4, 0]}>
          <cylinderGeometry args={[0.15, 0.1, 1.6, 32]} />
          <meshStandardMaterial color={color} metalness={0.6} emissive={active ? "#2563eb" : "#1f2937"} emissiveIntensity={active ? 0.8 : 0.2} />
        </mesh>
      )
    case "capteur-photon":
      return (
        <mesh ref={meshRef} position={[-2, 0.4, 0]}>
          <boxGeometry args={[0.6, 0.4, 0.6]} />
          <meshStandardMaterial color={color} metalness={0.2} roughness={0.4} />
        </mesh>
      )
    case "microscope-holo":
      return (
        <mesh ref={meshRef} position={[0, 0.6, -1.5]}>
          <coneGeometry args={[0.6, 1.4, 32]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
        </mesh>
      )
    default:
      return (
        <mesh ref={meshRef} position={[0, 0.4, 1]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )
  }
}

export function SimulationWorkspace({ simulation }: SimulationWorkspaceProps) {
  const detail = simulation ? getSimulationDetail(simulation.id) : null
  const { state, setState, reset } = useSimulationState(simulation?.id ?? null, detail)
  const [activeInstrument, setActiveInstrument] = useState<string | null>(() => detail?.instruments[0]?.id ?? null)
  const progressTimerRef = useRef<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (!state.isRunning) {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current)
        progressTimerRef.current = null
      }
      return undefined
    }

    progressTimerRef.current = window.setInterval(() => {
      setState(current => {
        const nextProgress = Math.min(100, current.progress + 2)
        if (nextProgress >= 100) {
          window.clearInterval(progressTimerRef.current ?? undefined)
          progressTimerRef.current = null
          toast.success("Simulation terminée", { description: "Toutes les étapes ont été complétées avec succès." })
        }
        return {
          ...current,
          progress: nextProgress,
        }
      })
    }, 1500)

    return () => {
      if (progressTimerRef.current) {
        window.clearInterval(progressTimerRef.current)
        progressTimerRef.current = null
      }
    }
  }, [setState, state.isRunning])

  if (!simulation || !detail) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-primary/20 bg-primary/5 p-10 text-center text-sm text-muted-foreground">
        <p>Sélectionnez une simulation pour lancer l&apos;environnement 3D.</p>
        <p className="mt-2 text-xs">Choisissez un scénario depuis la bibliothèque pour commencer.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-3xl border border-border/60 bg-card/90 shadow-lg">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Simulation active</p>
            <p className="text-sm font-semibold text-foreground">{simulation.title}</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="secondary" className="uppercase tracking-[0.3em]">
              {simulation.discipline}
            </Badge>
            <Badge variant="outline">{simulation.difficulty}</Badge>
          </div>
        </div>
        <div className="relative aspect-video overflow-hidden rounded-b-3xl">
          <Canvas shadows dpr={[1, 2]}>
            <color attach="background" args={["#050b1b"]} />
            <PerspectiveCamera makeDefault position={[4, 3, 6]} />
            <ambientLight intensity={0.4} />
            <directionalLight position={[4, 10, 6]} intensity={1.4} castShadow />
            <Suspense fallback={<Html center>Chargement...</Html>}>
              <Float speed={state.isRunning ? 3 : 2} rotationIntensity={state.isRunning ? 1 : 0.6} floatIntensity={state.isRunning ? 1.2 : 0.8}>
                <EnergyParticleField
                  gravity={state.gravity}
                  temperature={state.temperature}
                  parameterValues={state.parameterValues}
                  progress={state.progress}
                  isRunning={state.isRunning}
                />
              </Float>
              {detail.instruments.map(instrument => (
                <VirtualInstrument
                  key={instrument.id}
                  instrumentId={instrument.id}
                  active={activeInstrument === instrument.id}
                  isRunning={state.isRunning}
                />
              ))}
            </Suspense>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]} receiveShadow>
              <planeGeometry args={[20, 20]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <Stars radius={50} depth={20} count={5000} factor={4} saturation={0} fade />
            <OrbitControls enablePan enableZoom />
          </Canvas>
        </div>
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paramètres physiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <Label>Gravité ({state.gravity.toFixed(2)} m/s²)</Label>
              <Slider
                min={0}
                max={20}
                step={0.1}
                value={[state.gravity]}
                onValueChange={([value]) => setState(current => ({ ...current, gravity: value }))}
              />
            </div>
            <div>
              <Label>Température ({Math.round(state.temperature)} K)</Label>
              <Slider
                min={250}
                max={400}
                value={[state.temperature]}
                onValueChange={([value]) => setState(current => ({ ...current, temperature: value }))}
              />
            </div>
            {detail.parameters.map(parameter => (
              <div key={parameter.id}>
                <Label>
                  {parameter.label} ({state.parameterValues[parameter.id]?.toFixed(2) ?? parameter.defaultValue} {parameter.unit})
                </Label>
                <Slider
                  min={parameter.min}
                  max={parameter.max}
                  step={(parameter.max - parameter.min) / 100}
                  value={[state.parameterValues[parameter.id] ?? parameter.defaultValue]}
                  onValueChange={([value]) =>
                    setState(current => ({
                      ...current,
                      parameterValues: {
                        ...current.parameterValues,
                        [parameter.id]: value,
                      },
                    }))
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Instruments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {detail.instruments.map(instrument => (
              <button
                key={instrument.id}
                type="button"
                onClick={() => setActiveInstrument(instrument.id)}
                className="w-full rounded-xl border border-border/60 bg-muted/20 px-3 py-2 text-left transition hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{instrument.label}</span>
                    <div className="flex items-center gap-2">
                      {activeInstrument === instrument.id ? <Badge variant="outline">Actif</Badge> : null}
                      {state.isRunning && activeInstrument === instrument.id ? (
                        <Badge variant="secondary">En cours</Badge>
                      ) : null}
                    </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{instrument.description}</p>
              </button>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progression</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Tabs
              value={state.activeStageId ?? detail.stages[0]?.id}
              onValueChange={value =>
                setState(current => ({
                  ...current,
                  activeStageId: value,
                  progress: (detail.stages.findIndex(stage => stage.id === value) / detail.stages.length) * 100,
                }))
              }
            >
              <TabsList className="grid grid-cols-3">
                {detail.stages.map(stage => (
                  <TabsTrigger key={stage.id} value={stage.id}>
                    {stage.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {detail.stages.map(stage => (
                <TabsContent key={stage.id} value={stage.id} className="space-y-3">
                  <p className="font-medium text-foreground">{stage.objective}</p>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    {stage.instructions.map(instruction => (
                      <li key={instruction}>• {instruction}</li>
                    ))}
                  </ul>
                </TabsContent>
              ))}
            </Tabs>
            <div>
              <Label>Notes personnelles</Label>
              <Textarea
                placeholder="Consignez vos observations, variantes d'expérience..."
                value={state.customNotes}
                onChange={event => setState(current => ({ ...current, customNotes: event.target.value }))}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={async () => {
                  if (!simulation) return
                  
                  setIsSaving(true)
                  try {
                    // Sauvegarder sur le serveur (optionnel, pour synchronisation multi-appareils)
                    const response = await fetch("/api/simulations/save", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        simulationId: simulation.id,
                        state: {
                          gravity: state.gravity,
                          temperature: state.temperature,
                          progress: state.progress,
                          customNotes: state.customNotes,
                          parameterValues: state.parameterValues,
                          activeStageId: state.activeStageId,
                          isRunning: state.isRunning,
                        },
                      }),
                    })
                    
                    if (response.ok) {
                      toast.success("Progression enregistrée", { 
                        description: "Vos notes et paramètres ont été sauvegardés localement et sur le serveur." 
                      })
                    } else {
                      // Même en cas d'erreur serveur, la sauvegarde locale fonctionne
                      toast.success("Progression enregistrée localement", { 
                        description: "Vos données sont sauvegardées dans votre navigateur." 
                      })
                    }
                  } catch (error) {
                    // La sauvegarde locale fonctionne toujours via localStorage
                    toast.success("Progression enregistrée localement", { 
                      description: "Vos données sont sauvegardées dans votre navigateur." 
                    })
                  } finally {
                    setIsSaving(false)
                  }
                }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Sauvegarder
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={async () => {
                  if (!simulation || !detail) return
                  
                  setIsExporting(true)
                  try {
                    const exportData = {
                      simulation: {
                        id: simulation.id,
                        title: simulation.title,
                        discipline: simulation.discipline,
                        description: simulation.description,
                      },
                      state: {
                        gravity: state.gravity,
                        temperature: state.temperature,
                        progress: state.progress,
                        customNotes: state.customNotes,
                        parameterValues: state.parameterValues,
                        activeStageId: state.activeStageId,
                        isRunning: state.isRunning,
                      },
                      instruments: detail.instruments.map(instr => ({
                        id: instr.id,
                        label: instr.label,
                        active: activeInstrument === instr.id,
                      })),
                      stages: detail.stages.map(stage => ({
                        id: stage.id,
                        label: stage.label,
                        objective: stage.objective,
                        completed: detail.stages.findIndex(s => s.id === stage.id) <= detail.stages.findIndex(s => s.id === state.activeStageId),
                      })),
                      exportedAt: new Date().toISOString(),
                      exportedBy: "user", // Peut être amélioré avec le nom d'utilisateur
                    }
                    
                    const jsonString = JSON.stringify(exportData, null, 2)
                    const blob = new Blob([jsonString], { type: "application/json" })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `simulation-${simulation.id}-${new Date().toISOString().split("T")[0]}.json`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                    
                    toast.success("Simulation exportée", {
                      description: `Les données ont été téléchargées au format JSON.`,
                    })
                  } catch (error) {
                    toast.error("Erreur lors de l'export", {
                      description: "Impossible d'exporter les données de la simulation.",
                    })
                  } finally {
                    setIsExporting(false)
                  }
                }}
                disabled={isExporting}
              >
                {isExporting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FolderDown className="size-4" />
                )}
                Exporter
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="gap-2"
                onClick={() => {
                  if (state.isRunning) {
                    setState(current => ({ ...current, isRunning: false }))
                  }
                  reset()
                }}
                disabled={isSaving || isExporting}
              >
                <RotateCcw className="size-4" />
                Réinitialiser
              </Button>
              <Button
                size="sm"
                className="gap-2"
                variant={state.isRunning ? "secondary" : "default"}
                onClick={() => {
                  setState(current => ({
                    ...current,
                    isRunning: !current.isRunning,
                    progress: current.isRunning ? current.progress : current.progress || 5,
                  }))
                  toast.success(state.isRunning ? "Simulation en pause" : "Simulation lancée", {
                    description: state.isRunning
                      ? "Vous pouvez reprendre à tout moment."
                      : "Le scénario complet est en cours d'exécution.",
                  })
                }}
                disabled={isSaving || isExporting}
              >
                {state.isRunning ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4" />
                )}
                {state.isRunning ? "Mettre en pause" : "Démarrer la simulation"}
              </Button>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
              <p className="font-medium">
                Progression globale : <span className="text-base font-semibold">{Math.round(state.progress)}%</span>
              </p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-primary/10">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, state.progress))}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

