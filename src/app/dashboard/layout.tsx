import type { ReactNode } from "react"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { authOptions } from "@/lib/auth"

type DashboardLayoutProps = {
  children: ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login?callbackUrl=/dashboard")
  }

  const { user } = session

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col bg-slate-100/70 py-4 dark:bg-slate-950/70 md:min-h-[calc(100vh-4rem)]">
      <div className="flex flex-1 flex-col gap-6 px-4 md:flex-row md:px-8">
        <div className="block shrink-0 md:hidden">
          <DashboardSidebar
            collapsible={false}
            className="w-full"
            user={{
              name: user.name,
              email: user.email,
              role: user.role ?? "student",
            }}
          />
        </div>
        <div className="hidden shrink-0 md:block">
          <DashboardSidebar
            user={{
              name: user.name,
              email: user.email,
              role: user.role ?? "student",
            }}
          />
        </div>
        <main className="flex-1 overflow-hidden rounded-3xl border border-border/60 bg-white/80 shadow-lg backdrop-blur dark:border-border/40 dark:bg-slate-950/60">
          {children}
        </main>
      </div>
    </div>
  )
}


