"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import {
  Award,
  BadgeCheck,
  Brain,
  CalendarClock,
  CheckCircle2,
  Filter,
  History,
  LayoutGrid,
  List,
  Medal,
  NotebookPen,
  Search,
  Sparkles,
  Target,
  Users,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

import type { EvaluationSummary } from "@/lib/evaluations-db"

type EvaluationRecord = EvaluationSummary

type EvaluationsBrowserProps = {
  evaluations: EvaluationRecord[]
}

const sortOptions = [
  { value: "title", label: "Nom A → Z" },
  { value: "completion", label: "Taux de complétion" },
  { value: "progress", label: "Progression moyenne" },
]

const SAMPLE_GROUPS = [
  { id: "groupe-a", name: "Groupe A — Physique L2", size: 28 },
  { id: "groupe-b", name: "Groupe B — Biologie L1", size: 34 },
  { id: "groupe-c", name: "Groupe C — Masters Circuits", size: 18 },
]

const SAMPLE_SCHEDULES = [
  { id: "slot-1", label: "Mercredi 10h • Salle VR 2" },
  { id: "slot-2", label: "Jeudi 14h • Amphithéâtre" },
  { id: "slot-3", label: "Vendredi 18h • Distanciel" },
]

export function EvaluationsBrowser({ evaluations }: EvaluationsBrowserProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState<EvaluationRecord["difficulty"] | "all">("all")
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [sortBy, setSortBy] = useState(sortOptions[1].value)
  const [statusFilter, setStatusFilter] = useState<"all" | EvaluationRecord["status"]>("all")
  const [openPlanning, setOpenPlanning] = useState<EvaluationRecord | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string>(SAMPLE_GROUPS[0]?.id ?? "")
  const [selectedSchedule, setSelectedSchedule] = useState<string>(SAMPLE_SCHEDULES[0]?.id ?? "")
  const [instructions, setInstructions] = useState<string>("")
  const [certEvaluation, setCertEvaluation] = useState<EvaluationRecord | null>(null)
  const [certForm, setCertForm] = useState({ owner: "", email: "", badge: "explorateur" as "explorateur" | "innovateur" | "mentor", score: 80 })
  const [isIssuingCertificate, startIssueTransition] = useTransition()

  const tags = useMemo(() => {
    const set = new Set<string>()
    evaluations.forEach(evaluation => evaluation.tags.forEach(tag => set.add(tag)))
    return Array.from(set)
  }, [evaluations])


  const filteredEvaluations = useMemo(() => {
    let result = evaluations.filter(evaluation => {
      const matchesSearch =
        evaluation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        evaluation.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesDifficulty = difficultyFilter === "all" || evaluation.difficulty === difficultyFilter
      const matchesTags = tagFilter.length === 0 || tagFilter.every(tag => evaluation.tags.includes(tag))
      const matchesStatus = statusFilter === "all" || evaluation.status === statusFilter

      return matchesSearch && matchesDifficulty && matchesTags && matchesStatus
    })

    switch (sortBy) {
      case "completion":
        result = [...result].sort((a, b) => b.completion - a.completion)
        break
      case "progress":
        result = [...result].sort(
          (a, b) => b.postQuizScore - b.preQuizScore - (a.postQuizScore - a.preQuizScore),
        )
        break
      case "title":
      default:
        result = [...result].sort((a, b) => a.title.localeCompare(b.title))
    }

    return result
  }, [evaluations, searchQuery, difficultyFilter, statusFilter, tagFilter, sortBy])

  const averageCompletion = filteredEvaluations.length
    ? Math.round(
        (filteredEvaluations.reduce((acc, evaluation) => acc + evaluation.completion, 0) /
          filteredEvaluations.length) *
          100,
      )
    : 0

  const averageProgress = filteredEvaluations.length
    ? Math.round(
        filteredEvaluations.reduce((acc, evaluation) => acc + (evaluation.postQuizScore - evaluation.preQuizScore), 0) /
          filteredEvaluations.length,
      )
    : 0

  const statusCounts = filteredEvaluations.reduce(
    (acc, evaluation) => {
      acc[evaluation.status] = (acc[evaluation.status] ?? 0) + 1
      return acc
    },
    { pending: 0, completed: 0, certified: 0 } as Record<EvaluationRecord["status"], number>,
  )

  const resetFilters = () => {
    setSearchQuery("")
    setDifficultyFilter("all")
    setTagFilter([])
    setSortBy(sortOptions[1].value)
    setStatusFilter("all")
  }


  const openCertificateDialog = (evaluation: EvaluationRecord) => {
    setCertEvaluation(evaluation)
    const suggestedBadge = evaluation.postQuizScore >= 90 ? "mentor" : evaluation.postQuizScore >= 80 ? "innovateur" : "explorateur"
    setCertForm({ owner: "", email: "", badge: suggestedBadge, score: Math.round(evaluation.postQuizScore) })
  }

  const submitCertificate = () => {
    if (!certEvaluation) return
    if (!certForm.owner.trim()) {
      toast.error("Nom requis", { description: "Indiquez l'apprenant·e à certifier." })
      return
    }
    startIssueTransition(async () => {
      try {
        const response = await fetch("/api/certifications/issue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            evaluationId: certEvaluation.id,
            simulationId: certEvaluation.simulationId,
            simulationTitle: certEvaluation.title,
            owner: certForm.owner,
            email: certForm.email || undefined,
            badge: certForm.badge,
            score: certForm.score,
            discipline: certEvaluation.discipline,
          }),
        })
        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          throw new Error(payload?.message ?? "Erreur d'émission")
        }
        const payload = await response.json()
        toast.success("Certificat envoyé", {
          description: `Référence ${payload.certificate?.id ?? ""}`,
        })
        setCertEvaluation(null)
        router.refresh()
      } catch (error) {
        console.error(error)
        toast.error("Impossible d'émettre le certificat.")
      }
    })
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une évaluation, un badge ou un tag..."
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={difficultyFilter} onValueChange={value => setDifficultyFilter(value as typeof difficultyFilter)}>
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="all">Tous niveaux</TabsTrigger>
            <TabsTrigger value="facile">Facile</TabsTrigger>
            <TabsTrigger value="intermediaire">Intermédiaire</TabsTrigger>
            <TabsTrigger value="avance">Avancé</TabsTrigger>
          </TabsList>
        </Tabs>
        <Tabs value={statusFilter} onValueChange={value => setStatusFilter(value as typeof statusFilter)}>
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="all">Statuts</TabsTrigger>
            <TabsTrigger value="pending">En cours</TabsTrigger>
            <TabsTrigger value="completed">À certifier</TabsTrigger>
            <TabsTrigger value="certified">Certifiés</TabsTrigger>
          </TabsList>
        </Tabs>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="size-4" />
              Tags
              {tagFilter.length ? <Badge variant="secondary">{tagFilter.length}</Badge> : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {tags.length ? (
              tags.map(tag => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={tagFilter.includes(tag)}
                  onCheckedChange={checked =>
                    setTagFilter(prev => (checked ? [...prev, tag] : prev.filter(current => current !== tag)))
                  }
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
        <Tabs value={sortBy} onValueChange={value => setSortBy(value)} className="w-fit">
          <TabsList className="grid grid-cols-3">
            {sortOptions.map(option => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" onClick={resetFilters} className="gap-2">
          <Filter className="size-4" />
          Réinitialiser
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            className="rounded-xl"
            onClick={() => setViewMode("grid")}
            aria-label="Affichage en cartes"
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
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Évaluations actives</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{filteredEvaluations.length}</p>
            </div>
            <BadgeCheck className="size-6 text-primary" />
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-white/80 backdrop-blur dark:bg-slate-950/70">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Complétion moyenne</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{averageCompletion}%</p>
            </div>
            <CheckCircle2 className="size-6 text-primary" />
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-white/80 backdrop-blur dark:bg-slate-950/70">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Progression moyenne</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">+{averageProgress} pts</p>
            </div>
            <Brain className="size-6 text-primary" />
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-white/80 backdrop-blur dark:bg-slate-950/70">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Répartition des statuts</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">En cours {statusCounts.pending}</Badge>
                <Badge variant="outline">À certifier {statusCounts.completed}</Badge>
                <Badge variant="outline">Certifiés {statusCounts.certified}</Badge>
              </div>
            </div>
            <Users className="size-6 text-primary" />
          </CardContent>
        </Card>
      </div>

      <Tabs value={viewMode} onValueChange={value => setViewMode(value as typeof viewMode)} className="flex-1">
        <TabsList className="hidden">
          <TabsTrigger value="grid">Cartes</TabsTrigger>
          <TabsTrigger value="table">Tableau</TabsTrigger>
        </TabsList>
        <TabsContent value="grid" className="flex-1">
          {filteredEvaluations.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredEvaluations.map(evaluation => (
                <Card
                  key={evaluation.id}
                  className="flex h-full flex-col border-border/60 bg-white/85 backdrop-blur transition hover:-translate-y-1 hover:shadow-xl dark:bg-slate-950/70"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="uppercase tracking-[0.3em]">
                        {evaluation.discipline}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {evaluation.difficulty}
                      </Badge>
                      <StatusLabel status={evaluation.status} />
                    </div>
                    <CardTitle className="text-lg">{evaluation.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Taux de progression : {evaluation.preQuizScore}% → {evaluation.postQuizScore}%.
                    </p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 text-xs text-primary">
                      <span className="flex items-center gap-2 font-medium uppercase tracking-[0.3em] text-primary/80">
                        <CalendarClock className="size-4" />
                        Durée estimée
                      </span>
                      <span>{evaluation.duration} min</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline">Complétion {Math.round(evaluation.completion * 100)}%</Badge>
                      {evaluation.tags.map(tag => (
                        <Badge key={tag} variant="outline">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between gap-3 border-t border-border/60">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2" 
                        onClick={() => router.push(`/dashboard/evaluations/${evaluation.id}`)}
                      >
                        <History className="size-4" />
                        Historique
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => router.push(`/dashboard/evaluations/${evaluation.id}/quiz?mode=pre`)}
                      >
                        <Target className="size-4" />
                        Lancer un quiz
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          setSelectedGroup(SAMPLE_GROUPS[0]?.id ?? "")
                          setSelectedSchedule(SAMPLE_SCHEDULES[0]?.id ?? "")
                          setInstructions(
                            `Consignes :\n- Préparer le matériel spécifique\n- Rappeler les objectifs pédagogiques\n- Activer les retours IA.`,
                          )
                          setOpenPlanning(evaluation)
                        }}
                      >
                        <NotebookPen className="size-4" />
                        Planifier
                      </Button>
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => openCertificateDialog(evaluation)}
                        disabled={Boolean(evaluation.issuedCertId)}
                      >
                        <Award className="size-4" />
                        Certifier
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState onReset={resetFilters} />
          )}
        </TabsContent>
        <TabsContent value="table" className="flex-1">
          {filteredEvaluations.length ? (
            <Card className="border-border/60 bg-white/85 backdrop-blur dark:bg-slate-950/70">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Intitulé</TableHead>
                      <TableHead>Niveau</TableHead>
                      <TableHead>Durée</TableHead>
                      <TableHead>Pré / Post Quiz</TableHead>
                      <TableHead>Complétion</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvaluations.map(evaluation => (
                      <TableRow key={evaluation.id}>
                        <TableCell className="font-medium">{evaluation.title}</TableCell>
                        <TableCell className="capitalize">{evaluation.difficulty}</TableCell>
                        <TableCell>{evaluation.duration} min</TableCell>
                        <TableCell>
                          {evaluation.preQuizScore}% → {evaluation.postQuizScore}%
                        </TableCell>
                        <TableCell>
                          {Math.round(evaluation.completion * 100)}% <StatusLabel status={evaluation.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => router.push(`/dashboard/evaluations/${evaluation.id}`)}
                            >
                              Historique
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/dashboard/evaluations/${evaluation.id}/quiz?mode=pre`)}
                            >
                              Quiz
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedGroup(SAMPLE_GROUPS[0]?.id ?? "")
                                setSelectedSchedule(SAMPLE_SCHEDULES[0]?.id ?? "")
                                setInstructions(
                                  `Consignes :\n- Préparer le matériel spécifique\n- Rappeler les objectifs pédagogiques\n- Activer les retours IA.`,
                                )
                                setOpenPlanning(evaluation)
                              }}
                            >
                              Planifier
                            </Button>
                            <Button size="sm" onClick={() => openCertificateDialog(evaluation)} disabled={Boolean(evaluation.issuedCertId)}>
                              Certifier
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <EmptyState onReset={resetFilters} />
          )}
        </TabsContent>
      </Tabs>
      <Dialog open={Boolean(openPlanning)} onOpenChange={open => !open && setOpenPlanning(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Planifier {openPlanning?.title}</DialogTitle>
            <DialogDescription>
              Choisissez le groupe concerné, le créneau et indiquez les instructions de lancement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <Label>Cours / Groupe</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un groupe" />
                </SelectTrigger>
                <SelectContent>
                  {SAMPLE_GROUPS.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name} • {group.size} étudiants
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Créneau</Label>
              <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un créneau" />
                </SelectTrigger>
                <SelectContent>
                  {SAMPLE_SCHEDULES.map(schedule => (
                    <SelectItem key={schedule.id} value={schedule.id}>
                      {schedule.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Instructions envoyées aux étudiants</Label>
              <Textarea
                className="min-h-[140px]"
                value={instructions}
                onChange={event => setInstructions(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setOpenPlanning(null)}>
              Annuler
            </Button>
            <Button
              className="gap-2"
              onClick={() => {
                if (openPlanning) {
                  toast.success("Évaluation planifiée", {
                    description: `${openPlanning.title} prévu pour ${SAMPLE_GROUPS.find(group => group.id === selectedGroup)?.name ?? "votre groupe"} — ${SAMPLE_SCHEDULES.find(schedule => schedule.id === selectedSchedule)?.label ?? ""}.`,
                  })
                }
                setOpenPlanning(null)
              }}
            >
              <NotebookPen className="size-4" />
              Confirmer la planification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={Boolean(certEvaluation)} onOpenChange={open => !open && setCertEvaluation(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Émettre un certificat</DialogTitle>
            <DialogDescription>
              Renseignez l&apos;apprenant·e concerné·e et choisissez le badge correspondant au niveau atteint.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <Label>Nom et prénom</Label>
              <Input
                placeholder="Ex. Nora Lefebvre"
                value={certForm.owner}
                onChange={event => setCertForm(prev => ({ ...prev, owner: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Email (facultatif)</Label>
              <Input
                type="email"
                placeholder="prenom.nom@univ-setif.dz"
                value={certForm.email}
                onChange={event => setCertForm(prev => ({ ...prev, email: event.target.value }))}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Badge</Label>
                <Select
                  value={certForm.badge}
                  onValueChange={value => setCertForm(prev => ({ ...prev, badge: value as typeof certForm.badge }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="explorateur">Explorateur</SelectItem>
                    <SelectItem value="innovateur">Innovateur</SelectItem>
                    <SelectItem value="mentor">Mentor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Score</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={certForm.score}
                  onChange={event =>
                    setCertForm(prev => ({ ...prev, score: Number(event.target.value) || 0 }))
                  }
                />
              </div>
            </div>
            <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 text-xs text-primary">
              Le badge sélectionné sera enregistré dans l&apos;historique et le certificat sera disponible au téléchargement.
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setCertEvaluation(null)}>
              Annuler
            </Button>
            <Button className="gap-2" onClick={submitCertificate} disabled={isIssuingCertificate}>
              {isIssuingCertificate ? <Loader2 className="size-4 animate-spin" /> : <Medal className="size-4" />}
              {isIssuingCertificate ? "Émission..." : "Émettre le certificat"}
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
        <CardTitle className="text-lg">Aucune évaluation trouvée</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>Modifiez vos critères de recherche ou réinitialisez les filtres pour revoir toutes les évaluations.</p>
        <Button variant="secondary" size="sm" className="gap-2" onClick={onReset}>
          Réinitialiser
        </Button>
      </CardContent>
    </Card>
  )
}

function StatusLabel({ status }: { status: EvaluationRecord["status"] }) {
  switch (status) {
    case "pending":
      return <Badge variant="outline">En cours</Badge>
    case "completed":
      return <Badge variant="outline">À certifier</Badge>
    case "certified":
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <BadgeCheck className="size-3" />
          Certifié
        </Badge>
      )
  }
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border/60 bg-white/80 backdrop-blur dark:bg-slate-950/70">
      <CardContent className="space-y-2 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  )
}


