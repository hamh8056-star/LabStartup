import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"

import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { listCertifications } from "@/lib/evaluations-db"

const sendMessageSchema = z.object({
  certificationIds: z.array(z.string()).min(1, "Au moins une certification est requise"),
  message: z.string().min(1).max(1000).optional(),
  senderName: z.string().min(1),
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return NextResponse.json({ message: "Non authentifié." }, { status: 401 })
  }

  // Seuls les enseignants et admins peuvent envoyer des messages
  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    return NextResponse.json({ message: "Accès refusé. Seuls les enseignants peuvent envoyer des messages." }, { status: 403 })
  }

  const body = await request.json()
  const parsed = sendMessageSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Données invalides.", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const { certificationIds, message, senderName } = parsed.data

    // Récupérer les certifications depuis la base de données
    const allCertifications = await listCertifications()
    const targetCertifications = allCertifications.filter(cert => certificationIds.includes(cert.id))

    if (targetCertifications.length === 0) {
      return NextResponse.json({ message: "Aucune certification trouvée." }, { status: 404 })
    }

    // Filtrer les certifications avec email
    const certificationsWithEmail = targetCertifications.filter(cert => cert.email)

    if (certificationsWithEmail.length === 0) {
      return NextResponse.json({ message: "Aucune certification avec email disponible." }, { status: 400 })
    }

    const db = await getDatabase()
    const now = new Date()

    // Créer les notifications dans la base de données
    const notifications = certificationsWithEmail.map(cert => ({
      userId: cert.email, // Utiliser l'email comme identifiant temporaire
      userEmail: cert.email,
      userName: cert.owner,
      type: "certification_congratulations",
      title: "Félicitations pour votre certification !",
      message: message || "Félicitations pour votre certification ! Continuez vos excellents efforts.",
      senderName: senderName,
      certificationId: cert.id,
      certificationTitle: cert.simulationTitle,
      badge: cert.badge,
      score: cert.score,
      read: false,
      createdAt: now,
      updatedAt: now,
    }))

    // Insérer les notifications dans la base de données
    if (notifications.length > 0) {
      await db.collection("notifications").insertMany(notifications)
    }

    // TODO: Intégrer un service d'email (Resend, SendGrid, etc.) pour envoyer les emails réels
    // Pour l'instant, on enregistre juste les notifications dans la base de données

    return NextResponse.json({
      message: "Messages envoyés avec succès.",
      sent: notifications.length,
      total: certificationsWithEmail.length,
    })
  } catch (error) {
    console.error("Error sending messages:", error)
    return NextResponse.json(
      { message: "Erreur lors de l'envoi des messages." },
      { status: 500 }
    )
  }
}

