// GET /api/vehicles/[vehicleId]/zone - Query current zone status for a vehicle

import { getVehicleZoneStatus, ZONES } from "@/lib/geofence"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ vehicleId: string }> }) {
  try {
    const { vehicleId } = await params

    if (!vehicleId) {
      return NextResponse.json({ error: "Vehicle ID is required" }, { status: 400 })
    }

    const vehicleState = getVehicleZoneStatus(vehicleId)

    if (!vehicleState) {
      return NextResponse.json(
        {
          vehicleId: vehicleId,
          currentZone: null,
          lastLocation: null,
          message: "Vehicle not found (no location events received yet)",
        },
        { status: 200 },
      )
    }

    const zoneDetails = vehicleState.currentZone ? ZONES.find((z) => z.id === vehicleState.currentZone) : null

    return NextResponse.json(
      {
        vehicleId: vehicleId,
        currentZone: vehicleState.currentZone,
        zoneDetails: zoneDetails || null,
        lastLocation: vehicleState.lastLocation,
        lastUpdate: new Date(vehicleState.lastUpdate).toISOString(),
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Zone query error:", error)
    return NextResponse.json({ error: "Failed to query zone status" }, { status: 500 })
  }
}
