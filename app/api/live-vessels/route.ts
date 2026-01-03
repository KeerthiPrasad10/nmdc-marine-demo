import { NextRequest, NextResponse } from 'next/server';
import { 
  getDatalasticClient, 
  isDatalasticConfigured, 
  convertToSimplifiedVessel,
  SimplifiedVessel,
} from '@/lib/datalastic';

export const dynamic = 'force-dynamic';

// UAE/Persian Gulf region defaults
const UAE_CENTER = { lat: 24.8, lng: 54.0 };
const DEFAULT_RADIUS = 50; // nautical miles (max for Starter plan)

/**
 * GET /api/live-vessels
 * 
 * Fetch live vessel data from Datalastic API
 * 
 * Query parameters:
 * - action: 'radius' | 'search' | 'single' | 'stats' (default: 'radius')
 * - lat: center latitude (default: UAE center)
 * - lng: center longitude (default: UAE center)  
 * - radius: search radius in nautical miles (default: 100, max: 500)
 * - type: vessel type filter
 * - country: flag country filter
 * - mmsi: vessel MMSI (for single vessel lookup)
 * - imo: vessel IMO (for single vessel lookup)
 * - query: search query (for vessel search)
 */
export async function GET(request: NextRequest) {
  // Check if Datalastic is configured
  if (!isDatalasticConfigured()) {
    return NextResponse.json({
      success: false,
      error: 'Datalastic API not configured',
      message: 'Please set the DATALASTIC_API_KEY environment variable',
    }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'radius';

  try {
    const client = getDatalasticClient();

    switch (action) {
      case 'radius': {
        // Get vessels within a radius
        const lat = parseFloat(searchParams.get('lat') || String(UAE_CENTER.lat));
        const lng = parseFloat(searchParams.get('lng') || String(UAE_CENTER.lng));
        const radius = Math.min(
          parseInt(searchParams.get('radius') || String(DEFAULT_RADIUS), 10),
          50 // Max radius for Starter plan
        );
        const type = searchParams.get('type') || undefined;
        const country = searchParams.get('country') || undefined;

        const result = await client.getVesselsInRadius(lat, lng, radius, {
          type,
          country,
        });

        // The API returns { data: { vessels: [...], total, point } }
        const vesselData = result.data.vessels || [];
        const vessels: SimplifiedVessel[] = vesselData.map(convertToSimplifiedVessel);

        return NextResponse.json({
          success: true,
          vessels,
          meta: {
            total: result.data.total,
            center: { lat, lng },
            radius,
            filters: { type, country },
          },
        });
      }

      case 'single': {
        // Get a single vessel by MMSI or IMO
        const mmsi = searchParams.get('mmsi');
        const imo = searchParams.get('imo');

        if (!mmsi && !imo) {
          return NextResponse.json({
            success: false,
            error: 'Missing parameter',
            message: 'Please provide mmsi or imo parameter',
          }, { status: 400 });
        }

        const vessel = mmsi 
          ? await client.getVesselByMMSI(mmsi)
          : await client.getVesselByIMO(imo!);

        return NextResponse.json({
          success: true,
          vessel: convertToSimplifiedVessel(vessel),
        });
      }

      case 'search': {
        // Search for vessels by name or other criteria
        const query = searchParams.get('query') || searchParams.get('name');
        const type = searchParams.get('type') || undefined;
        const country = searchParams.get('country') || undefined;
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const result = await client.searchVessels({
          name: query || undefined,
          type,
          country,
          limit,
        });

        // The API returns { data: [...vessels] } for search
        const vesselData = Array.isArray(result.data) ? result.data : [];
        const vessels: SimplifiedVessel[] = vesselData.map(convertToSimplifiedVessel);

        return NextResponse.json({
          success: true,
          vessels,
          meta: {
            total: vessels.length,
            query,
            filters: { type, country },
          },
        });
      }

      case 'history': {
        // Get vessel historical positions
        const mmsi = searchParams.get('mmsi');
        const days = parseInt(searchParams.get('days') || '7', 10);

        if (!mmsi) {
          return NextResponse.json({
            success: false,
            error: 'Missing parameter',
            message: 'Please provide mmsi parameter',
          }, { status: 400 });
        }

        const history = await client.getVesselHistory(mmsi, { days });

        return NextResponse.json({
          success: true,
          history,
        });
      }

      case 'info': {
        // Get detailed vessel information
        const mmsi = searchParams.get('mmsi');
        const imo = searchParams.get('imo');
        const name = searchParams.get('name');

        if (!mmsi && !imo && !name) {
          return NextResponse.json({
            success: false,
            error: 'Missing parameter',
            message: 'Please provide mmsi, imo, or name parameter',
          }, { status: 400 });
        }

        const info = await client.getVesselInfo({
          mmsi: mmsi || undefined,
          imo: imo || undefined,
          name: name || undefined,
        });

        return NextResponse.json({
          success: true,
          info,
        });
      }

      case 'stats': {
        // Get API usage statistics
        const stats = await client.getStats();
        return NextResponse.json({
          success: true,
          stats,
        });
      }

      case 'bulk': {
        // Get multiple vessels by MMSI (up to 100)
        const mmsiParam = searchParams.get('mmsi') || '';
        const mmsiList = mmsiParam.split(',').filter(m => m.trim());

        if (mmsiList.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'Missing parameter',
            message: 'Please provide comma-separated MMSI numbers',
          }, { status: 400 });
        }

        if (mmsiList.length > 100) {
          return NextResponse.json({
            success: false,
            error: 'Too many vessels',
            message: 'Maximum 100 vessels per bulk request',
          }, { status: 400 });
        }

        const vesselData = await client.getVesselsBulk(mmsiList);
        const vessels: SimplifiedVessel[] = vesselData.map(convertToSimplifiedVessel);

        return NextResponse.json({
          success: true,
          vessels,
          meta: {
            requested: mmsiList.length,
            found: vessels.length,
          },
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          message: `Unknown action: ${action}. Valid actions: radius, single, search, history, info, stats, bulk`,
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Live vessels API error:', error);
    return NextResponse.json({
      success: false,
      error: 'API error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

