"use client"

import { useState, useEffect } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { MapPin, AlertCircle, CheckCircle, Clock, TrendingUp, Users, Activity, Map } from "lucide-react"

interface Vehicle {
  id: string
  name: string
  lat: number
  lng: number
  currentZone: string | null
  status: "active" | "inactive"
}

interface Zone {
  id: string
  name: string
  center: { lat: number; lng: number }
  radius: number
  color: string
}

interface Event {
  id: string
  vehicleId: string
  vehicleName: string
  type: "enter" | "exit"
  zone: string
  timestamp: Date
}

interface ApiEvent {
  id: string
  vehicleId: string
  eventType: "enter" | "exit"
  zone: { id: string; name: string; center: { lat: number; lng: number }; radius: number }
  timestamp: number
}

const VEHICLE_NAMES: Record<string, string> = {
  v1: "Taxi-01",
  v2: "Taxi-02",
  v3: "Taxi-03",
  v4: "Taxi-04",
}

const ZONE_COLORS: Record<string, string> = {
  "zone-1": "#14b8a6",
  "zone-2": "#0d9488",
  "zone-3": "#06b6d4",
}

const fetchZones = async (): Promise<Zone[]> => {
  try {
    const response = await fetch("/api/zones")
    const data = await response.json()
    return data.zones.map((zone: any) => ({
      ...zone,
      color: ZONE_COLORS[zone.id] || "#14b8a6",
    }))
  } catch {
    return []
  }
}

const fetchVehicleZoneStatus = async (vehicleId: string) => {
  try {
    const response = await fetch(`/api/vehicles/${vehicleId}/zone`)
    return await response.json()
  } catch {
    return null
  }
}

const sendLocationUpdate = async (vehicleId: string, lat: number, lng: number) => {
  try {
    const response = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId, lat, lng, timestamp: Date.now() }),
    })
    return await response.json()
  } catch {
    return null
  }
}

const generateVehicles = (): Vehicle[] => [
  {
    id: "v1",
    name: "Taxi-01",
    lat: 40.7128 + Math.random() * 0.1 - 0.05,
    lng: -74.006 + Math.random() * 0.1 - 0.05,
    currentZone: null,
    status: "active",
  },
  {
    id: "v2",
    name: "Taxi-02",
    lat: 40.7769 + Math.random() * 0.1 - 0.05,
    lng: -73.874 + Math.random() * 0.1 - 0.05,
    currentZone: null,
    status: "active",
  },
  {
    id: "v3",
    name: "Taxi-03",
    lat: 40.6892 + Math.random() * 0.1 - 0.05,
    lng: -74.0445 + Math.random() * 0.1 - 0.05,
    currentZone: null,
    status: "active",
  },
  {
    id: "v4",
    name: "Taxi-04",
    lat: 40.73 + Math.random() * 0.1 - 0.05,
    lng: -73.95 + Math.random() * 0.1 - 0.05,
    currentZone: null,
    status: "active",
  },
]

export default function GeoFenceDashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(generateVehicles())
  const [zones, setZones] = useState<Zone[]>([])
  const [recentEvents, setRecentEvents] = useState<Event[]>([])
  const [stats, setStats] = useState({
    totalVehicles: 4,
    activeZones: 3,
    eventsToday: 0,
    zonesOccupied: 0,
  })

  useEffect(() => {
    const loadZones = async () => {
      const loadedZones = await fetchZones()
      setZones(loadedZones)
    }
    loadZones()
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      setVehicles((prev) => {
        const updated = prev.map((v) => {
          const newLat = v.lat + (Math.random() - 0.5) * 0.01
          const newLng = v.lng + (Math.random() - 0.5) * 0.01

          sendLocationUpdate(v.id, newLat, newLng).then((response) => {
            if (response?.geofenceEvents && response.geofenceEvents.length > 0) {
              response.geofenceEvents.forEach((evt: ApiEvent) => {
                const eventData: Event = {
                  id: evt.id,
                  vehicleId: evt.vehicleId,
                  vehicleName: VEHICLE_NAMES[evt.vehicleId] || evt.vehicleId,
                  type: evt.eventType,
                  zone: evt.zone.name,
                  timestamp: new Date(evt.timestamp),
                }
                setRecentEvents((prev) => [eventData, ...prev.slice(0, 19)])
                setStats((prev) => ({
                  ...prev,
                  eventsToday: prev.eventsToday + 1,
                }))
              })
            }
          })

          return { ...v, lat: newLat, lng: newLng }
        })
        return updated
      })

      vehicles.forEach(async (v) => {
        const status = await fetchVehicleZoneStatus(v.id)
        if (status?.currentZone) {
          setVehicles((prev) =>
            prev.map((vehicle) =>
              vehicle.id === v.id
                ? {
                    ...vehicle,
                    currentZone: status.zoneDetails?.name || null,
                  }
                : vehicle,
            ),
          )
        }
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [vehicles])

  const eventData = [
    { time: "6:00", entries: 12, exits: 8 },
    { time: "9:00", entries: 19, exits: 5 },
    { time: "12:00", entries: 25, exits: 15 },
    { time: "15:00", entries: 18, exits: 12 },
    { time: "18:00", entries: 22, exits: 18 },
  ]

  const zoneStats = zones.map((zone) => ({
    name: zone.name,
    vehicles: Math.floor(Math.random() * 8) + 2,
  }))

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Map className="w-6 h-6 text-accent" />
          </div>
          <h1 className="text-4xl font-bold text-balance">Geofence Tracking System</h1>
        </div>
        <p className="text-muted-foreground">Real-time vehicle location monitoring and zone event detection</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Active Vehicles</h3>
            <Users className="w-5 h-5 text-accent" />
          </div>
          <div className="text-3xl font-bold text-primary">{stats.totalVehicles}</div>
          <p className="text-xs text-muted-foreground mt-2">All vehicles online</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Active Zones</h3>
            <MapPin className="w-5 h-5 text-accent" />
          </div>
          <div className="text-3xl font-bold text-primary">{zones.length}</div>
          <p className="text-xs text-muted-foreground mt-2">Zones configured</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Events Today</h3>
            <Activity className="w-5 h-5 text-accent" />
          </div>
          <div className="text-3xl font-bold text-primary">{stats.eventsToday}</div>
          <p className="text-xs text-muted-foreground mt-2">Entry/exit events</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Avg Response</h3>
            <Clock className="w-5 h-5 text-accent" />
          </div>
          <div className="text-3xl font-bold text-primary">1.2s</div>
          <p className="text-xs text-muted-foreground mt-2">Zone detection time</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Line Chart - Entry/Exit Events */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Daily Event Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={eventData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="time" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="entries" stroke="#14b8a6" dot={{ fill: "#14b8a6" }} strokeWidth={2} />
              <Line type="monotone" dataKey="exits" stroke="#06b6d4" dot={{ fill: "#06b6d4" }} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Zone Distribution */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Vehicles by Zone</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={zoneStats}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="vehicles"
              >
                {zoneStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={zones[index]?.color || "#14b8a6"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vehicle Status and Zone Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Status Table */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            Vehicle Status
          </h2>
          <div className="space-y-3">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg border border-border/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <div>
                    <p className="font-medium text-sm">{v.name}</p>
                    <p className="text-xs text-muted-foreground">{v.currentZone || "In transit"}</p>
                  </div>
                </div>
                <span className="text-xs bg-primary/30 text-accent px-2 py-1 rounded">{v.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Zone Information */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-accent" />
            Zone Information
          </h2>
          <div className="space-y-3">
            {zones.map((zone) => (
              <div key={zone.id} className="p-3 bg-secondary/30 rounded-lg border border-border/50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                    <p className="font-medium text-sm">{zone.name}</p>
                  </div>
                  <span className="text-xs text-accent">R: {zone.radius}km</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Center: {zone.center.lat.toFixed(4)}, {zone.center.lng.toFixed(4)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="mt-8 bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent" />
          Recent Events
        </h2>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {recentEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Waiting for location events...</p>
          ) : (
            recentEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 border-b border-border/30 last:border-b-0"
              >
                <div className="flex items-center gap-3 flex-1">
                  {event.type === "enter" ? (
                    <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {event.vehicleName}{" "}
                      <span className="text-muted-foreground">{event.type === "enter" ? "entered" : "exited"}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{event.zone}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {event.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
