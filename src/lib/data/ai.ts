import { nanoid } from "nanoid"

export type AiRecommendation = {
  id: string
  title: string
  focus: string
  message: string
  suggestedAction: string
  confidence: number
}

export function getAiRecommendations(level: "student" | "teacher") {
  if (level === "teacher") {
    return [
      {
        id: nanoid(8),
        title: "Analyse formative automatisée",
        focus: "Suivi des progrès",
        message:
          "Le groupe 2B montre une baisse de 12% sur les quiz post-simulation. Proposez une révision ciblée sur la section thermodynamique.",
        suggestedAction:
          "Planifier une session collaborative avec le tuteur IA pour revoir les concepts critiques.",
        confidence: 0.82,
      },
      {
        id: nanoid(8),
        title: "Nouvelle ressource recommandée",
        focus: "Ressources",
        message:
          "Les étudiants de biologie demandent plus d'activités libres. Ajoutez le scénario 'Mutation génétique contrôlée'.",
        suggestedAction: "Activer le mode expérimentation libre pour la section biologie.",
        confidence: 0.74,
      },
    ]
  }

  return [
    {
      id: nanoid(8),
      title: "Prochaine expérience suggérée",
      focus: "Progression",
      message:
        "Tu as excellé en diffraction. Essaie maintenant la simulation 'Laser et spectroscopie' pour approfondir.",
      suggestedAction: "Lancer la simulation recommandée avec guidage pas à pas.",
      confidence: 0.9,
    },
    {
      id: nanoid(8),
      title: "Révision ciblée",
      focus: "Révision",
      message:
        "Certaines erreurs sur l'analyse des interférences. Consulte la fiche récapitulative interactive de 8 minutes.",
      suggestedAction: "Ouvrir la fiche et répondre aux questions flash.",
      confidence: 0.78,
    },
  ]
}

