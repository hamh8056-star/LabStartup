"use client"

import { useEffect, useState, useTransition } from "react"
import {
  CloudOff,
  CloudSun,
  Headset,
  MonitorSmartphone,
  ShieldCheck,
  Eye,
  Type,
  Volume2,
  Keyboard,
  Palette,
  Loader2,
  Save,
  CheckCircle2,
} from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { AccessibilitySettings } from "@/lib/accessibility-db"
import { usePWA } from "@/hooks/use-pwa"
import { useKeyboardNavigation } from "@/hooks/use-keyboard-navigation"
import { useScreenReader } from "@/hooks/use-screen-reader"

const deviceMatrix = [
  {
    label: "PC & Ordinateurs portables",
    description: "Optimisation pleine largeur, gestion multi-écrans et compatibilité WebGL 2.0.",
    icon: <MonitorSmartphone className="size-5" />,
    badges: ["Windows", "macOS", "Linux"],
  },
  {
    label: "Tablettes et mobiles",
    description: "Interface responsive, gestures tactiles et rendu 60 FPS.",
    icon: <MonitorSmartphone className="size-5" />,
    badges: ["iPadOS", "Android", "iOS"],
  },
  {
    label: "Casques VR",
    description: "Support WebXR, contrôleurs et streaming 3D immersif.",
    icon: <Headset className="size-5" />,
    badges: ["Quest", "Pico", "HTC Vive"],
  },
]

const lmsPlatforms = [
  {
    name: "Moodle",
    status: "Connecteur API REST & LTI",
    description: "Export des notes, synchronisation des cohortes et insertion des simulations dans vos cours.",
  },
  {
    name: "Google Classroom",
    status: "Import automatique",
    description: "Distribution de ressources, quiz et retour d'évaluations en un clic.",
  },
  {
    name: "Microsoft Teams",
    status: "Bêta",
    description: "Accès direct aux expériences via onglet Teams et suivi des participants.",
  },
  {
    name: "SCORM / xAPI",
    status: "Export",
    description: "Génération de paquets SCORM 1.2 / xAPI pour intégration dans toute plateforme compatible.",
  },
]

export function AccessibilityWorkspace() {
  const { t } = useLanguage()
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.navigator.onLine
    }
    return true
  })
  const [vrSupported, setVrSupported] = useState(false)
  const [settings, setSettings] = useState<AccessibilitySettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, startSaveTransition] = useTransition()
  const [saveSuccess, setSaveSuccess] = useState(false)

  // État local des paramètres
  const [localSettings, setLocalSettings] = useState({
    language: "fr" as "fr" | "en" | "ar",
    fontSize: "medium" as "small" | "medium" | "large" | "xlarge",
    contrast: "normal" as "normal" | "high" | "dark",
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: false,
    colorBlindMode: "none" as "none" | "protanopia" | "deuteranopia" | "tritanopia",
    captions: false,
    audioDescriptions: false,
    offlineMode: false,
    lmsPlatform: "",
    lmsApiKey: "",
    lmsApiUrl: "",
    lmsEnabled: false,
  })

  // Hooks d'accessibilité (doivent être après localSettings)
  const { isInstallable, isInstalled, install } = usePWA()
  const { shortcuts } = useKeyboardNavigation(localSettings.keyboardNavigation)
  useScreenReader(localSettings.screenReader)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("/api/accessibility/settings")
        if (response.ok) {
          const data = await response.json()
          if (data.settings) {
            setSettings(data.settings)
            setLocalSettings({
              language: data.settings.language || "fr",
              fontSize: data.settings.fontSize || "medium",
              contrast: data.settings.contrast || "normal",
              reducedMotion: data.settings.reducedMotion || false,
              screenReader: data.settings.screenReader || false,
              keyboardNavigation: data.settings.keyboardNavigation || false,
              colorBlindMode: data.settings.colorBlindMode || "none",
              captions: data.settings.captions || false,
              audioDescriptions: data.settings.audioDescriptions || false,
              offlineMode: data.settings.offlineMode || false,
              lmsPlatform: data.settings.lmsIntegration?.platform || "",
              lmsApiKey: data.settings.lmsIntegration?.apiKey || "",
              lmsApiUrl: data.settings.lmsIntegration?.apiUrl || "",
              lmsEnabled: data.settings.lmsIntegration?.enabled || false,
            })
          }
        }
      } catch (error) {
        console.error("Error loading settings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    const nav = window.navigator as Navigator & {
      xr?: { isSessionSupported?: (mode: string) => Promise<boolean> }
    }

    if (nav.xr?.isSessionSupported) {
      nav.xr
        .isSessionSupported("immersive-vr")
        .then((supported: boolean) => setVrSupported(supported))
        .catch(() => setVrSupported(false))
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleSaveSettings = () => {
    startSaveTransition(async () => {
      try {
        const payload: any = {
          language: localSettings.language,
          fontSize: localSettings.fontSize,
          contrast: localSettings.contrast,
          reducedMotion: localSettings.reducedMotion,
          screenReader: localSettings.screenReader,
          keyboardNavigation: localSettings.keyboardNavigation,
          colorBlindMode: localSettings.colorBlindMode,
          captions: localSettings.captions,
          audioDescriptions: localSettings.audioDescriptions,
          offlineMode: localSettings.offlineMode,
        }

        if (localSettings.lmsEnabled && localSettings.lmsPlatform) {
          payload.lmsIntegration = {
            platform: localSettings.lmsPlatform,
            apiKey: localSettings.lmsApiKey || undefined,
            apiUrl: localSettings.lmsApiUrl || undefined,
            enabled: true,
          }
        }

        const response = await fetch("/api/accessibility/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error("Erreur lors de la sauvegarde")
        }

        toast.success("Paramètres sauvegardés avec succès")
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
      } catch (error) {
        console.error(error)
        toast.error("Impossible de sauvegarder les paramètres")
      }
    })
  }

  // Appliquer les paramètres d'accessibilité au document
  useEffect(() => {
    if (typeof document === "undefined") return

    const root = document.documentElement
    
    // Taille de police
    root.style.fontSize = {
      small: "14px",
      medium: "16px",
      large: "18px",
      xlarge: "20px",
    }[localSettings.fontSize]

    // Contraste
    if (localSettings.contrast === "high") {
      root.classList.add("high-contrast")
    } else {
      root.classList.remove("high-contrast")
    }

    if (localSettings.contrast === "dark") {
      root.classList.add("dark-mode")
    }

    // Réduction de mouvement
    if (localSettings.reducedMotion) {
      root.style.setProperty("--motion-reduce", "1")
    } else {
      root.style.removeProperty("--motion-reduce")
    }

    // Mode daltonien
    if (localSettings.colorBlindMode !== "none") {
      root.setAttribute("data-color-blind", localSettings.colorBlindMode)
    } else {
      root.removeAttribute("data-color-blind")
    }
  }, [localSettings.fontSize, localSettings.contrast, localSettings.reducedMotion, localSettings.colorBlindMode])

  return (
    <div className="space-y-6">
      {/* Paramètres d'accessibilité */}
      <Card className="border-border/60 bg-card/90">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Paramètres d'accessibilité</CardTitle>
              <p className="text-sm text-muted-foreground">Personnalisez votre expérience selon vos besoins</p>
            </div>
            <Button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sauvegarde...
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 className="size-4" />
                  Sauvegardé
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Taille de police */}
            <div className="space-y-2">
              <Label htmlFor="fontSize" className="flex items-center gap-2">
                <Type className="size-4" />
                Taille de police
              </Label>
              <Select
                value={localSettings.fontSize}
                onValueChange={value => setLocalSettings(prev => ({ ...prev, fontSize: value as typeof localSettings.fontSize }))}
              >
                <SelectTrigger id="fontSize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Petite</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                  <SelectItem value="xlarge">Très grande</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Contraste */}
            <div className="space-y-2">
              <Label htmlFor="contrast" className="flex items-center gap-2">
                <Eye className="size-4" />
                Contraste
              </Label>
              <Select
                value={localSettings.contrast}
                onValueChange={value => setLocalSettings(prev => ({ ...prev, contrast: value as typeof localSettings.contrast }))}
              >
                <SelectTrigger id="contrast">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Élevé</SelectItem>
                  <SelectItem value="dark">Mode sombre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Mode daltonien */}
            <div className="space-y-2">
              <Label htmlFor="colorBlindMode" className="flex items-center gap-2">
                <Palette className="size-4" />
                Mode daltonien
              </Label>
              <Select
                value={localSettings.colorBlindMode}
                onValueChange={value => setLocalSettings(prev => ({ ...prev, colorBlindMode: value as typeof localSettings.colorBlindMode }))}
              >
                <SelectTrigger id="colorBlindMode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  <SelectItem value="protanopia">Protanopie (rouge-vert)</SelectItem>
                  <SelectItem value="deuteranopia">Deutéranopie (rouge-vert)</SelectItem>
                  <SelectItem value="tritanopia">Tritanopie (bleu-jaune)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Options d'accessibilité */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Options d'accessibilité</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="reducedMotion" className="text-sm font-medium">Réduction de mouvement</Label>
                  <p className="text-xs text-muted-foreground">Désactive les animations pour réduire les distractions</p>
                </div>
                <Switch
                  id="reducedMotion"
                  checked={localSettings.reducedMotion}
                  onCheckedChange={checked => setLocalSettings(prev => ({ ...prev, reducedMotion: checked }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="screenReader" className="text-sm font-medium">Lecteur d'écran</Label>
                  <p className="text-xs text-muted-foreground">Optimise l'interface pour les lecteurs d'écran</p>
                </div>
                <Switch
                  id="screenReader"
                  checked={localSettings.screenReader}
                  onCheckedChange={checked => setLocalSettings(prev => ({ ...prev, screenReader: checked }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="keyboardNavigation" className="flex items-center gap-2 text-sm font-medium">
                    <Keyboard className="size-4" />
                    Navigation au clavier
                  </Label>
                  <p className="text-xs text-muted-foreground">Active les raccourcis clavier et la navigation complète</p>
                </div>
                <Switch
                  id="keyboardNavigation"
                  checked={localSettings.keyboardNavigation}
                  onCheckedChange={checked => setLocalSettings(prev => ({ ...prev, keyboardNavigation: checked }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="captions" className="flex items-center gap-2 text-sm font-medium">
                    <Volume2 className="size-4" />
                    Sous-titres
                  </Label>
                  <p className="text-xs text-muted-foreground">Affiche les sous-titres pour les vidéos</p>
                </div>
                <Switch
                  id="captions"
                  checked={localSettings.captions}
                  onCheckedChange={checked => setLocalSettings(prev => ({ ...prev, captions: checked }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="audioDescriptions" className="text-sm font-medium">Descriptions audio</Label>
                  <p className="text-xs text-muted-foreground">Active les descriptions audio pour les contenus visuels</p>
                </div>
                <Switch
                  id="audioDescriptions"
                  checked={localSettings.audioDescriptions}
                  onCheckedChange={checked => setLocalSettings(prev => ({ ...prev, audioDescriptions: checked }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="offlineMode" className="text-sm font-medium">Mode hors ligne</Label>
                  <p className="text-xs text-muted-foreground">Active le cache pour l'utilisation hors ligne</p>
                </div>
                <Switch
                  id="offlineMode"
                  checked={localSettings.offlineMode}
                  onCheckedChange={checked => setLocalSettings(prev => ({ ...prev, offlineMode: checked }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/90">
        <CardHeader>
          <CardTitle className="text-lg">{t("accessibility.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("accessibility.subtitle")}</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {deviceMatrix.map(device => (
            <div key={device.label} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {device.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{device.label}</p>
                  <p className="text-xs text-muted-foreground">{device.description}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {device.badges.map(badge => (
                  <Badge key={badge} variant="outline">
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="text-lg">{t("accessibility.languageHeading")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("accessibility.languageDescription")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <LanguageSwitcher />
            <Tabs value={localSettings.language} onValueChange={value => setLocalSettings(prev => ({ ...prev, language: value as "fr" | "en" | "ar" }))}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="fr">Français</TabsTrigger>
                <TabsTrigger value="en">English</TabsTrigger>
                <TabsTrigger value="ar">العربية</TabsTrigger>
              </TabsList>
              <TabsContent value="fr" className="text-sm text-muted-foreground">
                Interface par défaut avec normes RGAA et traductions disciplinaires.
              </TabsContent>
              <TabsContent value="en" className="text-sm text-muted-foreground">
                Interface anglophone pour vos classes internationales.
              </TabsContent>
              <TabsContent value="ar" className="text-sm text-muted-foreground">
                Prise en charge RTL et terminologie scientifique adaptée.
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="text-lg">Statut en direct</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <StatusRow
              icon={isOnline ? <CloudSun className="size-4 text-emerald-500" /> : <CloudOff className="size-4 text-red-500" />}
              title={isOnline ? t("common.online") : t("common.offline")}
              description={isOnline ? "Synchronisation des données activée." : "Utilisation hors ligne — les modifications seront envoyées dès le retour du réseau."}
            />
            <StatusRow
              icon={<Headset className={cn("size-4", vrSupported ? "text-emerald-500" : "text-muted-foreground") } />}
              title={t("common.vrReady")}
              description={vrSupported ? "Casque VR détecté. Vous pouvez lancer les expériences immersives." : "Activez WebXR dans votre navigateur ou connectez un casque compatible."}
            />
            <StatusRow
              icon={<ShieldCheck className="size-4 text-primary" />}
              title={isInstalled ? "PWA installée" : isInstallable ? "PWA installable" : "PWA installable"}
              description={
                isInstalled
                  ? "L'application est installée sur votre appareil."
                  : isInstallable
                    ? "Cliquez sur le bouton ci-dessous pour installer l'application."
                    : "Ajoutez Taalimia à votre écran d'accueil pour un lancement instantané et un stockage hors connexion."
              }
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/90">
        <CardHeader>
          <CardTitle className="text-lg">{t("accessibility.offlineHeading")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("accessibility.offlineDescription")}</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Les ressources critiques (fiches PDF, vidéos compressées, modules interactifs) sont mises en cache automatiquement.
            </p>
            <p>
              Le mode hors ligne conserve votre progression puis déclenche une synchronisation différée dès que la connexion revient.
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={async () => {
              if (isInstallable && !isInstalled) {
                const installed = await install()
                if (installed) {
                  toast.success("Application installée avec succès")
                }
              } else if (isInstalled) {
                toast.info("L'application est déjà installée")
              } else {
                window.open("/manifest.webmanifest", "_blank")
              }
            }}
            disabled={!isInstallable && !isInstalled}
          >
            {isInstalled ? "Application installée" : isInstallable ? "Installer l'application" : "Voir le manifeste"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/90">
        <CardHeader>
          <CardTitle className="text-lg">{t("accessibility.lmsHeading")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("accessibility.lmsDescription")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {lmsPlatforms.map(platform => (
            <div key={platform.name} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{platform.name}</p>
                <Badge variant="outline">{platform.status}</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{platform.description}</p>
            </div>
          ))}
          <Separator />
          
          {/* Configuration LMS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="lmsEnabled" className="text-sm font-medium">Activer l'intégration LMS</Label>
              <Switch
                id="lmsEnabled"
                checked={localSettings.lmsEnabled}
                onCheckedChange={checked => setLocalSettings(prev => ({ ...prev, lmsEnabled: checked }))}
              />
            </div>

            {localSettings.lmsEnabled && (
              <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
                <div className="space-y-2">
                  <Label htmlFor="lmsPlatform">Plateforme LMS</Label>
                  <Select
                    value={localSettings.lmsPlatform}
                    onValueChange={value => setLocalSettings(prev => ({ ...prev, lmsPlatform: value }))}
                  >
                    <SelectTrigger id="lmsPlatform">
                      <SelectValue placeholder="Sélectionnez une plateforme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="moodle">Moodle</SelectItem>
                      <SelectItem value="google-classroom">Google Classroom</SelectItem>
                      <SelectItem value="microsoft-teams">Microsoft Teams</SelectItem>
                      <SelectItem value="canvas">Canvas</SelectItem>
                      <SelectItem value="blackboard">Blackboard</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lmsApiUrl">URL de l'API</Label>
                  <Input
                    id="lmsApiUrl"
                    type="url"
                    value={localSettings.lmsApiUrl}
                    onChange={e => setLocalSettings(prev => ({ ...prev, lmsApiUrl: e.target.value }))}
                    placeholder="https://votre-lms.com/api"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lmsApiKey">Clé API (optionnel)</Label>
                  <Input
                    id="lmsApiKey"
                    type="password"
                    value={localSettings.lmsApiKey}
                    onChange={e => setLocalSettings(prev => ({ ...prev, lmsApiKey: e.target.value }))}
                    placeholder="Votre clé API"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Besoin d&apos;un connecteur personnalisé (LTI, OAuth) ?</span>
              <Button asChild size="sm" variant="ghost" className="gap-1">
                <a href="mailto:contact@taalimia.education">Contacter le support intégration</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Raccourcis clavier */}
      {localSettings.keyboardNavigation && (
        <Card className="border-border/60 bg-card/90">
          <CardHeader>
            <CardTitle className="text-lg">Raccourcis clavier</CardTitle>
            <p className="text-sm text-muted-foreground">Liste des raccourcis disponibles</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {shortcuts
                .filter(s => s.description)
                .map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                    <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.ctrlKey && <kbd className="rounded border border-border bg-muted px-2 py-1 text-xs">Ctrl</kbd>}
                      {shortcut.shiftKey && <kbd className="rounded border border-border bg-muted px-2 py-1 text-xs">Shift</kbd>}
                      {shortcut.altKey && <kbd className="rounded border border-border bg-muted px-2 py-1 text-xs">Alt</kbd>}
                      <kbd className="rounded border border-border bg-muted px-2 py-1 text-xs">{shortcut.key.toUpperCase()}</kbd>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres SVG pour les modes daltoniens */}
      <svg className="accessibility-filters" aria-hidden="true">
        <defs>
          <filter id="protanopia">
            <feColorMatrix
              type="matrix"
              values="0.567, 0.433, 0, 0, 0
                      0.558, 0.442, 0, 0, 0
                      0, 0.242, 0.758, 0, 0
                      0, 0, 0, 1, 0"
            />
          </filter>
          <filter id="deuteranopia">
            <feColorMatrix
              type="matrix"
              values="0.625, 0.375, 0, 0, 0
                      0.7, 0.3, 0, 0, 0
                      0, 0.3, 0.7, 0, 0
                      0, 0, 0, 1, 0"
            />
          </filter>
          <filter id="tritanopia">
            <feColorMatrix
              type="matrix"
              values="0.95, 0.05, 0, 0, 0
                      0, 0.433, 0.567, 0, 0
                      0, 0.475, 0.525, 0, 0
                      0, 0, 0, 1, 0"
            />
          </filter>
        </defs>
      </svg>
    </div>
  )
}

function StatusRow({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-3">
      <span className="mt-1 text-primary">{icon}</span>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
