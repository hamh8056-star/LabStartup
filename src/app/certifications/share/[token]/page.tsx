import { redirect } from "next/navigation"
import { getDatabase } from "@/lib/mongodb"
import { listCertifications } from "@/lib/evaluations-db"

export default async function CertificationSharePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const db = await getDatabase()
  
  // Trouver le partage
  const share = await db.collection("certification_shares").findOne({
    shareToken: token,
  })

  if (!share) {
    redirect("/dashboard/certifications")
  }

  // Incrémenter le compteur de vues
  await db.collection("certification_shares").updateOne(
    { shareToken: token },
    { $inc: { views: 1 }, $set: { lastViewedAt: new Date() } }
  )

  // Récupérer la certification
  const certifications = await listCertifications()
  const certification = certifications.find(cert => cert.id === share.certificationId)

  if (!certification) {
    redirect("/dashboard/certifications")
  }

  const badgeLabels: Record<string, string> = {
    explorateur: "Explorateur",
    innovateur: "Innovateur",
    mentor: "Mentor",
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/20 via-background to-primary/10 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-border/60 bg-card p-8 shadow-2xl">
        <div className="text-center">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-primary">🎓 Certificat de Réussite</h1>
            <p className="mt-2 text-muted-foreground">Plateforme Taalimia</p>
          </div>

          <div className="my-8">
            <div className="mb-4 text-2xl font-semibold text-primary">
              Badge: {badgeLabels[certification.badge] || certification.badge}
            </div>
            <div className="text-3xl font-bold">{certification.owner}</div>
          </div>

          <div className="my-8 rounded-lg border border-border/60 bg-muted/20 p-6">
            <p className="mb-2 text-lg">
              <strong>Simulation:</strong> {certification.simulationTitle}
            </p>
            <p className="mb-2 text-lg">
              <strong>Discipline:</strong> {certification.discipline}
            </p>
            <div className="mt-4 text-4xl font-bold text-primary">
              Score: {certification.score}/100
            </div>
          </div>

          <div className="mt-8 border-t border-border/60 pt-6 text-sm text-muted-foreground">
            <p>
              Émis le{" "}
              {new Date(certification.issuedAt).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="mt-2 font-mono text-xs">ID: {certification.id}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

