import { nanoid } from "nanoid"

export type EvaluationStatus = "pending" | "completed" | "certified"

export type QuizOption = {
  id: string
  label: string
  correct: boolean
  points: number
}

export type QuizQuestion = {
  id: string
  prompt: string
  options: QuizOption[]
  explanation: string
}

export type EvaluationTemplate = {
  id: string
  title: string
  simulationId: string
  preQuizScore: number
  postQuizScore: number
  completion: number
  status: EvaluationStatus
  issuedCertId?: string
  discipline?: string
  difficulty?: "facile" | "intermediaire" | "avance"
  duration?: number
  tags?: string[]
  participants?: number
  lastSubmissionAt?: string
  averageTime?: number
  rubric?: string[]
  quiz: {
    passingScore: number
    badgeThresholds: Array<{ badge: "explorateur" | "innovateur" | "mentor"; minScore: number }>
    pre: QuizQuestion[]
    post: QuizQuestion[]
  }
}

function buildQuestion(prompt: string, answers: Array<{ label: string; correct?: boolean; points?: number }>, explanation: string): QuizQuestion {
  return {
    id: nanoid(8),
    prompt,
    explanation,
    options: answers.map(answer => ({
      id: nanoid(6),
      label: answer.label,
      correct: Boolean(answer.correct),
      points: answer.points ?? (answer.correct ? 1 : 0),
    })),
  }
}

export function getSampleEvaluations(): EvaluationTemplate[] {
  return [
    {
      id: nanoid(10),
      title: "Diffraction quantique - Série A",
      simulationId: "sim-quantum-diffraction",
      preQuizScore: 54,
      postQuizScore: 88,
      completion: 0.92,
      status: "certified",
      issuedCertId: `CERT-${nanoid(6).toUpperCase()}`,
      discipline: "physique",
      difficulty: "intermediaire",
      duration: 25,
      tags: ["quantique", "optique"],
      participants: 28,
      lastSubmissionAt: new Date().toISOString(),
      averageTime: 22,
      rubric: ["Analyse des franges", "Utilisation des capteurs", "Rédaction du rapport"],
      quiz: {
        passingScore: 70,
        badgeThresholds: [
          { badge: "explorateur", minScore: 60 },
          { badge: "innovateur", minScore: 80 },
          { badge: "mentor", minScore: 95 },
        ],
        pre: [
          buildQuestion(
            "Quelle grandeur influe sur l'espacement des franges d'interférence ?",
            [
              { label: "La longueur d'onde", correct: true },
              { label: "L'intensité lumineuse" },
              { label: "La couleur de l'écran" },
            ],
            "La distance entre franges dépend de la longueur d'onde utilisée.",
          ),
          buildQuestion(
            "Pourquoi utilise-t-on un capteur photonique dans l'expérience ?",
            [
              { label: "Pour mesurer l'intensité lumineuse", correct: true },
              { label: "Pour refroidir les lasers" },
              { label: "Pour stabiliser la table optique" },
            ],
            "Le capteur photonique quantifie l'intensité des franges afin d'analyser les variations.",
          ),
        ],
        post: [
          buildQuestion(
            "Que se passe-t-il si on divise par deux la distance écran-fentes ?",
            [
              { label: "Les franges se rapprochent", correct: true },
              { label: "Le motif disparaît" },
              { label: "Les franges s'écartent" },
            ],
            "Réduire la distance diminue l'espacement observé sur l'écran.",
          ),
          buildQuestion(
            "Quelle configuration maximise le contraste des franges ?",
            [
              { label: "Une source monochromatique et cohérente", correct: true },
              { label: "Une lampe halogène" },
              { label: "Deux lasers de couleurs différentes" },
            ],
            "Un laser monochromatique et cohérent offre un contraste optimal.",
          ),
          buildQuestion(
            "Quel paramètre régler pour observer davantage de maxima ?",
            [
              { label: "Augmenter la distance entre les fentes" },
              { label: "Réduire la largeur des fentes", correct: true },
              { label: "Changer l'écran pour un matériau réfléchissant" },
            ],
            "Des fentes plus fines permettent d'augmenter le nombre de maxima visibles.",
          ),
        ],
      },
    },
    {
      id: nanoid(10),
      title: "Circuit audio immersif",
      simulationId: "sim-electro-circuit",
      preQuizScore: 61,
      postQuizScore: 79,
      completion: 0.74,
      status: "completed",
      discipline: "electronique",
      difficulty: "avance",
      duration: 30,
      tags: ["circuits", "audio"],
      participants: 19,
      lastSubmissionAt: new Date(Date.now() - 36 * 3_600_000).toISOString(),
      averageTime: 28,
      rubric: ["Montage du circuit", "Analyse du spectre", "Sécurité électrique"],
      quiz: {
        passingScore: 75,
        badgeThresholds: [
          { badge: "explorateur", minScore: 65 },
          { badge: "innovateur", minScore: 82 },
          { badge: "mentor", minScore: 95 },
        ],
        pre: [
          buildQuestion(
            "Quel composant filtre les basses fréquences dans un filtre passe-haut ?",
            [
              { label: "La self" },
              { label: "Le condensateur", correct: true },
              { label: "La résistance" },
            ],
            "Le condensateur bloque les basses fréquences dans un montage passe-haut.",
          ),
          buildQuestion(
            "Quel est l'effet d'un court-circuit sur l'amplificateur ?",
            [
              { label: "Il augmente le gain" },
              { label: "Il risque d'endommager le composant", correct: true },
              { label: "Il réduit le bruit" },
            ],
            "Un court-circuit peut griller l'ampli et la source.",
          ),
        ],
        post: [
          buildQuestion(
            "Quelle méthode permet de réduire le bruit parasite ?",
            [
              { label: "Relier la masse audio à la terre", correct: true },
              { label: "Ajouter des résistances aléatoires" },
              { label: "Diminuer la tension d'alimentation" },
            ],
            "Une bonne mise à la terre réduit les parasites.",
          ),
          buildQuestion(
            "À quoi sert l'oscilloscope dans cette expérience ?",
            [
              { label: "À moduler la fréquence" },
              { label: "À visualiser le signal audio", correct: true },
              { label: "À refroidir les composants" },
            ],
            "L'oscilloscope affiche la forme du signal.",
          ),
        ],
      },
    },
    {
      id: nanoid(10),
      title: "Exploration cellulaire",
      simulationId: "sim-bio-cell",
      preQuizScore: 48,
      postQuizScore: 83,
      completion: 0.96,
      status: "certified",
      issuedCertId: `CERT-${nanoid(6).toUpperCase()}`,
      discipline: "biologie",
      difficulty: "facile",
      duration: 20,
      tags: ["microscopie", "cellule"],
      participants: 34,
      lastSubmissionAt: new Date(Date.now() - 12 * 3_600_000).toISOString(),
      averageTime: 18,
      rubric: ["Identification organites", "Notes d'observation", "Quiz final"],
      quiz: {
        passingScore: 70,
        badgeThresholds: [
          { badge: "explorateur", minScore: 55 },
          { badge: "innovateur", minScore: 75 },
          { badge: "mentor", minScore: 92 },
        ],
        pre: [
          buildQuestion(
            "Quel organite produit l'énergie sous forme d'ATP ?",
            [
              { label: "Le noyau" },
              { label: "La mitochondrie", correct: true },
              { label: "Le réticulum endoplasmique" },
            ],
            "Les mitochondries génèrent l'ATP.",
          ),
        ],
        post: [
          buildQuestion(
            "Quelle coloration met en évidence le noyau ?",
            [
              { label: "Le bleu de méthylène", correct: true },
              { label: "L'éosine" },
              { label: "Le vert malachite" },
            ],
            "Le bleu de méthylène colore spécifiquement le noyau.",
          ),
          buildQuestion(
            "Quel est le rôle de l'appareil de Golgi ?",
            [
              { label: "Synthétiser l'ADN" },
              { label: "Modifier et trier les protéines", correct: true },
              { label: "Dégrader les lipides" },
            ],
            "Il conditionne et distribue les protéines.",
          ),
        ],
      },
    },
    {
      id: nanoid(10),
      title: "Sécurité des manipulations chimiques",
      simulationId: "sim-bio-cell",
      preQuizScore: 0,
      postQuizScore: 0,
      completion: 0.48,
      status: "pending",
      discipline: "chimie",
      difficulty: "intermediaire",
      duration: 35,
      tags: ["sécurité", "protocoles"],
      participants: 22,
      lastSubmissionAt: new Date(Date.now() - 72 * 3_600_000).toISOString(),
      averageTime: 0,
      rubric: ["Checklist sécurité", "Gestion incidents", "Quiz final"],
      quiz: {
        passingScore: 80,
        badgeThresholds: [
          { badge: "explorateur", minScore: 60 },
          { badge: "innovateur", minScore: 80 },
          { badge: "mentor", minScore: 95 },
        ],
        pre: [
          buildQuestion(
            "Quel EPI est indispensable pour manipuler un acide concentré ?",
            [
              { label: "Des lunettes et des gants nitrile", correct: true },
              { label: "Une blouse en coton uniquement" },
              { label: "Un masque poussière" },
            ],
            "Protection des yeux et des mains obligatoire.",
          ),
        ],
        post: [
          buildQuestion(
            "Quel est le premier réflexe en cas de projection d'acide sur la peau ?",
            [
              { label: "Appliquer une pommade" },
              { label: "Rincer abondamment à l'eau", correct: true },
              { label: "Couvrir avec un bandage" },
            ],
            "Le rinçage prolongé est prioritaire.",
          ),
          buildQuestion(
            "Quel pictogramme correspond à une substance corrosive ?",
            [
              { label: "Main attaquée par un liquide", correct: true },
              { label: "Tête de mort" },
              { label: "Flamme" },
            ],
            "Le pictogramme corrosif représente un liquide attaquant une main.",
          ),
        ],
      },
    },
  ]
}

