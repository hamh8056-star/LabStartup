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
    <div className="flex min-h-[calc(100vh-3.5rem)] w-full flex-col bg-slate-100/70 py-2 dark:bg-slate-950/70 md:min-h-[calc(100vh-4rem)] md:py-4">
      <div className="flex flex-1 flex-col gap-4 px-2 md:flex-row md:gap-6 md:px-4 lg:px-8">
        {/* Mobile Sidebar Button */}
        <div className="flex items-center gap-2 px-2 md:hidden">
          <DashboardSidebar
            mobile={true}
            collapsible={false}
            user={{
              name: user.name,
              email: user.email,
              role: user.role ?? "student",
            }}
          />
        </div>
        {/* Desktop Sidebar */}
        <div className="hidden shrink-0 md:block">
          <DashboardSidebar
            user={{
              name: user.name,
              email: user.email,
              role: user.role ?? "student",
            }}
          />
        </div>
        {/* Main Content */}
        <main className="flex-1 overflow-hidden rounded-2xl border border-border/60 bg-white/80 shadow-lg backdrop-blur dark:border-border/40 dark:bg-slate-950/60 md:rounded-3xl">
          {children}
        </main>
      </div>
    </div>
  )
}


