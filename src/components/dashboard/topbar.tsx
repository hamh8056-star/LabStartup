"use client"

import { Bell, CalendarDays, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useLanguage } from "@/components/i18n/language-provider"

type DashboardTopbarProps = {
  title: string
  subtitle?: string
}

export function DashboardTopbar({ title, subtitle }: DashboardTopbarProps) {
  const { t } = useLanguage()
  
  return (
    <div className="flex flex-col gap-6 border-b border-border/60 bg-gradient-to-r from-primary/10 via-background to-primary/10 p-6 backdrop-blur dark:from-primary/15 dark:via-background dark:to-primary/15 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
        <div className="relative flex flex-1 items-center">
          <Search className="absolute left-3 size-4 text-muted-foreground" />
          <Input
            placeholder={(() => { const v = t("dashboard.main.topbar.searchPlaceholder"); return Array.isArray(v) ? v[0] : v; })()}
            className="pl-9"
          />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full">
              <CalendarDays className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("dashboard.main.topbar.calendarTooltip")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full">
              <Bell className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("dashboard.main.topbar.notificationsTooltip")}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

