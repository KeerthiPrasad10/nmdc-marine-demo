import { NextRequest, NextResponse } from 'next/server';
import { 
  getDatalasticClient, 
  isDatalasticConfigured, 
  convertToSimplifiedVessel,
  SimplifiedVessel,
  calculateDistanceNm,
} from '@/lib/datalastic';
import { 
  WSDOT_FLEET, 
  getWSDOTVesselByMMSI,
  getWSDOTActiveRoutes,
  type WSDOTVessel,
} from '@/lib/wsdot/fleet';

export const dynamic = 'force-dynamic';

export interface WSDOTEnrichedVessel extends SimplifiedVessel {
  wsdot: WSDOTVessel;
  isOnline: boolean;
  distanceFromSeattle?: number;
}

// Seattle Colman Dock (ferry terminal) coordinates
const SEATTLE_COLMAN_DOCK = { lat: 47.6023, lng: -122.3393 };

/**
 * GET /api/nmdc  (legacy endpoint, serves WSDOT data)
 * 
 * Fetch WSDOT ferry fleet data with enrichment
 * 
 * Query parameters:
 * - action: 'fleet' | 'vessel' | 'routes' | 'stats'
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
        // Get all WSDOT vessels with live positions
        const mmsiList = WSDOT_FLEET.map(v => v.mmsi);
        const liveVessels = await client.getVesselsBulk(mmsiList);
        
        const enrichedVessels: WSDOTEnrichedVessel[] = [];
        const now = Date.now();

        for (const wsdotVessel of WSDOT_FLEET) {
          const liveData = liveVessels.find(v => v.mmsi === wsdotVessel.mmsi);
          
          if (liveData) {
            const simplified = convertToSimplifiedVessel(liveData);
            const lastUpdateTime = simplified.lastUpdate 
              ? new Date(simplified.lastUpdate).getTime() 
              : 0;
            const isOnline = (now - lastUpdateTime) < 3600000; // 1 hour
            
            const distanceFromSeattle = calculateDistanceNm(
              SEATTLE_COLMAN_DOCK.lat,
              SEATTLE_COLMAN_DOCK.lng,
              simplified.position.lat,
              simplified.position.lng
            );

            enrichedVessels.push({
              ...simplified,
              name: wsdotVessel.name, // Use WSDOT name (more accurate)
              wsdot: wsdotVessel,
              isOnline,
              distanceFromSeattle: Math.round(distanceFromSeattle * 10) / 10,
            });
          } else {
            // Vessel not found in live data - create placeholder
            enrichedVessels.push({
              id: wsdotVessel.mmsi,
              mmsi: wsdotVessel.mmsi,
              name: wsdotVessel.name,
              type: 'ferry',
              subType: wsdotVessel.vesselClass,
              position: { lat: 0, lng: 0 },
              navStatus: 'Unknown',
              wsdot: wsdotVessel,
              isOnline: false,
            });
          }
        }

        // Sort: online vessels first, then by distance from Seattle
        enrichedVessels.sort((a, b) => {
          if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
          return (a.distanceFromSeattle || 999) - (b.distanceFromSeattle || 999);
        });

        // Calculate fleet stats
        const onlineCount = enrichedVessels.filter(v => v.isOnline).length;
        const totalCrew = WSDOT_FLEET.reduce((sum, v) => sum + (v.crewCount || 0), 0);
        const avgSpeed = enrichedVessels
          .filter(v => v.speed && v.speed > 0)
          .reduce((sum, v, _, arr) => sum + (v.speed || 0) / arr.length, 0);

        return NextResponse.json({
          success: true,
          vessels: enrichedVessels,
          stats: {
            totalVessels: WSDOT_FLEET.length,
            onlineVessels: onlineCount,
            offlineVessels: WSDOT_FLEET.length - onlineCount,
            totalCrew,
            avgSpeed: Math.round(avgSpeed * 10) / 10,
            activeRoutes: getWSDOTActiveRoutes().length,
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

        const wsdotVessel = getWSDOTVesselByMMSI(mmsi);
        if (!wsdotVessel) {
          return NextResponse.json({
            success: false,
            error: 'Vessel not in WSDOT fleet',
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

        const distanceFromSeattle = calculateDistanceNm(
          SEATTLE_COLMAN_DOCK.lat,
          SEATTLE_COLMAN_DOCK.lng,
          simplified.position.lat,
          simplified.position.lng
        );

        return NextResponse.json({
          success: true,
          vessel: {
            ...simplified,
            name: wsdotVessel.name,
            wsdot: wsdotVessel,
            isOnline,
            distanceFromSeattle: Math.round(distanceFromSeattle * 10) / 10,
          },
          info: vesselInfo,
          history: history?.positions || [],
        });
      }

      case 'routes':
      case 'projects': {
        const routes = getWSDOTActiveRoutes();
        return NextResponse.json({
          success: true,
          routes,
        });
      }

      case 'stats': {
        // Quick stats without fetching live data
        const routes = getWSDOTActiveRoutes();
        const vesselsByClass = WSDOT_FLEET.reduce((acc, v) => {
          acc[v.vesselClass] = (acc[v.vesselClass] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return NextResponse.json({
          success: true,
          stats: {
            totalVessels: WSDOT_FLEET.length,
            totalCrew: WSDOT_FLEET.reduce((sum, v) => sum + (v.crewCount || 0), 0),
            activeRoutes: routes.length,
            vesselsByClass,
            routes: routes.map(r => ({
              name: r.route,
              vesselCount: r.vessels.length,
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
    console.error('WSDOT API error:', error);
    return NextResponse.json({
      success: false,
      error: 'API error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
