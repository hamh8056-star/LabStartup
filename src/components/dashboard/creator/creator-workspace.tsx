"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import {
  Layers,
  PenTool,
  Share2,
  Sparkles,
  UploadCloud,
  Wrench,
  Download,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"

import type { ExperienceBlueprint } from "@/lib/data/creator"

const fetcher = (url: string) => fetch(url).then(res => res.json())

const blockLibrary = [
  {
    icon: Layers,
    title: "Environnement physique",
    description: "Paramétrage des scènes (gravité, température, atmosphère, éclairage).",
    badge: "scènes",
  },
  {
    icon: Wrench,
    title: "Instruments virtuels",
    description: "Oscilloscope, capteurs, pipettes, microscopes et équipements VR.",
    badge: "outils",
  },
  {
    icon: Sparkles,
    title: "Scénarios guidés",
    description: "Étapes pédagogiques avec objectifs, feedback IA et sécurité intégrée.",
    badge: "workflow",
  },
]

const workflows = [
  {
    title: "Simulation guidée",
    steps: [
      "Définir le contexte pédagogique",
      "Choisir la scène 3D",
      "Ajouter instruments et consignes",
      "Configurer l&apos;évaluation finale",
    ],
  },
  {
    title: "Expérience libre",
    steps: ["Sélectionner une discipline", "Activer les garde-fous sécurité", "Modifier les paramètres physiques", "Publier pour vos classes"],
  },
  {
    title: "Challenge collaboratif",
    steps: ["Créer les équipes", "Associer un canal audio/texte", "Définir les badges et score", "Planifier les phases temps réel"],
  },
]

type CreatorWorkspaceProps = {
  initialLibrary: ExperienceBlueprint[]
}

export function CreatorWorkspace({ initialLibrary }: CreatorWorkspaceProps) {
  const [selectedExperience, setSelectedExperience] = useState<string | null>(initialLibrary[0]?.id ?? null)
  const [publishTargets, setPublishTargets] = useState<string>("L2 Physique, Prépa BIO")
  const [publishing, setPublishing] = useState(false)

  const { data, mutate } = useSWR<{ experiences: ExperienceBlueprint[] }>("/api/creator/experiences", fetcher, {
    fallbackData: { experiences: initialLibrary },
    refreshInterval: 20000,
  })

  const experiences = useMemo(() => data?.experiences ?? [], [data])
  const activeExperience = useMemo(() => experiences.find(exp => exp.id === selectedExperience) ?? experiences[0] ?? null, [experiences, selectedExperience])

  const handlePublish = async () => {
    if (!activeExperience) return
    const targets = publishTargets
      .split(",")
      .map(target => target.trim())
      .filter(Boolean)
    if (targets.length === 0) {
      toast.error("Veuillez indiquer au moins un groupe ou classe.")
      return
    }
    setPublishing(true)
    try {
      const response = await fetch("/api/creator/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activeExperience.id, target: targets }),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        toast.error(payload?.message ?? "Publication impossible")
        return
      }
      await response.json()
      toast.success("Expérience publiée", { description: `${activeExperience.title} est disponible pour ${targets.join(", ")}.` })
      mutate()
    } catch (error) {
      console.error(error)
      toast.error("Une erreur est survenue.")
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="grid flex-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
      <Card className="border-border/60 bg-white/85 backdrop-blur dark:bg-slate-950/70">
        <CardHeader className="flex flex-col gap-4 border-b border-border/60 pb-6">
          <div>
            <CardTitle className="text-xl">Nouvelle simulation</CardTitle>
            <p className="text-sm text-muted-foreground">
              Décrivez votre expérience, sélectionnez l’environnement et ajoutez des étapes interactives.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input id="title" placeholder="Ex : Oscillations amorties en mécanique" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discipline">Discipline</Label>
              <Input id="discipline" placeholder="Physique, Biologie, Chimie..." />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Objectifs pédagogiques</Label>
              <Textarea placeholder="Énumérez les objectifs clés de la manipulation." className="min-h-[120px]" />
            </div>
            <div className="space-y-2">
              <Label>Consignes et sécurité</Label>
              <Textarea placeholder="Indiquez les étapes critiques, avertissements et conseils IA." className="min-h-[120px]" />
            </div>
          </div>
          <Tabs defaultValue="scene" className="w-full">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="scene">Scène 3D</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="logic">Logique</TabsTrigger>
              <TabsTrigger value="evaluation">Évaluation</TabsTrigger>
            </TabsList>
            <TabsContent value="scene" className="space-y-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 text-sm text-muted-foreground">
              <p className="font-semibold text-primary">Paramètres immersifs</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Environnement</Label>
                  <Input placeholder="Laboratoire, terrain lunaire, microcosme..." />
                </div>
                <div className="space-y-2">
                  <Label>Paramètres physiques</Label>
                  <Input placeholder="Gravité, température, atmosphère..." />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Ajoutez des points d’intérêt, animations et interactions via l’éditeur avancé (bientôt disponible).
              </p>
            </TabsContent>
            <TabsContent value="assets" className="space-y-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 text-sm text-muted-foreground">
              <p className="font-semibold text-primary">Ressources liées</p>
              <p>Glissez-déposez des modèles 3D, vidéos, quiz interactifs ou fiches de laboratoire.</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-1">
                  <UploadCloud className="size-3.5" />
                  Importer un modèle
                </Button>
                <Button variant="outline" size="sm" className="gap-1">
                  <Sparkles className="size-3.5" />
                  Générer via IA
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="logic" className="space-y-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 text-sm text-muted-foreground">
              <p className="font-semibold text-primary">Logique d&apos;expérience</p>
              <p>Définissez les substances, réactions, circuits ou conditions déclenchant des évènements.</p>
              <Button variant="outline" size="sm" className="gap-2">
                <Layers className="size-4" />
                Ajouter une règle
              </Button>
            </TabsContent>
            <TabsContent value="evaluation" className="space-y-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-6 text-sm text-muted-foreground">
              <p className="font-semibold text-primary">Barème et quiz</p>
              <p>Définissez les indicateurs de réussite, questions pré/post-simulation et certificats délivrés.</p>
              <Button variant="outline" size="sm" className="w-fit">
                Configurer l’évaluation
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3 border-t border-border/60 pt-6">
          <Button variant="secondary" className="gap-2">
            <PenTool className="size-4" />
            Prévisualiser
          </Button>
          <Button className="gap-2">
            <Sparkles className="size-4" />
            Publier pour mes classes
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-6">
        <Card className="border-border/60 bg-white/85 backdrop-blur dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="text-lg">Bibliothèque de blocs</CardTitle>
            <p className="text-sm text-muted-foreground">
              Piochez des composants préconfigurés pour accélérer la création de vos expériences.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            {blockLibrary.map(block => (
              <div key={block.title} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <block.icon className="size-5" />
                </span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{block.title}</p>
                    <Badge variant="secondary" className="uppercase tracking-[0.3em]">
                      {block.badge}
                    </Badge>
                  </div>
                  <p>{block.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-white/85 backdrop-blur dark:bg-slate-950/70">
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg">Bibliothèque personnelle</CardTitle>
              <p className="text-sm text-muted-foreground">Centralisez vos expériences, du brouillon à la publication partagée.</p>
            </div>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => mutate()}>
              <Download className="size-3.5" />
              Rafraîchir
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <ScrollArea className="max-h-[260px]">
              <div className="space-y-3">
                {experiences.map(experience => (
                  <button
                    key={experience.id}
                    type="button"
                    onClick={() => setSelectedExperience(experience.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition hover:border-primary ${selectedExperience === experience.id ? "border-primary bg-primary/10" : "border-border/60 bg-muted/30"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{experience.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(experience.updatedAt), "PPP", { locale: fr })} • v{experience.version}
                        </p>
                      </div>
                      <Badge variant={experience.status === "published" ? "secondary" : experience.status === "review" ? "outline" : "destructive"}>
                        {experience.status === "draft" ? "Brouillon" : experience.status === "review" ? "Relecture" : "En ligne"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{experience.summary}</p>
                    <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                      {experience.tags.map(tag => (
                        <Badge key={tag} variant="outline">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
            {activeExperience ? (
              <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Partage & publication</p>
                <div className="space-y-2">
                  <Label>Destinataires (classes, équipes, e-mails)</Label>
                  <Input value={publishTargets} onChange={event => setPublishTargets(event.target.value)} />
                </div>
                <Button variant="outline" size="sm" className="gap-2" onClick={handlePublish} disabled={publishing}>
                  {publishing ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
                  {publishing ? "Publication..." : "Partager / Publier"}
                </Button>
                <Separator />
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Étapes de l&apos;expérience</p>
                  <ul className="space-y-1">
                    {activeExperience.steps.map(step => (
                      <li key={step}>• {step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-800 text-white shadow-xl">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-5 text-white/80" />
              Assistance IA en direct
            </CardTitle>
            <p className="text-sm text-white/70">
              Laissez l’IA générer des étapes, proposer des assets ou analyser les retours étudiants.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-white/80">
            <p>Glissez un scénario existant pour en dériver une nouvelle séquence interactive.</p>
            <p>Demandez une fiche de sécurité instantanée ou la traduction multilingue de votre manipulation.</p>
          </CardContent>
          <CardFooter>
            <Button variant="secondary" className="w-full gap-2 bg-white/15 text-white hover:bg-white/25">
              <Sparkles className="size-4" />
              Activer l’assistant IA
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-border/60 bg-white/85 backdrop-blur dark:bg-slate-950/70">
          <CardHeader>
            <CardTitle className="text-lg">Workflows recommandés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            {workflows.map(workflow => (
              <div key={workflow.title} className="rounded-2xl border border-border/50 bg-muted/30 p-4">
                <p className="text-sm font-semibold text-foreground">{workflow.title}</p>
                <ul className="mt-3 space-y-1 text-xs">
                  {workflow.steps.map(step => (
                    <li key={step}>• {step}</li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
