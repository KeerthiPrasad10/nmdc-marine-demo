import { NextRequest, NextResponse } from 'next/server'
import { WSDOT_FLEET, getWSDOTVesselByMMSI, type WSDOTVessel } from '@/lib/wsdot/fleet'
import { FERRY_ROUTES, getRouteStats } from '@/lib/wsdot/routes'

export const dynamic = 'force-dynamic'

export interface FleetVessel {
  id: string
  mmsi: string
  imo?: string
  name: string
  type: string
  subType: string
  position: { lat: number; lng: number }
  speed: number
  heading: number
  navStatus?: string
  destination?: string
  eta?: string
  lastUpdate?: string
  wsdot: WSDOTVessel
  isOnline: boolean
  healthScore: number
  fuelLevel: number
  fuelConsumption: number
  emissions: { co2: number; nox: number; sox: number }
  crew: { count: number; hoursOnDuty: number; safetyScore: number }
  route?: string
  atDock?: boolean
}

interface FleetStats {
  totalVessels: number
  onlineVessels: number
  offlineVessels: number
  operationalVessels: number
  maintenanceVessels: number
  totalCrew: number
  avgSpeed: number
  avgHealthScore: number
  activeRoutes: number
  totalEmissionsCO2: number
}

function generateOperationalData(mmsi: string, vessel: WSDOTVessel) {
  const seed = parseInt(mmsi.slice(-6)) / 1000000
  const healthScore = 72 + (seed * 24)
  const fuelLevel = 45 + (seed * 48)
  const baseFuelConsumption = vessel.vesselClass === 'jumbo_mark_ii' ? 350 :
    vessel.vesselClass === 'jumbo' ? 300 :
    vessel.vesselClass === 'super' ? 250 :
    vessel.vesselClass === 'issaquah_130' ? 200 :
    vessel.vesselClass === 'olympic' ? 180 : 160

  const fuelConsumption = baseFuelConsumption * (0.8 + seed * 0.4)

  return {
    healthScore: Math.round(healthScore),
    fuelLevel: Math.round(fuelLevel),
    fuelConsumption: Math.round(fuelConsumption),
    emissions: {
      co2: Math.round(fuelConsumption * 2.68 * 10) / 10,
      nox: Math.round(fuelConsumption * 0.05 * 100) / 100,
      sox: Math.round(fuelConsumption * 0.002 * 1000) / 1000,
    },
    crew: {
      count: vessel.crewCount || 12,
      hoursOnDuty: Math.round(seed * 10),
      safetyScore: Math.round(90 + seed * 10),
    },
  }
}

const PUGET_SOUND_POSITIONS: Record<string, { lat: number; lng: number; heading: number; speed: number; atDock: boolean }> = {
  '366709770': { lat: 47.6180, lng: -122.4200, heading: 275, speed: 15.2, atDock: false },
  '366709780': { lat: 47.6235, lng: -122.5110, heading: 0, speed: 0, atDock: true },
  '366709790': { lat: 47.5800, lng: -122.5500, heading: 245, speed: 14.8, atDock: false },
  '366709810': { lat: 47.8050, lng: -122.4400, heading: 310, speed: 13.5, atDock: false },
  '366709820': { lat: 47.5618, lng: -122.6244, heading: 0, speed: 0, atDock: true },
  '366709830': { lat: 47.3150, lng: -122.5100, heading: 180, speed: 12.1, atDock: false },
  '366709840': { lat: 47.5150, lng: -122.4300, heading: 260, speed: 13.8, atDock: false },
  '366709850': { lat: 47.5082, lng: -122.4635, heading: 0, speed: 0, atDock: true },
  '366709860': { lat: 48.5500, lng: -122.8000, heading: 340, speed: 14.2, atDock: false },
  '366709870': { lat: 47.5226, lng: -122.3924, heading: 0, speed: 0, atDock: true },
  '366709880': { lat: 47.9600, lng: -122.3200, heading: 350, speed: 13.1, atDock: false },
  '366709890': { lat: 47.9483, lng: -122.3043, heading: 0, speed: 0, atDock: true },
  '366709900': { lat: 48.5200, lng: -122.9500, heading: 15, speed: 12.5, atDock: false },
  '366709910': { lat: 48.1360, lng: -122.7575, heading: 200, speed: 11.8, atDock: false },
  '366709920': { lat: 47.3059, lng: -122.5145, heading: 0, speed: 0, atDock: true },
  '366709930': { lat: 48.5073, lng: -122.6773, heading: 0, speed: 0, atDock: true },
  '366709940': { lat: 48.1130, lng: -122.7598, heading: 0, speed: 0, atDock: true },
  '366709950': { lat: 47.9650, lng: -122.3280, heading: 175, speed: 14.0, atDock: false },
  '366709960': { lat: 47.5160, lng: -122.4500, heading: 245, speed: 12.3, atDock: false },
  '366709970': { lat: 47.5082, lng: -122.4635, heading: 90, speed: 11.5, atDock: false },
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const action = searchParams.get('action') || 'fleet'

  try {
    switch (action) {
      case 'fleet': {
        const fleetVessels: FleetVessel[] = []
        let totalSpeed = 0
        let speedCount = 0
        let totalHealth = 0
        let totalCO2 = 0

        for (const vessel of WSDOT_FLEET) {
          const operationalData = generateOperationalData(vessel.mmsi, vessel)
          const simPosition = PUGET_SOUND_POSITIONS[vessel.mmsi]

          const position = simPosition
            ? { lat: simPosition.lat, lng: simPosition.lng }
            : { lat: 47.6 + (Math.random() * 1.5 - 0.75), lng: -122.4 + (Math.random() * 0.6 - 0.3) }
          const heading = simPosition?.heading ?? Math.round(Math.random() * 360)
          const speed = simPosition?.speed ?? 0
          const atDock = simPosition?.atDock ?? true
          const isOnline = !atDock || speed > 0

          if (speed > 0) {
            totalSpeed += speed
            speedCount++
          }
          totalHealth += operationalData.healthScore
          totalCO2 += operationalData.emissions.co2

          fleetVessels.push({
            id: vessel.mmsi,
            mmsi: vessel.mmsi,
            name: vessel.name,
            type: 'ferry',
            subType: vessel.classDisplayName,
            position,
            speed,
            heading,
            navStatus: atDock ? 'At Dock' : 'Under way using engine',
            wsdot: vessel,
            isOnline: true,
            atDock,
            route: vessel.route ?? undefined,
            ...operationalData,
          })
        }

        fleetVessels.sort((a, b) => {
          if (a.atDock !== b.atDock) return a.atDock ? 1 : -1
          return a.name.localeCompare(b.name)
        })

        const onlineCount = fleetVessels.filter(v => !v.atDock).length
        const operationalCount = fleetVessels.filter(v => v.healthScore > 60).length
        const routeStats = getRouteStats()

        const stats: FleetStats = {
          totalVessels: WSDOT_FLEET.length,
          onlineVessels: onlineCount,
          offlineVessels: WSDOT_FLEET.length - onlineCount,
          operationalVessels: operationalCount,
          maintenanceVessels: WSDOT_FLEET.length - operationalCount,
          totalCrew: WSDOT_FLEET.reduce((sum, v) => sum + (v.crewCount || 12), 0),
          avgSpeed: speedCount > 0 ? Math.round(totalSpeed / speedCount * 10) / 10 : 0,
          avgHealthScore: Math.round(totalHealth / WSDOT_FLEET.length),
          activeRoutes: routeStats.active,
          totalEmissionsCO2: Math.round(totalCO2),
        }

        return NextResponse.json({
          success: true,
          vessels: fleetVessels,
          stats,
          vesselCount: fleetVessels.length,
          onlineVessels: onlineCount,
          meta: {
            source: 'simulated',
            fetchedAt: new Date().toISOString(),
            cached: false,
            note: 'WSDOT Ferry fleet data - simulated positions for demo',
          },
        })
      }

      case 'vessel': {
        const mmsi = searchParams.get('mmsi')
        if (!mmsi) {
          return NextResponse.json({ success: false, error: 'Missing mmsi' }, { status: 400 })
        }

        const vessel = getWSDOTVesselByMMSI(mmsi)
        if (!vessel) {
          return NextResponse.json({ success: false, error: 'Vessel not in WSDOT fleet' }, { status: 404 })
        }

        const operationalData = generateOperationalData(mmsi, vessel)
        const simPosition = PUGET_SOUND_POSITIONS[mmsi]

        return NextResponse.json({
          success: true,
          vessel: {
            id: vessel.mmsi,
            mmsi: vessel.mmsi,
            name: vessel.name,
            type: 'ferry',
            subType: vessel.classDisplayName,
            position: simPosition
              ? { lat: simPosition.lat, lng: simPosition.lng }
              : { lat: 47.6, lng: -122.4 },
            speed: simPosition?.speed ?? 0,
            heading: simPosition?.heading ?? 0,
            wsdot: vessel,
            isOnline: true,
            atDock: simPosition?.atDock ?? true,
            route: vessel.route ?? undefined,
            ...operationalData,
          },
        })
      }

      case 'stats': {
        const routeStats = getRouteStats()
        const vesselsByClass = WSDOT_FLEET.reduce((acc, v) => {
          acc[v.classDisplayName] = (acc[v.classDisplayName] || 0) + 1
          return acc
        }, {} as Record<string, number>)

        return NextResponse.json({
          success: true,
          stats: {
            totalVessels: WSDOT_FLEET.length,
            totalCrew: WSDOT_FLEET.reduce((sum, v) => sum + (v.crewCount || 12), 0),
            activeRoutes: routeStats.active,
            totalTerminals: routeStats.totalTerminals,
            vesselsByClass,
            routes: FERRY_ROUTES.map(r => ({
              name: r.name,
              status: r.status,
              crossingTime: r.crossingTimeMinutes,
            })),
          },
        })
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Fleet API error:', error)
    return NextResponse.json({
      success: false,
      error: 'API error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
