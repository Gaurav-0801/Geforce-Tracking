// Core geofence detection utilities and types

export interface Zone {
  id: string
  name: string
  center: { lat: number; lng: number }
  radius: number // in km
}

export interface LocationEvent {
  vehicleId: string
  lat: number
  lng: number
  timestamp: number
}

export interface VehicleState {
  vehicleId: string
  currentZone: string | null
  lastLocation: { lat: number; lng: number }
  lastUpdate: number
}

export interface GeofenceEvent {
  id: string
  vehicleId: string
  eventType: "enter" | "exit"
  zone: Zone
  timestamp: number
}

// Define predefined zones
export const ZONES: Zone[] = [
  {
    id: "zone-1",
    name: "Downtown Depot",
    center: { lat: 40.7128, lng: -74.006 },
    radius: 2,
  },
  {
    id: "zone-2",
    name: "Airport Terminal",
    center: { lat: 40.7769, lng: -73.874 },
    radius: 3,
  },
  {
    id: "zone-3",
    name: "Harbor District",
    center: { lat: 40.6892, lng: -74.0445 },
    radius: 2.5,
  },
]

// Haversine formula: calculate distance between two lat/lng points in km
export function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Determine which zone a location is in (if any)
export function getZoneForLocation(lat: number, lng: number): Zone | null {
  for (const zone of ZONES) {
    const distance = getDistance(lat, lng, zone.center.lat, zone.center.lng)
    if (distance <= zone.radius) {
      return zone
    }
  }
  return null
}

// In-memory store for vehicle states (in production, use a database)
const vehicleStates = new Map<string, VehicleState>()

// Process a location event and detect enter/exit events
export function processLocationEvent(event: LocationEvent): GeofenceEvent[] {
  const generatedEvents: GeofenceEvent[] = []
  const newZone = getZoneForLocation(event.lat, event.lng)
  const previousState = vehicleStates.get(event.vehicleId)
  const oldZone = previousState?.currentZone ? ZONES.find((z) => z.id === previousState.currentZone) : null

  // Detect zone exit
  if (previousState && oldZone && (!newZone || newZone.id !== oldZone.id)) {
    generatedEvents.push({
      id: `${event.vehicleId}-exit-${event.timestamp}`,
      vehicleId: event.vehicleId,
      eventType: "exit",
      zone: oldZone,
      timestamp: event.timestamp,
    })
  }

  // Detect zone entry
  if (newZone && (!previousState || previousState.currentZone !== newZone.id)) {
    generatedEvents.push({
      id: `${event.vehicleId}-enter-${event.timestamp}`,
      vehicleId: event.vehicleId,
      eventType: "enter",
      zone: newZone,
      timestamp: event.timestamp,
    })
  }

  // Update vehicle state
  vehicleStates.set(event.vehicleId, {
    vehicleId: event.vehicleId,
    currentZone: newZone?.id || null,
    lastLocation: { lat: event.lat, lng: event.lng },
    lastUpdate: event.timestamp,
  })

  return generatedEvents
}

// Query current zone status for a vehicle
export function getVehicleZoneStatus(vehicleId: string): VehicleState | null {
  return vehicleStates.get(vehicleId) || null
}

// Get all vehicle states
export function getAllVehicleStates(): VehicleState[] {
  return Array.from(vehicleStates.values())
}
