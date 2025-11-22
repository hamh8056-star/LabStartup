"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Menu } from "lucide-react"

import { HeaderUserMenu } from "@/components/dashboard/header-user-menu"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"
import { useLanguage } from "@/components/i18n/language-provider"
import { NotificationIcons } from "@/components/layout/notification-icons"

export function SiteHeader() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const {
    dictionary: { layout },
  } = useLanguage()

  const navItems = [
    { href: "#features", label: layout.navFeatures },
    { href: "/dashboard", label: layout.navDashboard },
    { href: "/resources", label: layout.navResources },
    { href: "/community", label: layout.navCommunity },
  ]

  const isWorkspaceView =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/teacher") ||
    pathname?.startsWith("/student") ||
    pathname?.startsWith("/admin")

  if (isWorkspaceView) {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-gradient-to-r from-[#0a1630]/90 via-[#102a5c]/85 to-[#1e3a8a]/90 text-white backdrop-blur">
        <div className="flex h-14 w-full items-center justify-between gap-3 px-4 text-white md:px-6">
          <Link href="/dashboard" className="flex items-center gap-3 text-sm font-semibold text-white">
            <Image
              src="/logo-talimia.svg"
              alt="Talimia Lab DZ"
              width={140}
              height={48}
              className="h-9 w-auto"
              priority
            />
            <span className="sr-only">{layout.workspaceTitle}</span>
          </Link>
          <div className="flex items-center gap-2 text-white">
            <Link
              href="/"
              className="hidden rounded-full border border-white/40 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-white/20 hover:text-white md:inline-flex"
            >
              {layout.workspaceHome}
            </Link>
            <div className="hidden items-center gap-2 md:flex">
              <LanguageSwitcher variant="inverted" />
            </div>
            {status === "authenticated" && <NotificationIcons variant="inverted" />}
            <ThemeToggle className="rounded-full border border-white/40 bg-white/15 text-white hover:bg-white/25" variant="outline" />
            {status === "authenticated" && session?.user ? (
              <HeaderUserMenu user={session.user} variant="inverted" />
            ) : (
              <Link
                href="/auth/login"
                className="hidden rounded-full border border-white/40 bg-white/15 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-white/25 hover:text-white md:inline-flex"
              >
                {layout.workspaceLogin}
              </Link>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="outline" className="md:hidden">
                  <Menu className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 space-y-1">
                <DropdownMenuItem asChild>
                  <Link href="/">{layout.navHome}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">{layout.navDashboard}</Link>
                </DropdownMenuItem>
                {status !== "authenticated" ? (
                  <DropdownMenuItem asChild>
                    <Link href="/auth/login">{layout.navLogin}</Link>
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-white/80 backdrop-blur-md transition-colors dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold">
          <Image
            src="/logo-talimia.svg"
            alt="Talimia Lab DZ"
            width={160}
            height={60}
            className="h-10 w-auto"
            priority
          />
          <span className="sr-only">{layout.landingBrand}</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            <LanguageSwitcher />
          </div>
          <ThemeToggle />
          <Button asChild size="sm" className="hidden md:inline-flex">
            <Link href="/auth/login">{layout.navLogin}</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="md:hidden">
                <Menu className="size-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 space-y-1">
              {navItems.map(item => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem asChild>
                <Link href="/auth/register">{layout.navRegister}</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

