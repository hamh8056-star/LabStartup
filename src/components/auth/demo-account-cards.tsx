"use client"

import type { ComponentType } from "react"
import { useState } from "react"
import { GraduationCap, Microscope, Shield } from "lucide-react"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"

type DemoAccount = {
  id: string
  label: string
  email: string
  password: string
  icon: ComponentType<{ className?: string }>
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: "admin",
    label: "Admin",
    email: "admin@univ-setif.dz",
    password: "Taalimia#2025",
    icon: Shield,
  },
  {
    id: "teacher",
    label: "Enseignant",
    email: "enseignant@univ-setif.dz",
    password: "Taalimia#2025",
    icon: Microscope,
  },
  {
    id: "student",
    label: "Étudiant",
    email: "etudiant@univ-setif.dz",
    password: "Taalimia#2025",
    icon: GraduationCap,
  },
]

export function DemoAccountCards() {
  const [lastCopiedId, setLastCopiedId] = useState<string | null>(null)

  async function handleSelect(account: DemoAccount) {
    const { id, email, password } = account

    try {
      await navigator.clipboard.writeText(`${email}\n${password}`)
      setLastCopiedId(id)
      setTimeout(() => setLastCopiedId(null), 2400)
    } catch (error) {
      console.error("Impossible de copier les identifiants :", error)
    } finally {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent<string>("taalimia:demo-account-select", {
            detail: id,
          }),
        )
      }
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {DEMO_ACCOUNTS.map((account) => {
        const Icon = account.icon
        const isCopied = lastCopiedId === account.id

        return (
          <Card
            key={account.id}
            className={`flex min-h-[160px] flex-col items-center justify-center gap-4 rounded-xl border-border/70 bg-card/90 text-center shadow-sm transition focus-visible:border-primary focus-visible:outline-none hover:border-primary/60 ${
              isCopied ? "border-primary bg-primary/5" : ""
            }`}
            onClick={() => handleSelect(account)}
            role="button"
            tabIndex={0}
            aria-label={`Compte ${account.label}`}
            title={`Copier les identifiants ${account.label}`}
            onKeyUp={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                handleSelect(account)
              }
            }}
          >
            <CardHeader className="flex flex-col items-center space-y-4 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-6" />
              </span>
              <CardTitle className="text-lg font-semibold">{account.label}</CardTitle>
            </CardHeader>
          </Card>
        )
      })}
    </div>
  )
}


