import Link from "next/link"

import { AuthCard } from "@/components/auth/auth-card"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Réinitialiser votre mot de passe"
      description="Recevez un lien sécurisé par email pour définir un nouveau mot de passe."
      form={<ForgotPasswordForm />}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href="/auth/login" className="text-sm text-primary hover:underline">
            ← Retour connexion
          </Link>
          <Link href="/auth/register" className="text-sm text-primary hover:underline">
            Créer un compte
          </Link>
        </div>
      }
    />
  )
}






