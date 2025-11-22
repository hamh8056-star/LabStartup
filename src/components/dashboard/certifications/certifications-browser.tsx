"use client"

import { useMemo, useState, useTransition } from "react"
import { useSession } from "next-auth/react"
import {
  Award,
  BadgeCheck,
  CalendarRange,
  Download,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  Mail,
  Search,
  Share2,
  Sparkles,
  Users,
} from "lucide-react"

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
import { toast } from "sonner"

import { formatDateTime, formatRelativeTime } from "@/lib/utils"

export type CertificationRecord = {
  id: string
  owner: string
  email?: string
  simulationTitle: string
  discipline: string
  score: number
  issuedAt: string
  badge: "explorateur" | "innovateur" | "mentor"
}

type CertificationsBrowserProps = {
  certifications: CertificationRecord[]
}

const badgeLabels: Record<CertificationRecord["badge"], string> = {
  explorateur: "Explorateur",
  innovateur: "Innovateur",
  mentor: "Mentor",
}

const sortOptions = [
  { value: "date", label: "Date d'émission" },
  { value: "score-desc", label: "Score décroissant" },
  { value: "score-asc", label: "Score croissant" },
  { value: "name", label: "Nom A → Z" },
]

export function CertificationsBrowser({ certifications }: CertificationsBrowserProps) {
  const { data: session } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [badgeFilter, setBadgeFilter] = useState<CertificationRecord["badge"] | "all">("all")
  const [sortBy, setSortBy] = useState(sortOptions[0].value)
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isSendingMessage, startSendingMessage] = useTransition()
  const [openMessageDialog, setOpenMessageDialog] = useState(false)
  const [messageContent, setMessageContent] = useState("")

  const filteredCertifications = useMemo(() => {
    let result = certifications.filter(certification => {
      const matchesSearch =
        certification.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        certification.simulationTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        certification.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        certification.discipline.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesBadge = badgeFilter === "all" || certification.badge === badgeFilter

      return matchesSearch && matchesBadge
    })

    switch (sortBy) {
      case "score-desc":
        result = [...result].sort((a, b) => b.score - a.score)
        break
      case "score-asc":
        result = [...result].sort((a, b) => a.score - b.score)
        break
      case "name":
        result = [...result].sort((a, b) => a.owner.localeCompare(b.owner))
        break
      case "date":
      default:
        result = [...result].sort(
          (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
        )
    }

    return result
  }, [certifications, searchQuery, badgeFilter, sortBy])

  const averageScore = filteredCertifications.length
    ? Math.round(filteredCertifications.reduce((acc, current) => acc + current.score, 0) / filteredCertifications.length)
    : 0

  const badgeCounts = filteredCertifications.reduce(
    (acc, certification) => {
      acc[certification.badge] = (acc[certification.badge] ?? 0) + 1
      return acc
    },
    { explorateur: 0, innovateur: 0, mentor: 0 } as Record<CertificationRecord["badge"], number>,
  )

  const handleDownload = async (certification: CertificationRecord) => {
    try {
      const response = await fetch(`/api/certifications/${certification.id}/download`)
      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement")
      }

      // Créer un blob et télécharger
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `certificat-${certification.id}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success("Certificat téléchargé", {
        description: `Le certificat de ${certification.owner} a été téléchargé.`,
      })
    } catch (error) {
      toast.error("Erreur lors du téléchargement", {
        description: "Impossible de télécharger le certificat.",
      })
    }
  }

  const handleShare = async (certification: CertificationRecord) => {
    try {
      const response = await fetch(`/api/certifications/${certification.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ makePublic: true }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la création du lien")
      }

      const data = await response.json()

      // Copier le lien dans le presse-papiers
      await navigator.clipboard.writeText(data.shareUrl)

      toast.success("Lien de partage copié", {
        description: `Le lien a été copié dans le presse-papiers. Partagez-le avec ${certification.owner} ou d'autres étudiants.`,
        action: {
          label: "Ouvrir",
          onClick: () => window.open(data.shareUrl, "_blank"),
        },
      })
    } catch (error) {
      toast.error("Erreur lors du partage", {
        description: "Impossible de créer le lien de partage.",
      })
    }
  }

  const handleBulkDownload = () => {
    if (selectedIds.length === 0) {
      toast.error("Sélection vide", { description: "Choisissez au moins un certificat." })
      return
    }

    toast.success("Certificats exportés", {
      description: `${selectedIds.length} certificats prêts à être envoyés.`,
    })
    setSelectedIds([])
  }

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(current => current !== id) : [...prev, id]))
  }

  const handleSendMessage = async () => {
    if (!session?.user) {
      toast.error("Vous devez être connecté pour envoyer des messages")
      return
    }

    // Déterminer les certifications ciblées
    const targetCertifications = selectedIds.length > 0
      ? filteredCertifications.filter(cert => selectedIds.includes(cert.id))
      : filteredCertifications

    if (targetCertifications.length === 0) {
      toast.error("Aucune certification sélectionnée")
      return
    }

    // Filtrer les certifications avec email
    const certificationsWithEmail = targetCertifications.filter(cert => cert.email)

    if (certificationsWithEmail.length === 0) {
      toast.error("Aucune certification avec email disponible")
      return
    }

    startSendingMessage(async () => {
      try {
        const response = await fetch("/api/certifications/send-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            certificationIds: certificationsWithEmail.map(cert => cert.id),
            message: messageContent || "Félicitations pour votre certification ! Continuez vos excellents efforts.",
            senderName: session.user?.name || "Équipe pédagogique",
          }),
        })

        if (!response.ok) {
          const error = await response.json()
          toast.error(error.message || "Erreur lors de l'envoi des messages")
          return
        }

        const result = await response.json()
        toast.success("Messages envoyés avec succès", {
          description: `${result.sent} message(s) envoyé(s) à ${certificationsWithEmail.length} étudiant(s).`,
        })
        setOpenMessageDialog(false)
        setMessageContent("")
        setSelectedIds([])
      } catch (error) {
        toast.error("Erreur lors de l'envoi des messages")
      }
    })
  }

  const handleOpenMessageDialog = () => {
    if (filteredCertifications.length === 0) {
      toast.error("Aucune certification à envoyer")
      return
    }
    setOpenMessageDialog(true)
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un certificat, un étudiant ou une simulation..."
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={badgeFilter} onValueChange={value => setBadgeFilter(value as typeof badgeFilter)}>
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="explorateur">Explorateur</TabsTrigger>
            <TabsTrigger value="innovateur">Innovateur</TabsTrigger>
            <TabsTrigger value="mentor">Mentor</TabsTrigger>
          </TabsList>
        </Tabs>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="size-4" />
              Filtres
              {selectedIds.length ? <Badge variant="secondary">{selectedIds.length}</Badge> : null}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuCheckboxItem
              checked={selectedIds.length === filteredCertifications.length && filteredCertifications.length > 0}
              onCheckedChange={checked =>
                setSelectedIds(checked ? filteredCertifications.map(cert => cert.id) : [])
              }
            >
              Tout sélectionner
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={false}
              onCheckedChange={() => {
                toast.message("Export CSV en préparation", {
                  description: "La fonctionnalité sera disponible prochainement.",
                })
              }}
            >
              Export CSV (bientôt)
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={sortBy} onValueChange={value => setSortBy(value)} className="w-fit">
          <TabsList className="grid grid-cols-4">
            {sortOptions.map(option => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" className="gap-2" onClick={handleBulkDownload}>
          <Download className="size-4" />
          Exporter la sélection
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            className="rounded-xl"
            onClick={() => setViewMode("grid")}
            aria-label="Affichage cartes"
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="icon"
            className="rounded-xl"
            onClick={() => setViewMode("table")}
            aria-label="Affichage tableau"
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60 bg-white/80 backdrop-blur dark:bg-slate-950/70">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Certificats</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{filteredCertifications.length}</p>
            </div>
            <Award className="size-6 text-primary" />
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-white/80 backdrop-blur dark:bg-slate-950/70">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Score moyen</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">{averageScore}/100</p>
            </div>
            <BadgeCheck className="size-6 text-primary" />
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-white/80 backdrop-blur dark:bg-slate-950/70">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Badges</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">Explorateur {badgeCounts.explorateur}</Badge>
                <Badge variant="outline">Innovateur {badgeCounts.innovateur}</Badge>
                <Badge variant="outline">Mentor {badgeCounts.mentor}</Badge>
              </div>
            </div>
            <Users className="size-6 text-primary" />
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-white/80 backdrop-blur dark:bg-slate-950/70">
          <CardContent className="space-y-2 p-4 text-xs text-muted-foreground">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">Action rapide</p>
            <p>Envoyez une notification collective pour féliciter les apprenants certifiés cette semaine.</p>
            <Button
              variant="secondary"
              size="sm"
              className="w-fit gap-2"
              onClick={handleOpenMessageDialog}
              disabled={isSendingMessage || filteredCertifications.length === 0}
            >
              {isSendingMessage ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Envoyer un message
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs value={viewMode} onValueChange={value => setViewMode(value as typeof viewMode)} className="flex-1">
        <TabsList className="hidden">
          <TabsTrigger value="grid">Cartes</TabsTrigger>
          <TabsTrigger value="table">Tableau</TabsTrigger>
        </TabsList>
        <TabsContent value="grid" className="flex-1">
          {filteredCertifications.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredCertifications.map(certification => (
                <Card
                  key={certification.id}
                  className="flex h-full flex-col border-border/60 bg-white/85 backdrop-blur transition hover:-translate-y-1 hover:shadow-xl dark:bg-slate-950/70"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="uppercase tracking-[0.3em]">
                        {certification.discipline}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {badgeLabels[certification.badge]}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{certification.owner}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {certification.simulationTitle} • {certification.score}/100
                    </p>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-4 text-sm text-muted-foreground">
                    <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 text-xs text-primary">
                      Émis {formatRelativeTime(certification.issuedAt)} • ID {certification.id}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <Badge variant="outline">
                        <CalendarRange className="mr-1 size-3" />
                        {formatDateTime(certification.issuedAt, { dateStyle: "medium" })}
                      </Badge>
                      <Badge variant="outline">Score {certification.score}</Badge>
                      <Badge variant="outline">{certification.badge}</Badge>
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-end gap-2 border-t border-border/60">
                    <Button variant="outline" size="icon" onClick={() => handleShare(certification)}>
                      <Share2 className="size-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => handleDownload(certification)}>
                      <Download className="size-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState onReset={() => setSearchQuery("")} />
          )}
        </TabsContent>
        <TabsContent value="table" className="flex-1">
          {filteredCertifications.length ? (
            <Card className="border-border/60 bg-white/85 backdrop-blur dark:bg-slate-950/70">
              <CardContent className="p-0">
                <ScrollArea className="max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Étudiant</TableHead>
                        <TableHead>Simulation</TableHead>
                        <TableHead>Badge</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Émis le</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCertifications.map(certification => (
                        <TableRow key={certification.id}>
                          <TableCell className="space-y-1 font-medium">
                            <p>{certification.owner}</p>
                            {certification.email ? (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="size-3" />
                                {certification.email}
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell>{certification.simulationTitle}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {badgeLabels[certification.badge]}
                            </Badge>
                          </TableCell>
                          <TableCell>{certification.score}/100</TableCell>
                          <TableCell>{formatDateTime(certification.issuedAt)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleShare(certification)}>
                                Partager
                              </Button>
                              <Button size="sm" onClick={() => handleDownload(certification)}>
                                Télécharger
                              </Button>
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
            <EmptyState onReset={() => setSearchQuery("")} />
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog pour envoyer un message */}
      <Dialog open={openMessageDialog} onOpenChange={setOpenMessageDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Envoyer un message de félicitations</DialogTitle>
            <DialogDescription>
              Envoyez un message personnalisé aux étudiants certifiés
              {selectedIds.length > 0
                ? ` (${selectedIds.length} sélectionné(s))`
                : ` (${filteredCertifications.filter(c => c.email).length} avec email)`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="message-content">Message</Label>
              <Textarea
                id="message-content"
                value={messageContent}
                onChange={e => setMessageContent(e.target.value)}
                placeholder="Félicitations pour votre certification ! Continuez vos excellents efforts."
                className="min-h-[150px]"
              />
              <p className="text-xs text-muted-foreground">
                Si le champ est vide, un message par défaut sera envoyé.
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
              <p className="font-semibold text-foreground">Destinataires :</p>
              <p className="mt-1 text-muted-foreground">
                {selectedIds.length > 0
                  ? `${selectedIds.length} certification(s) sélectionnée(s)`
                  : `${filteredCertifications.filter(c => c.email).length} étudiant(s) certifié(s) avec email`}
              </p>
              {filteredCertifications.filter(c => c.email).length === 0 && (
                <p className="mt-2 text-xs text-destructive">
                  Aucun étudiant avec email disponible. Les messages ne pourront pas être envoyés.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenMessageDialog(false)} disabled={isSendingMessage}>
              Annuler
            </Button>
            <Button onClick={handleSendMessage} disabled={isSendingMessage || filteredCertifications.filter(c => c.email).length === 0}>
              {isSendingMessage ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" />
                  Envoyer
                </>
              )}
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
        <CardTitle className="text-lg">Aucun certificat trouvé</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>Modifiez votre recherche ou réinitialisez les filtres pour consulter l’ensemble des badges.</p>
        <Button variant="secondary" size="sm" className="gap-2" onClick={onReset}>
          Réinitialiser
        </Button>
      </CardContent>
    </Card>
  )
}





