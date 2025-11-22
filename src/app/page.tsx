"use client"

import { CallToAction } from "@/components/landing/cta"
import { FeaturesGrid } from "@/components/landing/features-grid"
import { HeroSection } from "@/components/landing/hero"
import { LandingFooter } from "@/components/landing/footer"

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-16 bg-slate-50/60 pb-16 pt-10 dark:bg-slate-950">
      <HeroSection />
      <FeaturesGrid />
      <CallToAction />
      <LandingFooter />
    </div>
  )
}
