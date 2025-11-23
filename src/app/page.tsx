"use client"

import { CallToAction } from "@/components/landing/cta"
import { FeaturesGrid } from "@/components/landing/features-grid"
import { HeroSection } from "@/components/landing/hero"
import { LandingFooter } from "@/components/landing/footer"

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-8 bg-slate-50/60 pb-8 pt-6 dark:bg-slate-950 sm:gap-12 sm:pb-12 sm:pt-8 md:gap-16 md:pb-16 md:pt-10">
      <HeroSection />
      <FeaturesGrid />
      <CallToAction />
      <LandingFooter />
    </div>
  )
}
