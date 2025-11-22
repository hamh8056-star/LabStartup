"use client"

import { useMemo, useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  BarChart2,
  Filter,
  LayoutGrid,
  List,
  Search,
  Sparkles,
  TimerReset,
  Wand2,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { Simulation } from "@/lib/data/seed"
import { formatMinutes } from "@/lib/utils"

type SimulationsBrowserProps = {
  simulations: Simulation[]
  onLaunch?: (simulation: Simulation) => void
}

const difficultyLabels: Record<Simulation["difficulty"], string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
}

const difficultyOrder: Record<Simulation["difficulty"], number> = {
  debutant: 0,
  intermediaire: 1,
  avance: 2,
}

const sortOptions = [
  { value: "chronological", label: "Ordre d'origine" },
  { value: "duration-asc", label: "Durée croissante" },
  { value: "duration-desc", label: "Durée décroissante" },
  { value: "difficulty", label: "Difficulté" },
]

function getDisciplineLabel(discipline: Simulation["discipline"]) {
  switch (discipline) {
    case "chimie":
      return "Chimie"
    case "physique":
      return "Physique"
    case "biologie":
      return "Biologie"
    case "electronique":
      return "Électronique"
    case "informatique":
      return "Informatique"
    default:
      return discipline
  }
}

type Class = {
  id: string
  name: string
  discipline: string
  level: string
  studentIds: string[]
}

export function SimulationsBrowser({ simulations, onLaunch }: SimulationsBrowserProps) {
  const { data: session } = useSession()
  const isTeacher = session?.user?.role === "teacher" || session?.user?.role === "admin"
  
  const [searchQuery, setSearchQuery] = useState("")
  const [discipline, setDiscipline] = useState<string>("all")
  const [difficulty, setDifficulty] = useState<Simulation["difficulty"] | "all">("all")
  const [sortBy, setSortBy] = useState(sortOptions[0].value)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [tags, setTags] = useState<string[]>([])
  
  // État pour l'assignation
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null)
  const [openAssignDialog, setOpenAssignDialog] = useState(false)
  const [assignForm, setAssignForm] = useState({
    classId: "",
    title: "",
    instructions: "",
    dueDate: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Charger les classes de l'enseignant
  useEffect(() => {
    if (isTeacher) {
      fetch("/api/teacher/classes")
        .then(res => res.json())
        .then(data => {
          if (data.classes) {
            setClasses(data.classes)
          }
        })
        .catch(error => {
          console.error("Error fetching classes:", error)
        })
    }
  }, [isTeacher])

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    simulations.forEach(simulation => {
      simulation.tags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet)
  }, [simulations])

  const disciplines = useMemo(() => {
    const disc = new Set<Simulation["discipline"]>()
    simulations.forEach(simulation => disc.add(simulation.discipline))
    return Array.from(disc)
  }, [simulations])

  const filteredSimulations = useMemo(() => {
    let result = simulations.filter(simulation => {
      const matchesSearch =
        simulation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        simulation.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        simulation.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesDiscipline = discipline === "all" || simulation.discipline === discipline
      const matchesDifficulty = difficulty === "all" || simulation.difficulty === difficulty
      const matchesTags = tags.length === 0 || tags.every(tag => simulation.tags.includes(tag))

      return matchesSearch && matchesDiscipline && matchesDifficulty && matchesTags
    })

    switch (sortBy) {
      case "duration-asc":
        result = [...result].sort((a, b) => a.estimatedDuration - b.estimatedDuration)
        break
      case "duration-desc":
        result = [...result].sort((a, b) => b.estimatedDuration - a.estimatedDuration)
        break
      case "difficulty":
        result = [...result].sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty])
        break
      default:
        result = [...result]
    }

    return result
  }, [simulations, searchQuery, discipline, difficulty, tags, sortBy])

  const totalDuration = useMemo(
    () => filteredSimulations.reduce((acc, simulation) => acc + simulation.estimatedDuration, 0),
    [filteredSimulations],
  )

  const averageDuration = filteredSimulations.length ? Math.round(totalDuration / filteredSimulations.length) : 0

  const difficultyDistribution = useMemo(() => {
    return filteredSimulations.reduce(
      (acc, simulation) => {
        acc[simulation.difficulty] = (acc[simulation.difficulty] ?? 0) + 1
        return acc
      },
      {} as Record<Simulation["difficulty"], number>,
    )
  }, [filteredSimulations])

  const resetFilters = () => {
    setSearchQuery("")
    setDiscipline("all")
    setDifficulty("all")
    setSortBy("chronological")
    setTags([])
  }
  
  const handleOpenAssignDialog = (simulation: Simulation) => {
    setSelectedSimulation(simulation)
    setAssignForm({
      classId: "",
      title: simulation.title,
      instructions: "",
      dueDate: "",
    })
    setOpenAssignDialog(true)
  }
  
  const handleAssignSimulation = async () => {
    if (!selectedSimulation || !assignForm.classId || !assignForm.title.trim()) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }
    
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/teacher/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: assignForm.classId,
          simulationId: selectedSimulation.id,
          title: assignForm.title,
          instructions: assignForm.instructions || undefined,
          dueDate: assignForm.dueDate || null,
          status: "active",
        }),
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Erreur lors de l'assignation")
      }
      
      toast.success("Simulation assignée avec succès", {
        description: `La simulation a été assignée à la classe sélectionnée.`,
      })
      
      setOpenAssignDialog(false)
      setSelectedSimulation(null)
      setAssignForm({ classId: "", title: "", instructions: "", dueDate: "" })
    } catch (error) {
      toast.error("Erreur lors de l'assignation", {
        description: error instanceof Error ? error.message : "Une erreur est survenue",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr_auto]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une simulation, un concept, un tag..."
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={discipline} onValueChange={setDiscipline}>
          <SelectTrigger>
            <SelectValue placeholder="Discipline" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les disciplines</SelectItem>
            {disciplines.map(disc => (
              <SelectItem key={disc} value={disc}>
                {getDisciplineLabel(disc)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={difficulty} onValueChange={value => setDifficulty(value as typeof difficulty)}>
          <SelectTrigger>
            <SelectValue placeholder="Difficulté" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous niveaux</SelectItem>
            <SelectItem value="debutant">Débutant</SelectItem>
            <SelectItem value="intermediaire">Intermédiaire</SelectItem>
            <SelectItem value="avance">Avancé</SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="size-4" />
              Tags
              {tags.length ? <Badge variant="secondary">{tags.length}</Badge> : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {allTags.length ? (
              allTags.map(tag => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={tags.includes(tag)}
                  onCheckedChange={checked => {
                    setTags(prev => (checked ? [...prev, tag] : prev.filter(current => current !== tag)))
                  }}
                >
                  #{tag}
                </DropdownMenuCheckboxItem>
              ))
            ) : (
              <p className="px-2 py-1 text-xs text-muted-foreground">Aucun tag disponible</p>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-fit min-w-[220px]">
            <SelectValue placeholder="Trier par" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-2" onClick={resetFilters}>
          <TimerReset className="size-4" />
          Réinitialiser
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            className="rounded-xl"
            onClick={() => setViewMode("grid")}
            aria-label="Affichage en grille"
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            className="rounded-xl"
            onClick={() => setViewMode("table")}
            aria-label="Affichage en tableau"
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-white/80 backdrop-blur dark:bg-slate-950/70">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Simulations</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{filteredSimulations.length}</p>
            </div>
            <Sparkles className="size-6 text-primary" />
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-white/80 backdrop-blur dark:bg-slate-950/70">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Durée moyenne</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{formatMinutes(averageDuration)}</p>
            </div>
            <BarChart2 className="size-6 text-primary" />
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-white/80 backdrop-blur dark:bg-slate-950/70">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Niveaux actifs</p>
              <div className="mt-2 flex items-center gap-2">
                {Object.entries(difficultyDistribution).map(([diff, count]) => (
                  <Badge key={diff} variant="outline" className="capitalize">
                    {difficultyLabels[diff as Simulation["difficulty"]]} · {count}
                  </Badge>
                ))}
                {Object.keys(difficultyDistribution).length === 0 ? (
                  <Badge variant="outline">Aucun filtre</Badge>
                ) : null}
              </div>
            </div>
            <Wand2 className="size-6 text-primary" />
          </CardContent>
        </Card>
      </div>

      <Tabs value={viewMode} onValueChange={value => setViewMode(value as typeof viewMode)} className="flex-1">
        <TabsList className="hidden">
          <TabsTrigger value="grid">Grille</TabsTrigger>
          <TabsTrigger value="table">Tableau</TabsTrigger>
        </TabsList>
        <TabsContent value="grid" className="flex-1">
          {filteredSimulations.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredSimulations.map((simulation, index) => (
                <Card
                  key={`${simulation.id}-${index}`}
                  className="flex h-full flex-col border-border/60 bg-white/85 backdrop-blur transition hover:-translate-y-1 hover:shadow-xl dark:bg-slate-950/70"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="uppercase tracking-[0.3em]">
                        {getDisciplineLabel(simulation.discipline)}
                      </Badge>
                      <Badge variant="outline">{difficultyLabels[simulation.difficulty]}</Badge>
                    </div>
                    <CardTitle className="text-lg">{simulation.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{simulation.description}</p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-4 text-sm text-muted-foreground">
                    <div>
                      <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                        Objectifs
                      </Label>
                      <ul className="mt-2 space-y-1">
                        {simulation.objectives.map(objective => (
                          <li key={objective}>• {objective}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">{formatMinutes(simulation.estimatedDuration)}</Badge>
                      {simulation.tags.map(tag => (
                        <Badge key={tag} variant="outline">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 text-xs text-primary">
                      {simulation.assets.length ? (
                        <ul className="space-y-1">
                          {simulation.assets.map(asset => (
                            <li key={asset.url}>
                              {asset.type === "model3d" ? "🧪" : asset.type === "video" ? "🎞️" : "📄"} {asset.label}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>Aucun asset associé pour le moment.</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between gap-3 border-t border-border/60">
                    <Button variant="outline" size="sm" onClick={() => onLaunch?.(simulation)}>
                      Lancer
                    </Button>
                    {isTeacher && (
                      <Button size="sm" onClick={() => handleOpenAssignDialog(simulation)}>
                        Affecter à une classe
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState onReset={resetFilters} />
          )}
        </TabsContent>
        <TabsContent value="table" className="flex-1">
          {filteredSimulations.length ? (
            <Card className="border-border/60 bg-white/85 backdrop-blur dark:bg-slate-950/70">
              <CardContent className="p-0">
                <ScrollArea className="max-h-[640px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titre</TableHead>
                        <TableHead>Discipline</TableHead>
                        <TableHead>Difficulté</TableHead>
                        <TableHead>Durée</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSimulations.map((simulation, index) => (
                        <TableRow key={`${simulation.id}-${index}`}>
                          <TableCell className="font-medium">{simulation.title}</TableCell>
                          <TableCell>{getDisciplineLabel(simulation.discipline)}</TableCell>
                          <TableCell>{difficultyLabels[simulation.difficulty]}</TableCell>
                          <TableCell>{formatMinutes(simulation.estimatedDuration)}</TableCell>
                          <TableCell className="space-x-1">
                            {simulation.tags.map(tag => (
                              <Badge key={tag} variant="outline">
                                #{tag}
                              </Badge>
                            ))}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => onLaunch?.(simulation)}>
                                Lancer
                              </Button>
                              {isTeacher && (
                                <Button size="sm" onClick={() => handleOpenAssignDialog(simulation)}>
                                  Assigner
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          ) : (
            <EmptyState onReset={resetFilters} />
          )}
        </TabsContent>
      </Tabs>
      
      {/* Dialogue d'assignation */}
      <Dialog open={openAssignDialog} onOpenChange={setOpenAssignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assigner une simulation à une classe</DialogTitle>
            <DialogDescription>
              Créez une assignation pour que les étudiants de la classe sélectionnée puissent accéder à cette simulation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedSimulation && (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="text-sm font-medium">{selectedSimulation.title}</p>
                <p className="text-xs text-muted-foreground">{selectedSimulation.description}</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="classId">Classe *</Label>
              <Select
                value={assignForm.classId}
                onValueChange={value => setAssignForm(prev => ({ ...prev, classId: value }))}
              >
                <SelectTrigger id="classId">
                  <SelectValue placeholder="Sélectionner une classe" />
                </SelectTrigger>
                <SelectContent>
                  {classes.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Aucune classe disponible
                    </SelectItem>
                  ) : (
                    classes.map(klass => (
                      <SelectItem key={klass.id} value={klass.id}>
                        {klass.name} ({klass.studentIds.length} étudiant{klass.studentIds.length > 1 ? "s" : ""})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {classes.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Vous devez créer une classe avant de pouvoir assigner des simulations.
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Titre de l'assignation *</Label>
              <Input
                id="title"
                value={assignForm.title}
                onChange={e => setAssignForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: TP Simulation de diffraction"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions (optionnel)</Label>
              <Textarea
                id="instructions"
                value={assignForm.instructions}
                onChange={e => setAssignForm(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Instructions pour les étudiants..."
                rows={4}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueDate">Date d'échéance (optionnel)</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={assignForm.dueDate}
                onChange={e => setAssignForm(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAssignDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAssignSimulation}
              disabled={isSubmitting || !assignForm.classId || !assignForm.title.trim() || classes.length === 0}
            >
              {isSubmitting ? "Assignation..." : "Assigner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <Card className="border-dashed border-primary/30 bg-primary/5 text-primary">
      <CardHeader>
        <CardTitle className="text-lg">Aucun résultat</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>Ajustez vos filtres ou réinitialisez la recherche pour retrouver vos simulations.</p>
        <Button variant="secondary" size="sm" className="gap-2" onClick={onReset}>
          <TimerReset className="size-4" />
          Réinitialiser la page
        </Button>
      </CardContent>
    </Card>
  )
}

