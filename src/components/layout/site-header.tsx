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
        <div className="flex h-12 w-full items-center justify-between gap-2 px-3 text-white sm:h-14 sm:gap-3 sm:px-4 md:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-semibold text-white sm:gap-3">
            <Image
              src="/logo-talimia.svg"
              alt="Talimia Lab DZ"
              width={140}
              height={48}
              className="h-7 w-auto sm:h-9"
              priority
            />
            <span className="sr-only">{layout.workspaceTitle}</span>
          </Link>
          <div className="flex items-center gap-1.5 text-white sm:gap-2">
            <Link
              href="/"
              className="hidden rounded-full border border-white/40 px-2 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-white/20 hover:text-white sm:px-3 sm:py-1.5 sm:text-sm md:inline-flex"
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
                className="hidden rounded-full border border-white/40 bg-white/15 px-2 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-white/25 hover:text-white sm:px-3 sm:py-1.5 sm:text-sm md:inline-flex"
              >
                {layout.workspaceLogin}
              </Link>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="outline" className="h-8 w-8 md:hidden">
                  <Menu className="size-4" />
                  <span className="sr-only">Menu</span>
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
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-3 sm:h-16 sm:px-4">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold sm:gap-3">
          <Image
            src="/logo-talimia.svg"
            alt="Talimia Lab DZ"
            width={160}
            height={60}
            className="h-8 w-auto sm:h-10"
            priority
          />
          <span className="sr-only">{layout.landingBrand}</span>
        </Link>
        <nav className="hidden items-center gap-4 text-sm font-medium text-muted-foreground sm:gap-6 md:flex">
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
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
            <LanguageSwitcher />
          </div>
          <ThemeToggle />
          <Button asChild size="sm" className="hidden text-xs sm:text-sm md:inline-flex">
            <Link href="/auth/login">{layout.navLogin}</Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="h-8 w-8 md:hidden">
                <Menu className="size-4" />
                <span className="sr-only">Menu</span>
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

