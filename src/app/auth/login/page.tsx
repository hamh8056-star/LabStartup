"use client"

import Link from "next/link"

import { AuthCard } from "@/components/auth/auth-card"
import { DemoAccountCards } from "@/components/auth/demo-account-cards"
import { LoginForm } from "@/components/auth/login-form"
import { useLanguage } from "@/components/i18n/language-provider"

export default function LoginPage() {
  const { t } = useLanguage()
  return (
    <AuthCard
      title={t("auth.login.title")}
      description={t("auth.login.description")}
      form={
        <div className="space-y-10">
          <LoginForm />
          <DemoAccountCards />
        </div>
      }
      footer={<Link href="/auth/register">{t("auth.login.requestTeacherAccess")}</Link>}
    />
  )
}




