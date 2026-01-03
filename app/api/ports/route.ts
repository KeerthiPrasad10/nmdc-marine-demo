import { NextRequest, NextResponse } from 'next/server';
import { 
  getDatalasticClient, 
  isDatalasticConfigured, 
  convertToSimplifiedPort,
  calculateDistanceNm,
  estimateVoyageDuration,
  SimplifiedPort,
} from '@/lib/datalastic';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ports
 * 
 * Fetch port data from Datalastic API
 * 
 * Query parameters:
 * - action: 'search' | 'nearby' | 'country' | 'route' (default: 'search')
 * - name: port name to search
 * - country: country code (e.g., AE, SA, QA)
 * - lat, lng, radius: for nearby search
 * - from, to: port codes for route calculation
 */
export async function GET(request: NextRequest) {
  if (!isDatalasticConfigured()) {
    return NextResponse.json({
      success: false,
      error: 'Datalastic API not configured',
      message: 'Please set the DATALASTIC_API_KEY environment variable',
    }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'search';

  try {
    const client = getDatalasticClient();

    switch (action) {
      case 'search': {
        const name = searchParams.get('name') || undefined;
        const country = searchParams.get('country') || undefined;
        const portType = searchParams.get('type') || undefined;
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        if (!name && !country && !portType) {
          return NextResponse.json({
            success: false,
            error: 'Missing parameter',
            message: 'Please provide name, country, or type parameter',
          }, { status: 400 });
        }

        const result = await client.searchPorts({
          name,
          country_iso: country,
          port_type: portType,
          limit,
        });

        const ports: SimplifiedPort[] = result.data.map(convertToSimplifiedPort);

        return NextResponse.json({
          success: true,
          ports,
          meta: {
            total: ports.length,
            filters: { name, country, type: portType },
          },
        });
      }

      case 'nearby': {
        const lat = parseFloat(searchParams.get('lat') || '');
        const lng = parseFloat(searchParams.get('lng') || '');
        const radius = parseInt(searchParams.get('radius') || '50', 10);

        if (isNaN(lat) || isNaN(lng)) {
          return NextResponse.json({
            success: false,
            error: 'Missing parameter',
            message: 'Please provide lat and lng parameters',
          }, { status: 400 });
        }

        const portData = await client.getPortsNearby(lat, lng, radius);
        const ports: SimplifiedPort[] = portData.map(convertToSimplifiedPort);

        // Add distance from search point
        const portsWithDistance = ports.map(port => ({
          ...port,
          distance: calculateDistanceNm(lat, lng, port.position.lat, port.position.lng),
        })).sort((a, b) => a.distance - b.distance);

        return NextResponse.json({
          success: true,
          ports: portsWithDistance,
          meta: {
            center: { lat, lng },
            radius,
            total: ports.length,
          },
        });
      }

      case 'country': {
        const country = searchParams.get('country');
        const limit = parseInt(searchParams.get('limit') || '100', 10);

        if (!country) {
          return NextResponse.json({
            success: false,
            error: 'Missing parameter',
            message: 'Please provide country parameter (e.g., AE, SA, QA)',
          }, { status: 400 });
        }

        const portData = await client.getPortsByCountry(country, limit);
        const ports: SimplifiedPort[] = portData.map(convertToSimplifiedPort);

        return NextResponse.json({
          success: true,
          ports,
          meta: {
            country,
            total: ports.length,
          },
        });
      }

      case 'route': {
        // Calculate route between two points/ports
        const fromLat = parseFloat(searchParams.get('fromLat') || '');
        const fromLng = parseFloat(searchParams.get('fromLng') || '');
        const toLat = parseFloat(searchParams.get('toLat') || '');
        const toLng = parseFloat(searchParams.get('toLng') || '');
        const speed = parseFloat(searchParams.get('speed') || '12');

        if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
          return NextResponse.json({
            success: false,
            error: 'Missing parameter',
            message: 'Please provide fromLat, fromLng, toLat, toLng parameters',
          }, { status: 400 });
        }

        const distance = calculateDistanceNm(fromLat, fromLng, toLat, toLng);
        const duration = estimateVoyageDuration(distance, speed);

        return NextResponse.json({
          success: true,
          route: {
            from: { lat: fromLat, lng: fromLng },
            to: { lat: toLat, lng: toLng },
            distance: Math.round(distance * 10) / 10,
            distanceUnit: 'nm',
            duration: duration.formatted,
            durationHours: Math.round(duration.hours * 10) / 10,
            speed,
            speedUnit: 'knots',
          },
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          message: `Unknown action: ${action}. Valid actions: search, nearby, country, route`,
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Ports API error:', error);
    return NextResponse.json({
      success: false,
      error: 'API error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
