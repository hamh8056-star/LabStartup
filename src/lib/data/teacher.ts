import type { Simulation } from "@/lib/data/seed"

export type StudentProgress = {
  id: string
  name: string
  status: "on-track" | "late" | "completed"
  completion: number
  lastSeen: string
  averageScore: number
}

export type TeacherClass = {
  id: string
  name: string
  level: string
  students: StudentProgress[]
}

export type TeacherAssignment = {
  id: string
  simulationId: string
  simulationTitle: string
  classId: string
  className: string
  dueDate: string
  mode: "guidé" | "libre"
  status: "scheduled" | "in-progress" | "completed"
  progress: number
  averageScore: number
  submissions: number
}

export type TeacherFeedback = {
  id: string
  assignmentId: string
  author: string
  authorRole: "teacher" | "student"
  message: string
  createdAt: string
}

const teacherClasses: TeacherClass[] = [
  {
    id: "class-phys-l2",
    name: "Licence Physique — L2",
    level: "Université",
    students: [
      { id: "std-1", name: "Nora L.", status: "on-track", completion: 82, lastSeen: new Date().toISOString(), averageScore: 16.2 },
      { id: "std-2", name: "Karim H.", status: "late", completion: 54, lastSeen: new Date(Date.now() - 72 * 3_600_000).toISOString(), averageScore: 12.5 },
      { id: "std-3", name: "Amine D.", status: "completed", completion: 100, lastSeen: new Date(Date.now() - 6 * 3_600_000).toISOString(), averageScore: 18.1 },
    ],
  },
  {
    id: "class-bio-prepa",
    name: "Prépa BIO SUP",
    level: "Classe préparatoire",
    students: [
      { id: "std-4", name: "Sarah B.", status: "on-track", completion: 75, lastSeen: new Date(Date.now() - 4 * 3_600_000).toISOString(), averageScore: 15.0 },
      { id: "std-5", name: "Yanis R.", status: "on-track", completion: 68, lastSeen: new Date().toISOString(), averageScore: 14.2 },
      { id: "std-6", name: "Leila K.", status: "completed", completion: 100, lastSeen: new Date(Date.now() - 12 * 3_600_000).toISOString(), averageScore: 17.3 },
    ],
  },
]

const teacherAssignments: TeacherAssignment[] = [
  {
    id: "assign-01",
    simulationId: "sim-quantum-diffraction",
    simulationTitle: "Diffraction Quantique du Photon",
    classId: "class-phys-l2",
    className: "Licence Physique — L2",
    dueDate: new Date(Date.now() + 3 * 24 * 3_600_000).toISOString(),
    mode: "guidé",
    status: "in-progress",
    progress: 68,
    averageScore: 14.5,
    submissions: 18,
  },
  {
    id: "assign-02",
    simulationId: "sim-bio-cell",
    simulationTitle: "Exploration d'une Cellule Augmentée",
    classId: "class-bio-prepa",
    className: "Prépa BIO SUP",
    dueDate: new Date(Date.now() + 5 * 24 * 3_600_000).toISOString(),
    mode: "guidé",
    status: "scheduled",
    progress: 25,
    averageScore: 0,
    submissions: 2,
  },
  {
    id: "assign-03",
    simulationId: "sim-electro-circuit",
    simulationTitle: "Synthèse d'un Circuit d'Amplification",
    classId: "class-phys-l2",
    className: "Licence Physique — L2",
    dueDate: new Date(Date.now() - 7 * 24 * 3_600_000).toISOString(),
    mode: "libre",
    status: "completed",
    progress: 100,
    averageScore: 17.8,
    submissions: 26,
  },
]

const teacherFeedbacks: TeacherFeedback[] = [
  {
    id: "feed-1",
    assignmentId: "assign-01",
    author: "Pr Karim Benali",
    authorRole: "teacher",
    message: "Très belles analyses des franges d'interférences. Pensez à détailler les incertitudes de mesure.",
    createdAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
  },
  {
    id: "feed-2",
    assignmentId: "assign-01",
    author: "Nora L.",
    authorRole: "student",
    message: "Pourriez-vous valider ma mesure de l'amplitude ? Je l'ai ajoutée dans le carnet de bord.",
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: "feed-3",
    assignmentId: "assign-02",
    author: "Assistant IA",
    authorRole: "teacher",
    message: "Nouvelle ressource recommandée : capsule vidéo sur la fluorescence des organites (8 min).",
    createdAt: new Date().toISOString(),
  },
]

export function getTeacherDashboardData(simulations: Simulation[]) {
  const simulationMap = new Map(simulations.map(simulation => [simulation.id, simulation]))

  const assignments = teacherAssignments.map(assignment => {
    const simulation = simulationMap.get(assignment.simulationId)
    return {
      ...assignment,
      simulationTitle: simulation?.title ?? assignment.simulationTitle,
    }
  })

  return {
    classes: teacherClasses,
    assignments,
    feedbacks: teacherFeedbacks,
  }
}






