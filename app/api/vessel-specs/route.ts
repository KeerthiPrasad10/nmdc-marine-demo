/**
 * Vessel Specifications API
 * 
 * Fetches detailed vessel specifications from Datalastic API
 * and caches them for the fleet.
 * 
 * Endpoint: GET /api/vessel-specs
 * Query params:
 *   - mmsi: Fetch specs for a single vessel
 *   - refresh: Force refresh from API (uses credits)
 *   - action: 'all' to fetch all fleet specs
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getDatalasticClient, 
  isDatalasticConfigured,
  DatalasticVesselInfo,
} from '@/lib/datalastic';
import { NMDC_ENERGY_FLEET as LEGACY_ENERGY_FLEET, NMDCVessel as LegacyVessel } from '@/lib/nmdc/fleet';

export const dynamic = 'force-dynamic';

// In-memory cache for vessel specs
interface VesselSpecsCache {
  specs: Map<string, EnrichedVesselSpec>;
  fetchedAt: string;
}

let specsCache: VesselSpecsCache | null = null;

export interface EnrichedVesselSpec {
  mmsi: string;
  imo?: string;
  name: string;
  // From Fleet config
  legacyMarine: {
    type: string;
    subType: string;
    company: string;
    project?: string;
    captain?: string;
    crewCount?: number;
    datasheetUrl?: string;
  };
  // From Datalastic API
  specifications: {
    length?: number;
    width?: number;
    draught?: number;
    maxDraught?: number;
    grossTonnage?: number;
    deadweight?: number;
    yearBuilt?: number;
    homeport?: string;
    flag?: string;
    callSign?: string;
    shipType?: string;
    shipSubType?: string;
    // Engine details
    enginePower?: string;
    engineType?: string;
    averageSpeed?: number;
    maxSpeed?: number;
    // Capacity
    teu?: number;
    liquidGas?: number;
  };
  // Simulated sensor data (would come from IoT in real system)
  sensors?: {
    mainEngine: {
      rpm: number;
      temperature: number;
      oilPressure: number;
      fuelRate: number;
      runningHours: number;
      status: 'normal' | 'warning' | 'critical';
    };
    generator: {
      load: number;
      voltage: number;
      frequency: number;
      fuelLevel: number;
      status: 'normal' | 'warning' | 'critical';
    };
    navigation: {
      gpsAccuracy: number;
      compassHeading: number;
      windSpeed: number;
      windDirection: number;
    };
    safety: {
      fireAlarms: number;
      bilgeLevel: number;
      lifeboatStatus: 'ready' | 'maintenance';
      emergencyBeacon: 'armed' | 'inactive';
    };
  };
  lastUpdated: string;
  source: 'live' | 'cache' | 'static';
}

// Generate simulated sensor data based on vessel MMSI (for consistent values)
function generateSensorData(mmsi: string): EnrichedVesselSpec['sensors'] {
  const seed = parseInt(mmsi.slice(-6)) / 1000000;
  
  return {
    mainEngine: {
      rpm: Math.round(800 + seed * 400),
      temperature: Math.round(75 + seed * 20),
      oilPressure: Math.round(40 + seed * 20),
      fuelRate: Math.round(150 + seed * 100),
      runningHours: Math.round(5000 + seed * 15000),
      status: seed > 0.9 ? 'warning' : 'normal',
    },
    generator: {
      load: Math.round(50 + seed * 40),
      voltage: Math.round(440 + (seed - 0.5) * 10),
      frequency: Math.round(60 + (seed - 0.5) * 0.5),
      fuelLevel: Math.round(40 + seed * 50),
      status: seed < 0.15 ? 'warning' : 'normal',
    },
    navigation: {
      gpsAccuracy: Math.round(2 + seed * 5),
      compassHeading: Math.round(seed * 360),
      windSpeed: Math.round(5 + seed * 20),
      windDirection: Math.round(seed * 360),
    },
    safety: {
      fireAlarms: 0,
      bilgeLevel: Math.round(seed * 20),
      lifeboatStatus: 'ready',
      emergencyBeacon: 'armed',
    },
  };
}

// Convert Datalastic vessel info to our enriched format
function convertToEnrichedSpec(
  legacyVessel: LegacyVessel,
  apiInfo?: DatalasticVesselInfo,
  source: 'live' | 'cache' | 'static' = 'static'
): EnrichedVesselSpec {
  return {
    mmsi: legacyVessel.mmsi,
    imo: legacyVessel.imo || apiInfo?.imo,
    name: legacyVessel.name,
    legacyMarine: {
      type: legacyVessel.type,
      subType: legacyVessel.subType,
      company: legacyVessel.company,
      project: legacyVessel.project,
      captain: legacyVessel.captain,
      crewCount: legacyVessel.crewCount,
      datasheetUrl: legacyVessel.datasheetUrl,
    },
    specifications: {
      // Prefer API data, fall back to fleet config
      length: apiInfo?.length || legacyVessel.specs?.length,
      width: apiInfo?.width || legacyVessel.specs?.breadth,
      draught: apiInfo?.draught,
      maxDraught: apiInfo?.max_draught || legacyVessel.specs?.depth,
      grossTonnage: apiInfo?.grt,
      deadweight: apiInfo?.dwt,
      yearBuilt: apiInfo?.year_built || legacyVessel.specs?.yearBuilt,
      homeport: apiInfo?.homeport,
      flag: apiInfo?.flag || apiInfo?.country_iso || 'AE',
      callSign: apiInfo?.call_sign,
      shipType: apiInfo?.ship_type || legacyVessel.type,
      shipSubType: apiInfo?.ship_sub_type || legacyVessel.subType,
      enginePower: apiInfo?.engine_power,
      engineType: apiInfo?.engine_type,
      averageSpeed: apiInfo?.average_speed,
      maxSpeed: apiInfo?.max_speed,
      teu: apiInfo?.teu,
      liquidGas: apiInfo?.liquid_gas,
    },
    sensors: generateSensorData(legacyVessel.mmsi),
    lastUpdated: new Date().toISOString(),
    source,
  };
}

// Fetch vessel info from Datalastic API
async function fetchVesselInfo(mmsi: string): Promise<DatalasticVesselInfo | null> {
  if (!isDatalasticConfigured()) {
    return null;
  }

  try {
    const client = getDatalasticClient();
    const info = await client.getVesselInfo({ mmsi });
    return info;
  } catch (error) {
    console.error(`[Vessel Specs] Failed to fetch info for ${mmsi}:`, error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mmsi = searchParams.get('mmsi');
  const action = searchParams.get('action');
  const forceRefresh = searchParams.get('refresh') === 'true';

  try {
    // Single vessel lookup
    if (mmsi) {
      const legacyVessel = LEGACY_ENERGY_FLEET.find(v => v.mmsi === mmsi);
      if (!legacyVessel) {
        return NextResponse.json(
          { success: false, error: 'Vessel not found in fleet' },
          { status: 404 }
        );
      }

      // Check cache first
      if (!forceRefresh && specsCache?.specs.has(mmsi)) {
        return NextResponse.json({
          success: true,
          vessel: specsCache.specs.get(mmsi),
          meta: { source: 'cache', cachedAt: specsCache.fetchedAt },
        });
      }

      // Fetch from API
      const apiInfo = await fetchVesselInfo(mmsi);
      const enrichedSpec = convertToEnrichedSpec(
        legacyVessel,
        apiInfo || undefined,
        apiInfo ? 'live' : 'static'
      );

      // Update cache
      if (!specsCache) {
        specsCache = { specs: new Map(), fetchedAt: new Date().toISOString() };
      }
      specsCache.specs.set(mmsi, enrichedSpec);

      return NextResponse.json({
        success: true,
        vessel: enrichedSpec,
        meta: {
          source: apiInfo ? 'live' : 'static',
          apiDataAvailable: !!apiInfo,
        },
      });
    }

    // Fetch all fleet specs
    if (action === 'all' || action === 'fleet') {
      // Return cached data if available and not forcing refresh
      if (!forceRefresh && specsCache && specsCache.specs.size === LEGACY_ENERGY_FLEET.length) {
        const vessels = Array.from(specsCache.specs.values());
        return NextResponse.json({
          success: true,
          vessels,
          meta: {
            source: 'cache',
            cachedAt: specsCache.fetchedAt,
            vesselCount: vessels.length,
          },
        });
      }

      // Fetch all vessel specs
      const enrichedSpecs: EnrichedVesselSpec[] = [];
      let apiSuccessCount = 0;

      for (const legacyVessel of LEGACY_ENERGY_FLEET) {
        let apiInfo: DatalasticVesselInfo | null = null;
        
        if (forceRefresh || !specsCache?.specs.has(legacyVessel.mmsi)) {
          apiInfo = await fetchVesselInfo(legacyVessel.mmsi);
          if (apiInfo) apiSuccessCount++;
        }

        const enrichedSpec = convertToEnrichedSpec(
          legacyVessel,
          apiInfo || undefined,
          apiInfo ? 'live' : (specsCache?.specs.has(legacyVessel.mmsi) ? 'cache' : 'static')
        );

        enrichedSpecs.push(enrichedSpec);
      }

      // Update cache
      specsCache = {
        specs: new Map(enrichedSpecs.map(s => [s.mmsi, s])),
        fetchedAt: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        vessels: enrichedSpecs,
        meta: {
          source: forceRefresh ? 'live' : 'mixed',
          vesselCount: enrichedSpecs.length,
          apiDataFetched: apiSuccessCount,
          fetchedAt: specsCache.fetchedAt,
          note: apiSuccessCount > 0 
            ? `Enriched ${apiSuccessCount} vessels with live API data`
            : 'Using static fleet configuration (API data not available)',
        },
      });
    }

    // Default: Return fleet summary
    return NextResponse.json({
      success: true,
      fleet: LEGACY_ENERGY_FLEET.map(v => ({
        mmsi: v.mmsi,
        name: v.name,
        type: v.type,
        subType: v.subType,
        hasCachedSpecs: specsCache?.specs.has(v.mmsi) || false,
      })),
      meta: {
        vesselCount: LEGACY_ENERGY_FLEET.length,
        cachedCount: specsCache?.specs.size || 0,
        actions: ['?action=all', '?mmsi=<MMSI>', '?refresh=true'],
      },
    });

  } catch (error) {
    console.error('[Vessel Specs] API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch vessel specs',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}





