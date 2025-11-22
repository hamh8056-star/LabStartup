import { getDatabase } from "@/lib/mongodb"

export type AnalyticsSummary = {
  users: number
  simulations: number
  labs: number
  resources: number
  activeStudents: number
  avgSessionMinutes: number
  completionRate: number
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const db = await getDatabase()

  const [userCount, simulationsCount, labsCount, resourcesCount] =
    await Promise.all([
      db.collection("users").estimatedDocumentCount(),
      db.collection("simulations").estimatedDocumentCount(),
      db.collection("labs").estimatedDocumentCount(),
      db.collection("resources").estimatedDocumentCount(),
    ])

  return {
    users: userCount,
    simulations: simulationsCount,
    labs: labsCount,
    resources: resourcesCount,
    activeStudents: Math.max(42, Math.floor(userCount * 0.68)),
    avgSessionMinutes: 46,
    completionRate: 0.83,
  }
}

export type PerformancePoint = {
  label: string
  completionRate: number
  averageScore: number
  timeSpent: number
}

export function getPerformanceTimeline(): PerformancePoint[] {
  return [
    {
      label: "Semaine 1",
      completionRate: 0.64,
      averageScore: 68,
      timeSpent: 42,
    },
    {
      label: "Semaine 2",
      completionRate: 0.71,
      averageScore: 74,
      timeSpent: 48,
    },
    {
      label: "Semaine 3",
      completionRate: 0.79,
      averageScore: 81,
      timeSpent: 52,
    },
    {
      label: "Semaine 4",
      completionRate: 0.86,
      averageScore: 88,
      timeSpent: 60,
    },
    {
      label: "Semaine 5",
      completionRate: 0.84,
      averageScore: 85,
      timeSpent: 58,
    },
    {
      label: "Semaine 6",
      completionRate: 0.88,
      averageScore: 89,
      timeSpent: 63,
    },
  ]
}

export type ClassPerformance = {
  id: string
  name: string
  discipline: string
  learners: number
  completion: number
  avgScore: number
  timeSpent: number
}

export function getClassPerformance(): ClassPerformance[] {
  return [
    {
      id: "class-phys-l2",
      name: "Licence Physique L2",
      discipline: "physique",
      learners: 32,
      completion: 0.91,
      avgScore: 87,
      timeSpent: 58,
    },
    {
      id: "class-bio-prepa",
      name: "Prépa BIO SUP",
      discipline: "biologie",
      learners: 28,
      completion: 0.78,
      avgScore: 82,
      timeSpent: 46,
    },
    {
      id: "class-elec-m1",
      name: "Master Électronique M1",
      discipline: "electronique",
      learners: 24,
      completion: 0.74,
      avgScore: 79,
      timeSpent: 51,
    },
    {
      id: "class-info-licence",
      name: "Licence Informatique L3",
      discipline: "informatique",
      learners: 35,
      completion: 0.69,
      avgScore: 76,
      timeSpent: 44,
    },
  ]
}

export type ExperienceMetric = {
  id: string
  title: string
  discipline: string
  completions: number
  satisfaction: number
  avgScore: number
  timeSpent: number
}

export function getExperienceMetrics(): ExperienceMetric[] {
  return [
    {
      id: "sim-quantum-diffraction",
      title: "Diffraction quantique du photon",
      discipline: "physique",
      completions: 186,
      satisfaction: 4.6,
      avgScore: 88,
      timeSpent: 48,
    },
    {
      id: "sim-bio-cell",
      title: "Exploration d'une cellule augmentée",
      discipline: "biologie",
      completions: 214,
      satisfaction: 4.8,
      avgScore: 92,
      timeSpent: 36,
    },
    {
      id: "sim-electro-circuit",
      title: "Synthèse d'un circuit d'amplification",
      discipline: "electronique",
      completions: 142,
      satisfaction: 4.2,
      avgScore: 84,
      timeSpent: 54,
    },
    {
      id: "sim-algo-complexity",
      title: "Complexité des algorithmes",
      discipline: "informatique",
      completions: 198,
      satisfaction: 4.4,
      avgScore: 81,
      timeSpent: 40,
    },
  ]
}

export type ActivityPoint = {
  date: string
  activeUsers: number
  sessions: number
  timeSpent: number
}

export function getActivityTimeline(): ActivityPoint[] {
  return [
    { date: "2024-10-01", activeUsers: 54, sessions: 96, timeSpent: 3120 },
    { date: "2024-10-02", activeUsers: 62, sessions: 104, timeSpent: 3540 },
    { date: "2024-10-03", activeUsers: 58, sessions: 98, timeSpent: 3300 },
    { date: "2024-10-04", activeUsers: 70, sessions: 120, timeSpent: 4020 },
    { date: "2024-10-05", activeUsers: 47, sessions: 72, timeSpent: 2510 },
    { date: "2024-10-06", activeUsers: 40, sessions: 60, timeSpent: 2100 },
    { date: "2024-10-07", activeUsers: 65, sessions: 110, timeSpent: 3800 },
  ]
}

export function buildExportDataset(format: "csv" | "xlsx" | "pdf" = "csv") {
  const timeline = getActivityTimeline()
  if (format === "csv") {
    const header = "date,activeUsers,sessions,timeSpent"
    const rows = timeline.map(point => `${point.date},${point.activeUsers},${point.sessions},${point.timeSpent}`)
    const content = [header, ...rows].join("\n")
    return { mime: "text/csv", fileName: "taalimia-analytics.csv", content }
  }
  if (format === "xlsx") {
    const content = JSON.stringify({ sheets: [{ name: "Activity", data: timeline }] })
    return { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName: "taalimia-analytics.xlsx", content }
  }
  const content = `Rapport analytique\n\nTotal utilisateurs actifs: ${timeline.reduce((acc, item) => acc + item.activeUsers, 0)}\nTotal sessions: ${timeline.reduce((acc, item) => acc + item.sessions, 0)}`
  return { mime: "application/pdf", fileName: "taalimia-analytics.pdf", content }
}

