 "use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, LockKeyhole, Mail } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useLanguage } from "@/components/i18n/language-provider"

type LoginSchemaProps = {
  invalidEmail: string
  invalidPassword: string
}

const createLoginSchema = ({ invalidEmail, invalidPassword }: LoginSchemaProps) =>
  z.object({
    email: z.string().email(invalidEmail),
    password: z.string().min(6, invalidPassword),
  })

import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/components/auth/demo-accounts"

export function LoginForm() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const hasWelcomed = useRef(false)

  const loginSchema = createLoginSchema({
    invalidEmail: t("auth.login.invalidEmail"),
    invalidPassword: t("auth.login.invalidPassword"),
  })

  type LoginValues = z.infer<typeof loginSchema>

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard"

  useEffect(() => {
    const registered = searchParams.get("registered")

    if (registered && !hasWelcomed.current) {
      hasWelcomed.current = true
      toast.success(t("auth.login.welcomeMessage"), {
        description: t("auth.login.welcomeDescription"),
      })
    }
  }, [searchParams, t])

  const applyPrefill = useCallback(
    (accountId: string, { clearQuery = false }: { clearQuery?: boolean } = {}) => {
      const account = DEMO_ACCOUNTS.find(candidate => candidate.id === accountId)
      if (!account) {
        return
      }

      form.setValue("email", account.email)
      form.setValue("password", DEMO_PASSWORD)
      toast.info(t("auth.login.credentialsPrefilled"), {
        description: t("auth.login.accountReady").replace("{account}", account.label),
      })

      if (clearQuery && typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search)
        params.delete("prefill")
        const query = params.toString()
        router.replace(`${window.location.pathname}${query ? `?${query}` : ""}`, { scroll: false })
      }
    },
    [form, router],
  )

  useEffect(() => {
    const prefill = searchParams.get("prefill")
    if (!prefill) {
      return
    }

    applyPrefill(prefill, { clearQuery: true })
  }, [applyPrefill, searchParams])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<string>
      if (!customEvent.detail) {
        return
      }
      applyPrefill(customEvent.detail)
    }

    window.addEventListener("taalimia:demo-account-select", handler as EventListener)

    return () => {
      window.removeEventListener("taalimia:demo-account-select", handler as EventListener)
    }
  }, [applyPrefill])

  async function onSubmit(values: LoginValues) {
    setErrorMessage(null)
    setIsSubmitting(true)
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: values.email,
        password: values.password,
        callbackUrl,
      })

      if (!result) {
        setErrorMessage(t("auth.login.unexpectedError"))
        return
      }

      if (result.error) {
        setErrorMessage(t("auth.login.invalidCredentials"))
        return
      }

      toast.success(t("auth.login.loginSuccess"), {
        description: t("auth.login.loginSuccessDescription"),
      })

      const destination = result.url ?? callbackUrl
      const targetUrl = destination?.startsWith("http")
        ? (() => {
            try {
              const parsed = new URL(destination)
              return `${parsed.pathname}${parsed.search}`
            } catch {
              return "/dashboard"
            }
          })()
        : destination

      if (typeof window !== "undefined") {
        window.location.href = targetUrl ?? "/dashboard"
      } else {
        router.replace(targetUrl ?? "/dashboard")
        router.refresh()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.login.emailLabel")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("auth.login.emailPlaceholder")}
                  type="email"
                  autoComplete="email"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.login.passwordLabel")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("auth.login.passwordPlaceholder")}
                  type="password"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormDescription>{t("auth.login.passwordDescription")}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}
        <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}
          {isSubmitting ? t("auth.login.submittingButton") : t("auth.login.submitButton")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={() => signIn("google", { callbackUrl })}
        >
          <Mail className="size-4" />
          {t("auth.login.continueWithGmail")}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          <a href="/auth/forgot-password" className="text-primary hover:underline">
            {t("auth.login.forgotPassword")}
          </a>
        </p>
      </form>
    </Form>
  )
}

