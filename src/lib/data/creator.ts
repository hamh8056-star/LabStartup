export type ExperienceBlueprint = {
  id: string
  title: string
  discipline: string
  status: "draft" | "published" | "review"
  updatedAt: string
  author: string
  tags: string[]
  sharedWith: string[]
  summary: string
  steps: string[]
  version: number
}

export function getExperienceLibrary(): ExperienceBlueprint[] {
  return [
    {
      id: "exp-diffraction-ai",
      title: "Diffraction assistée par IA",
      discipline: "physique",
      status: "published",
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      author: "Pr Karim Benali",
      tags: ["optique", "ia", "baccalauréat"],
      sharedWith: ["L2 Physique", "Prépa sciences"],
      summary: "Expérience immersive de diffraction avec feedback IA et collecte automatique des observations.",
      steps: [
        "Configurer le laser et sélectionner la longueur d'onde.",
        "Activer le capteur photonique et enregistrer les données.",
        "Analyser les franges et valider les hypothèses.",
      ],
      version: 4,
    },
    {
      id: "exp-titrage-virtual",
      title: "Titrage virtuel acide/base avancé",
      discipline: "chimie",
      status: "review",
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
      author: "Dr Nora L.",
      tags: ["chimie analytique", "sécurité"],
      sharedWith: ["M1 Chimie", "Labo partenariat"],
      summary: "Simulation réaliste avec instrumentation virtuelle et reporting automatique SCORM.",
      steps: [
        "Préparer la burette et calibrer la sonde.",
        "Lancer le titrage et relever la courbe.",
        "Importer les résultats dans le module d'évaluation.",
      ],
      version: 2,
    },
    {
      id: "exp-algo-challenge",
      title: "Challenge d'algorithmes collaboratifs",
      discipline: "informatique",
      status: "draft",
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      author: "Sara Kaci",
      tags: ["algorithmique", "collaboration"],
      sharedWith: [],
      summary: "Expérience libre pour créer et comparer des algorithmes de tri en temps réel.",
      steps: [
        "Créer les équipes et attribuer les datasets.",
        "Suivre la performance des algorithmes via le dashboard.",
        "Publier les badges et retours.",
      ],
      version: 1,
    },
  ]
}

export function getBlueprintById(id: string) {
  return getExperienceLibrary().find(blueprint => blueprint.id === id) ?? null
}




