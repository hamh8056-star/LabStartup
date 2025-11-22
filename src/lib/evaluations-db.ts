import { ObjectId } from "mongodb"

import { getDatabase } from "@/lib/mongodb"
import { getSampleEvaluations, type EvaluationTemplate } from "@/lib/data/evaluations"
import { getSampleCertifications } from "@/lib/data/certifications"

export type EvaluationAttemptMode = "pre" | "post"

export type EvaluationAttemptDoc = {
  _id: ObjectId
  evaluationId: string
  userId: string
  userName: string
  userEmail?: string
  mode: EvaluationAttemptMode
  score: number
  maxScore: number
  answers: Array<{
    questionId: string
    selectedOptionIds: string[]
    gainedPoints: number
  }>
  durationSeconds?: number
  badgesAwarded: string[]
  pointsAwarded: number
  createdAt: Date
}

export type EvaluationParticipantSummary = {
  userId: string
  userName: string
  lastScore: number
  lastAttemptAt: string
}

export type EvaluationSummary = {
  id: string
  title: string
  simulationId: string
  discipline: string
  difficulty: "facile" | "intermediaire" | "avance"
  duration: number
  tags: string[]
  preQuizScore: number
  postQuizScore: number
  completion: number
  status: "pending" | "completed" | "certified"
  issuedCertId?: string
  participants: number
  lastSubmissionAt?: string
  averageTime?: number
  rubric?: string[]
  quiz: EvaluationTemplate["quiz"]
}

export type CertificationDoc = {
  _id: ObjectId
  id: string
  evaluationId: string
  simulationId: string
  owner: string
  email?: string
  discipline: string
  simulationTitle: string
  badge: "explorateur" | "innovateur" | "mentor"
  score: number
  issuedAt: Date
}

export async function ensureEvaluationIndexes() {
  const db = await getDatabase()
  await Promise.all([
    db.collection<EvaluationAttemptDoc>("evaluation_attempts").createIndex({ evaluationId: 1, mode: 1 }),
    db.collection<EvaluationAttemptDoc>("evaluation_attempts").createIndex({ userId: 1 }),
    db.collection<CertificationDoc>("certifications").createIndex({ evaluationId: 1 }),
    db.collection("evaluation_templates").createIndex({ id: 1 }, { unique: true }),
  ])
}

export async function seedEvaluationData() {
  const db = await getDatabase()
  const templateCollection = db.collection<EvaluationTemplate>("evaluation_templates")
  const attemptsCollection = db.collection<EvaluationAttemptDoc>("evaluation_attempts")
  const certificationsCollection = db.collection<CertificationDoc>("certifications")

  const templatesCount = await templateCollection.countDocuments()
  if (templatesCount === 0) {
    const templates = getSampleEvaluations()
    await templateCollection.insertMany(templates)
  }

  const attemptsCount = await attemptsCollection.countDocuments()
  if (attemptsCount === 0) {
    // Seed attempts based on sample data statistics
    const seedAttempts: EvaluationAttemptDoc[] = []
    const templates = await templateCollection.find().toArray()
    templates.forEach(template => {
      const participants = template.participants ?? 20
      const baseUsers = Array.from({ length: participants }).map((_, index) => ({
        userId: `student-${index + 1}`,
        userName: `Étudiant·e ${index + 1}`,
      }))
      baseUsers.forEach(({ userId, userName }, idx) => {
        const preScore = Math.max(30, Math.min(90, Math.round(template.preQuizScore + (idx % 5) - 2)))
        const postScore = Math.max(
          preScore,
          Math.min(100, Math.round(template.postQuizScore + ((idx % 4) - 1) * 2)),
        )
        seedAttempts.push({
          _id: new ObjectId(),
          evaluationId: template.id,
          userId,
          userName,
          mode: "pre",
          score: preScore,
          maxScore: 100,
          answers: [],
          badgesAwarded: [],
          pointsAwarded: Math.round(preScore / 5),
          createdAt: new Date(Date.now() - 7 * 24 * 3_600_000 + idx * 7_000_000),
        })
        seedAttempts.push({
          _id: new ObjectId(),
          evaluationId: template.id,
          userId,
          userName,
          mode: "post",
          score: postScore,
          maxScore: 100,
          answers: [],
          badgesAwarded: [],
          pointsAwarded: Math.round(postScore / 4),
          createdAt: new Date(Date.now() - 6 * 24 * 3_600_000 + idx * 6_000_000),
        })
      })
    })
    if (seedAttempts.length) {
      await attemptsCollection.insertMany(seedAttempts)
    }
  }

  const certCount = await certificationsCollection.countDocuments({})
  if (certCount === 0) {
    const templates = await templateCollection.find().toArray()
    const sampleCerts = getSampleCertifications()
    const docs: CertificationDoc[] = sampleCerts.map(cert => {
      const template = templates.find(tpl => tpl.simulationId === cert.simulationId)
      return {
        _id: new ObjectId(),
        id: cert.id,
        evaluationId: template?.id ?? cert.simulationId,
        simulationId: cert.simulationId,
        owner: cert.owner,
        email: cert.email,
        discipline: template?.discipline ?? "interdisciplinaire",
        simulationTitle: template?.title ?? cert.simulationId,
        badge: cert.badge,
        score: cert.score,
        issuedAt: new Date(cert.issuedAt),
      }
    })
    if (docs.length) {
      await certificationsCollection.insertMany(docs)
    }
  }
}

export async function getEvaluationSummaries(): Promise<EvaluationSummary[]> {
  const db = await getDatabase()
  const templateCollection = db.collection<EvaluationTemplate>("evaluation_templates")
  const attemptsCollection = db.collection<EvaluationAttemptDoc>("evaluation_attempts")
  const certificationsCollection = db.collection<CertificationDoc>("certifications")

  const templates = await templateCollection.find().toArray()
  const attempts = await attemptsCollection.aggregate<{
    evaluationId: string
    mode: EvaluationAttemptMode
    averageScore: number
    maxScore: number
    participants: number
    completion: number
    averageDuration: number
    lastSubmissionAt?: Date
  }>([
    {
      $group: {
        _id: {
          evaluationId: "$evaluationId",
          mode: "$mode",
        },
        averageScore: { $avg: "$score" },
        maxScore: { $avg: "$maxScore" },
        participants: { $addToSet: "$userId" },
        averageDuration: { $avg: "$durationSeconds" },
        lastSubmissionAt: { $max: "$createdAt" },
      },
    },
    {
      $project: {
        evaluationId: "$_id.evaluationId",
        mode: "$_id.mode",
        averageScore: { $ifNull: ["$averageScore", 0] },
        maxScore: { $ifNull: ["$maxScore", 100] },
        participants: { $size: "$participants" },
        averageDuration: 1,
        lastSubmissionAt: 1,
      },
    },
  ]).toArray()

  const certificates = await certificationsCollection.find().toArray()

  return templates.map(template => {
    const preData = attempts.find(item => item.evaluationId === template.id && item.mode === "pre")
    const postData = attempts.find(item => item.evaluationId === template.id && item.mode === "post")
    const participantCount = Math.max(preData?.participants ?? 0, postData?.participants ?? 0)
    const completionRatio = participantCount
      ? (postData?.participants ?? 0) / participantCount
      : template.completion
    const cert = certificates.find(doc => doc.evaluationId === template.id)

    return {
      id: template.id,
      title: template.title,
      simulationId: template.simulationId,
      discipline: template.discipline ?? "physique",
      difficulty: template.difficulty ?? "intermediaire",
      duration: template.duration ?? 20,
      tags: template.tags ?? [],
      preQuizScore: Math.round(preData?.averageScore ?? template.preQuizScore),
      postQuizScore: Math.round(postData?.averageScore ?? template.postQuizScore),
      completion: completionRatio || 0,
      status: template.status,
      issuedCertId: cert?.id ?? template.issuedCertId,
      participants: (participantCount ?? template.participants) ?? 0,
      lastSubmissionAt: (postData?.lastSubmissionAt ?? preData?.lastSubmissionAt)?.toISOString() ?? template.lastSubmissionAt,
      averageTime: postData?.averageDuration ? Math.round((postData.averageDuration ?? 0) / 60) : template.averageTime,
      rubric: template.rubric,
      quiz: template.quiz,
    }
  })
}

export async function getEvaluationHistory(evaluationId: string, options?: { page?: number; limit?: number }) {
  const db = await getDatabase()
  const page = options?.page ?? 1
  const limit = options?.limit ?? 10
  const skip = (page - 1) * limit

  // Compter le total d'essais
  const totalAttempts = await db.collection<EvaluationAttemptDoc>("evaluation_attempts").countDocuments({ evaluationId })

  // Récupérer les tentatives paginées
  const attempts = await db
    .collection<EvaluationAttemptDoc>("evaluation_attempts")
    .find({ evaluationId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray()

  // Récupérer tous les participants (sans pagination car c'est un résumé)
  const allAttempts = await db
    .collection<EvaluationAttemptDoc>("evaluation_attempts")
    .find({ evaluationId })
    .sort({ createdAt: -1 })
    .toArray()

  const participants: EvaluationParticipantSummary[] = []
  const participantMap = new Map<string, EvaluationParticipantSummary>()

  allAttempts.forEach(attempt => {
    if (!participantMap.has(attempt.userId) || participantMap.get(attempt.userId)!.lastAttemptAt < attempt.createdAt.toISOString()) {
      participantMap.set(attempt.userId, {
        userId: attempt.userId,
        userName: attempt.userName,
        lastScore: attempt.score,
        lastAttemptAt: attempt.createdAt.toISOString(),
      })
    }
  })

  participants.push(...participantMap.values())

  return {
    attempts: attempts.map(attempt => ({
      id: attempt._id.toHexString(),
      mode: attempt.mode,
      score: attempt.score,
      maxScore: attempt.maxScore,
      answers: attempt.answers,
      badgesAwarded: attempt.badgesAwarded,
      pointsAwarded: attempt.pointsAwarded,
      createdAt: attempt.createdAt.toISOString(),
      userId: attempt.userId,
      userName: attempt.userName,
    })),
    participants,
    pagination: {
      page,
      limit,
      total: totalAttempts,
      totalPages: Math.ceil(totalAttempts / limit),
    },
  }
}

export async function recordEvaluationAttempt(params: {
  evaluationId: string
  mode: EvaluationAttemptMode
  userId: string
  userName: string
  userEmail?: string
  answers: Array<{ questionId: string; selectedOptionIds: string[]; gainedPoints: number }>
  maxScore: number
  durationSeconds?: number
}) {
  const db = await getDatabase()
  const template = await db
    .collection<EvaluationTemplate>("evaluation_templates")
    .findOne({ id: params.evaluationId })

  if (!template) {
    throw new Error("Evaluation template not found")
  }

  const totalScore = Math.min(
    100,
    Math.round((params.answers.reduce((acc, answer) => acc + answer.gainedPoints, 0) / params.maxScore) * 100),
  )

  const badgesAwarded: string[] = []
  const thresholds = template.quiz.badgeThresholds.sort((a, b) => a.minScore - b.minScore)
  thresholds.forEach(threshold => {
    if (totalScore >= threshold.minScore) {
      badgesAwarded.push(threshold.badge)
    }
  })

  const pointsAwarded = Math.round(totalScore / 2)

  const attempt: EvaluationAttemptDoc = {
    _id: new ObjectId(),
    evaluationId: template.id,
    userId: params.userId,
    userName: params.userName,
    userEmail: params.userEmail,
    mode: params.mode,
    score: totalScore,
    maxScore: params.maxScore,
    answers: params.answers,
    durationSeconds: params.durationSeconds,
    badgesAwarded,
    pointsAwarded,
    createdAt: new Date(),
  }

  await db.collection<EvaluationAttemptDoc>("evaluation_attempts").insertOne(attempt)

  let certificate: CertificationDoc | null = null
  if (params.mode === "post" && totalScore >= template.quiz.passingScore) {
    const badge = badgesAwarded.length ? (badgesAwarded.at(-1) as CertificationDoc["badge"]) : "explorateur"
    certificate = await issueCertificate({
      evaluationId: template.id,
      simulationId: template.simulationId,
      simulationTitle: template.title,
      owner: params.userName,
      email: params.userEmail,
      badge,
      score: totalScore,
      discipline: template.discipline ?? "physique",
    })
  }

  return {
    score: totalScore,
    badgesAwarded,
    pointsAwarded,
    certificate,
  }
}

export async function issueCertificate(params: {
  evaluationId: string
  simulationId: string
  simulationTitle: string
  owner: string
  email?: string
  discipline: string
  badge: "explorateur" | "innovateur" | "mentor"
  score: number
}) {
  const db = await getDatabase()
  const collection = db.collection<CertificationDoc>("certifications")
  const now = new Date()
  const id = `CERT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const doc: CertificationDoc = {
    _id: new ObjectId(),
    id,
    evaluationId: params.evaluationId,
    simulationId: params.simulationId,
    simulationTitle: params.simulationTitle,
    owner: params.owner,
    email: params.email,
    badge: params.badge,
    score: params.score,
    issuedAt: now,
    discipline: params.discipline,
  }
  await collection.insertOne(doc)
  return doc
}

export async function listCertifications() {
  const db = await getDatabase()
  const docs = await db
    .collection<CertificationDoc>("certifications")
    .find({})
    .sort({ issuedAt: -1 })
    .toArray()
  return docs.map(doc => ({
    id: doc.id,
    evaluationId: doc.evaluationId,
    simulationId: doc.simulationId,
    simulationTitle: doc.simulationTitle,
    owner: doc.owner,
    email: doc.email,
    badge: doc.badge,
    score: doc.score,
    issuedAt: doc.issuedAt.toISOString(),
    discipline: doc.discipline,
  }))
}
