"use client"

import type { ReactNode } from "react"
import { Toaster } from "sonner"

import { AuthProvider } from "@/components/providers/session-provider"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { LanguageProvider } from "@/components/i18n/language-provider"
import { LabInstrumentProvider } from "@/contexts/lab-instrument-context"
import { AccessibilityProvider } from "@/components/accessibility/accessibility-provider"
import { NotificationProvider } from "@/contexts/notification-context"

type AppProvidersProps = {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LanguageProvider>
          <NotificationProvider>
            <AccessibilityProvider>
              <LabInstrumentProvider>
                <TooltipProvider>{children}</TooltipProvider>
              </LabInstrumentProvider>
            </AccessibilityProvider>
          </NotificationProvider>
        </LanguageProvider>
      </AuthProvider>
      <Toaster richColors closeButton />
    </ThemeProvider>
  )
}

