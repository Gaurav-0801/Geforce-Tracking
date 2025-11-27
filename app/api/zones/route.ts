// GET /api/zones - Return all available zones

import { ZONES } from "@/lib/geofence"
import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json(
    {
      zones: ZONES,
      count: ZONES.length,
    },
    { status: 200 },
  )
}
