import type { Metadata } from "next"
import { Cairo, Geist, Geist_Mono } from "next/font/google"

import { AppProviders } from "@/components/providers/app-providers"
import { SiteHeader } from "@/components/layout/site-header"
import { ServiceWorkerRegistrar } from "@/components/layout/service-worker-registrar"
import { GlobalAssistantWidget } from "@/components/layout/global-assistant-widget"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
  display: "swap",
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
  display: "swap",
})

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  preload: false,
  display: "swap",
})

export const metadata: Metadata = {
  title: "Taalimia — Laboratoires virtuels innovants",
  description:
    "Simulations 3D interactives, collaboration temps réel et analytics intelligents pour révolutionner l'enseignement scientifique.",
  keywords: [
    "laboratoire virtuel",
    "simulation 3D",
    "enseignement scientifique",
    "Next.js",
    "NextAuth",
  ],
  openGraph: {
    title: "Taalimia — Laboratoires virtuels innovants",
    description:
      "Une plateforme immersive pour les expériences scientifiques, avec IA éducative, collaboration et certifications.",
    url: "https://taalimia.education",
    siteName: "Taalimia",
    locale: "fr_FR",
    type: "website",
  },
  manifest: "/manifest.webmanifest",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
          <body
            className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
            suppressHydrationWarning
          >
            <AppProviders>
              <div className="flex min-h-screen flex-col">
                <SiteHeader />
                <main className="flex-1" role="main">{children}</main>
              </div>
              <GlobalAssistantWidget />
            </AppProviders>
            <ServiceWorkerRegistrar />
          </body>
    </html>
  )
}
