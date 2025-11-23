"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Atom,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Hammer,
  LayoutDashboard,
  MessagesSquare,
  PenTool,
  Trophy,
  Users,
  Sparkles,
  ChevronsLeft,
  ChevronsRight,
  Globe,
  Shield,
  UserCog,
  Menu,
} from "lucide-react"
import { useMemo, useState } from "react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import type { UserRole } from "@/lib/roles"
import { useLanguage } from "@/components/i18n/language-provider"

type NavLink = {
  label: string
  icon: typeof LayoutDashboard
  href: string
  roles?: UserRole[]
}

type DashboardSidebarProps = {
  user: {
    name?: string | null
    email?: string | null
    role: string
  }
  className?: string
  collapsible?: boolean
  mobile?: boolean
  onClose?: () => void
}

export function DashboardSidebar({ user, className, collapsible = true, mobile = false, onClose }: DashboardSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const isCollapsed = collapsible ? collapsed : false

  const handleLinkClick = () => {
    if (mobile && onClose) {
      onClose()
    }
  }

  const role = (user.role?.toLowerCase() ?? "student") as UserRole
  const {
    dictionary: {
      dashboard: { sidebar },
    },
  } = useLanguage()

  const roleLabels: Record<UserRole, string> = {
    admin: sidebar.roleAdmin,
    teacher: sidebar.roleTeacher,
    student: sidebar.roleStudent,
  }

  const navLinks: NavLink[] = useMemo(
    () => [
      { label: sidebar.overview, icon: LayoutDashboard, href: "/dashboard" },
      { label: sidebar.simulations, icon: Atom, href: "/dashboard/simulations" },
      { label: sidebar.labs, icon: Hammer, href: "/dashboard/labs" },
      { label: sidebar.pedagogy, icon: BookOpen, href: "/dashboard/teacher", roles: ["teacher", "admin"] },
      { label: sidebar.evaluations, icon: BadgeCheck, href: "/dashboard/evaluations", roles: ["teacher", "admin", "student"] },
      { label: sidebar.certifications, icon: Trophy, href: "/dashboard/certifications", roles: ["teacher", "admin", "student"] },
      { label: sidebar.resources, icon: BookOpen, href: "/dashboard/resources" },
      { label: sidebar.collaboration, icon: Users, href: "/dashboard/collaboration", roles: ["teacher", "student"] },
      { label: sidebar.accessibility, icon: Globe, href: "/dashboard/accessibility", roles: ["admin", "teacher"] },
      { label: sidebar.administration, icon: UserCog, href: "/dashboard/admin", roles: ["admin"] },
      { label: sidebar.assistant, icon: Sparkles, href: "/dashboard/assistant", roles: ["teacher", "student"] },
      { label: sidebar.security, icon: Shield, href: "/dashboard/security", roles: ["admin"] },
      { label: sidebar.analytics, icon: BarChart3, href: "/dashboard/analytics", roles: ["admin", "teacher"] },
      {
        label: sidebar.creator,
        icon: PenTool,
        href: "/dashboard/creator",
        roles: ["teacher", "admin"],
      },
      { label: sidebar.community, icon: MessagesSquare, href: "/dashboard/community" },
    ],
    [sidebar],
  )

  const filteredLinks = useMemo(() => {
    return navLinks.filter(link => !link.roles || link.roles.includes(role))
  }, [navLinks, role])

  const initials = user.name
    ?.split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const SidebarContent = () => (
    <aside
      data-collapsed={isCollapsed}
      className={cn(
        "group/sidebar relative flex h-full flex-col gap-6 border-r border-border/60 bg-gradient-to-b from-sidebar via-background to-sidebar transition-all duration-300",
        isCollapsed ? "w-[84px] px-3 py-6" : "w-[280px] px-6 py-6",
        mobile && "border-r-0 w-full px-6",
        className,
      )}
    >
      {collapsible ? (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => setCollapsed(value => !value)}
          className="absolute -right-3 top-6 hidden size-7 rounded-full border border-border/60 bg-background shadow-sm transition hover:-translate-x-0.5 hover:bg-primary/10 md:flex"
        >
          {isCollapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        </Button>
      ) : null}

      <div
        className={cn(
          "flex flex-col gap-4 transition-all",
          isCollapsed ? "items-center text-center" : "items-start",
        )}
      >
        <Avatar className={cn("border border-border shadow-sm", isCollapsed ? "size-12" : "size-16")}>
          <AvatarFallback className="bg-primary/10 text-primary">{initials || "LS"}</AvatarFallback>
        </Avatar>
        <div className={cn("space-y-1", isCollapsed ? "hidden" : "block")}>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{user.name ?? sidebar.defaultUser}</h2>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <Badge className="mt-2 flex w-fit items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20">
            <BadgeCheck className="size-3.5" />
            {roleLabels[role]}
          </Badge>
        </div>
      </div>

      <nav
        className={cn(
          "flex flex-1 flex-col gap-1 text-sm text-muted-foreground",
          isCollapsed ? "items-center" : "items-stretch",
        )}
      >
        {filteredLinks.map(link => {
          const active = pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={handleLinkClick}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 font-medium transition",
                active
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "hover:bg-muted/40 hover:text-slate-900 dark:hover:text-white",
                isCollapsed && "justify-center px-2",
              )}
            >
              <link.icon className="size-4" />
              {!isCollapsed ? <span className="truncate">{link.label}</span> : null}
            </Link>
          )
        })}
      </nav>

      {["teacher", "admin"].includes(role) ? (
        <div
          className={cn(
            "rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 text-xs text-primary transition-all",
            isCollapsed ? "hidden" : "block",
          )}
        >
          {sidebar.creationModeTitle} <br />
          {sidebar.creationModeDescription}
        </div>
      ) : null}
    </aside>
  )

  if (mobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div className="h-full overflow-y-auto py-6">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return <SidebarContent />
}

