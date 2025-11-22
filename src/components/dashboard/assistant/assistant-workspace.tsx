"use client"

import { useState, useMemo, type ReactNode } from "react"
import useSWR from "swr"
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  CalendarClock,
  MessageCircle,
  Rocket,
  Sparkles,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

import type { AiRecommendation, AssistantResponse, InsightDiagnostics, LearnerProfile } from "@/lib/ai/personalization"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const fetcher = (url: string) => fetch(url).then(res => res.json())

type AssistantWorkspaceProps = {
  initialProfile: LearnerProfile
  initialDiagnostics: InsightDiagnostics
  initialRecommendations: AiRecommendation
}

type Message = {
  id: string
  author: "assistant" | "user"
  content: string
  followUps?: string[]
  actions?: AssistantResponse["suggestedActions"]
  timestamp: string
}

export function AssistantWorkspace({ initialProfile, initialDiagnostics, initialRecommendations }: AssistantWorkspaceProps) {
  const { data } = useSWR<{ profile: LearnerProfile; diagnostics: InsightDiagnostics; recommendations: AiRecommendation }>(
    "/api/ai/recommendations",
    fetcher,
    {
      fallbackData: {
        profile: initialProfile,
        diagnostics: initialDiagnostics,
        recommendations: initialRecommendations,
      },
      refreshInterval: 30000,
    },
  )

  const [messages, setMessages] = useState<Message[]>([{
    id: "welcome",
    author: "assistant",
    content: `Bonjour ${data?.profile.name ?? "apprenant·e"} ! Je suis votre tuteur virtuel. Dites-moi où vous avez besoin d'aide : explications, correction ou plan de révision personnalisé ?`,
    followUps: ["Analyser ma progression", "Recommander une expérience", "Proposer un plan de révision"],
    timestamp: new Date().toISOString(),
  }])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("insights")

  const diagnostics = data?.diagnostics ?? initialDiagnostics
  const recommendations = data?.recommendations ?? initialRecommendations

  const masteryColor = diagnostics.masteryScore >= 80 ? "text-emerald-500" : diagnostics.masteryScore < 60 ? "text-red-500" : "text-amber-500"

  const sendMessage = async (prompt: string) => {
    const trimmed = prompt.trim()
    if (!trimmed) return

    const outgoing: Message = {
      id: `user-${Date.now()}`,
      author: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, outgoing])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      })

      if (!response.ok) {
        throw new Error("assistant-error")
      }

      const payload = (await response.json()) as AssistantResponse & { timestamp: string }
      const incoming: Message = {
        id: `assistant-${Date.now()}`,
        author: "assistant",
        content: payload.reply,
        followUps: payload.followUps,
        actions: payload.suggestedActions,
        timestamp: payload.timestamp,
      }
      setMessages(prev => [...prev, incoming])
    } catch (error) {
      console.error(error)
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          author: "assistant",
          content: "Je rencontre une difficulté technique. Réessayons dans un instant ou vérifiez votre connexion.",
          timestamp: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleFollowUp = (followUp: string) => {
    setInput(followUp)
  }

  const behaviourHighlights = useMemo(() => [
    {
      icon: <Brain className="size-4" />,
      label: "Maîtrise",
      value: `${diagnostics.masteryScore}%`,
      description: diagnostics.engagementTrend === "hausse"
        ? "Progression continue, poursuivez vos efforts !"
        : diagnostics.engagementTrend === "baisse"
          ? "Attention : légère baisse, planifions une révision."
          : "Stabilité observée sur les dernières séances.",
    },
    {
      icon: <AlertTriangle className="size-4" />,
      label: "Erreurs récurrentes",
      value: diagnostics.errorClusters.length,
      description: diagnostics.errorClusters.length
        ? diagnostics.errorClusters[0].recommendation
        : "Aucune erreur critique identifiée.",
    },
    {
      icon: <CalendarClock className="size-4" />,
      label: "Échéances",
      value: diagnostics.upcomingDeadlines.length,
      description: diagnostics.upcomingDeadlines
        .map(deadline => `${deadline.title} (${format(new Date(deadline.dueDate), "PPP", { locale: fr })})`)
        .join(" • "),
    },
  ], [diagnostics])

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className="space-y-6">
        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-lg">Analyse personnalisée</CardTitle>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="size-3.5" />
                Assistant IA actif
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="insights">Synthèse</TabsTrigger>
                <TabsTrigger value="erreurs">Erreurs</TabsTrigger>
                <TabsTrigger value="deadlines">Échéances</TabsTrigger>
              </TabsList>
              <TabsContent value="insights" className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  {behaviourHighlights.map(item => (
                    <div key={item.label} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          {item.icon}
                        </span>
                        <span className="text-sm font-semibold text-foreground">{item.label}</span>
                      </div>
                      <p className={cn("mt-3 text-2xl font-bold", item.label === "Maîtrise" && masteryColor)}>{item.value}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="erreurs" className="space-y-3">
                {diagnostics.errorClusters.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune erreur critique détectée récemment.</p>
                ) : (
                  diagnostics.errorClusters.map(error => (
                    <div key={error.label} className="rounded-xl border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">{error.label}</span>
                        <Badge variant="outline">x{error.frequency}</Badge>
                      </div>
                      <p className="mt-2 text-xs">Suggestion IA : {error.recommendation}</p>
                    </div>
                  ))
                )}
              </TabsContent>
              <TabsContent value="deadlines" className="space-y-3">
                {diagnostics.upcomingDeadlines.map(deadline => (
                  <div key={deadline.title} className="rounded-xl border border-border/60 bg-muted/20 p-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CalendarClock className="size-4 text-primary" />
                      <p className="font-semibold text-foreground">{deadline.title}</p>
                    </div>
                    <p className="text-xs">
                      À rendre pour le {format(new Date(deadline.dueDate), "PPP", { locale: fr })} — type : {deadline.type.toUpperCase()}
                    </p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="text-lg">Tuteur virtuel intelligent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[320px] rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="space-y-4 text-sm">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex flex-col gap-2",
                      message.author === "assistant" ? "items-start" : "items-end",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3",
                        message.author === "assistant"
                          ? "bg-primary/10 text-foreground"
                          : "bg-primary text-white",
                      )}
                    >
                      <p>{message.content}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {format(new Date(message.timestamp), "HH:mm", { locale: fr })}
                    </span>
                    {message.followUps?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {message.followUps.map(option => (
                          <Button
                            key={option}
                            variant="outline"
                            size="xs"
                            onClick={() => handleFollowUp(option)}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    ) : null}
                    {message.actions?.length ? (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {message.actions.map(action => (
                          <Button key={action.target} asChild variant="ghost" size="xs" className="gap-1">
                            <a href={action.target}>
                              <ArrowRight className="size-3.5" />
                              {action.label}
                            </a>
                          </Button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <form
              className="flex gap-2"
              onSubmit={event => {
                event.preventDefault()
                sendMessage(input)
              }}
            >
              <Input
                value={input}
                onChange={event => setInput(event.target.value)}
                placeholder="Décrivez votre question ou votre difficulté..."
              />
              <Button type="submit" disabled={loading} className="gap-2">
                <MessageCircle className="size-4" />
                {loading ? "Analyse..." : "Envoyer"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="text-lg">Suggestions de révisions personnalisées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {recommendations.revisions.map(revision => (
              <div key={revision.title} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center gap-2 text-xs text-primary">
                  <BookOpenCheck className="size-3.5" />
                  <span className="font-semibold text-foreground">{revision.title}</span>
                </div>
                <p className="mt-1 text-sm">{revision.description}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span>Durée estimée : {revision.estimatedDuration} min</span>
                  <div className="flex gap-1">
                    {revision.tags.map(tag => (
                      <Badge key={tag} variant="outline">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="text-lg">Expériences recommandées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {recommendations.simulations.map(simulation => (
              <div key={simulation.id} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">{simulation.title}</p>
                    <p className="text-xs">Discipline : {simulation.discipline.toUpperCase()} • Durée {simulation.estimatedDuration} min</p>
                  </div>
                  <Badge variant={simulation.priority === "haute" ? "default" : "outline"}>
                    Priorité {simulation.priority.toUpperCase()}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{simulation.reason}</p>
                <Button asChild size="sm" variant="outline" className="mt-3 gap-2">
                  <a href={`/dashboard/simulations?focus=${simulation.id}`}>
                    <Rocket className="size-4" />
                    Lancer
                  </a>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="text-lg">Ressources ciblées</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {recommendations.resources.map(resource => (
              <div key={resource.id} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">{resource.title}</p>
                  <Badge variant="outline">{resource.type.toUpperCase()}</Badge>
                </div>
                <p className="mt-1 text-xs">{resource.summary}</p>
                <p className="mt-1 text-xs text-muted-foreground">Pourquoi ? {resource.reason}</p>
                <Button asChild size="sm" variant="ghost" className="mt-2 gap-2">
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    <ArrowRight className="size-3.5" />
                    Consulter
                  </a>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="text-lg">Conseils IA instantanés</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <Tip
              icon={<BarChart3 className="size-4" />}
              title="Analyser vos progrès"
              description="Comparez vos scores avant et après chaque expérience pour identifier les compétences à renforcer."
            />
            <Tip
              icon={<Sparkles className="size-4" />}
              title="Activez les aides contextuelles"
              description="Dans les simulations, ouvrez le panneau IA pour recevoir des explications pas-à-pas en fonction de vos erreurs."
            />
            <Tip
              icon={<BookOpenCheck className="size-4" />}
              title="Planifier vos révisions"
              description="Associez chaque recommandation IA à un créneau dans votre calendrier pour consolider vos acquis régulièrement."
            />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function Tip({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
      <div className="flex items-center gap-2 text-primary">
        <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10">{icon}</span>
        <p className="font-semibold text-foreground">{title}</p>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{description}</p>
    </div>
  )
}
