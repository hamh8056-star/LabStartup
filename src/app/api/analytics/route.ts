import { NextResponse } from "next/server"

import {
  getAnalyticsSummary,
  getPerformanceTimeline,
  getClassPerformance,
  getExperienceMetrics,
  getActivityTimeline,
} from "@/lib/data/analytics"

export async function GET() {
  const [summary, timeline, classes, experiences, activity] = await Promise.all([
    getAnalyticsSummary(),
    getPerformanceTimeline(),
    Promise.resolve(getClassPerformance()),
    Promise.resolve(getExperienceMetrics()),
    Promise.resolve(getActivityTimeline()),
  ])

  return NextResponse.json({
    summary,
    timeline,
    classes,
    experiences,
    activity,
  })
}

