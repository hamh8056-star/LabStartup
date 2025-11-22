import Link from "next/link"

import { AuthCard } from "@/components/auth/auth-card"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

type ResetPasswordPageProps = {
  searchParams: {
    token?: string
  }
}

export default function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const token = searchParams.token

  if (!token) {
    return (
      <AuthCard
        title="Lien invalide"
        description="Le lien de réinitialisation est manquant ou invalide."
        form={
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>Veuillez demander un nouveau lien de réinitialisation.</p>
            <Link href="/auth/forgot-password" className="text-primary hover:underline">
              Recevoir un nouveau lien
            </Link>
          </div>
        }
      />
    )
  }

  return (
    <AuthCard
      title="Définir un nouveau mot de passe"
      description="Choisissez un mot de passe robuste pour sécuriser votre compte."
      form={<ResetPasswordForm token={token} />}
      footer={
        <Link href="/auth/login" className="text-sm text-primary hover:underline">
          ← Retour connexion
        </Link>
      }
    />
  )
}






