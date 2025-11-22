"use client"

import { useMemo, useState, useTransition, useEffect } from "react"
import useSWR from "swr"
import { useSession } from "next-auth/react"
import {
  Award,
  Flame,
  Heart,
  MessageCircle,
  Share2,
  Trophy,
  Users,
  Plus,
  ThumbsUp,
  Download,
  X,
  Star,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type { CommunityResponse } from "@/lib/data/community"

const fetcher = (url: string) => fetch(url).then(res => res.json())

type DiscussionTab = "all" | "physics" | "biology" | "electronics" | "informatics"

type CommentDraft = {
  experienceId: string
  content: string
  rating: number
}

type DiscussionDraft = {
  title: string
  discipline: "physics" | "biology" | "electronics" | "informatics"
  content: string
  tags: string[]
}

type ProjectDraft = {
  title: string
  discipline: "physics" | "biology" | "electronics" | "informatics"
  summary: string
  description: string
  fileUrl: string
}

export function CommunityWorkspace({ fallback }: { fallback: CommunityResponse }) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<DiscussionTab>("all")
  const [commentDraft, setCommentDraft] = useState<CommentDraft | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [openDiscussionDialog, setOpenDiscussionDialog] = useState(false)
  const [openProjectDialog, setOpenProjectDialog] = useState(false)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState<{ threadId: string; content: string } | null>(null)
  const [upvotingThreads, setUpvotingThreads] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [threadReplies, setThreadReplies] = useState<Record<string, Array<{
    id: string
    author: string
    content: string
    createdAt: string
    upvotes: number
  }>>>({})
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set())
  const [joinedContests, setJoinedContests] = useState<Set<string>>(new Set())
  const [joiningContests, setJoiningContests] = useState<Set<string>>(new Set())

  const [discussionDraft, setDiscussionDraft] = useState<DiscussionDraft>({
    title: "",
    discipline: "physics",
    content: "",
    tags: [],
  })

  const [projectDraft, setProjectDraft] = useState<ProjectDraft>({
    title: "",
    discipline: "physics",
    summary: "",
    description: "",
    fileUrl: "",
  })

  const { data, mutate } = useSWR<CommunityResponse & { contests?: Array<{
    id: string
    title: string
    description: string
    deadline: string
    teamSize: { min: number; max: number }
    requirements: string[]
    prizes: string[]
    participants: number
    isJoined?: boolean
  }> }>("/api/community", fetcher, {
    fallbackData: fallback,
    refreshInterval: 20000,
  })

  // Initialiser les concours rejoints depuis les données
  useEffect(() => {
    if (data?.contests) {
      const joined = new Set<string>()
      data.contests.forEach(contest => {
        if (contest.isJoined) {
          joined.add(contest.id)
        }
      })
      setJoinedContests(joined)
    }
  }, [data?.contests])

  const discussions = useMemo(() => {
    const collection = data?.discussions ?? []
    if (activeTab === "all") return collection
    return collection.filter(item => item.discipline === activeTab)
  }, [data?.discussions, activeTab])

  const leaderboard = data?.leaderboard ?? []
  const projects = data?.projects ?? []
  const contests = data?.contests ?? []

  const handleAddComment = async (experienceId: string, content: string, rating: number = 5) => {
    if (!content.trim()) {
      toast.error("Le commentaire ne peut pas être vide")
      return
    }
    if (!session?.user) {
      toast.error("Vous devez être connecté pour commenter")
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch(`/api/community/projects/${experienceId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, rating }),
      })
      if (!response.ok) {
        const error = await response.json()
        toast.error(error.message || "Erreur lors de l'ajout du commentaire")
        return
      }
      toast.success("Commentaire ajouté avec succès")
      await mutate()
      setCommentDraft(null)
    } catch (error) {
      toast.error("Erreur lors de l'ajout du commentaire")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateDiscussion = async () => {
    if (!session?.user) {
      toast.error("Vous devez être connecté pour créer une discussion")
      return
    }
    if (!discussionDraft.title.trim() || !discussionDraft.content.trim()) {
      toast.error("Le titre et le contenu sont requis")
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/community/discussions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(discussionDraft),
        })
        if (!response.ok) {
          const error = await response.json()
          console.error("Erreur création discussion:", error)
          const errorMessage = error.issues 
            ? `Erreur de validation: ${Object.entries(error.issues).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`).join("; ")}`
            : error.message || "Erreur lors de la création de la discussion"
          toast.error(errorMessage)
          return
        }
        toast.success("Discussion créée avec succès")
        setOpenDiscussionDialog(false)
        setDiscussionDraft({ title: "", discipline: "physics", content: "", tags: [] })
        await mutate()
      } catch (error) {
        toast.error("Erreur lors de la création de la discussion")
      }
    })
  }

  const handleCreateProject = async () => {
    if (!session?.user) {
      toast.error("Vous devez être connecté pour créer un projet")
      return
    }
    if (!projectDraft.title.trim() || !projectDraft.summary.trim()) {
      toast.error("Le titre et le résumé sont requis")
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/community/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectDraft),
        })
        if (!response.ok) {
          const error = await response.json()
          toast.error(error.message || "Erreur lors de la création du projet")
          return
        }
        toast.success("Projet créé avec succès")
        setOpenProjectDialog(false)
        setProjectDraft({ title: "", discipline: "physics", summary: "", description: "", fileUrl: "" })
        await mutate()
      } catch (error) {
        toast.error("Erreur lors de la création du projet")
      }
    })
  }

  const handleUpvoteDiscussion = async (threadId: string) => {
    if (!session?.user) {
      toast.error("Vous devez être connecté pour voter")
      return
    }
    setUpvotingThreads(prev => new Set(prev).add(threadId))
    try {
      const response = await fetch("/api/community/discussions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId }),
      })
      if (!response.ok) {
        toast.error("Erreur lors du vote")
        return
      }
      await mutate()
    } catch (error) {
      toast.error("Erreur lors du vote")
    } finally {
      setUpvotingThreads(prev => {
        const next = new Set(prev)
        next.delete(threadId)
        return next
      })
    }
  }

  const handleAddReply = async (threadId: string, content: string) => {
    if (!session?.user) {
      toast.error("Vous devez être connecté pour répondre")
      return
    }
    if (!content.trim()) {
      toast.error("La réponse ne peut pas être vide")
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/community/discussions/${threadId}/replies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        })
        if (!response.ok) {
          const error = await response.json()
          toast.error(error.message || "Erreur lors de l'ajout de la réponse")
          return
        }
        toast.success("Réponse ajoutée avec succès")
        setReplyDraft(null)
        // Recharger les réponses si elles sont affichées
        if (selectedThreadId === threadId) {
          const replyResponse = await fetch(`/api/community?threadId=${threadId}`)
          if (replyResponse.ok) {
            const replyData = await replyResponse.json()
            setThreadReplies(prev => ({
              ...prev,
              [threadId]: replyData.replies || []
            }))
          }
        }
        await mutate()
      } catch (error) {
        toast.error("Erreur lors de l'ajout de la réponse")
      }
    })
  }

  const handleLoadReplies = async (threadId: string) => {
    if (threadReplies[threadId]) {
      // Si les réponses sont déjà chargées, on les cache
      setSelectedThreadId(selectedThreadId === threadId ? null : threadId)
      return
    }

    setLoadingReplies(prev => new Set(prev).add(threadId))
    setSelectedThreadId(threadId)
    
    try {
      const response = await fetch(`/api/community?threadId=${threadId}`)
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des réponses")
      }
      const data = await response.json()
      setThreadReplies(prev => ({
        ...prev,
        [threadId]: data.replies || []
      }))
    } catch (error) {
      toast.error("Erreur lors du chargement des réponses")
    } finally {
      setLoadingReplies(prev => {
        const next = new Set(prev)
        next.delete(threadId)
        return next
      })
    }
  }

  const handleDownloadProject = async (projectId: string) => {
    if (!session?.user) {
      toast.error("Vous devez être connecté pour télécharger")
      return
    }
    try {
      const response = await fetch("/api/community/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, action: "download" }),
      })
      if (!response.ok) {
        toast.error("Erreur lors de l'enregistrement du téléchargement")
        return
      }
      await mutate()
    } catch (error) {
      toast.error("Erreur lors du téléchargement")
    }
  }

  const handleJoinContest = async (contestId: string) => {
    if (!session?.user) {
      toast.error("Vous devez être connecté pour vous inscrire")
      return
    }

    // Vérifier si déjà inscrit
    if (joinedContests.has(contestId)) {
      toast.info("Vous êtes déjà inscrit à ce concours")
      return
    }

    setJoiningContests(prev => new Set(prev).add(contestId))
    
    try {
      const response = await fetch("/api/community/contests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contestId, action: "join" }),
      })
      if (!response.ok) {
        const error = await response.json()
        toast.error(error.message || "Erreur lors de l'inscription")
        return
      }
      toast.success("Inscription réussie ! Vous participez maintenant à ce concours.")
      setJoinedContests(prev => new Set(prev).add(contestId))
      await mutate()
    } catch (error) {
      toast.error("Erreur lors de l'inscription")
    } finally {
      setJoiningContests(prev => {
        const next = new Set(prev)
        next.delete(contestId)
        return next
      })
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      {/* Forum communautaire */}
      <Card className="border-border/60 bg-card/90">
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-lg">Forum communautaire</CardTitle>
          <div className="flex gap-2">
            {session?.user && (
              <Button
                size="sm"
                onClick={() => setOpenDiscussionDialog(true)}
                className="gap-2"
              >
                <Plus className="size-4" />
                Nouvelle discussion
              </Button>
            )}
            <Tabs value={activeTab} onValueChange={value => setActiveTab(value as DiscussionTab)}>
              <TabsList>
                <TabsTrigger value="all">Tous</TabsTrigger>
                <TabsTrigger value="physics">Physique</TabsTrigger>
                <TabsTrigger value="biology">Biologie</TabsTrigger>
                <TabsTrigger value="electronics">Électronique</TabsTrigger>
                <TabsTrigger value="informatics">Informatique</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <ScrollArea className="max-h-[420px] pr-4">
            <div className="space-y-4">
              {discussions.map(thread => (
                <div key={thread.id} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{thread.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {thread.author} • {formatDistanceToNow(new Date(thread.createdAt), { locale: fr, addSuffix: true })}
                      </p>
                    </div>
                    <Badge variant="outline">{thread.disciplineLabel}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{thread.preview}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 gap-1 px-2"
                      onClick={() => handleUpvoteDiscussion(thread.id)}
                      disabled={upvotingThreads.has(thread.id)}
                    >
                      <ThumbsUp className="size-3" />
                      {thread.upvotes}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 gap-1 px-2 text-xs"
                      onClick={() => handleLoadReplies(thread.id)}
                      disabled={loadingReplies.has(thread.id)}
                    >
                      {loadingReplies.has(thread.id) ? (
                        <>
                          <Loader2 className="size-3 animate-spin" />
                          Chargement...
                        </>
                      ) : selectedThreadId === thread.id ? (
                        <>
                          <ChevronUp className="size-3" />
                          Masquer les réponses
                        </>
                      ) : (
                        <>
                          <ChevronDown className="size-3" />
                          {thread.replies} réponse(s)
                        </>
                      )}
                    </Button>
                    {thread.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                    {session?.user && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => setReplyDraft({ threadId: thread.id, content: "" })}
                      >
                        Répondre
                      </Button>
                    )}
                  </div>
                  {/* Affichage des réponses */}
                  {selectedThreadId === thread.id && threadReplies[thread.id] && (
                    <div className="mt-4 space-y-3 rounded-lg border border-border/60 bg-muted/30 p-3">
                      <p className="text-xs font-semibold text-foreground">
                        {threadReplies[thread.id].length} réponse(s)
                      </p>
                      {threadReplies[thread.id].length === 0 ? (
                        <p className="text-xs text-muted-foreground">Aucune réponse pour le moment.</p>
                      ) : (
                        <div className="space-y-3">
                          {threadReplies[thread.id].map(reply => (
                            <div key={reply.id} className="rounded-lg border border-border/40 bg-card p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-foreground">{reply.author}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(reply.createdAt), { locale: fr, addSuffix: true })}
                                  </p>
                                  <p className="mt-2 text-sm text-foreground">{reply.content}</p>
                                </div>
                                {reply.upvotes > 0 && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <ThumbsUp className="size-3" />
                                    {reply.upvotes}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Formulaire de réponse */}
                  {replyDraft?.threadId === thread.id && (
                    <div className="mt-3 space-y-2 rounded-lg border border-border/60 bg-muted/40 p-3">
                      <Textarea
                        value={replyDraft.content}
                        onChange={e => setReplyDraft({ threadId: thread.id, content: e.target.value })}
                        placeholder="Votre réponse..."
                        className="min-h-[80px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            handleAddReply(thread.id, replyDraft.content)
                            // Recharger les réponses après ajout
                            if (selectedThreadId === thread.id) {
                              setTimeout(() => {
                                handleLoadReplies(thread.id)
                              }, 500)
                            }
                          }}
                          disabled={isPending}
                        >
                          {isPending ? (
                            <>
                              <Loader2 className="mr-2 size-3 animate-spin" />
                              Envoi...
                            </>
                          ) : (
                            "Publier"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setReplyDraft(null)}
                          disabled={isPending}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Classement */}
        <Card className="border-border/60 bg-card/90">
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="size-5 text-primary" />
                Classement expérimental
              </CardTitle>
              <CardDescription className="text-xs">
                Classement mis à jour chaque semaine selon engagement et qualité pédagogique.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <ScrollArea className="max-h-[300px] pr-2">
              {leaderboard.map((entry, index) => (
                <div key={entry.teamId} className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/20 p-3">
                  <div className="flex items-center gap-3">
                    <Badge variant={index === 0 ? "secondary" : "outline"} className="px-2 py-1 text-xs">
                      #{index + 1}
                    </Badge>
                    <div>
                      <p className="font-semibold text-foreground">{entry.teamName}</p>
                      <p className="text-xs text-muted-foreground">{entry.projectTitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-primary">
                      <Flame className="size-3.5" />
                      {entry.score} pts
                    </span>
                    <Badge variant="outline">{entry.disciplineLabel}</Badge>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Partage de projets */}
        <Card className="border-border/60 bg-card/90">
          <CardHeader className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg">Partage de projets</CardTitle>
            {session?.user && (
              <Button
                size="sm"
                onClick={() => setOpenProjectDialog(true)}
                className="gap-2"
              >
                <Plus className="size-4" />
                Nouveau projet
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <ScrollArea className="max-h-[320px] pr-2">
              <div className="space-y-3">
                {projects.map(project => (
                  <div key={project.id} className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{project.title}</p>
                      <Badge variant="outline">{project.disciplineLabel}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Par {project.author} • {formatDistanceToNow(new Date(project.publishedAt), { locale: fr, addSuffix: true })}
                    </p>
                    <p className="mt-2 text-sm">{project.summary}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Share2 className="size-3.5" /> {project.downloads} partages
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="size-3.5" /> {project.peerReviews} évaluations
                      </span>
                      {session?.user && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 gap-1 px-2"
                          onClick={() => handleDownloadProject(project.id)}
                        >
                          <Download className="size-3" />
                          Télécharger
                        </Button>
                      )}
                    </div>
                    {commentDraft?.experienceId === project.id ? (
                      <div className="mt-3 space-y-2">
                        <Textarea
                          value={commentDraft.content}
                          onChange={event => setCommentDraft({ experienceId: project.id, content: event.target.value, rating: commentDraft.rating })}
                          placeholder="Ajoutez votre retour : points forts, axes d'amélioration..."
                          className="min-h-[80px]"
                        />
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Note :</Label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(rating => (
                              <Button
                                key={rating}
                                size="sm"
                                variant={commentDraft.rating >= rating ? "default" : "ghost"}
                                className="h-6 w-6 p-0"
                                onClick={() => setCommentDraft({ ...commentDraft, rating })}
                              >
                                <Star className={`size-3 ${commentDraft.rating >= rating ? "fill-current" : ""}`} />
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAddComment(project.id, commentDraft.content, commentDraft.rating)}
                            disabled={submitting}
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="mr-2 size-3 animate-spin" />
                                Publication...
                              </>
                            ) : (
                              "Publier"
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setCommentDraft(null)}
                            disabled={submitting}
                          >
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      session?.user && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 gap-2"
                          onClick={() => setCommentDraft({ experienceId: project.id, content: "", rating: 5 })}
                        >
                          <MessageCircle className="size-3.5" />
                          Donner un feedback
                        </Button>
                      )
                    )}
                    <Separator className="my-3" />
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground">Feedbacks récents</p>
                      {project.comments.slice(0, 3).map(comment => (
                        <div key={comment.id} className="rounded-lg bg-muted/40 p-2">
                          <p className="text-xs font-medium text-foreground">{comment.author}</p>
                          <p>{comment.content}</p>
                          <div className="mt-1 flex items-center gap-2 text-[11px]">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map(rating => (
                                <Star
                                  key={rating}
                                  className={`size-2 ${comment.rating >= rating ? "fill-current text-yellow-500" : "text-muted-foreground"}`}
                                />
                              ))}
                            </div>
                            <span>{formatDistanceToNow(new Date(comment.createdAt), { locale: fr, addSuffix: true })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Évènements & concours */}
      <Card className="border-border/60 bg-card/90 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Évènements & concours</CardTitle>
          <CardDescription>Participez aux challenges mensuels et partagez vos résultats.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {contests.length > 0 ? (
            contests.map(contest => (
              <div key={contest.id} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Trophy className="size-4" />
                  <p className="font-semibold text-foreground">{contest.title}</p>
                </div>
                <p className="mt-2 text-xs">{contest.description}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">
                    Deadline {new Date(contest.deadline).toLocaleDateString("fr-FR")}
                  </Badge>
                  <Badge variant="outline">
                    Équipe {contest.teamSize.min}-{contest.teamSize.max} personnes
                  </Badge>
                  <Badge variant="secondary">{contest.participants} participants</Badge>
                </div>
                {session?.user && (
                  <Button
                    size="sm"
                    className="mt-3 gap-2"
                    onClick={() => handleJoinContest(contest.id)}
                    disabled={joiningContests.has(contest.id) || joinedContests.has(contest.id)}
                    variant={joinedContests.has(contest.id) ? "secondary" : "default"}
                  >
                    {joiningContests.has(contest.id) ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Inscription...
                      </>
                    ) : joinedContests.has(contest.id) ? (
                      <>
                        <Award className="size-4" />
                        Déjà inscrit
                      </>
                    ) : (
                      <>
                        <Award className="size-4" />
                        S&apos;inscrire
                      </>
                    )}
                  </Button>
                )}
              </div>
            ))
          ) : (
            <>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Trophy className="size-4" />
                  <p className="font-semibold text-foreground">Concours VR — Novembre 2024</p>
                </div>
                <p className="mt-2 text-xs">
                  Thème : concevoir une expérience immersive simulant la photosynthèse. Prix : casque VR + certification.
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">Deadline 30/11</Badge>
                  <Badge variant="outline">Équipe 2-4 personnes</Badge>
                  <Badge variant="secondary">Partage public requis</Badge>
                </div>
                {session?.user && (
                  <Button 
                    size="sm" 
                    className="mt-3 gap-2"
                    onClick={() => toast.info("Ce concours est un exemple. Les vrais concours seront disponibles prochainement.")}
                  >
                    <Award className="size-4" />
                    S&apos;inscrire
                  </Button>
                )}
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Heart className="size-4" />
                  <p className="font-semibold text-foreground">Programme mentorat</p>
                </div>
                <p className="mt-2 text-xs">
                  Rejoignez un mentor enseignant pour accélérer vos créations et recevoir un feedback hebdomadaire.
                </p>
                {session?.user && (
                  <Button size="sm" variant="outline" className="mt-3">
                    Devenir mentor
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog pour créer une discussion */}
      <Dialog open={openDiscussionDialog} onOpenChange={setOpenDiscussionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle discussion</DialogTitle>
            <DialogDescription>
              Partagez vos questions, expériences ou conseils avec la communauté.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discussion-title">Titre</Label>
              <Input
                id="discussion-title"
                value={discussionDraft.title}
                onChange={e => setDiscussionDraft({ ...discussionDraft, title: e.target.value })}
                placeholder="Ex: Optimiser la précision du capteur photonique"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discussion-discipline">Discipline</Label>
              <Select
                value={discussionDraft.discipline}
                onValueChange={value => setDiscussionDraft({ ...discussionDraft, discipline: value as any })}
              >
                <SelectTrigger id="discussion-discipline">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physics">Physique</SelectItem>
                  <SelectItem value="biology">Biologie</SelectItem>
                  <SelectItem value="electronics">Électronique</SelectItem>
                  <SelectItem value="informatics">Informatique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discussion-content">
                Contenu <span className="text-xs text-muted-foreground">(minimum 10 caractères)</span>
              </Label>
              <Textarea
                id="discussion-content"
                value={discussionDraft.content}
                onChange={e => setDiscussionDraft({ ...discussionDraft, content: e.target.value })}
                placeholder="Décrivez votre question ou partagez votre expérience... (minimum 10 caractères)"
                className="min-h-[200px]"
              />
              {discussionDraft.content.length > 0 && discussionDraft.content.length < 10 && (
                <p className="text-xs text-destructive">
                  {10 - discussionDraft.content.length} caractère(s) restant(s) (minimum 10 requis)
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="discussion-tags">Tags (séparés par des virgules)</Label>
              <Input
                id="discussion-tags"
                value={discussionDraft.tags.join(", ")}
                onChange={e => setDiscussionDraft({ ...discussionDraft, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
                placeholder="capteur, pro tips, optimisation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDiscussionDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateDiscussion} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer la discussion"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog pour créer un projet */}
      <Dialog open={openProjectDialog} onOpenChange={setOpenProjectDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Partager un nouveau projet</DialogTitle>
            <DialogDescription>
              Partagez vos créations, expériences ou ressources avec la communauté.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-title">Titre</Label>
              <Input
                id="project-title"
                value={projectDraft.title}
                onChange={e => setProjectDraft({ ...projectDraft, title: e.target.value })}
                placeholder="Ex: Diffraction assistée par IA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-discipline">Discipline</Label>
              <Select
                value={projectDraft.discipline}
                onValueChange={value => setProjectDraft({ ...projectDraft, discipline: value as any })}
              >
                <SelectTrigger id="project-discipline">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="physics">Physique</SelectItem>
                  <SelectItem value="biology">Biologie</SelectItem>
                  <SelectItem value="electronics">Électronique</SelectItem>
                  <SelectItem value="informatics">Informatique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-summary">Résumé</Label>
              <Textarea
                id="project-summary"
                value={projectDraft.summary}
                onChange={e => setProjectDraft({ ...projectDraft, summary: e.target.value })}
                placeholder="Un bref résumé de votre projet..."
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description (optionnel)</Label>
              <Textarea
                id="project-description"
                value={projectDraft.description}
                onChange={e => setProjectDraft({ ...projectDraft, description: e.target.value })}
                placeholder="Description détaillée de votre projet..."
                className="min-h-[150px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-file">URL du fichier (optionnel)</Label>
              <Input
                id="project-file"
                type="url"
                value={projectDraft.fileUrl}
                onChange={e => setProjectDraft({ ...projectDraft, fileUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenProjectDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateProject} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Publier le projet"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
