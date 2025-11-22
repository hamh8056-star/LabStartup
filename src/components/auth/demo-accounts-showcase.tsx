"use client"

import { useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { GraduationCap, ShieldCheck, User, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "./demo-accounts"

const ICON_MAP: Record<(typeof DEMO_ACCOUNTS)[number]["id"], LucideIcon> = {
  admin: ShieldCheck,
  teacher: GraduationCap,
  student: User,
}

export function DemoAccountsShowcase() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  function handlePrefill(accountId: (typeof DEMO_ACCOUNTS)[number]["id"]) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("prefill", accountId)
      const query = params.toString()
      const target = query ? `${window.location.pathname}?${query}` : window.location.pathname
      router.replace(target, { scroll: false })
    })
  }

  return (
    <div className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary/90">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-primary">Comptes démonstration</p>
        <p className="text-xs text-primary/70">Mot de passe : {DEMO_PASSWORD}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {DEMO_ACCOUNTS.map(account => {
          const Icon = ICON_MAP[account.id]

          return (
            <div
              key={account.id}
              className="flex flex-col gap-2 rounded-xl border border-primary/20 bg-white/70 p-3 text-xs text-primary/80 shadow-sm transition hover:border-primary/40 dark:bg-slate-950/70"
            >
              <div className="flex items-center gap-2 text-primary">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="sr-only">{account.label}</span>
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-medium text-foreground">{account.email}</p>
                <p className="text-muted-foreground">{account.description}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-auto w-full justify-center text-xs text-primary hover:bg-primary/10"
                onClick={() => handlePrefill(account.id)}
                disabled={isPending}
              >
                Utiliser ce compte
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}


