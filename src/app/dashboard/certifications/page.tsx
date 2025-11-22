import { CertificationsBrowser } from "@/components/dashboard/certifications/certifications-browser"
import { DashboardTopbar } from "@/components/dashboard/topbar"
import { ensureEvaluationIndexes, listCertifications, seedEvaluationData } from "@/lib/evaluations-db"

export default async function DashboardCertificationsPage() {
  // S'assurer que les index et les données de base sont initialisés
  await ensureEvaluationIndexes()
  await seedEvaluationData()
  
  // Récupérer les certifications depuis la base de données MongoDB
  const certifications = await listCertifications()

  return (
    <div className="flex h-full flex-col">
      <DashboardTopbar
        title="Certifications & badges"
        subtitle="Félicitez vos étudiants, exportez leurs badges et suivez les parcours certifiants."
      />
      <div className="flex-1 p-6">
        <CertificationsBrowser certifications={certifications} />
      </div>
    </div>
  )
}


