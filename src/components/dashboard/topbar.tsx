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
    <div className="flex flex-col gap-4 border-b border-border/60 bg-gradient-to-r from-primary/10 via-background to-primary/10 p-4 backdrop-blur dark:from-primary/15 dark:via-background dark:to-primary/15 md:flex-row md:items-center md:justify-between md:gap-6 md:p-6">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-semibold text-foreground md:text-2xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-xs text-muted-foreground md:text-sm">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center md:w-auto md:gap-3">
        <div className="relative flex flex-1 items-center sm:max-w-xs">
          <Search className="absolute left-3 size-4 text-muted-foreground" />
          <Input
            placeholder={(() => { const v = t("dashboard.main.topbar.searchPlaceholder"); return Array.isArray(v) ? v[0] : v; })()}
            className="pl-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full shrink-0">
                <CalendarDays className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("dashboard.main.topbar.calendarTooltip")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full shrink-0">
                <Bell className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("dashboard.main.topbar.notificationsTooltip")}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

