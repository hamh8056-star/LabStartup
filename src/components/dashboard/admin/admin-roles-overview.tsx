"use client"

import { Fragment } from "react"
import {
  Activity,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Headphones,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  UserCog,
  Mic,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type RoleKey = "admin" | "teacher" | "student"

const rolePalette: Record<RoleKey, { label: string; accent: string; icon: React.ElementType }> = {
  admin: { label: "Administrateur", accent: "bg-primary/15 text-primary", icon: ShieldCheck },
  teacher: { label: "Enseignant", accent: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200", icon: Users },
  student: { label: "Étudiant", accent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200", icon: BookOpen },
}

const rolesContent: Record<
  RoleKey,
  {
    mission: string
    objective: string
    highlights: { icon: React.ElementType; title: string; description: string }[]
    capabilities: { title: string; items: string[] }[]
  }
> = {
  admin: {
    mission: "Garantir la cohérence, la sécurité et la disponibilité de l&apos;écosystème Taalimia.",
    objective:
      "Surveiller la plateforme, orchestrer les accès et valider les contenus pour maintenir un cadre fiable et conforme.",
    highlights: [
      {
        icon: UserCog,
        title: "Pilotage des accès",
        description: "Création, modification et suppression des comptes enseignants et étudiants avec attribution fine des rôles.",
      },
      {
        icon: ShieldCheck,
        title: "Sécurité renforcée",
        description: "Configuration des politiques d&apos;authentification, suivi des sauvegardes et audit des actions sensibles.",
      },
      {
        icon: BarChart3,
        title: "Supervision globale",
        description: "Lecture des indicateurs d&apos;usage, des performances et export des rapports consolidés.",
      },
    ],
    capabilities: [
      {
        title: "Gestion des utilisateurs",
        items: [
          "Créer, suspendre ou restaurer un compte (enseignant ou étudiant).",
          "Réinitialiser un mot de passe ou gérer un accès SSO.",
          "Affecter ou modifier un rôle et ses permissions.",
        ],
      },
      {
        title: "Supervision du contenu",
        items: [
          "Valider les expériences proposées par les enseignants.",
          "Structurer la bibliothèque et classer les ressources pédagogiques.",
          "Garantir la cohérence des programmes et référentiels.",
        ],
      },
      {
        title: "Paramétrage & conformité",
        items: [
          "Configurer les intégrations LMS, la langue et la charte graphique.",
          "Gérer les licences, quotas institutionnels et accès externes.",
          "Définir les politiques de sauvegarde, chiffrement et journalisation.",
        ],
      },
      {
        title: "Support & maintenance",
        items: [
          "Surveiller l&apos;état des serveurs et la disponibilité des modules.",
          "Traiter les incidents et notifier la communauté.",
          "Coordonner les mises à jour et l&apos;accompagnement technique.",
        ],
      },
    ],
  },
  teacher: {
    mission: "Accompagner les apprenants à travers des expériences scientifiques riches et évaluées.",
    objective:
      "Concevoir, animer et analyser les parcours expérimentaux pour dynamiser l&apos;apprentissage et valoriser les acquis.",
    highlights: [
      {
        icon: ClipboardCheck,
        title: "Création sur mesure",
        description: "Assembler des expériences personnalisées en partant des laboratoires ou de l&apos;éditeur visuel.",
      },
      {
        icon: Trophy,
        title: "Évaluation agile",
        description: "Construire des barèmes, quiz et certificats pour chaque expérience.",
      },
      {
        icon: Activity,
        title: "Suivi pédagogique",
        description: "Analyser les performances, détecter les erreurs fréquentes et ajuster les parcours.",
      },
    ],
    capabilities: [
      {
        title: "Création & adaptation",
        items: [
          "Sélectionner un laboratoire thématique ou créer une scène originale.",
          "Ajouter consignes, paramètres physiques, réactions ou circuits.",
          "Partager ses créations avec la communauté d&apos;enseignants.",
        ],
      },
      {
        title: "Gestion de classe",
        items: [
          "Constituer des classes ou groupes de travail.",
          "Attribuer une expérience à un groupe avec agenda et notifications.",
          "Superviser une séance en temps réel (chat, écran partagé, corrections).",
        ],
      },
      {
        title: "Évaluation & certification",
        items: [
          "Créer des quiz pré/post expérience et définir les objectifs de réussite.",
          "Attribuer badges, points de compétence et certificats numériques.",
          "Consigner les feedbacks individualisés et noter les travaux remis.",
        ],
      },
      {
        title: "Analyse & amélioration",
        items: [
          "Consulter les tableaux de bord par classe, expérience ou période.",
          "Identifier les difficultés récurrentes et proposer des remédiations.",
          "Activer l&apos;assistant IA pour générer des supports ou scénarii alternatifs.",
        ],
      },
    ],
  },
  student: {
    mission: "Développer des compétences scientifiques par l&apos;exploration et la répétition sans risque.",
    objective:
      "Vivre des expériences immersives, collaborer avec sa promotion et progresser grâce à des feedbacks ciblés.",
    highlights: [
      {
        icon: BookOpen,
        title: "Apprentissage immersif",
        description: "Accéder aux laboratoires virtuels, manipuler les instruments et tester des hypothèses.",
      },
      {
        icon: Users,
        title: "Collaboration vivante",
        description: "Travailler en binôme, participer aux classes virtuelles et partager ses rapports.",
      },
      {
        icon: Sparkles,
        title: "Coaching intelligent",
        description: "Recevoir de l&apos;aide via l&apos;assistant IA et bénéficier de recommandations personnalisées.",
      },
    ],
    capabilities: [
      {
        title: "Exploration & pratique",
        items: [
          "Choisir un laboratoire selon sa filière et accéder aux expériences recommandées.",
          "Suivre un scénario guidé ou passer en mode libre pour expérimenter.",
          "Manipuler les instruments 3D et visualiser les résultats en direct.",
        ],
      },
      {
        title: "Apprentissage guidé",
        items: [
          "Lire les fiches de laboratoire, guides pratiques et ressources multimédia.",
          "Utiliser le glossaire interactif pour clarifier un concept.",
          "Valider ses acquis via des quiz interactifs et exercices corrigés.",
        ],
      },
      {
        title: "Collaboration & partage",
        items: [
          "Discuter dans le chat intégré ou rejoindre une classe virtuelle animée.",
          "Partager ses productions et commenter celles des pairs.",
          "Participer aux concours et événements de la communauté.",
        ],
      },
      {
        title: "Suivi personnel",
        items: [
          "Consulter son tableau de bord : progression, badges, certificats.",
          "Analyser ses erreurs et relancer une expérience pour s&apos;améliorer.",
          "Recevoir des propositions de révision ciblées par l&apos;assistant IA.",
        ],
      },
    ],
  },
}

const interactionMatrix: { action: string; admin: boolean; teacher: boolean; student: boolean }[] = [
  { action: "Gestion des utilisateurs", admin: true, teacher: false, student: false },
  { action: "Création d&apos;expériences", admin: true, teacher: true, student: false },
  { action: "Suivi des performances", admin: true, teacher: true, student: true },
  { action: "Collaboration en temps réel", admin: false, teacher: true, student: true },
  { action: "Évaluation & certificats", admin: true, teacher: true, student: true },
  { action: "Accès aux ressources", admin: true, teacher: true, student: true },
  { action: "Gestion du contenu", admin: true, teacher: true, student: false },
  { action: "Support technique", admin: true, teacher: false, student: false },
  { action: "Paramétrage IA & recommandations", admin: true, teacher: true, student: true },
]

export function AdminRolesOverview() {
  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-3">
        {(Object.keys(rolesContent) as RoleKey[]).map(roleKey => {
          const palette = rolePalette[roleKey]
          const content = rolesContent[roleKey]
          const Icon = palette.icon

          return (
            <Card key={roleKey} className="border-border/60 bg-card/95 backdrop-blur">
              <CardHeader className="space-y-3">
                <Badge className={`w-fit gap-2 rounded-full px-3 py-1 text-xs font-semibold ${palette.accent}`}>
                  <Icon className="size-4" />
                  {palette.label}
                </Badge>
                <CardTitle className="text-xl text-foreground">{content.mission}</CardTitle>
                <p className="text-sm text-muted-foreground">{content.objective}</p>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                {content.highlights.map(item => {
                  const HighlightIcon = item.icon
                  return (
                    <div key={item.title} className="flex gap-3 rounded-2xl border border-border/60 bg-muted/25 p-3">
                      <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <HighlightIcon className="size-5" />
                      </span>
                      <div>
                        <p className="text-base font-semibold text-foreground">{item.title}</p>
                        <p>{item.description}</p>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {(Object.keys(rolesContent) as RoleKey[]).map(roleKey => {
          const palette = rolePalette[roleKey]
          const content = rolesContent[roleKey]

          return (
            <Card key={`${roleKey}-capabilities`} className="border-border/60 bg-background/70 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">Focus {palette.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                {content.capabilities.map(section => (
                  <Fragment key={section.title}>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">{section.title}</p>
                      <ul className="space-y-2">
                        {section.items.map(item => (
                          <li key={item} className="flex items-start gap-2">
                            <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Separator className="last:hidden" />
                  </Fragment>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </section>

      <Card className="border-border/60 bg-card/95 backdrop-blur">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-3 text-xl text-foreground">
            <Mic className="size-5 text-primary" />
            Schéma synthétique des interactions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Visualisez en un coup d&apos;œil les actions couvertes par chaque rôle et les responsabilités associées.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border border-border/60">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[40%]">Fonction / action</TableHead>
                  <TableHead className="w-[20%] text-center">Administrateur</TableHead>
                  <TableHead className="w-[20%] text-center">Enseignant</TableHead>
                  <TableHead className="w-[20%] text-center">Étudiant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interactionMatrix.map(entry => (
                  <TableRow key={entry.action}>
                    <TableCell className="text-sm font-medium text-foreground">{entry.action}</TableCell>
                    <TableCell className="text-center">
                      {entry.admin ? <ShieldCheck className="mx-auto size-5 text-primary" /> : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.teacher ? <Users className="mx-auto size-5 text-amber-500" /> : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.student ? <BookOpen className="mx-auto size-5 text-emerald-500" /> : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-lg text-primary">
            <Headphones className="size-5" />
            Guide d&apos;adoption des rôles
          </CardTitle>
          <p className="text-sm text-primary/80">
            Utilisez ce récapitulatif pour former vos équipes, préparer une session de lancement ou harmoniser les bonnes pratiques.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-primary/90 md:grid-cols-3">
          <div className="space-y-2">
            <p className="font-semibold text-primary">Administrateur</p>
            <ul className="space-y-1">
              <li>• Planifier des audits mensuels et vérifier les sauvegardes.</li>
              <li>• Communiquer les nouveautés et informer du support.</li>
              <li>• Valider les expériences partagées avant publication.</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-primary">Enseignant</p>
            <ul className="space-y-1">
              <li>• Déployer au moins une expérience par bloc pédagogique.</li>
              <li>• Donner un feedback structuré après chaque session.</li>
              <li>• Partager les meilleures pratiques avec la communauté.</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-primary">Étudiant</p>
            <ul className="space-y-1">
              <li>• Explorer librement en dehors des séances encadrées.</li>
              <li>• Débriefer les expériences via le portfolio personnel.</li>
              <li>• Activer l&apos;assistant IA pour préparer les évaluations.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}





