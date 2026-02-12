/**
 * Legacy Fleet API (marine vessels)
 * 
 * Combines live AIS data from Datalastic with operational data.
 * Live data: position, speed, heading, destination, ETA
 * Simulated: fuel, health, emissions, crew (not available via AIS)
 * 
 * Includes caching to avoid hitting Datalastic rate limits.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getDatalasticClient, 
  isDatalasticConfigured, 
  convertToSimplifiedVessel,
  SimplifiedVessel,
  DatalasticVessel,
  calculateDistanceNm,
} from '@/lib/datalastic';
import { 
  NMDC_FLEET as LEGACY_FLEET, 
  NMDC_ENERGY_FLEET as LEGACY_ENERGY_FLEET, 
  getNMDCVesselByMMSI as getLegacyVesselByMMSI,
  getNMDCActiveProjects as getLegacyActiveProjects,
  NMDCVessel as LegacyVessel,
  getVesselsByCompany as getLegacyVesselsByCompany,
} from '@/lib/nmdc/fleet';

// Legacy fleet for marine demo compatibility
const ACTIVE_FLEET = LEGACY_ENERGY_FLEET;

export const dynamic = 'force-dynamic';

// In-memory cache - persists until manual refresh or server restart
interface CacheEntry {
  vessels: DatalasticVessel[];
  fetchedAt: string;
  creditsUsed: number;
}

interface ApiStats {
  requestsMade: number;
  requestsRemaining: number;
  lastChecked: string;
}

let fleetCache: CacheEntry | null = null;
let apiStats: ApiStats | null = null;

function getCachedFleet(): CacheEntry | null {
  return fleetCache;
}

function setCachedFleet(vessels: DatalasticVessel[], creditsUsed: number) {
  fleetCache = {
    vessels,
    fetchedAt: new Date().toISOString(),
    creditsUsed,
  };
}

function clearCache() {
  fleetCache = null;
}

function getApiStats(): ApiStats | null {
  return apiStats;
}

function setApiStats(stats: ApiStats) {
  apiStats = stats;
}

// Abu Dhabi port coordinates
const ABU_DHABI_PORT = { lat: 24.4539, lng: 54.3773 };

export interface FleetVessel extends SimplifiedVessel {
  // Legacy vessel metadata
  legacyMarine: LegacyVessel;
  isOnline: boolean;
  distanceFromAbuDhabi?: number;
  
  // Operational data (simulated - not available via AIS)
  healthScore: number;
  fuelLevel: number;
  fuelConsumption: number;
  emissions: {
    co2: number;
    nox: number;
    sox: number;
  };
  crew: {
    count: number;
    hoursOnDuty: number;
    safetyScore: number;
  };
}

interface FleetStats {
  totalVessels: number;
  onlineVessels: number;
  offlineVessels: number;
  operationalVessels: number;
  maintenanceVessels: number;
  totalCrew: number;
  avgSpeed: number;
  avgHealthScore: number;
  activeProjects: number;
  totalEmissionsCO2: number;
}

// Generate consistent simulated operational data based on MMSI
function generateOperationalData(mmsi: string, legacyVessel: LegacyVessel) {
  // Use MMSI as seed for consistent values between refreshes
  const seed = parseInt(mmsi.slice(-6)) / 1000000;
  
  const healthScore = 70 + (seed * 25);
  const fuelLevel = 40 + (seed * 50);
  const baseFuelConsumption = legacyVessel.type === 'hopper_dredger' || legacyVessel.type === 'csd' ? 400 : 
                               legacyVessel.type === 'supply' ? 200 : 150;
  const fuelConsumption = baseFuelConsumption * (0.8 + seed * 0.4);
  
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
      count: legacyVessel.crewCount || 15,
      hoursOnDuty: Math.round(seed * 12),
      safetyScore: Math.round(88 + seed * 12),
    },
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'fleet';

  // If Datalastic not configured, return mock data
  if (!isDatalasticConfigured()) {
    return NextResponse.json({
      success: true,
      vessels: ACTIVE_FLEET.map(v => ({
        id: v.mmsi,
        mmsi: v.mmsi,
        imo: v.imo,
        name: v.name,
        type: v.type,
        subType: v.subType,
        position: { lat: Math.round((24.5 + Math.random() * 0.5) * 1000000) / 1000000, lng: Math.round((54.3 + Math.random() * 0.5) * 1000000) / 1000000 },
        speed: Math.round(Math.random() * 80) / 10, // 1 decimal place, 0-8 knots
        heading: Math.round(Math.random() * 360),
        navStatus: 'Under way using engine',
        legacyMarine: v,
        isOnline: false,
        ...generateOperationalData(v.mmsi, v),
      })),
      stats: {
        totalVessels: ACTIVE_FLEET.length,
        onlineVessels: 0,
        offlineVessels: ACTIVE_FLEET.length,
        operationalVessels: Math.floor(ACTIVE_FLEET.length * 0.8),
        maintenanceVessels: Math.ceil(ACTIVE_FLEET.length * 0.2),
        totalCrew: ACTIVE_FLEET.reduce((sum, v) => sum + (v.crewCount || 15), 0),
        avgSpeed: 0,
        avgHealthScore: 85,
        activeProjects: getLegacyActiveProjects().length,
        totalEmissionsCO2: 0,
      },
      meta: {
        source: 'mock',
        fetchedAt: new Date().toISOString(),
      },
    });
  }

  try {
    const client = getDatalasticClient();

    switch (action) {
      case 'fleet': {
        // Check if manual refresh requested
        const forceRefresh = searchParams.get('refresh') === 'true';
        
        // Clear cache if refresh requested
        if (forceRefresh) {
          clearCache();
        }
        
        // Check cache first to avoid rate limits
        const cached = getCachedFleet();
        let liveVessels: DatalasticVessel[];
        let fromCache = false;
        let rateLimited = false;
        let creditsUsed = 0;
        
        if (cached && cached.vessels.length > 0 && !forceRefresh) {
          liveVessels = cached.vessels;
          fromCache = true;
          console.log('Using cached fleet data from', cached.fetchedAt);
        } else {
          // Fetch live positions for all fleet vessels
          const mmsiList = ACTIVE_FLEET.map(v => v.mmsi);
          try {
            liveVessels = await client.getVesselsBulk(mmsiList);
            creditsUsed = liveVessels.length;
            // Only cache if we got actual data
            if (liveVessels.length > 0) {
              setCachedFleet(liveVessels, creditsUsed);
            }
          } catch (err) {
            console.error('Datalastic API error:', err);
            rateLimited = err instanceof Error && err.message.includes('Rate Limit');
            liveVessels = [];
          }
        }
        
        const fleetVessels: FleetVessel[] = [];
        const now = Date.now();
        let totalSpeed = 0;
        let speedCount = 0;
        let totalHealth = 0;
        let totalCO2 = 0;

        for (const legacyVessel of ACTIVE_FLEET) {
          const liveData = liveVessels.find(v => v.mmsi === legacyVessel.mmsi);
          const operationalData = generateOperationalData(legacyVessel.mmsi, legacyVessel);
          
          if (liveData) {
            const simplified = convertToSimplifiedVessel(liveData);
            const lastUpdateTime = simplified.lastUpdate 
              ? new Date(simplified.lastUpdate).getTime() 
              : 0;
            const isOnline = (now - lastUpdateTime) < 3600000; // 1 hour
            
            const distanceFromAbuDhabi = calculateDistanceNm(
              ABU_DHABI_PORT.lat,
              ABU_DHABI_PORT.lng,
              simplified.position.lat,
              simplified.position.lng
            );

            if (simplified.speed && simplified.speed > 0) {
              totalSpeed += simplified.speed;
              speedCount++;
            }
            totalHealth += operationalData.healthScore;
            totalCO2 += operationalData.emissions.co2;

            fleetVessels.push({
              ...simplified,
              name: legacyVessel.name,
              type: legacyVessel.type,
              subType: legacyVessel.subType,
              legacyMarine: legacyVessel,
              isOnline,
              distanceFromAbuDhabi: Math.round(distanceFromAbuDhabi * 10) / 10,
              ...operationalData,
            });
          } else {
            // Vessel not in live data - use fallback position
            totalHealth += operationalData.healthScore;
            
            // Generate consistent mock position based on MMSI (UAE waters area)
            const seed = parseInt(legacyVessel.mmsi.slice(-6)) / 1000000;
            const fallbackLat = 24.2 + (seed * 1.8); // ~24.2 to 26.0
            const fallbackLng = 52.5 + (seed * 4.0); // ~52.5 to 56.5
            
            fleetVessels.push({
              id: legacyVessel.mmsi,
              mmsi: legacyVessel.mmsi,
              imo: legacyVessel.imo,
              name: legacyVessel.name,
              type: legacyVessel.type,
              subType: legacyVessel.subType,
              position: { lat: fallbackLat, lng: fallbackLng },
              speed: rateLimited ? 2 + seed * 6 : 0,
              heading: seed * 360,
              navStatus: rateLimited ? 'Under way using engine' : 'Unknown',
              legacyMarine: legacyVessel,
              isOnline: rateLimited, // If rate limited, show as "simulated online"
              distanceFromAbuDhabi: calculateDistanceNm(ABU_DHABI_PORT.lat, ABU_DHABI_PORT.lng, fallbackLat, fallbackLng),
              ...operationalData,
            });
          }
        }

        // Sort: online vessels first, then by distance
        fleetVessels.sort((a, b) => {
          if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
          return (a.distanceFromAbuDhabi || 999) - (b.distanceFromAbuDhabi || 999);
        });

        const onlineCount = fleetVessels.filter(v => v.isOnline).length;
        const operationalCount = fleetVessels.filter(v => v.healthScore > 60).length;

        const stats: FleetStats = {
          totalVessels: ACTIVE_FLEET.length,
          onlineVessels: onlineCount,
          offlineVessels: ACTIVE_FLEET.length - onlineCount,
          operationalVessels: operationalCount,
          maintenanceVessels: ACTIVE_FLEET.length - operationalCount,
          totalCrew: ACTIVE_FLEET.reduce((sum, v) => sum + (v.crewCount || 15), 0),
          avgSpeed: speedCount > 0 ? Math.round(totalSpeed / speedCount * 10) / 10 : 0,
          avgHealthScore: Math.round(totalHealth / ACTIVE_FLEET.length),
          activeProjects: getLegacyActiveProjects().length,
          totalEmissionsCO2: Math.round(totalCO2),
        };

        return NextResponse.json({
          success: true,
          vessels: fleetVessels,
          stats,
          vesselCount: fleetVessels.length,
          onlineVessels: onlineCount,
          meta: {
            source: rateLimited ? 'simulated' : (fromCache ? 'cache' : 'live'),
            fetchedAt: fromCache && cached ? cached.fetchedAt : new Date().toISOString(),
            cached: fromCache,
            rateLimited,
            creditsUsed: fromCache ? 0 : creditsUsed,
            cacheInfo: fromCache && cached ? {
              cachedAt: cached.fetchedAt,
              creditsUsedOnFetch: cached.creditsUsed,
            } : undefined,
            note: rateLimited 
              ? 'API credits exhausted - showing simulated positions. Credits reset monthly.' 
              : fromCache 
                ? 'Using cached data. Click refresh to fetch live data (uses 15 credits).'
                : undefined,
          },
        });
      }

      case 'vessel': {
        const mmsi = searchParams.get('mmsi');
        if (!mmsi) {
          return NextResponse.json({ success: false, error: 'Missing mmsi' }, { status: 400 });
        }

        const legacyVessel = getLegacyVesselByMMSI(mmsi);
        if (!legacyVessel) {
          return NextResponse.json({ success: false, error: 'Vessel not found in fleet' }, { status: 404 });
        }

        const liveData = await client.getVesselByMMSI(mmsi);
        const simplified = convertToSimplifiedVessel(liveData);
        const operationalData = generateOperationalData(mmsi, legacyVessel);

        return NextResponse.json({
          success: true,
          vessel: {
            ...simplified,
            name: legacyVessel.name,
            legacyMarine: legacyVessel,
            isOnline: true,
            ...operationalData,
          },
        });
      }

      case 'stats': {
        const projects = getLegacyActiveProjects();
        const vesselsByType = ACTIVE_FLEET.reduce((acc, v) => {
          acc[v.type] = (acc[v.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return NextResponse.json({
          success: true,
          stats: {
            totalVessels: ACTIVE_FLEET.length,
            totalCrew: ACTIVE_FLEET.reduce((sum, v) => sum + (v.crewCount || 15), 0),
            activeProjects: projects.length,
            vesselsByType,
            projects: projects.map(p => ({
              name: p.project,
              vesselCount: p.vessels.length,
            })),
          },
        });
      }

      case 'api-stats': {
        // Check API credit usage (costs 0 credits)
        try {
          const statsResponse = await client.getStats();
          const stats = {
            requestsMade: statsResponse.requests_used || 0,
            requestsRemaining: statsResponse.requests_remaining || 0,
            lastChecked: new Date().toISOString(),
          };
          setApiStats(stats);
          
          return NextResponse.json({
            success: true,
            apiStats: stats,
            cache: fleetCache ? {
              fetchedAt: fleetCache.fetchedAt,
              creditsUsed: fleetCache.creditsUsed,
              vesselCount: fleetCache.vessels.length,
            } : null,
            usage: {
              creditsPerRefresh: ACTIVE_FLEET.length,
              monthlyLimit: (statsResponse.requests_used || 0) + (statsResponse.requests_remaining || 0) || 80000,
              refreshesRemaining: Math.floor((statsResponse.requests_remaining || 0) / ACTIVE_FLEET.length),
            },
          });
        } catch (err) {
          return NextResponse.json({
            success: false,
            error: 'Failed to fetch API stats',
            message: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Fleet API error:', error);
    return NextResponse.json({
      success: false,
      error: 'API error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

