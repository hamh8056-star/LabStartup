"use client"

import { useState, useEffect, useTransition } from "react"
import useSWR from "swr"
import {
  AlertTriangle,
  ArchiveRestore,
  BadgeCheck,
  KeySquare,
  Lock,
  LogOut,
  RefreshCcw,
  ShieldHalf,
  Shield,
  Activity,
  Database,
  Clock,
  CheckCircle2,
  XCircle,
  Download,
  Eye,
  EyeOff,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function SecurityWorkspace() {
  const [keyName, setKeyName] = useState("")
  const [newSecret, setNewSecret] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState(false)
  const [isSaving, startTransition] = useTransition()

  const { data: keysData, mutate: mutateKeys, isValidating: keysLoading } = useSWR<{
    keys: Array<{ id: string; name: string; prefix?: string; createdAt: string; revokedAt?: string | null; lastUsedAt?: string }>
  }>("/api/security/api-keys", fetcher, { revalidateOnFocus: false })

  const { data: logsData, mutate: mutateLogs } = useSWR<{
    logs: Array<{
      id: string
      action: string
      severity: string
      metadata: Record<string, unknown>
      email?: string | null
      createdAt: string
    }>
  }>("/api/security/logs?limit=50", fetcher, { refreshInterval: 20000 })

  const { data: statsData, mutate: mutateStats } = useSWR<{
    stats: {
      totalAPIKeys: number
      activeAPIKeys: number
      revokedAPIKeys: number
      totalAuditLogs: number
      criticalLogs: number
      recentBackups: number
      lastBackup?: string
    }
  }>("/api/security/stats", fetcher, { refreshInterval: 30000 })

  const { data: backupsData, mutate: mutateBackups } = useSWR<{
    backups: Array<{
      id: string
      type: string
      status: string
      size?: number
      createdAt: string
      completedAt?: string
      error?: string
    }>
  }>("/api/security/backup", fetcher, { refreshInterval: 30000 })

  const keys = keysData?.keys ?? []
  const logs = logsData?.logs ?? []
  const stats = statsData?.stats
  const backups = backupsData?.backups ?? []

  const activeKeys = keys.filter(key => !key.revokedAt)

  const handleCreateKey = () => {
    const trimmed = keyName.trim()
    if (trimmed.length < 3) {
      toast.error("Nom trop court", { description: "Merci de fournir un intitulé d'au moins 3 caractères." })
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/security/api-keys", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        })

        if (!response.ok) {
          const body = await response.json().catch(() => null)
          toast.error(body?.message ?? "Impossible de créer la clé API.")
          return
        }

        const payload = (await response.json()) as { id: string; secret: string }
        setNewSecret(payload.secret)
        setKeyName("")
        mutateKeys()
        mutateStats()
        toast.success("Clé API générée", { description: "Copiez le secret affiché ci-dessous : il ne sera plus visible." })
      } catch (error) {
        toast.error("Erreur lors de la création de la clé API")
      }
    })
  }

  const handleRevoke = async (id: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/security/api-keys/${id}`, { method: "DELETE" })
        if (!response.ok) {
          toast.error("Révocation impossible.")
          return
        }
        mutateKeys()
        mutateStats()
        toast.success("Clé révoquée")
      } catch (error) {
        toast.error("Erreur lors de la révocation")
      }
    })
  }

  const handleBackup = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/security/backup", { method: "POST" })
        if (!response.ok) {
          toast.error("Échec de la sauvegarde")
          return
        }
        const body = (await response.json()) as { message: string }
        toast.success("Sauvegarde planifiée", { description: body.message })
        mutateBackups()
        mutateStats()
        mutateLogs()
      } catch (error) {
        toast.error("Erreur lors de la sauvegarde")
      }
    })
  }

  const severityColors: Record<string, string> = {
    critical: "destructive",
    error: "destructive",
    warning: "outline",
    info: "secondary",
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clés API actives</CardTitle>
              <KeySquare className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeAPIKeys}</div>
              <p className="text-xs text-muted-foreground">sur {stats.totalAPIKeys} total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Logs d'audit</CardTitle>
              <Activity className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAuditLogs}</div>
              <p className="text-xs text-muted-foreground">{stats.criticalLogs} critiques</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sauvegardes (7j)</CardTitle>
              <Database className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentBackups}</div>
              {stats.lastBackup && (
                <p className="text-xs text-muted-foreground">
                  Dernière: {format(new Date(stats.lastBackup), "dd/MM/yyyy", { locale: fr })}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clés révoquées</CardTitle>
              <XCircle className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.revokedAPIKeys}</div>
              <p className="text-xs text-muted-foreground">Clés désactivées</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Authentification & conformité */}
      <Card className="border-border/60 bg-card/90">
        <CardHeader>
          <CardTitle className="text-lg">Authentification & conformité</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <SecurityTile
            icon={<ShieldHalf className="size-5" />}
            title="JWT sécurisés"
            description="Sessions signées côté serveur. Les tokens sont régénérés à chaque connexion."
            status="Actif"
          />
          <SecurityTile
            icon={<BadgeCheck className="size-5" />}
            title="SSO GitHub"
            description="Connexion via OAuth 2.0. Activez d'autres providers en ajoutant leurs identifiants."
            status="Configurable"
          />
          <SecurityTile
            icon={<Lock className="size-5" />}
            title="Rôles & permissions"
            description="Rôles disponibles : admin, teacher, student. Autorisations fines côté back-end."
            status={`Actif (${activeKeys.length} clé${activeKeys.length > 1 ? "s" : ""} API)`}
          />
        </CardContent>
      </Card>

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList>
          <TabsTrigger value="api-keys">Clés API</TabsTrigger>
          <TabsTrigger value="audit-logs">Logs d'audit</TabsTrigger>
          <TabsTrigger value="backups">Sauvegardes</TabsTrigger>
        </TabsList>

        {/* Gestion des clés API */}
        <TabsContent value="api-keys" className="space-y-6">
          <Card className="border-border/60 bg-card/90">
            <CardHeader>
              <CardTitle className="text-lg">Gestion des clés API</CardTitle>
              <CardDescription>
                Générez des clés pour automatiser des intégrations (LMS, scripts administratifs). Les secrets sont hashés côté serveur.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <Input
                  placeholder="Nom de la clé (ex. Integration Moodle)"
                  value={keyName}
                  onChange={event => setKeyName(event.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      handleCreateKey()
                    }
                  }}
                  className="md:flex-1"
                />
                <Button onClick={handleCreateKey} className="gap-2" disabled={keysLoading || isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <KeySquare className="size-4" />
                      Générer
                    </>
                  )}
                </Button>
              </div>
              {newSecret ? (
                <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-primary">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-[0.3em] text-primary/80">Secret API — affichez-le une seule fois</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSecret(!showSecret)}
                      className="h-6 w-6 p-0"
                    >
                      {showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                  <div className="mt-2 font-mono text-sm break-all">
                    {showSecret ? newSecret : "•".repeat(50)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(newSecret)
                      toast.success("Secret copié dans le presse-papier")
                    }}
                    className="mt-2"
                  >
                    Copier dans le presse-papier
                  </Button>
                </div>
              ) : null}
              <Separator />
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2">
                  {keys.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune clé générée pour le moment.</p>
                  ) : (
                    keys.map(key => (
                      <div
                        key={key.id}
                        className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 p-3 text-sm md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">{key.name}</p>
                            {key.revokedAt ? (
                              <Badge variant="outline">Révoquée</Badge>
                            ) : (
                              <Badge variant="secondary">Active</Badge>
                            )}
                          </div>
                          {key.prefix && (
                            <p className="text-xs text-muted-foreground">
                              Préfixe: {key.prefix}...
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Créée le {format(new Date(key.createdAt), "PPPp", { locale: fr })}
                            {key.lastUsedAt && ` • Dernière utilisation: ${format(new Date(key.lastUsedAt), "PPPp", { locale: fr })}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!key.revokedAt && (
                            <Button variant="ghost" size="sm" onClick={() => handleRevoke(key.id)} className="gap-1" disabled={isSaving}>
                              <LogOut className="size-3.5" />
                              Révoquer
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs d'audit */}
        <TabsContent value="audit-logs" className="space-y-6">
          <Card className="border-border/60 bg-card/90">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Journalisation des accès</CardTitle>
                  <CardDescription>Historique des connexions et évènements critiques</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => mutateLogs()}>
                  <RefreshCcw className="size-4" />
                  Actualiser
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScrollArea className="max-h-[500px] pr-4">
                <div className="space-y-3 text-sm text-muted-foreground">
                  {logs.length === 0 ? (
                    <p>Aucun évènement pour l&apos;instant.</p>
                  ) : (
                    logs.map(log => (
                      <div key={log.id} className="rounded-xl border border-border/60 bg-muted/20 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant={severityColors[log.severity] as any} className="gap-1">
                            {log.severity.toUpperCase()}
                          </Badge>
                          <span className="text-xs">{format(new Date(log.createdAt), "PPPp", { locale: fr })}</span>
                        </div>
                        <p className="mt-2 text-sm text-foreground">{log.action}</p>
                        {log.email ? <p className="text-xs text-muted-foreground">Utilisateur: {log.email}</p> : null}
                        {Object.keys(log.metadata ?? {}).length ? (
                          <pre className="mt-2 rounded-lg bg-background/60 p-2 text-[11px] text-muted-foreground overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sauvegardes */}
        <TabsContent value="backups" className="space-y-6">
          <Card className="border-border/60 bg-card/90">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Sauvegarde & reprise</CardTitle>
                  <CardDescription>
                    Les sauvegardes automatiques sont planifiées quotidiennement (2h UTC). Lancez un backup manuel en cas d&apos;opération sensible.
                  </CardDescription>
                </div>
                <Button variant="outline" className="gap-2" onClick={handleBackup} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <ArchiveRestore className="size-4" />
                      Lancer une sauvegarde
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <p>Les données d&apos;audit et les clés API sont chiffrées au repos dans MongoDB.</p>
              </div>
              <Separator className="mb-4" />
              <ScrollArea className="max-h-[400px]">
                <div className="space-y-2">
                  {backups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune sauvegarde disponible.</p>
                  ) : (
                    backups.map(backup => (
                      <div
                        key={backup.id}
                        className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/20 p-3 text-sm md:flex-row md:items-center md:justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">
                              Sauvegarde {backup.type === "manual" ? "manuelle" : "automatique"}
                            </p>
                            <Badge
                              variant={
                                backup.status === "completed"
                                  ? "default"
                                  : backup.status === "failed"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {backup.status === "completed" ? "Terminée" : backup.status === "failed" ? "Échouée" : "En cours"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Créée le {format(new Date(backup.createdAt), "PPPp", { locale: fr })}
                            {backup.completedAt && ` • Terminée le ${format(new Date(backup.completedAt), "PPPp", { locale: fr })}`}
                            {backup.size && ` • Taille: ${(backup.size / 1024 / 1024).toFixed(2)} MB`}
                          </p>
                          {backup.error && (
                            <p className="text-xs text-destructive mt-1">Erreur: {backup.error}</p>
                          )}
                        </div>
                        {backup.status === "completed" && (
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Download className="size-4" />
                            Télécharger
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recommandations de sécurité */}
      <Card className="border-border/60 bg-card/90">
        <CardHeader>
          <CardTitle className="text-lg">Recommandations de sécurité</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 text-sm text-muted-foreground">
          <Tip
            icon={<AlertTriangle className="size-4 text-orange-500" />}
            title="Rotation des secrets"
            description="Renouvelez les clés API tous les trimestres et utilisez des variables d&apos;environnement pour les stocker."
          />
          <Tip
            icon={<Lock className="size-4 text-primary" />}
            title="SSO étendu"
            description="Activez l&apos;auth SAML ou Azure AD pour aligner Taalimia avec votre politique d&apos;entreprise."
          />
          <Tip
            icon={<ShieldHalf className="size-4 text-emerald-500" />}
            title="Surveillance"
            description="Connectez les logs à votre SIEM (Splunk, Datadog) via l&apos;export audit_logs pour une supervision centralisée."
          />
        </CardContent>
      </Card>
    </div>
  )
}

function SecurityTile({ icon, title, description, status }: { icon: React.ReactNode; title: string; description: string; status: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">{icon}</span>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <p className="mt-3 text-xs font-medium uppercase tracking-[0.3em] text-primary/70">{status}</p>
    </div>
  )
}

function Tip({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
      <div className="flex items-center gap-2 text-primary">
        <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10">{icon}</span>
        <p className="font-semibold text-foreground">{title}</p>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{description}</p>
    </div>
  )
}
