import { NextRequest, NextResponse } from 'next/server';
import { 
  getDatalasticClient, 
  isDatalasticConfigured, 
  convertToSimplifiedVessel,
  SimplifiedVessel,
  calculateDistanceNm,
} from '@/lib/datalastic';
import { 
  NMDC_FLEET as LEGACY_FLEET, 
  getNMDCVesselByMMSI as getLegacyVesselByMMSI,
  getNMDCActiveProjects as getLegacyActiveProjects,
  NMDCVessel as LegacyVessel,
} from '@/lib/nmdc/fleet';

export const dynamic = 'force-dynamic';

export interface LegacyEnrichedVessel extends SimplifiedVessel {
  legacyMarine: LegacyVessel;
  isOnline: boolean;
  distanceFromAbuDhabi?: number;
}

// Abu Dhabi port coordinates
const ABU_DHABI_PORT = { lat: 24.4539, lng: 54.3773 };

/**
 * GET /api/nmdc  (legacy marine fleet endpoint)
 * 
 * Fetch fleet data with enrichment
 * 
 * Query parameters:
 * - action: 'fleet' | 'vessel' | 'projects' | 'stats'
 * - mmsi: vessel MMSI (for single vessel)
 */
export async function GET(request: NextRequest) {
  if (!isDatalasticConfigured()) {
    return NextResponse.json({
      success: false,
      error: 'Datalastic API not configured',
    }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'fleet';

  try {
    const client = getDatalasticClient();

    switch (action) {
      case 'fleet': {
        // Get all fleet vessels with live positions
        const mmsiList = LEGACY_FLEET.map(v => v.mmsi);
        const liveVessels = await client.getVesselsBulk(mmsiList);
        
        const enrichedVessels: LegacyEnrichedVessel[] = [];
        const now = Date.now();

        for (const legacyVessel of LEGACY_FLEET) {
          const liveData = liveVessels.find(v => v.mmsi === legacyVessel.mmsi);
          
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

            enrichedVessels.push({
              ...simplified,
              name: legacyVessel.name, // Use fleet-sourced name (more accurate)
              legacyMarine: legacyVessel,
              isOnline,
              distanceFromAbuDhabi: Math.round(distanceFromAbuDhabi * 10) / 10,
            });
          } else {
            // Vessel not found in live data - create placeholder
            enrichedVessels.push({
              id: legacyVessel.mmsi,
              mmsi: legacyVessel.mmsi,
              imo: legacyVessel.imo,
              name: legacyVessel.name,
              type: legacyVessel.type,
              subType: legacyVessel.subType,
              position: { lat: 0, lng: 0 },
              navStatus: 'Unknown',
              legacyMarine: legacyVessel,
              isOnline: false,
            });
          }
        }

        // Sort: online vessels first, then by distance from Abu Dhabi
        enrichedVessels.sort((a, b) => {
          if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
          return (a.distanceFromAbuDhabi || 999) - (b.distanceFromAbuDhabi || 999);
        });

        // Calculate fleet stats
        const onlineCount = enrichedVessels.filter(v => v.isOnline).length;
        const totalCrew = LEGACY_FLEET.reduce((sum, v) => sum + (v.crewCount || 0), 0);
        const avgSpeed = enrichedVessels
          .filter(v => v.speed && v.speed > 0)
          .reduce((sum, v, _, arr) => sum + (v.speed || 0) / arr.length, 0);

        return NextResponse.json({
          success: true,
          vessels: enrichedVessels,
          stats: {
            totalVessels: LEGACY_FLEET.length,
            onlineVessels: onlineCount,
            offlineVessels: LEGACY_FLEET.length - onlineCount,
            totalCrew,
            avgSpeed: Math.round(avgSpeed * 10) / 10,
            activeProjects: getLegacyActiveProjects().length,
          },
          meta: {
            fetchedAt: new Date().toISOString(),
            creditsUsed: liveVessels.length,
          },
        });
      }

      case 'vessel': {
        const mmsi = searchParams.get('mmsi');
        if (!mmsi) {
          return NextResponse.json({
            success: false,
            error: 'Missing mmsi parameter',
          }, { status: 400 });
        }

        const legacyVessel = getLegacyVesselByMMSI(mmsi);
        if (!legacyVessel) {
          return NextResponse.json({
            success: false,
            error: 'Vessel not found in fleet',
          }, { status: 404 });
        }

        // Fetch live position
        const liveData = await client.getVesselByMMSI(mmsi);
        const simplified = convertToSimplifiedVessel(liveData);
        
        // Fetch vessel info for more details
        let vesselInfo = null;
        try {
          vesselInfo = await client.getVesselInfo({ mmsi });
        } catch (e) {
          console.log('Could not fetch vessel info:', e);
        }

        // Fetch 1 day history
        let history = null;
        try {
          history = await client.getVesselHistory(mmsi, { days: 1 });
        } catch (e) {
          console.log('Could not fetch history:', e);
        }

        const now = Date.now();
        const lastUpdateTime = simplified.lastUpdate 
          ? new Date(simplified.lastUpdate).getTime() 
          : 0;
        const isOnline = (now - lastUpdateTime) < 3600000;

        const distanceFromAbuDhabi = calculateDistanceNm(
          ABU_DHABI_PORT.lat,
          ABU_DHABI_PORT.lng,
          simplified.position.lat,
          simplified.position.lng
        );

        return NextResponse.json({
          success: true,
          vessel: {
            ...simplified,
            name: legacyVessel.name,
            legacyMarine: legacyVessel,
            isOnline,
            distanceFromAbuDhabi: Math.round(distanceFromAbuDhabi * 10) / 10,
          },
          info: vesselInfo,
          history: history?.positions || [],
        });
      }

      case 'projects': {
        const projects = getLegacyActiveProjects();
        return NextResponse.json({
          success: true,
          projects,
        });
      }

      case 'stats': {
        // Quick stats without fetching live data
        const projects = getLegacyActiveProjects();
        const vesselsByType = LEGACY_FLEET.reduce((acc, v) => {
          acc[v.type] = (acc[v.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return NextResponse.json({
          success: true,
          stats: {
            totalVessels: LEGACY_FLEET.length,
            totalCrew: LEGACY_FLEET.reduce((sum, v) => sum + (v.crewCount || 0), 0),
            activeProjects: projects.length,
            vesselsByType,
            projects: projects.map(p => ({
              name: p.project,
              vesselCount: p.vessels.length,
            })),
          },
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
        }, { status: 400 });
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















