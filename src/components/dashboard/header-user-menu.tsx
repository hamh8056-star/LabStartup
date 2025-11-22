"use client"

import Link from "next/link"
import { LogOut, Settings, User } from "lucide-react"
import type { Session } from "next-auth"
import { signOut } from "next-auth/react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type HeaderUserMenuProps = {
  user: Session["user"]
  variant?: "default" | "inverted"
}

export function HeaderUserMenu({ user, variant = "default" }: HeaderUserMenuProps) {
  const initials =
    user?.name
      ?.split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ?? "LS"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={
            variant === "inverted"
              ? "relative size-10 rounded-full border-white/70 bg-white text-primary shadow-sm transition hover:bg-white/90"
              : "relative size-10 rounded-full border-border/60 bg-white/70 shadow-sm transition hover:shadow-md dark:bg-slate-950/80"
          }
        >
          <Avatar
            className={
              variant === "inverted"
                ? "size-10 border border-white/60 bg-white text-primary"
                : "size-10 border border-border/40 bg-muted/40"
            }
          >
            <AvatarFallback
              className={
                variant === "inverted"
                  ? "text-sm font-semibold uppercase text-primary"
                  : "text-sm font-semibold uppercase text-primary"
              }
            >
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="end">
        <DropdownMenuLabel className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{user?.name ?? "Utilisateur"}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile" className="flex items-center gap-2">
            <User className="size-4" />
            Profil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings" className="flex items-center gap-2">
            <Settings className="size-4" />
            Paramètres
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={event => {
            event.preventDefault()
            void signOut({ callbackUrl: "/" })
          }}
          className="flex items-center gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

