export type TeachingClass = {
  id: string
  name: string
  level: string
  schedule: string
  students: number
  activeAssignments: number
}

export type TeachingAssignment = {
  id: string
  classId: string
  simulationId: string
  title: string
  status: "draft" | "published" | "in-progress" | "completed"
  dueDate: string
  objectives: string[]
}

export type TeachingProgress = {
  student: string
  classId: string
  simulationTitle: string
  completion: number
  preQuiz: number
  postQuiz: number
  lastActivity: string
  feedback?: string
}

export type TeachingFeedback = {
  id: string
  student: string
  classId: string
  assignmentId: string
  message: string
  timestamp: string
  author: string
}

export type CustomExperience = {
  id: string
  title: string
  discipline: string
  difficulty: "debutant" | "intermediaire" | "avance"
  summary: string
  lastUpdated: string
  sharedWith: string[]
}

export const teachingClasses: TeachingClass[] = [
  {
    id: "class-phys-l2",
    name: "Licence Physique — L2",
    level: "Universitaire",
    schedule: "Mercredi 10h-12h",
    students: 28,
    activeAssignments: 3,
  },
  {
    id: "class-bio-l1",
    name: "Biologie cellulaire — L1",
    level: "Université",
    schedule: "Jeudi 14h-16h",
    students: 34,
    activeAssignments: 2,
  },
  {
    id: "class-nsi-term",
    name: "Terminale NSI — Groupe B",
    level: "Lycée",
    schedule: "Vendredi 16h-18h",
    students: 24,
    activeAssignments: 1,
  },
]

export const teachingAssignments: TeachingAssignment[] = [
  {
    id: "assign-diffraction",
    classId: "class-phys-l2",
    simulationId: "sim-quantum-diffraction",
    title: "Analyse des franges d'interférence",
    status: "in-progress",
    dueDate: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    objectives: [
      "Configurer un dispositif multi-fentes virtuel",
      "Relier longueur d'onde et espacement des franges",
      "Rédiger un rapport comparant théorie et simulation",
    ],
  },
  {
    id: "assign-cellule",
    classId: "class-bio-l1",
    simulationId: "sim-bio-cell",
    title: "Cartographie d'une cellule eucaryote",
    status: "published",
    dueDate: new Date(Date.now() + 5 * 86_400_000).toISOString(),
    objectives: [
      "Identifier noyau, mitochondries, appareil de Golgi",
      "Annoter au moins trois observations pertinentes",
      "Partager un compte rendu collaboratif",
    ],
  },
]

export const teachingProgression: TeachingProgress[] = [
  {
    student: "Nora L.",
    classId: "class-phys-l2",
    simulationTitle: "Diffraction quantique",
    completion: 0.86,
    preQuiz: 58,
    postQuiz: 90,
    lastActivity: new Date(Date.now() - 7200_000).toISOString(),
    feedback: "Analyse précise des maxima, à approfondir pour les minima.",
  },
  {
    student: "Yanis B.",
    classId: "class-phys-l2",
    simulationTitle: "Diffraction quantique",
    completion: 0.68,
    preQuiz: 42,
    postQuiz: 76,
    lastActivity: new Date(Date.now() - 18_000_000).toISOString(),
  },
  {
    student: "Sara K.",
    classId: "class-bio-l1",
    simulationTitle: "Exploration cellulaire",
    completion: 0.94,
    preQuiz: 51,
    postQuiz: 88,
    lastActivity: new Date(Date.now() - 3600_000).toISOString(),
    feedback: "Annotations complètes, bon usage du microscope holographique.",
  },
]

export const teachingFeedback: TeachingFeedback[] = [
  {
    id: "feedback-1",
    student: "Nora L.",
    classId: "class-phys-l2",
    assignmentId: "assign-diffraction",
    message: "Excellent rapport, toujours préciser les incertitudes de mesure.",
    timestamp: new Date(Date.now() - 3600_000).toISOString(),
    author: "Pr Karim Benali",
  },
  {
    id: "feedback-2",
    student: "Yanis B.",
    classId: "class-phys-l2",
    assignmentId: "assign-diffraction",
    message: "Revoit la section sur le rôle de la longueur d'onde dans le motif.",
    timestamp: new Date(Date.now() - 7200_000).toISOString(),
    author: "Pr Karim Benali",
  },
]

export const teachingCustomExperiences: CustomExperience[] = [
  {
    id: "exp-vr-thermo",
    title: "Thermodynamique en réalité mixte",
    discipline: "physique",
    difficulty: "intermediaire",
    summary: "Observation immersive des échanges thermiques dans un système isolé.",
    lastUpdated: new Date(Date.now() - 20_000_000).toISOString(),
    sharedWith: ["Licence Physique — L2", "Terminale NSI — Groupe B"],
  },
  {
    id: "exp-genetique",
    title: "Expression génique assistée par IA",
    discipline: "biologie",
    difficulty: "avance",
    summary: "Simulation multimodale du mécanisme de transcription et traduction.",
    lastUpdated: new Date(Date.now() - 1_000_000).toISOString(),
    sharedWith: ["Biologie cellulaire — L1"],
  },
]


