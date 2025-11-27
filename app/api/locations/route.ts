// POST /api/locations - Accept location events and process geofence logic

import { processLocationEvent, type LocationEvent, type GeofenceEvent } from "@/lib/geofence"
import { type NextRequest, NextResponse } from "next/server"

interface RequestBody {
  vehicleId: string
  lat: number
  lng: number
  timestamp?: number
}

// Store recent events for querying
const recentEvents: GeofenceEvent[] = []
const MAX_STORED_EVENTS = 1000

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()

    if (!body.vehicleId || body.lat === undefined || body.lng === undefined) {
      return NextResponse.json({ error: "Missing required fields: vehicleId, lat, lng" }, { status: 400 })
    }

    if (Math.abs(body.lat) > 90 || Math.abs(body.lng) > 180) {
      return NextResponse.json(
        { error: "Invalid coordinates: lat must be -90 to 90, lng must be -180 to 180" },
        { status: 400 },
      )
    }

    const locationEvent: LocationEvent = {
      vehicleId: body.vehicleId,
      lat: body.lat,
      lng: body.lng,
      timestamp: body.timestamp || Date.now(),
    }

    const geofenceEvents = processLocationEvent(locationEvent)

    recentEvents.unshift(...geofenceEvents)
    if (recentEvents.length > MAX_STORED_EVENTS) {
      recentEvents.pop()
    }

    return NextResponse.json(
      {
        success: true,
        location: locationEvent,
        geofenceEvents: geofenceEvents,
        eventsDetected: geofenceEvents.length,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Location event processing error:", error)
    return NextResponse.json({ error: "Failed to process location event" }, { status: 500 })
  }
}
