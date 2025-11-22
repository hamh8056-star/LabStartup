import Link from "next/link"

import { AuthCard } from "@/components/auth/auth-card"
import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <AuthCard
      title="Créer un compte Taalimia"
      description="Unifiez vos laboratoires virtuels, ressources pédagogiques et évaluations certifiantes."
      form={<RegisterForm />}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span>Déjà inscrit ?</span>
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            Se connecter
          </Link>
        </div>
      }
    />
  )
}






