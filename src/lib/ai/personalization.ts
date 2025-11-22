import type { LearningResource, Simulation } from "@/lib/data/seed"
import { baseResources, baseSimulations } from "@/lib/data/seed"

export type LearnerProfile = {
  userId: string
  name: string
  role: "student" | "teacher" | "admin"
  recentSimulations: Array<{
    id: string
    title: string
    completion: number
    lastAccess: string
    score?: number
    errors?: string[]
  }>
  preferredDisciplines: string[]
  focusAreas: string[]
  strengths: string[]
  goals: string[]
}

export type InsightDiagnostics = {
  masteryScore: number
  engagementTrend: "hausse" | "stable" | "baisse"
  errorClusters: Array<{ label: string; frequency: number; recommendation: string }>
  upcomingDeadlines: Array<{ title: string; dueDate: string; type: "quiz" | "simulation" | "evaluation" }>
}

export type AiRecommendation = {
  simulations: Array<Simulation & { reason: string; priority: "haute" | "moyenne" | "basse" }>
  resources: Array<LearningResource & { reason: string }>
  revisions: Array<{ title: string; description: string; estimatedDuration: number; tags: string[] }>
}

export type AssistantResponse = {
  reply: string
  followUps: string[]
  suggestedActions: Array<{ label: string; target: string }>
}

const SAMPLE_USER_PROFILES: Record<string, LearnerProfile> = {
  "student-demo": {
    userId: "student-demo",
    name: "Sara Kaci",
    role: "student",
    preferredDisciplines: ["biologie", "physique"],
    focusAreas: ["optique", "cellule"],
    strengths: ["Observation fine", "Narration scientifique"],
    goals: ["Renforcer l'analyse quantitative", "Préparer le quiz sur la diffraction"],
    recentSimulations: [
      {
        id: "sim-bio-cell",
        title: "Exploration d'une Cellule Augmentée",
        completion: 100,
        lastAccess: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        score: 92,
        errors: ["Confusion sur l'ATP vs ADP"],
      },
      {
        id: "sim-quantum-diffraction",
        title: "Diffraction Quantique du Photon",
        completion: 62,
        lastAccess: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
        score: 58,
        errors: ["Erreur de calcul sur la distance inter-franges", "Mauvaise orientation du capteur"],
      },
    ],
  },
}

export function getLearnerProfile(userId: string, fallback: Partial<LearnerProfile> = {}): LearnerProfile {
  const preset = SAMPLE_USER_PROFILES[userId]
  if (preset) return preset
  return {
    userId,
    name: fallback.name ?? "Apprenant·e",
    role: fallback.role ?? "student",
    preferredDisciplines: fallback.preferredDisciplines ?? ["physique"],
    focusAreas: fallback.focusAreas ?? ["optique"],
    strengths: fallback.strengths ?? ["Curiosité scientifique"],
    goals: fallback.goals ?? ["Renforcer la rigueur méthodologique"],
    recentSimulations: fallback.recentSimulations ?? [],
  }
}

export function buildDiagnostics(profile: LearnerProfile): InsightDiagnostics {
  const masteryBase = profile.recentSimulations.reduce((acc, simulation) => acc + (simulation.score ?? 60), 0)
  const masteryScore = profile.recentSimulations.length ? Math.round(masteryBase / profile.recentSimulations.length) : 65

  const errorClusters = profile.recentSimulations.flatMap(simulation =>
    (simulation.errors ?? []).map(error => ({
      label: error,
      frequency: 1,
      recommendation: error.includes("distance")
        ? "Réviser la formule Δx = λ · L / a et utiliser le tableau de mesures fourni."
        : "Consultez le guide de correction pour comprendre l'origine de l'erreur.",
    })),
  )

  const aggregatedErrors = Object.values(
    errorClusters.reduce<Record<string, { label: string; frequency: number; recommendation: string }>>((acc, item) => {
      if (!acc[item.label]) {
        acc[item.label] = { ...item }
      } else {
        acc[item.label].frequency += 1
      }
      return acc
    }, {}),
  )

  const engagementTrend = masteryScore > 80 ? "hausse" : masteryScore < 60 ? "baisse" : "stable"

  return {
    masteryScore,
    engagementTrend,
    errorClusters: aggregatedErrors,
    upcomingDeadlines: [
      {
        title: "Quiz Post-expérience — Diffraction",
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
        type: "quiz",
      },
      {
        title: "Compte-rendu laboratoire (Cellule)",
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
        type: "evaluation",
      },
    ],
  }
}

export function buildRecommendations(profile: LearnerProfile): AiRecommendation {
  const relevantSimulations: AiRecommendation["simulations"] = baseSimulations
    .filter(simulation => profile.preferredDisciplines.includes(simulation.discipline))
    .slice(0, 3)
    .map((simulation, index) => ({
      ...simulation,
      reason:
        index === 0
          ? "Renforce les notions abordées lors de la dernière séance et propose une analyse guidée."
          : "Correspond à votre objectif pédagogique déclaré.",
      priority: index === 0 ? "haute" : (index === 1 ? "moyenne" : "basse"),
    }))

  const relevantResources: AiRecommendation["resources"] = baseResources
    .filter(resource => profile.preferredDisciplines.includes(resource.discipline))
    .slice(0, 4)
    .map(resource => ({
      ...resource,
      reason: resource.type === "manuel"
        ? "Synthèse théorique pour consolider les connaissances."
        : resource.type === "exercice"
          ? "Entraînement ciblé avec correction automatique."
          : "Support complémentaire recommandé par l'IA.",
    }))

  const revisions: AiRecommendation["revisions"] = [
    {
      title: "Revoir l'équation des franges et ses applications",
      description: "Calculer Δx pour trois configurations différentes et comparer aux résultats simulés.",
      estimatedDuration: 20,
      tags: ["optique", "calcul"],
    },
    {
      title: "Analyse critique d'une expérience d'interférence",
      description: "Décrire les sources d'erreurs possibles et proposer des solutions de remédiation.",
      estimatedDuration: 15,
      tags: ["méthodologie", "analyse"],
    },
  ]

  return {
    simulations: relevantSimulations,
    resources: relevantResources,
    revisions,
  }
}

export function getAssistantResponse(message: string, profile: LearnerProfile): AssistantResponse {
  const normalized = message.toLowerCase()
  const followUps: string[] = []
  const suggestedActions: AssistantResponse["suggestedActions"] = []

  let reply = "Je suis votre tuteur virtuel Taalimia. Posez-moi une question sur les expériences, les résultats ou les révisions à effectuer !"

  if (normalized.includes("erreur") || normalized.includes("bloqué") || normalized.includes("problème")) {
    reply = "Je détecte une difficulté. Vérifions les points sensibles : utilisez le capteur photonique en mode balayage et comparez la distance inter-franges avec la formule Δx = λ · L / a. Je peux aussi générer une fiche de remédiation."
    followUps.push("Souhaitez-vous une explication détaillée de la formule de diffraction ?", "Voulez-vous revoir la configuration du capteur en pas à pas ?")
    suggestedActions.push({ label: "Ouvrir la fiche de remédiation", target: "/dashboard/resources" })
  } else if (normalized.includes("recommandation") || normalized.includes("expérience") || normalized.includes("suivant")) {
    const nextSimulation = buildRecommendations(profile).simulations[0]
    reply = `Je vous suggère de poursuivre avec "${nextSimulation.title}" : vous pourrez y appliquer les corrections identifiées et consolider les acquis.`
    followUps.push("Voulez-vous voir un récapitulatif des objectifs de cette simulation ?")
    suggestedActions.push({ label: "Ouvrir les simulations recommandées", target: "/dashboard/simulations" })
  } else if (normalized.includes("révision") || normalized.includes("réviser") || normalized.includes("quiz")) {
    const revision = buildRecommendations(profile).revisions[0]
    reply = `Pour vos révisions : ${revision.title}. ${revision.description}`
    followUps.push("Besoin d'un quiz diagnostique ?", "Souhaitez-vous une explication vidéo ?")
    suggestedActions.push({ label: "Consulter l'exercice interactif", target: "/dashboard/resources" })
  } else if (normalized.includes("bonjour") || normalized.includes("salut")) {
    reply = `Bonjour ${profile.name}, prêt·e pour une nouvelle exploration ? Je peux analyser vos résultats récents et vous guider.`
    followUps.push("Que souhaitez-vous travailler aujourd'hui ?")
  } else if (normalized.includes("analyse") || normalized.includes("performance") || normalized.includes("progression")) {
    const diagnostics = buildDiagnostics(profile)
    reply = `Analyse actuelle : niveau de maîtrise ${diagnostics.masteryScore}%. Tendance ${diagnostics.engagementTrend}. Principales erreurs : ${diagnostics.errorClusters
      .map(error => error.label)
      .join(", ")}. Voulez-vous que je détaillé chaque point ?`
    followUps.push("Souhaitez-vous un plan d'action personnalisé ?")
    suggestedActions.push({ label: "Voir le tableau de bord", target: "/dashboard" })
  } else {
    reply = "Je prends note. Souhaitez-vous une aide conceptuelle, une recommandation d'expérience ou un plan de révision personnalisé ?"
    followUps.push("Avez-vous rencontré une erreur précise ?", "Quel objectif souhaitez-vous atteindre ?")
  }

  return { reply, followUps, suggestedActions }
}




