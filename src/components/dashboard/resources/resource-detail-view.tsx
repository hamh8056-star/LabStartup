"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  PlayCircle,
  Sparkles,
  Target,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { LearningResource } from "@/lib/data/seed"

type ResourceDetailViewProps = {
  resource: LearningResource
}

const typeMeta: Record<LearningResource["type"], { label: string; icon: typeof FileText }> = {
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

export function ResourceDetailView({ resource }: ResourceDetailViewProps) {
  const router = useRouter()
  const meta = typeMeta[resource.type]
  const Icon = meta.icon

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/resources")} className="gap-2">
          <ArrowLeft className="size-4" />
          Retour
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{resource.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1 uppercase tracking-[0.3em]">
              <Icon className="size-3.5" />
              {meta.label}
            </Badge>
            <Badge variant="outline">{disciplineLabels[resource.discipline]}</Badge>
            <Badge variant="outline">{levelLabels[resource.level]}</Badge>
            <Badge variant="outline">Durée {resource.duration} min</Badge>
            <Badge variant="outline">{resource.format.toUpperCase()}</Badge>
          </div>
        </div>
      </div>

      <Card className="border-border/60 bg-white/85 backdrop-blur dark:bg-slate-950/70">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="mb-2 text-lg font-semibold">Résumé</h2>
              <p className="text-sm text-muted-foreground">{resource.summary}</p>
            </div>

            {resource.tags.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map(tag => (
                    <Badge key={tag} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button asChild className="gap-2">
                <Link href={resource.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  Accéder à la ressource
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {resource.attachments && resource.attachments.length > 0 && (
        <Card className="border-border/60 bg-white/85 backdrop-blur dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="text-lg">Pièces jointes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {resource.attachments.map((attachment, index) => (
                <li key={index}>
                  <Link
                    href={attachment.url}
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="size-4" />
                    {attachment.label}
                    <Badge variant="outline" className="ml-auto">
                      {attachment.type.toUpperCase()}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {resource.manual && (
        <Card className="border-border/60 bg-white/85 backdrop-blur dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="text-lg">Contenu du manuel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {resource.manual.prerequisites && resource.manual.prerequisites.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Prérequis</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {resource.manual.prerequisites.map((prereq, index) => (
                    <li key={index}>{prereq}</li>
                  ))}
                </ul>
              </div>
            )}

            {resource.manual.safety && resource.manual.safety.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-destructive">Consignes de sécurité</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {resource.manual.safety.map((safety, index) => (
                    <li key={index}>{safety}</li>
                  ))}
                </ul>
              </div>
            )}

            {resource.manual.sections && resource.manual.sections.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold">Sections</h3>
                <div className="space-y-3">
                  {resource.manual.sections.map((section, index) => (
                    <div key={index} className="rounded-lg border border-border/60 bg-muted/20 p-4">
                      <h4 className="mb-2 font-semibold text-foreground">{section.title}</h4>
                      <p className="text-sm text-muted-foreground">{section.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {resource.video && (
        <Card className="border-border/60 bg-white/85 backdrop-blur dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="text-lg">Informations vidéo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium">Plateforme</p>
                <p className="text-sm text-muted-foreground">{resource.video.platform.toUpperCase()}</p>
              </div>
              {resource.video.aspectRatio && (
                <div>
                  <p className="text-sm font-medium">Ratio d'aspect</p>
                  <p className="text-sm text-muted-foreground">{resource.video.aspectRatio}</p>
                </div>
              )}
              {resource.video.duration && (
                <div>
                  <p className="text-sm font-medium">Durée</p>
                  <p className="text-sm text-muted-foreground">
                    {Math.floor(resource.video.duration / 60)}:{(resource.video.duration % 60).toString().padStart(2, "0")}
                  </p>
                </div>
              )}
            </div>

            {resource.video.chapters && resource.video.chapters.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Chapitres</h3>
                <ul className="space-y-2">
                  {resource.video.chapters.map((chapter, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{chapter.timecode}</Badge>
                      <span className="text-muted-foreground">{chapter.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {resource.video.downloadUrl && (
              <Button asChild variant="outline" className="gap-2">
                <Link href={resource.video.downloadUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="size-4" />
                  Télécharger la vidéo
                </Link>
              </Button>
            )}

            {resource.video.captions && resource.video.captions.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Sous-titres disponibles</h3>
                <div className="flex flex-wrap gap-2">
                  {resource.video.captions.map((caption, index) => (
                    <Badge key={index} variant="outline">
                      Sous-titres
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {resource.interactive && (
        <Card className="border-border/60 bg-white/85 backdrop-blur dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="text-lg">Module interactif</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {resource.interactive.objective && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Objectif</h3>
                <p className="text-sm text-muted-foreground">{resource.interactive.objective}</p>
              </div>
            )}

            {resource.interactive.steps && resource.interactive.steps.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold">Étapes</h3>
                <Accordion type="single" collapsible className="w-full">
                  {resource.interactive.steps.map((step, index) => (
                    <AccordionItem key={index} value={`step-${index}`}>
                      <AccordionTrigger className="text-sm">
                        Étape {index + 1} — {step.title}
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2 text-sm text-muted-foreground">
                        <p>{step.action}</p>
                        {step.hint && (
                          <p className="text-xs text-primary">💡 Astuce : {step.hint}</p>
                        )}
                        {step.expectedResult && (
                          <p className="text-xs text-muted-foreground">
                            ✓ Résultat attendu : {step.expectedResult}
                          </p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}

            {resource.interactive.correction && resource.interactive.correction.length > 0 && (
              <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4">
                <h3 className="mb-2 text-sm font-semibold text-primary">Correction / Validation</h3>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {resource.interactive.correction.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {resource.exercise && (
        <Card className="border-border/60 bg-white/85 backdrop-blur dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="text-lg">Paramètres d'exercice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium">Difficulté</p>
                <Badge variant="outline" className="mt-1 capitalize">
                  {resource.exercise.difficulty}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Score maximum</p>
                <p className="text-sm text-muted-foreground">{resource.exercise.scoring.maxPoints} points</p>
              </div>
              <div>
                <p className="text-sm font-medium">Seuil de réussite</p>
                <p className="text-sm text-muted-foreground">{resource.exercise.scoring.successThreshold}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push("/dashboard/resources")}>
          Retour à la liste
        </Button>
        <Button asChild className="gap-2">
          <Link href={resource.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
            Ouvrir la ressource
          </Link>
        </Button>
      </div>
    </div>
  )
}



