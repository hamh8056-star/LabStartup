import { nanoid } from "nanoid"

export type CommunityPost = {
  id: string
  title: string
  author: string
  summary: string
  upvotes: number
  tags: string[]
  createdAt: string
}

export function getCommunityHighlights(): CommunityPost[] {
  return [
    {
      id: nanoid(10),
      title: "Synthèse d'ADN en classe inversée",
      author: "Prof. Benslimane",
      summary:
        "Retour d'expérience sur l'utilisation d'un scénario libre avec feedback IA pour une classe de BTS.",
      upvotes: 128,
      tags: ["biologie", "classe-inversée", "ia"],
      createdAt: new Date().toISOString(),
    },
    {
      id: nanoid(10),
      title: "Challenge circuits amplificateurs",
      author: "Groupe Makers ENSAM",
      summary:
        "Un concours virtuel où les étudiants optimisent le rapport signal/bruit en mode collaboratif.",
      upvotes: 96,
      tags: ["electronique", "collaboration"],
      createdAt: new Date(Date.now() - 7200_000).toISOString(),
    },
    {
      id: nanoid(10),
      title: "VR et accessibilité en laboratoire",
      author: "Nadia O.",
      summary:
        "Conseils pour exploiter les casques VR et rendre les manipulations accessibles aux élèves malvoyants.",
      upvotes: 143,
      tags: ["accessibilite", "vr"],
      createdAt: new Date(Date.now() - 10800_000).toISOString(),
    },
  ]
}

export type DiscussionThread = {
  id: string
  title: string
  author: string
  discipline: "physics" | "biology" | "electronics" | "informatics"
  disciplineLabel: string
  createdAt: string
  preview: string
  replies: number
  upvotes: number
  tags: string[]
}

export type LeaderboardEntry = {
  teamId: string
  teamName: string
  projectTitle: string
  score: number
  disciplineLabel: string
}

export type ProjectComment = {
  id: string
  author: string
  content: string
  rating: number
  createdAt: string
}

export type CommunityProject = {
  id: string
  title: string
  disciplineLabel: string
  author: string
  publishedAt: string
  summary: string
  downloads: number
  peerReviews: number
  comments: ProjectComment[]
}

export type CommunityResponse = {
  discussions: DiscussionThread[]
  leaderboard: LeaderboardEntry[]
  projects: CommunityProject[]
}

export function getCommunityData(): CommunityResponse {
  const now = Date.now()
  return {
    discussions: [
      {
        id: "thread-diffraction",
        title: "Optimiser la précision du capteur photonique",
        author: "Sara K.",
        discipline: "physics",
        disciplineLabel: "Physique",
        createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
        preview: "Quels filtres utilisez-vous pour réduire le bruit lors des mesures de diffraction ?",
        replies: 14,
        upvotes: 32,
        tags: ["capteur", "pro tips"],
      },
      {
        id: "thread-bio",
        title: "Créer un organite custom dans la simulation",
        author: "Yanis R.",
        discipline: "biology",
        disciplineLabel: "Biologie",
        createdAt: new Date(now - 1000 * 60 * 60 * 18).toISOString(),
        preview: "Je partage ma méthode pour ajouter un organite personnalisé avec comportement dynamique.",
        replies: 9,
        upvotes: 21,
        tags: ["organite", "assets"],
      },
      {
        id: "thread-elec",
        title: "Partage d'un circuit amplificateur stable",
        author: "Pr Karim B.",
        discipline: "electronics",
        disciplineLabel: "Électronique",
        createdAt: new Date(now - 1000 * 60 * 60 * 30).toISOString(),
        preview: "Voici mon schéma pour limiter la saturation lors des mesures audio.",
        replies: 5,
        upvotes: 18,
        tags: ["circuit", "audio"],
      },
      {
        id: "thread-info",
        title: "Gamifier un challenge algo",
        author: "Leila K.",
        discipline: "informatics",
        disciplineLabel: "Informatique",
        createdAt: new Date(now - 1000 * 60 * 60 * 48).toISOString(),
        preview: "Comment gérez-vous le scoring en temps réel pour les challenges algorithmiques ?",
        replies: 12,
        upvotes: 40,
        tags: ["gamification", "scores"],
      },
    ],
    leaderboard: [
      {
        teamId: "team-quantum",
        teamName: "Quantum Makers",
        projectTitle: "Diffraction multi-fentes + IA",
        score: 96,
        disciplineLabel: "Physique",
      },
      {
        teamId: "team-bio-flux",
        teamName: "BioFlux",
        projectTitle: "Cellule holo évolutive",
        score: 91,
        disciplineLabel: "Biologie",
      },
      {
        teamId: "team-circuit-lab",
        teamName: "CircuitLab",
        projectTitle: "Amplification audio sans saturation",
        score: 88,
        disciplineLabel: "Électronique",
      },
      {
        teamId: "team-algo",
        teamName: "AlgoRacers",
        projectTitle: "Tri hybride temps réel",
        score: 84,
        disciplineLabel: "Informatique",
      },
    ],
    projects: [
      {
        id: "proj-diffraction",
        title: "Diffraction assistée",
        disciplineLabel: "Physique",
        author: "Sara Kaci",
        publishedAt: new Date(now - 1000 * 60 * 60 * 20).toISOString(),
        summary: "Expérience Keynote + VR pour présenter la diffraction à double fente avec collecte de données.",
        downloads: 162,
        peerReviews: 28,
        comments: [
          {
            id: "comment-1",
            author: "Pr Karim B.",
            content: "Excellent pour initier les L2. J'ai ajouté une étape sur la calibration laser.",
            rating: 5,
            createdAt: new Date(now - 1000 * 60 * 45).toISOString(),
          },
          {
            id: "comment-2",
            author: "Nora L.",
            content: "Peut-on intégrer directement le capteur photonique IA ?",
            rating: 4,
            createdAt: new Date(now - 1000 * 60 * 120).toISOString(),
          },
        ],
      },
      {
        id: "proj-bio",
        title: "Cellule augmentée collaborative",
        disciplineLabel: "Biologie",
        author: "Yanis R.",
        publishedAt: new Date(now - 1000 * 60 * 60 * 36).toISOString(),
        summary: "Scénario collaboratif pour explorer les organites avec annotations partagées.",
        downloads: 138,
        peerReviews: 19,
        comments: [
          {
            id: "comment-3",
            author: "Sara B.",
            content: "J'adore la possibilité d'ajouter un suivi de viabilité.",
            rating: 5,
            createdAt: new Date(now - 1000 * 60 * 90).toISOString(),
          },
        ],
      },
      {
        id: "proj-algo",
        title: "Challenge Tri Fusion",
        disciplineLabel: "Informatique",
        author: "Leila K.",
        publishedAt: new Date(now - 1000 * 60 * 60 * 60).toISOString(),
        summary: "Challenge en binôme avec scoring temps réel et export des résultats.",
        downloads: 110,
        peerReviews: 16,
        comments: [
          {
            id: "comment-4",
            author: "Adam S.",
            content: "Scoreboard très motivant. J'ai ajouté un badge pour les temps record.",
            rating: 4,
            createdAt: new Date(now - 1000 * 60 * 30).toISOString(),
          },
        ],
      },
    ],
  }
}

