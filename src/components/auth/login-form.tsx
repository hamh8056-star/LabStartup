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

  // Helper function to convert t() result to string
  const ts = (path: string): string => {
    const value = t(path)
    return Array.isArray(value) ? value[0] : value
  }

  const invalidEmailValue = t("auth.login.invalidEmail")
  const invalidPasswordValue = t("auth.login.invalidPassword")
  const loginSchema = createLoginSchema({
    invalidEmail: Array.isArray(invalidEmailValue) ? invalidEmailValue[0] : invalidEmailValue,
    invalidPassword: Array.isArray(invalidPasswordValue) ? invalidPasswordValue[0] : invalidPasswordValue,
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
      const welcomeMessageValue = t("auth.login.welcomeMessage")
      const welcomeDescriptionValue = t("auth.login.welcomeDescription")
      toast.success(Array.isArray(welcomeMessageValue) ? welcomeMessageValue[0] : welcomeMessageValue, {
        description: Array.isArray(welcomeDescriptionValue) ? welcomeDescriptionValue[0] : welcomeDescriptionValue,
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
      const accountReadyValue = t("auth.login.accountReady")
      const accountReadyText = Array.isArray(accountReadyValue) ? accountReadyValue[0] : accountReadyValue
      const credentialsPrefilledValue = t("auth.login.credentialsPrefilled")
      toast.info(Array.isArray(credentialsPrefilledValue) ? credentialsPrefilledValue[0] : credentialsPrefilledValue, {
        description: accountReadyText.replace("{account}", account.label),
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
        const unexpectedErrorValue = t("auth.login.unexpectedError")
        setErrorMessage(Array.isArray(unexpectedErrorValue) ? unexpectedErrorValue[0] : unexpectedErrorValue)
        return
      }

      if (result.error) {
        const invalidCredentialsValue = t("auth.login.invalidCredentials")
        setErrorMessage(Array.isArray(invalidCredentialsValue) ? invalidCredentialsValue[0] : invalidCredentialsValue)
        return
      }

      const loginSuccessValue = t("auth.login.loginSuccess")
      const loginSuccessDescriptionValue = t("auth.login.loginSuccessDescription")
      toast.success(Array.isArray(loginSuccessValue) ? loginSuccessValue[0] : loginSuccessValue, {
        description: Array.isArray(loginSuccessDescriptionValue) ? loginSuccessDescriptionValue[0] : loginSuccessDescriptionValue,
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
              <FormLabel>{ts("auth.login.emailLabel")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={ts("auth.login.emailPlaceholder")}
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
              <FormLabel>{ts("auth.login.passwordLabel")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={ts("auth.login.passwordPlaceholder")}
                  type="password"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  {...field}
                />
              </FormControl>
              <FormDescription>{ts("auth.login.passwordDescription")}</FormDescription>
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
          {isSubmitting ? ts("auth.login.submittingButton") : ts("auth.login.submitButton")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={() => signIn("google", { callbackUrl })}
        >
          <Mail className="size-4" />
          {ts("auth.login.continueWithGmail")}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          <a href="/auth/forgot-password" className="text-primary hover:underline">
            {ts("auth.login.forgotPassword")}
          </a>
        </p>
      </form>
    </Form>
  )
}

