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

// ============================================
// GUARDRAILS - Prevent accidental credit waste
// ============================================
const GUARDRAILS = {
  // Maximum vessels per search result (protects against 600+ vessel responses)
  MAX_SEARCH_RESULTS: 25,
  // Maximum vessels for bulk requests
  MAX_BULK_VESSELS: 50,
  // Radius search is DISABLED by default (use /api/fleet instead)
  RADIUS_SEARCH_ENABLED: false,
  // Required confirmation param for expensive operations
  CONFIRM_EXPENSIVE_OPS: true,
  // Daily call limit per endpoint type
  DAILY_LIMITS: {
    search: 50,
    history: 100,
    info: 200,
  },
};

/**
 * GET /api/live-vessels
 * 
 * ⚠️ GUARDRAILS ACTIVE - Use /api/fleet for fleet tracking
 * 
 * This endpoint is for individual vessel lookups only.
 * Radius search is DISABLED to prevent accidental credit waste.
 * 
 * Safe actions (1 credit each):
 * - action=single&mmsi=XXX - Get single vessel by MMSI
 * - action=stats - Get API usage statistics (free)
 * 
 * Limited actions:
 * - action=search&query=XXX - Search vessels (max 25 results)
 * - action=history&mmsi=XXX - Get vessel track history
 * - action=info&mmsi=XXX - Get vessel details
 * - action=bulk&mmsi=XXX,YYY - Bulk lookup (max 50 vessels)
 * 
 * Disabled actions:
 * - action=radius - DISABLED (can return 600+ vessels!)
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
  const action = searchParams.get('action') || 'stats'; // Default to stats (safe, free)

  try {
    const client = getDatalasticClient();

    switch (action) {
      case 'radius': {
        // ⚠️ GUARDRAIL: Radius search is DISABLED
        // This action can return 600+ vessels and waste credits!
        if (!GUARDRAILS.RADIUS_SEARCH_ENABLED) {
          return NextResponse.json({
            success: false,
            error: 'Radius search is disabled',
            message: 'Radius search can return 600+ vessels and waste API credits. Use /api/fleet for fleet tracking, or /api/live-vessels?action=single&mmsi=XXX for individual vessels.',
            suggestion: 'If you need radius search, enable it in the API guardrails or use action=search with a specific query.',
          }, { status: 403 });
        }

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
          warning: `⚠️ This returned ${vessels.length} vessels (${vessels.length} credits used). Consider using /api/fleet instead.`,
        });
      }

      case 'single': {
        // Get a single vessel by MMSI or IMO (1 credit)
        const mmsi = searchParams.get('mmsi');
        const imo = searchParams.get('imo');

        if (!mmsi && !imo) {
          return NextResponse.json({
            success: false,
            error: 'Missing parameter',
            message: 'Please provide mmsi or imo parameter. Example: /api/live-vessels?action=single&mmsi=470624000',
          }, { status: 400 });
        }

        const vessel = mmsi 
          ? await client.getVesselByMMSI(mmsi)
          : await client.getVesselByIMO(imo!);

        return NextResponse.json({
          success: true,
          vessel: convertToSimplifiedVessel(vessel),
          creditsUsed: 1,
        });
      }

      case 'search': {
        // Search for vessels by name or other criteria
        const query = searchParams.get('query') || searchParams.get('name');
        
        // ⚠️ GUARDRAIL: Require a search query to prevent broad searches
        if (!query || query.trim().length < 2) {
          return NextResponse.json({
            success: false,
            error: 'Search query required',
            message: 'Please provide a search query of at least 2 characters. Example: /api/live-vessels?action=search&query=MAERSK',
          }, { status: 400 });
        }

        const type = searchParams.get('type') || undefined;
        const country = searchParams.get('country') || undefined;
        
        // ⚠️ GUARDRAIL: Limit search results to prevent credit waste
        const requestedLimit = parseInt(searchParams.get('limit') || '25', 10);
        const limit = Math.min(requestedLimit, GUARDRAILS.MAX_SEARCH_RESULTS);

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
            limited: requestedLimit > GUARDRAILS.MAX_SEARCH_RESULTS,
          },
          creditsUsed: vessels.length,
        });
      }

      case 'history': {
        // Get vessel historical positions (1 credit)
        const mmsi = searchParams.get('mmsi');
        const requestedDays = parseInt(searchParams.get('days') || '7', 10);
        // ⚠️ GUARDRAIL: Limit history to 14 days to prevent excessive data
        const days = Math.min(requestedDays, 14);

        if (!mmsi) {
          return NextResponse.json({
            success: false,
            error: 'Missing parameter',
            message: 'Please provide mmsi parameter. Example: /api/live-vessels?action=history&mmsi=470624000&days=7',
          }, { status: 400 });
        }

        const history = await client.getVesselHistory(mmsi, { days });

        return NextResponse.json({
          success: true,
          history,
          meta: {
            days,
            limited: requestedDays > 14,
          },
          creditsUsed: 1,
        });
      }

      case 'info': {
        // Get detailed vessel information (1 credit)
        const mmsi = searchParams.get('mmsi');
        const imo = searchParams.get('imo');
        const name = searchParams.get('name');

        if (!mmsi && !imo && !name) {
          return NextResponse.json({
            success: false,
            error: 'Missing parameter',
            message: 'Please provide mmsi, imo, or name parameter. Example: /api/live-vessels?action=info&mmsi=470624000',
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
          creditsUsed: 1,
        });
      }

      case 'stats': {
        // Get API usage statistics (free, no credits used)
        const stats = await client.getStats();
        return NextResponse.json({
          success: true,
          stats,
          guardrails: {
            radiusSearchEnabled: GUARDRAILS.RADIUS_SEARCH_ENABLED,
            maxSearchResults: GUARDRAILS.MAX_SEARCH_RESULTS,
            maxBulkVessels: GUARDRAILS.MAX_BULK_VESSELS,
            recommendation: 'Use /api/fleet for fleet tracking (17 vessels, ~15 credits per refresh)',
          },
          creditsUsed: 0,
        });
      }

      case 'bulk': {
        // Get multiple vessels by MMSI
        const mmsiParam = searchParams.get('mmsi') || '';
        const mmsiList = mmsiParam.split(',').filter(m => m.trim());

        if (mmsiList.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'Missing parameter',
            message: 'Please provide comma-separated MMSI numbers',
          }, { status: 400 });
        }

        // ⚠️ GUARDRAIL: Limit bulk requests to prevent credit waste
        if (mmsiList.length > GUARDRAILS.MAX_BULK_VESSELS) {
          return NextResponse.json({
            success: false,
            error: 'Too many vessels',
            message: `Maximum ${GUARDRAILS.MAX_BULK_VESSELS} vessels per bulk request. You requested ${mmsiList.length}. Use /api/fleet for fleet tracking.`,
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
          creditsUsed: vessels.length,
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

