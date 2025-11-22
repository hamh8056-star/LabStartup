 "use client"

import { useTheme } from "next-themes"
import { MoonStar, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ThemeToggleProps = {
  className?: string
  variant?: "outline" | "ghost"
}

export function ThemeToggle({ className, variant = "outline" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const isDark = theme === "dark"

  return (
    <Button
      variant={variant}
      size="icon"
      className={cn("h-9 w-9 rounded-full border-border bg-secondary/20 text-foreground hover:bg-secondary/30", className)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Basculer le thème"
    >
      {isDark ? (
        <Sun className="size-4" />
      ) : (
        <MoonStar className="size-4" />
      )}
    </Button>
  )
}

