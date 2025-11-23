"use client"

import { Suspense } from "react"
import Link from "next/link"

import { AuthCard } from "@/components/auth/auth-card"
import { DemoAccountCards } from "@/components/auth/demo-account-cards"
import { LoginForm } from "@/components/auth/login-form"
import { useLanguage } from "@/components/i18n/language-provider"

export default function LoginPage() {
  const { t } = useLanguage()
  const titleValue = t("auth.login.title")
  const descriptionValue = t("auth.login.description")
  const title = Array.isArray(titleValue) ? titleValue[0] : titleValue
  const description = Array.isArray(descriptionValue) ? descriptionValue[0] : descriptionValue
  return (
    <AuthCard
      title={title as string}
      description={description as string}
      form={
        <div className="space-y-10">
          <Suspense fallback={<div>Chargement...</div>}>
            <LoginForm />
          </Suspense>
          <DemoAccountCards />
        </div>
      }
      footer={<Link href="/auth/register">{t("auth.login.requestTeacherAccess")}</Link>}
    />
  )
}




