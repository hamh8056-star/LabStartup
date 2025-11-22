"use client"

import Link from "next/link"
import { useMemo, useState, useEffect, useTransition, type ComponentType, type ReactNode } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import useSWR from "swr"
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  FileText,
  Filter,
  GraduationCap,
  PlayCircle,
  Search,
  Sparkles,
  Target,
  Plus,
  Loader2,
} from "lucide-react"

import type { GlossaryEntry, LearningResource } from "@/lib/data/seed"
import type { ResourceStats } from "@/lib/resources-db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then(response => response.json())

const typeMeta: Record<LearningResource["type"], { label: string; icon: ComponentType<{ className?: string }> }> = {
  fiche: { label: "Fiche", icon: FileText },
  manuel: { label: "Manuel", icon: BookOpen },
  video: { label: "Vidéo", icon: PlayCircle },
  animation: { label: "Animation", icon: Sparkles },
  exercice: { label: "Exercice", icon: Target },
}

const disciplineLabels: Record<string, string> = {
  physique: "Physique",
  chimie: "Chimie",
  biologie: "Biologie",
  electronique: "Électronique",
  informatique: "Informatique",
}

const levelLabels: Record<string, string> = {
  college: "Collège",
  lycee: "Lycée",
  universite: "Université",
}

const disciplines = ["all", "physique", "chimie", "biologie", "electronique", "informatique"]
const levels = ["all", "college", "lycee", "universite"]
const typeOrder: LearningResource["type"][] = ["fiche", "manuel", "video", "animation", "exercice"]

type ResourcesWorkspaceProps = {
  initialResources: LearningResource[]
  initialStats: ResourceStats
  initialGlossary: GlossaryEntry[]
  initialDiscipline?: string
  initialInstrument?: string
  initialType?: string
}

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(handle)
  }, [value, delay])

  return debounced
}

export function ResourcesWorkspace({ 
  initialResources, 
  initialStats, 
  initialGlossary,
  initialDiscipline,
  initialInstrument,
  initialType,
}: ResourcesWorkspaceProps) {
  const searchParams = useSearchParams()
  
  // Lire les paramètres de l'URL au chargement
  const urlDiscipline = initialDiscipline || searchParams.get("discipline") || "all"
  const urlInstrument = initialInstrument || searchParams.get("instrument") || ""
  const urlType = initialType || searchParams.get("type") || "all"
  
  const [query, setQuery] = useState(urlInstrument || "")
  const [activeType, setActiveType] = useState<string>(urlType)
  const [disciplineFilter, setDisciplineFilter] = useState<string>(urlDiscipline)
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [glossaryQuery, setGlossaryQuery] = useState("")
  const [selectedResourceId, setSelectedResourceId] = useState<string>(initialResources[0]?.id ?? "")
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set())
  const router = useRouter()
  const { data: session } = useSession()
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [isSubmitting, startTransition] = useTransition()
  
  // Formulaire de création de ressource
  const [formData, setFormData] = useState({
    title: "",
    type: "fiche" as LearningResource["type"],
    discipline: "physique" as LearningResource["discipline"],
    summary: "",
    duration: 0,
    level: "college" as LearningResource["level"],
    format: "pdf" as LearningResource["format"],
    url: "",
    tags: "",
    // Champs optionnels
    attachments: [] as Array<{ label: string; type: string; url: string }>,
    manualSections: [] as Array<{ title: string; content: string }>,
    manualSafety: [] as string[],
    manualPrerequisites: [] as string[],
    videoPlatform: "internal" as "youtube" | "vimeo" | "internal",
    videoAspectRatio: "",
    videoDuration: 0,
    videoChapters: [] as Array<{ title: string; timecode: string }>,
    videoDownloadUrl: "",
    videoCaptions: [] as string[],
    interactiveObjective: "",
    interactiveSteps: [] as Array<{ title: string; action: string; hint?: string; expectedResult?: string }>,
    interactiveCorrection: [] as string[],
    exerciseDifficulty: "facile" as "facile" | "intermediaire" | "avance",
    exerciseMaxPoints: 100,
    exerciseSuccessThreshold: 70,
  })

  const canCreateResource = session?.user?.role === "teacher" || session?.user?.role === "admin"

  // Mettre à jour les filtres si l'URL change
  useEffect(() => {
    const urlDisciplineParam = searchParams.get("discipline")
    const urlInstrumentParam = searchParams.get("instrument")
    const urlTypeParam = searchParams.get("type")
    
    if (urlDisciplineParam && urlDisciplineParam !== disciplineFilter) {
      setDisciplineFilter(urlDisciplineParam)
    }
    if (urlInstrumentParam && urlInstrumentParam !== query) {
      setQuery(urlInstrumentParam)
    }
    if (urlTypeParam && urlTypeParam !== activeType) {
      setActiveType(urlTypeParam)
    }
  }, [searchParams, disciplineFilter, query, activeType])

  const debouncedQuery = useDebouncedValue(query)
  const debouncedGlossaryQuery = useDebouncedValue(glossaryQuery)

  const resourceParams = useMemo(() => {
    const params = new URLSearchParams()
    if (debouncedQuery) params.set("q", debouncedQuery)
    if (activeType !== "all") params.append("type", activeType)
    if (disciplineFilter !== "all") params.set("discipline", disciplineFilter)
    if (levelFilter !== "all") params.set("level", levelFilter)
    return params
  }, [debouncedQuery, activeType, disciplineFilter, levelFilter])

  const glossaryParams = useMemo(() => {
    const params = new URLSearchParams()
    if (debouncedGlossaryQuery) params.set("q", debouncedGlossaryQuery)
    if (disciplineFilter !== "all") params.set("discipline", disciplineFilter)
    return params
  }, [debouncedGlossaryQuery, disciplineFilter])

  const { data: resourceData } = useSWR<{ resources: LearningResource[]; stats: ResourceStats }>(
    `/api/resources?${resourceParams.toString()}`,
    fetcher,
    {
      fallbackData: { resources: initialResources, stats: initialStats },
    },
  )

  const { data: glossaryData } = useSWR<{ entries: GlossaryEntry[]; total: number }>(
    `/api/resources/glossary?${glossaryParams.toString()}`,
    fetcher,
    {
      fallbackData: { entries: initialGlossary, total: initialGlossary.length },
    },
  )

  // Dédupliquer les ressources par ID pour éviter les clés dupliquées
  const resources = useMemo(() => {
    const resourcesList = resourceData?.resources ?? []
    const seen = new Set<string>()
    return resourcesList.filter(resource => {
      if (seen.has(resource.id)) {
        return false
      }
      seen.add(resource.id)
      return true
    })
  }, [resourceData])
  const stats = useMemo(() => resourceData?.stats ?? initialStats, [resourceData, initialStats])
  // Dédupliquer les entrées du glossaire par ID pour éviter les clés dupliquées
  const glossaryEntries = useMemo(() => {
    const entriesList = glossaryData?.entries ?? []
    const seen = new Set<string>()
    return entriesList.filter(entry => {
      if (seen.has(entry.id)) {
        return false
      }
      seen.add(entry.id)
      return true
    })
  }, [glossaryData])

  const displayResourceId = useMemo(() => {
    if (!resources.length) return ""
    return resources.some(resource => resource.id === selectedResourceId)
      ? selectedResourceId
      : resources[0].id
  }, [resources, selectedResourceId])

  const selectedResource = useMemo(
    () => resources.find(resource => resource.id === displayResourceId) ?? null,
    [resources, displayResourceId],
  )

  const resetFilters = () => {
    setQuery("")
    setGlossaryQuery("")
    setActiveType("all")
    setDisciplineFilter("all")
    setLevelFilter("all")
  }

  const handleAddResource = () => {
    startTransition(async () => {
      try {
        const tagsArray = formData.tags
          .split(",")
          .map(tag => tag.trim())
          .filter(Boolean)

        const payload: any = {
          title: formData.title,
          type: formData.type,
          discipline: formData.discipline,
          summary: formData.summary,
          duration: formData.duration,
          level: formData.level,
          format: formData.format,
          url: formData.url,
          tags: tagsArray,
        }

        // Ajouter les pièces jointes si présentes
        if (formData.attachments.length > 0) {
          payload.attachments = formData.attachments
        }

        // Ajouter les données du manuel si type manuel ou fiche
        if ((formData.type === "manuel" || formData.type === "fiche") && 
            (formData.manualSections.length > 0 || formData.manualSafety.length > 0 || formData.manualPrerequisites.length > 0)) {
          payload.manual = {
            sections: formData.manualSections,
            ...(formData.manualSafety.length > 0 && { safety: formData.manualSafety }),
            ...(formData.manualPrerequisites.length > 0 && { prerequisites: formData.manualPrerequisites }),
          }
        }

        // Ajouter les données vidéo si type video
        if (formData.type === "video") {
          payload.video = {
            platform: formData.videoPlatform,
            ...(formData.videoAspectRatio && { aspectRatio: formData.videoAspectRatio }),
            ...(formData.videoDuration > 0 && { duration: formData.videoDuration }),
            ...(formData.videoChapters.length > 0 && { chapters: formData.videoChapters }),
            ...(formData.videoDownloadUrl && { downloadUrl: formData.videoDownloadUrl }),
            ...(formData.videoCaptions.length > 0 && { captions: formData.videoCaptions }),
          }
        }

        // Ajouter les données interactives si type animation ou exercice
        if (formData.type === "animation" && formData.interactiveObjective) {
          payload.interactive = {
            objective: formData.interactiveObjective,
            steps: formData.interactiveSteps,
            ...(formData.interactiveCorrection.length > 0 && { correction: formData.interactiveCorrection }),
          }
        }

        // Ajouter les données d'exercice si type exercice
        if (formData.type === "exercice") {
          payload.exercise = {
            difficulty: formData.exerciseDifficulty,
            scoring: {
              maxPoints: formData.exerciseMaxPoints,
              successThreshold: formData.exerciseSuccessThreshold,
            },
          }
          if (formData.interactiveObjective) {
            payload.interactive = {
              objective: formData.interactiveObjective,
              steps: formData.interactiveSteps,
              ...(formData.interactiveCorrection.length > 0 && { correction: formData.interactiveCorrection }),
            }
          }
        }

        const response = await fetch("/api/resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => null)
          throw new Error(payload?.message ?? "Erreur lors de la création de la ressource")
        }

        toast.success("Ressource créée avec succès")
        setOpenAddDialog(false)
        setFormData({
          title: "",
          type: "fiche",
          discipline: "physique",
          summary: "",
          duration: 0,
          level: "college",
          format: "pdf",
          url: "",
          tags: "",
          attachments: [],
          manualSections: [],
          manualSafety: [],
          manualPrerequisites: [],
          videoPlatform: "internal",
          videoAspectRatio: "",
          videoDuration: 0,
          videoChapters: [],
          videoDownloadUrl: "",
          videoCaptions: [],
          interactiveObjective: "",
          interactiveSteps: [],
          interactiveCorrection: [],
          exerciseDifficulty: "facile",
          exerciseMaxPoints: 100,
          exerciseSuccessThreshold: 70,
        })
        router.refresh()
      } catch (error) {
        console.error(error)
        toast.error(error instanceof Error ? error.message : "Impossible de créer la ressource")
      }
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="space-y-4">
        <Card className="border-border/60 bg-card/90">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recherche et filtrage</CardTitle>
              <div className="flex items-center gap-2">
                {urlInstrument && (
                  <Badge variant="default" className="gap-1">
                    <Target className="size-3" />
                    Instrument : {urlInstrument}
                  </Badge>
                )}
                {canCreateResource && (
                  <Button
                    size="sm"
                    onClick={() => setOpenAddDialog(true)}
                    className="gap-2"
                  >
                    <Plus className="size-4" />
                    Ajouter une ressource
                  </Button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row xl:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Rechercher un guide, une vidéo ou un exercice..."
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Discipline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes disciplines</SelectItem>
                    {disciplines.slice(1).map(value => (
                      <SelectItem key={value} value={value}>
                        {disciplineLabels[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous niveaux</SelectItem>
                    {levels.slice(1).map(value => (
                      <SelectItem key={value} value={value}>
                        {levelLabels[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={resetFilters} className="gap-2">
                  <Filter className="size-4" />
                  Réinitialiser
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeType} onValueChange={setActiveType}>
              <TabsList className="grid grid-cols-6">
                <TabsTrigger value="all">Tout</TabsTrigger>
                {typeOrder.map(type => {
                  const meta = typeMeta[type]
                  return (
                    <TabsTrigger key={type} value={type}>
                      {meta.label}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </Tabs>
            <div className="grid gap-3 md:grid-cols-3">
              <StatCard
                icon={<GraduationCap className="size-4" />}
                label="Ressources"
                value={stats.total}
                sublabel="Total filtré"
              />
              <StatCard
                icon={<BookOpen className="size-4" />}
                label="Guides & fiches"
                value={(stats.countsByType.fiche ?? 0) + (stats.countsByType.manuel ?? 0)}
                sublabel="Supports écrits"
              />
              <StatCard
                icon={<PlayCircle className="size-4" />}
                label="Audiovisuel"
                value={(stats.countsByType.video ?? 0) + (stats.countsByType.animation ?? 0)}
                sublabel="Vidéos & animations"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {resources.length === 0 ? (
            <Card className="border-dashed border-primary/40 bg-primary/5">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Aucune ressource ne correspond à vos filtres. Ajustez les critères pour élargir la recherche.
              </CardContent>
            </Card>
          ) : (
            resources.map((resource, resourceIndex) => {
              const meta = typeMeta[resource.type]
              const Icon = meta.icon
              const isExpanded = expandedResources.has(resource.id)
              const toggleExpand = () => {
                setExpandedResources(prev => {
                  const newSet = new Set(prev)
                  if (newSet.has(resource.id)) {
                    newSet.delete(resource.id)
                  } else {
                    newSet.add(resource.id)
                  }
                  return newSet
                })
              }
              return (
                <Card
                  key={`resource-${resourceIndex}-${resource.id}`}
                  className={cn(
                    "border-border/60 bg-card/90 transition hover:-translate-y-[2px] hover:shadow-md",
                    resource.id === displayResourceId && "border-primary shadow-lg",
                  )}
                >
                  <CardHeader className="flex flex-row items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="gap-1 uppercase tracking-[0.3em]">
                          <Icon className="size-3.5" />
                          {meta.label}
                        </Badge>
                        <Badge variant="secondary">{disciplineLabels[resource.discipline]}</Badge>
                        <Badge variant="outline">{levelLabels[resource.level]}</Badge>
                        <Badge variant="outline">{resource.format.toUpperCase()}</Badge>
                      </div>
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{resource.summary}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {resource.tags.map((tag, tagIndex) => (
                          <Badge key={`tag-${tagIndex}-${tag}`} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant={resource.id === displayResourceId ? "default" : "outline"}
                        size="sm"
                        onClick={() => router.push(`/dashboard/resources/${resource.id}`)}
                      >
                        Consulter
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleExpand}
                        className="gap-1"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="size-4" />
                            Réduire
                          </>
                        ) : (
                          <>
                            <ChevronDown className="size-4" />
                            Développer
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs text-muted-foreground">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>Durée estimée : {resource.duration} min</span>
                      <div className="flex gap-2">
                        <Button asChild variant="ghost" size="sm" className="gap-1">
                          <Link href={resource.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="size-3.5" />
                            Ouvrir
                          </Link>
                        </Button>
                        {resource.attachments?.length ? (
                          <Badge variant="outline" className="text-xs">
                            {resource.attachments.length} pièce(s) jointe(s)
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 space-y-4 border-t border-border/60 pt-4">
                        {/* Pièces jointes */}
                        {resource.attachments && resource.attachments.length > 0 && (
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-foreground">Pièces jointes</h4>
                            <ul className="space-y-1">
                              {resource.attachments.map((attachment, index) => (
                                <li key={index}>
                                  <Link
                                    href={attachment.url}
                                    className="flex items-center gap-2 text-xs text-primary hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Download className="size-3" />
                                    {attachment.label}
                                    <Badge variant="outline" className="ml-auto text-[10px]">
                                      {attachment.type}
                                    </Badge>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Manuel */}
                        {resource.manual && (
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-foreground">Contenu du manuel</h4>
                            {resource.manual.prerequisites && resource.manual.prerequisites.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-medium">Prérequis :</p>
                                <ul className="list-disc space-y-0.5 pl-4 text-xs">
                                  {resource.manual.prerequisites.map((prereq, index) => (
                                    <li key={index}>{prereq}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {resource.manual.safety && resource.manual.safety.length > 0 && (
                              <div className="mb-2 rounded border border-destructive/20 bg-destructive/5 p-2">
                                <p className="text-xs font-medium text-destructive">Sécurité :</p>
                                <ul className="list-disc space-y-0.5 pl-4 text-xs">
                                  {resource.manual.safety.map((safety, index) => (
                                    <li key={index}>{safety}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {resource.manual.sections && resource.manual.sections.length > 0 && (
                              <div className="space-y-2">
                                {resource.manual.sections.map((section, index) => (
                                  <div key={index} className="rounded border border-border/60 bg-muted/20 p-2">
                                    <p className="text-xs font-semibold text-foreground">{section.title}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{section.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Vidéo */}
                        {resource.video && (
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-foreground">Informations vidéo</h4>
                            <div className="space-y-1 text-xs">
                              <p><span className="font-medium">Plateforme :</span> {resource.video.platform.toUpperCase()}</p>
                              {resource.video.aspectRatio && (
                                <p><span className="font-medium">Ratio :</span> {resource.video.aspectRatio}</p>
                              )}
                              {resource.video.duration && (
                                <p><span className="font-medium">Durée :</span> {Math.floor(resource.video.duration / 60)}:{(resource.video.duration % 60).toString().padStart(2, "0")}</p>
                              )}
                              {resource.video.chapters && resource.video.chapters.length > 0 && (
                                <div className="mt-2">
                                  <p className="font-medium">Chapitres :</p>
                                  <ul className="mt-1 space-y-0.5">
                                    {resource.video.chapters.map((chapter, index) => (
                                      <li key={index} className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px]">{chapter.timecode}</Badge>
                                        <span>{chapter.title}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Interactif */}
                        {resource.interactive && (
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-foreground">Module interactif</h4>
                            {resource.interactive.objective && (
                              <p className="mb-2 text-xs"><span className="font-medium">Objectif :</span> {resource.interactive.objective}</p>
                            )}
                            {resource.interactive.steps && resource.interactive.steps.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium">Étapes ({resource.interactive.steps.length}) :</p>
                                {resource.interactive.steps.slice(0, 3).map((step, index) => (
                                  <div key={index} className="rounded border border-border/60 bg-muted/20 p-2">
                                    <p className="text-xs font-semibold text-foreground">Étape {index + 1} : {step.title}</p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">{step.action}</p>
                                  </div>
                                ))}
                                {resource.interactive.steps.length > 3 && (
                                  <p className="text-xs text-muted-foreground">+ {resource.interactive.steps.length - 3} étape(s) supplémentaire(s)</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Exercice */}
                        {resource.exercise && (
                          <div>
                            <h4 className="mb-2 text-sm font-semibold text-foreground">Paramètres d'exercice</h4>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <Badge variant="outline" className="capitalize">
                                Difficulté : {resource.exercise.difficulty}
                              </Badge>
                              <Badge variant="outline">
                                Score max : {resource.exercise.scoring.maxPoints} pts
                              </Badge>
                              <Badge variant="outline">
                                Réussite : {resource.exercise.scoring.successThreshold}%
                              </Badge>
                            </div>
                          </div>
                        )}

                        <Separator />

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/resources/${resource.id}`)}
                            className="gap-2"
                          >
                            Voir les détails complets
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </section>

      <section className="space-y-4">
        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="text-lg">Aperçu détaillé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedResource ? (
              <ResourceDetail resource={selectedResource} />
            ) : (
              <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center text-sm text-muted-foreground">
                Sélectionnez une ressource dans la liste pour afficher le contenu détaillé, les pièces jointes et les activités associées.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90">
          <CardHeader className="space-y-3">
            <CardTitle className="text-lg">Glossaire scientifique</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={glossaryQuery}
                onChange={event => setGlossaryQuery(event.target.value)}
                placeholder="Recherche d'un terme, d'un synonyme..."
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="max-h-[320px] pr-4">
              <div className="space-y-4 text-sm">
                {glossaryEntries.length === 0 ? (
                  <p className="text-muted-foreground">Aucun terme ne correspond à votre recherche.</p>
                ) : (
                  glossaryEntries.map((entry, entryIndex) => (
                    <div key={`glossary-entry-${entryIndex}-${entry.id}`} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-foreground">{entry.term}</p>
                        <Badge variant="outline">{disciplineLabels[entry.discipline] ?? "Interdisciplinaire"}</Badge>
                      </div>
                      <p className="mt-2 text-muted-foreground">{entry.definition}</p>
                      <div className="mt-2 flex flex-wrap gap-1 text-xs text-muted-foreground">
                        {entry.tags.map((tag, tagIndex) => (
                          <Badge key={`glossary-tag-${tagIndex}-${tag}`} variant="secondary">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      {entry.synonyms.length ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Synonymes : {entry.synonyms.join(", ")}.
                        </p>
                      ) : null}
                      {entry.relatedResources && entry.relatedResources.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          {entry.relatedResources.map((resourceId, resourceIndex) => (
                            <Button
                              key={`related-resource-${resourceIndex}-${resourceId}`}
                              variant="outline"
                              size="xs"
                              onClick={() => {
                                const resource = resources.find(r => r.id === resourceId)
                                if (resource) {
                                  setSelectedResourceId(resourceId)
                                }
                              }}
                            >
                              Voir ressource
                            </Button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </section>

      <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter une nouvelle ressource</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour créer une nouvelle ressource pédagogique.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Guide d'utilisation du microscope"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={value => setFormData(prev => ({ ...prev, type: value as LearningResource["type"] }))}
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fiche">Fiche</SelectItem>
                    <SelectItem value="manuel">Manuel</SelectItem>
                    <SelectItem value="video">Vidéo</SelectItem>
                    <SelectItem value="animation">Animation</SelectItem>
                    <SelectItem value="exercice">Exercice</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discipline">Discipline *</Label>
                <Select
                  value={formData.discipline}
                  onValueChange={value => setFormData(prev => ({ ...prev, discipline: value as LearningResource["discipline"] }))}
                >
                  <SelectTrigger id="discipline">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physique">Physique</SelectItem>
                    <SelectItem value="chimie">Chimie</SelectItem>
                    <SelectItem value="biologie">Biologie</SelectItem>
                    <SelectItem value="electronique">Électronique</SelectItem>
                    <SelectItem value="informatique">Informatique</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Résumé *</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={e => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="Description courte de la ressource..."
                className="min-h-[100px]"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="duration">Durée (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  value={formData.duration}
                  onChange={e => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">Niveau *</Label>
                <Select
                  value={formData.level}
                  onValueChange={value => setFormData(prev => ({ ...prev, level: value as LearningResource["level"] }))}
                >
                  <SelectTrigger id="level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="college">Collège</SelectItem>
                    <SelectItem value="lycee">Lycée</SelectItem>
                    <SelectItem value="universite">Université</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Format *</Label>
                <Select
                  value={formData.format}
                  onValueChange={value => setFormData(prev => ({ ...prev, format: value as LearningResource["format"] }))}
                >
                  <SelectTrigger id="format">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="video">Vidéo</SelectItem>
                    <SelectItem value="interactive">Interactif</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL *</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://exemple.com/ressource"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="Ex: microscope, biologie, cellules"
              />
            </div>

            <Separator />

            {/* Section Pièces jointes */}
            <div className="space-y-2">
              <Label>Pièces jointes (optionnel)</Label>
              <div className="space-y-2">
                {formData.attachments.map((attachment, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Label (ex: Guide PDF)"
                      value={attachment.label}
                      onChange={e => {
                        const newAttachments = [...formData.attachments]
                        newAttachments[index].label = e.target.value
                        setFormData(prev => ({ ...prev, attachments: newAttachments }))
                      }}
                    />
                    <Select
                      value={attachment.type}
                      onValueChange={value => {
                        const newAttachments = [...formData.attachments]
                        newAttachments[index].type = value
                        setFormData(prev => ({ ...prev, attachments: newAttachments }))
                      }}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="module">Module</SelectItem>
                        <SelectItem value="dataset">Dataset</SelectItem>
                        <SelectItem value="slides">Slides</SelectItem>
                        <SelectItem value="template">Template</SelectItem>
                        <SelectItem value="video">Vidéo</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="url"
                      placeholder="URL"
                      value={attachment.url}
                      onChange={e => {
                        const newAttachments = [...formData.attachments]
                        newAttachments[index].url = e.target.value
                        setFormData(prev => ({ ...prev, attachments: newAttachments }))
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          attachments: prev.attachments.filter((_, i) => i !== index),
                        }))
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      attachments: [...prev.attachments, { label: "", type: "pdf", url: "" }],
                    }))
                  }}
                >
                  <Plus className="size-4" />
                  Ajouter une pièce jointe
                </Button>
              </div>
            </div>

            {/* Section Manuel (pour fiche et manuel) */}
            {(formData.type === "fiche" || formData.type === "manuel") && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Contenu du manuel</h3>
                  
                  <div className="space-y-2">
                    <Label>Prérequis (séparés par des virgules)</Label>
                    <Input
                      value={formData.manualPrerequisites.join(", ")}
                      onChange={e => {
                        setFormData(prev => ({
                          ...prev,
                          manualPrerequisites: e.target.value.split(",").map(s => s.trim()).filter(Boolean),
                        }))
                      }}
                      placeholder="Ex: Notions d'optique, Utilisation d'un capteur"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Consignes de sécurité (une par ligne)</Label>
                    <Textarea
                      value={formData.manualSafety.join("\n")}
                      onChange={e => {
                        setFormData(prev => ({
                          ...prev,
                          manualSafety: e.target.value.split("\n").filter(Boolean),
                        }))
                      }}
                      placeholder="Ex: Ne jamais regarder directement le faisceau laser."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Sections du manuel</Label>
                    {formData.manualSections.map((section, index) => (
                      <div key={index} className="space-y-2 rounded-lg border border-border/60 p-3">
                        <Input
                          placeholder="Titre de la section"
                          value={section.title}
                          onChange={e => {
                            const newSections = [...formData.manualSections]
                            newSections[index].title = e.target.value
                            setFormData(prev => ({ ...prev, manualSections: newSections }))
                          }}
                        />
                        <Textarea
                          placeholder="Contenu de la section"
                          value={section.content}
                          onChange={e => {
                            const newSections = [...formData.manualSections]
                            newSections[index].content = e.target.value
                            setFormData(prev => ({ ...prev, manualSections: newSections }))
                          }}
                          className="min-h-[80px]"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              manualSections: prev.manualSections.filter((_, i) => i !== index),
                            }))
                          }}
                        >
                          Supprimer
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          manualSections: [...prev.manualSections, { title: "", content: "" }],
                        }))
                      }}
                    >
                      <Plus className="size-4" />
                      Ajouter une section
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Section Vidéo */}
            {formData.type === "video" && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Informations vidéo</h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="videoPlatform">Plateforme</Label>
                      <Select
                        value={formData.videoPlatform}
                        onValueChange={value => setFormData(prev => ({ ...prev, videoPlatform: value as "youtube" | "vimeo" | "internal" }))}
                      >
                        <SelectTrigger id="videoPlatform">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="internal">Interne</SelectItem>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="vimeo">Vimeo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="videoAspectRatio">Ratio d'aspect</Label>
                      <Input
                        id="videoAspectRatio"
                        value={formData.videoAspectRatio}
                        onChange={e => setFormData(prev => ({ ...prev, videoAspectRatio: e.target.value }))}
                        placeholder="Ex: 16:9"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="videoDuration">Durée (secondes)</Label>
                      <Input
                        id="videoDuration"
                        type="number"
                        min="0"
                        value={formData.videoDuration}
                        onChange={e => setFormData(prev => ({ ...prev, videoDuration: parseInt(e.target.value) || 0 }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="videoDownloadUrl">URL de téléchargement</Label>
                      <Input
                        id="videoDownloadUrl"
                        type="url"
                        value={formData.videoDownloadUrl}
                        onChange={e => setFormData(prev => ({ ...prev, videoDownloadUrl: e.target.value }))}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Chapitres (optionnel)</Label>
                    {formData.videoChapters.map((chapter, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Titre du chapitre"
                          value={chapter.title}
                          onChange={e => {
                            const newChapters = [...formData.videoChapters]
                            newChapters[index].title = e.target.value
                            setFormData(prev => ({ ...prev, videoChapters: newChapters }))
                          }}
                        />
                        <Input
                          placeholder="Timecode (ex: 00:00)"
                          value={chapter.timecode}
                          onChange={e => {
                            const newChapters = [...formData.videoChapters]
                            newChapters[index].timecode = e.target.value
                            setFormData(prev => ({ ...prev, videoChapters: newChapters }))
                          }}
                          className="w-[120px]"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              videoChapters: prev.videoChapters.filter((_, i) => i !== index),
                            }))
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          videoChapters: [...prev.videoChapters, { title: "", timecode: "" }],
                        }))
                      }}
                    >
                      <Plus className="size-4" />
                      Ajouter un chapitre
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>URLs des sous-titres (une par ligne)</Label>
                    <Textarea
                      value={formData.videoCaptions.join("\n")}
                      onChange={e => {
                        setFormData(prev => ({
                          ...prev,
                          videoCaptions: e.target.value.split("\n").filter(Boolean),
                        }))
                      }}
                      placeholder="https://exemple.com/captions-fr.vtt"
                      className="min-h-[60px]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Section Interactif (pour animation et exercice) */}
            {(formData.type === "animation" || formData.type === "exercice") && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Module interactif</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="interactiveObjective">Objectif</Label>
                    <Textarea
                      id="interactiveObjective"
                      value={formData.interactiveObjective}
                      onChange={e => setFormData(prev => ({ ...prev, interactiveObjective: e.target.value }))}
                      placeholder="Objectif pédagogique du module interactif..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Étapes interactives</Label>
                    {formData.interactiveSteps.map((step, index) => (
                      <div key={index} className="space-y-2 rounded-lg border border-border/60 p-3">
                        <Input
                          placeholder="Titre de l'étape"
                          value={step.title}
                          onChange={e => {
                            const newSteps = [...formData.interactiveSteps]
                            newSteps[index].title = e.target.value
                            setFormData(prev => ({ ...prev, interactiveSteps: newSteps }))
                          }}
                        />
                        <Textarea
                          placeholder="Action à effectuer"
                          value={step.action}
                          onChange={e => {
                            const newSteps = [...formData.interactiveSteps]
                            newSteps[index].action = e.target.value
                            setFormData(prev => ({ ...prev, interactiveSteps: newSteps }))
                          }}
                          className="min-h-[60px]"
                        />
                        <div className="grid gap-2 md:grid-cols-2">
                          <Input
                            placeholder="Astuce (optionnel)"
                            value={step.hint || ""}
                            onChange={e => {
                              const newSteps = [...formData.interactiveSteps]
                              newSteps[index].hint = e.target.value || undefined
                              setFormData(prev => ({ ...prev, interactiveSteps: newSteps }))
                            }}
                          />
                          <Input
                            placeholder="Résultat attendu (optionnel)"
                            value={step.expectedResult || ""}
                            onChange={e => {
                              const newSteps = [...formData.interactiveSteps]
                              newSteps[index].expectedResult = e.target.value || undefined
                              setFormData(prev => ({ ...prev, interactiveSteps: newSteps }))
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              interactiveSteps: prev.interactiveSteps.filter((_, i) => i !== index),
                            }))
                          }}
                        >
                          Supprimer
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          interactiveSteps: [...prev.interactiveSteps, { title: "", action: "" }],
                        }))
                      }}
                    >
                      <Plus className="size-4" />
                      Ajouter une étape
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Correction / Validation (une par ligne)</Label>
                    <Textarea
                      value={formData.interactiveCorrection.join("\n")}
                      onChange={e => {
                        setFormData(prev => ({
                          ...prev,
                          interactiveCorrection: e.target.value.split("\n").filter(Boolean),
                        }))
                      }}
                      placeholder="Points de correction..."
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Section Exercice */}
            {formData.type === "exercice" && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Paramètres d'exercice</h3>
                  
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="exerciseDifficulty">Difficulté</Label>
                      <Select
                        value={formData.exerciseDifficulty}
                        onValueChange={value => setFormData(prev => ({ ...prev, exerciseDifficulty: value as "facile" | "intermediaire" | "avance" }))}
                      >
                        <SelectTrigger id="exerciseDifficulty">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="facile">Facile</SelectItem>
                          <SelectItem value="intermediaire">Intermédiaire</SelectItem>
                          <SelectItem value="avance">Avancé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="exerciseMaxPoints">Score maximum</Label>
                      <Input
                        id="exerciseMaxPoints"
                        type="number"
                        min="0"
                        value={formData.exerciseMaxPoints}
                        onChange={e => setFormData(prev => ({ ...prev, exerciseMaxPoints: parseInt(e.target.value) || 0 }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="exerciseSuccessThreshold">Seuil de réussite (%)</Label>
                      <Input
                        id="exerciseSuccessThreshold"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.exerciseSuccessThreshold}
                        onChange={e => setFormData(prev => ({ ...prev, exerciseSuccessThreshold: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenAddDialog(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button onClick={handleAddResource} disabled={isSubmitting || !formData.title || !formData.summary || !formData.url}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="size-4" />
                  Créer la ressource
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ResourceDetail({ resource }: { resource: LearningResource }) {
  const meta = typeMeta[resource.type]
  const Icon = meta.icon

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="gap-1">
          <Icon className="size-3.5" />
          {meta.label}
        </Badge>
        <Badge variant="outline">{disciplineLabels[resource.discipline]}</Badge>
        <Badge variant="outline">{levelLabels[resource.level]}</Badge>
        <span className="text-xs text-muted-foreground">Durée estimée {resource.duration} min</span>
      </div>

      <p className="text-sm text-muted-foreground">{resource.summary}</p>

      <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
        {resource.tags.map((tag, tagIndex) => (
          <Badge key={`tag-${tagIndex}-${tag}`} variant="outline">
            #{tag}
          </Badge>
        ))}
      </div>

      <Separator />

      {resource.manual ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Contenu du manuel</h3>
          {resource.manual.prerequisites?.length ? (
            <p className="text-xs text-muted-foreground">
              Pré-requis : {resource.manual.prerequisites.join(", ")}.
            </p>
          ) : null}
          {resource.manual.safety?.length ? (
            <p className="text-xs text-muted-foreground">
              Sécurité : {resource.manual.safety.join(" • ")}.
            </p>
          ) : null}
          <div className="space-y-2">
            {resource.manual.sections.map((section, sectionIndex) => (
              <div key={`section-${sectionIndex}-${section.title}`} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <p className="text-sm font-semibold text-foreground">{section.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {resource.video ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Ressource vidéo</h3>
          <p className="text-xs text-muted-foreground">
            Plateforme : {resource.video.platform.toUpperCase()} • Durée : {Math.round((resource.video.duration ?? resource.duration * 60) / 60)} min.
          </p>
          {resource.video.chapters?.length ? (
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Chapitres</p>
              <ul className="mt-1 space-y-1">
                {resource.video.chapters.map((chapter, chapterIndex) => (
                  <li key={`chapter-${chapterIndex}-${chapter.timecode}`}>
                    <strong className="text-foreground">{chapter.timecode}</strong> — {chapter.title}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            {resource.video.captions?.map((caption, captionIndex) => (
              <Badge key={`caption-${captionIndex}-${caption}`} variant="outline">
                Sous-titres
              </Badge>
            ))}
          </div>
          <Button asChild className="gap-2" size="sm">
            <Link href={resource.url} target="_blank" rel="noopener noreferrer">
              <PlayCircle className="size-4" />
              Visionner la vidéo
            </Link>
          </Button>
        </div>
      ) : null}

      {resource.interactive ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Module interactif</h3>
          <p className="text-xs text-muted-foreground">Objectif : {resource.interactive.objective}</p>
          <Accordion type="single" collapsible className="w-full">
            {resource.interactive.steps.map((step, index) => (
              <AccordionItem key={`step-${index}-${step.title}`} value={`step-${index}`}>
                <AccordionTrigger className="text-sm">Étape {index + 1} — {step.title}</AccordionTrigger>
                <AccordionContent className="space-y-2 text-xs text-muted-foreground">
                  <p>{step.action}</p>
                  {step.hint ? <p className="text-[11px] text-muted-foreground/80">Astuce : {step.hint}</p> : null}
                  {step.expectedResult ? (
                    <p className="text-[11px] text-muted-foreground/80">Résultat attendu : {step.expectedResult}</p>
                  ) : null}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {resource.interactive.correction?.length ? (
            <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 text-xs text-primary">
              <p className="font-medium text-foreground">Correction / Validation</p>
              <ul className="mt-2 space-y-1">
                {resource.interactive.correction.map((item, correctionIndex) => (
                  <li key={`correction-${correctionIndex}-${item.substring(0, 20)}`}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {resource.exercise ? (
        <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Notation automatique</p>
          <p>
            Difficulté : {resource.exercise.difficulty.toUpperCase()} • Score max : {resource.exercise.scoring.maxPoints} points • Réussite à partir de {resource.exercise.scoring.successThreshold}%.
          </p>
        </div>
      ) : null}

      {resource.attachments?.length ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Pièces jointes</h3>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {resource.attachments.map((attachment, attachmentIndex) => (
              <li key={`attachment-${attachmentIndex}-${attachment.url}`}>
                <Link href={attachment.url} className="inline-flex items-center gap-2 text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                  <Download className="size-3.5" />
                  {attachment.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Button asChild variant="outline" size="sm" className="gap-2">
        <Link href={resource.url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="size-4" />
          Accéder à la ressource complète
        </Link>
      </Button>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  sublabel,
}: {
  icon: ReactNode
  label: string
  value: number
  sublabel: string
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</span>
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{sublabel}</p>
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
