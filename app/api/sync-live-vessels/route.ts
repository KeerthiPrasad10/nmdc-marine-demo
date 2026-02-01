import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { 
  getDatalasticClient, 
  isDatalasticConfigured,
  DatalasticVessel,
  DatalasticVesselInfo,
} from '@/lib/datalastic';

export const dynamic = 'force-dynamic';

// Supabase admin client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// UAE region bounds for vessel search
const UAE_REGION = {
  center: { lat: 24.5, lng: 54.5 }, // Abu Dhabi / UAE waters
  radius: 50, // nautical miles - Datalastic API limit
};

// Map Datalastic vessel types to our vessel_type enum
// Valid enum values: tugboat, supply_vessel, crane_barge, dredger, survey_vessel
type VesselType = 'tugboat' | 'supply_vessel' | 'crane_barge' | 'dredger' | 'survey_vessel';

function mapVesselType(datalasticType: string): VesselType {
  const lowerType = (datalasticType || '').toLowerCase();
  
  if (lowerType.includes('tug') || lowerType.includes('towing')) return 'tugboat';
  if (lowerType.includes('dredg') || lowerType.includes('hopper')) return 'dredger';
  if (lowerType.includes('survey') || lowerType.includes('research') || lowerType.includes('cable')) return 'survey_vessel';
  if (lowerType.includes('crane') || lowerType.includes('heavy lift') || lowerType.includes('derrick') || lowerType.includes('barge')) return 'crane_barge';
  
  return 'supply_vessel'; // Default for cargo, tanker, offshore, other
}

// Map navigation status to our vessel_status enum
function mapNavStatus(navStatusCode?: number): string {
  if (navStatusCode === undefined || navStatusCode === null) return 'operational';
  
  switch (navStatusCode) {
    case 0: return 'operational'; // Under way using engine
    case 1: return 'idle';        // At anchor
    case 5: return 'idle';        // Moored
    case 2: return 'alert';       // Not under command
    case 6: return 'alert';       // Aground
    default: return 'operational';
  }
}

/**
 * GET /api/sync-live-vessels
 * 
 * Fetches live vessel data from Datalastic and syncs it to Supabase
 * 
 * Query params:
 * - mode: 'full' | 'update' (default: 'update')
 *   - full: Clears existing vessels and imports fresh
 *   - update: Updates existing vessels and adds new ones
 * - filter: vessel type filter (e.g., 'dredger', 'tug', 'offshore')
 */
export async function GET(request: NextRequest) {
  if (!isDatalasticConfigured()) {
    return NextResponse.json({
      success: false,
      error: 'Datalastic API not configured',
      message: 'Please set DATALASTIC_API_KEY in environment variables',
    }, { status: 503 });
  }

  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('mode') || 'update';
  const typeFilter = searchParams.get('filter');

  try {
    const client = getDatalasticClient();
    
    // Fetch vessels in UAE region
    console.log(`Fetching live vessels from Datalastic (radius: ${UAE_REGION.radius}nm)...`);
    
    const result = await client.getVesselsInRadius(
      UAE_REGION.center.lat,
      UAE_REGION.center.lng,
      UAE_REGION.radius,
      typeFilter ? { type: typeFilter } : {}
    );

    const vesselsData = result.data.vessels;
    console.log(`Found ${vesselsData.length} vessels in region`);

    // Filter for relevant vessel types - more permissive to capture working vessels
    const excludeTypes = ['pleasure', 'sailing', 'fishing', 'passenger'];
    
    // Note: Datalastic API returns 'lat' and 'lon' fields
    const filteredVessels = vesselsData.filter((v: any) => {
      // Must have valid position (Datalastic uses lat/lon)
      const lat = v.lat ?? v.latitude;
      const lon = v.lon ?? v.longitude;
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
        return false;
      }
      
      // Must have a name
      if (!v.name || v.name.length < 2) {
        return false;
      }
      
      const type = (v.type || v.ship_type || '').toLowerCase();
      const subType = (v.type_specific || v.ship_sub_type || '').toLowerCase();
      const name = (v.name || '').toLowerCase();
      
      // Exclude pleasure craft, fishing, sailing, passenger
      if (excludeTypes.some(et => type.includes(et) || subType.includes(et))) {
        return false;
      }
      
      // Include if it's a known working vessel type
      const workingTypes = ['tug', 'dredger', 'dredging', 'hopper', 'offshore', 'supply', 'crane', 'survey', 'research', 
                           'cargo', 'tanker', 'container', 'bulk', 'barge', 'anchor', 'ahts', 'platform', 'pipe', 'cable',
                           'heavy lift', 'jack up', 'rig'];
      
      if (workingTypes.some(wt => type.includes(wt) || subType.includes(wt) || name.includes(wt))) {
        return true;
      }
      
      // Also include 'other' and 'unknown' types that have a proper name (likely working vessels)
      if ((type === 'other' || type === 'unknown' || type === '') && v.name && v.name.length > 3) {
        return true;
      }
      
      return false;
    });

    console.log(`Filtered to ${filteredVessels.length} relevant vessels (dredgers, tugs, offshore, etc.)`);

    // Get detailed info for each vessel
    const vesselUpdates = [];
    
    for (const vessel of filteredVessels.slice(0, 50)) { // Limit to 50 to save API credits
      try {
        // Try to get detailed vessel info
        let vesselInfo: DatalasticVesselInfo | null = null;
        try {
          vesselInfo = await client.getVesselInfo({ mmsi: vessel.mmsi });
        } catch {
          // Info endpoint might fail, continue with basic data
        }

        // Datalastic uses lat/lon and type/type_specific fields
        // Get the most specific vessel type available for display
        const rawShipType = vesselInfo?.ship_type || vessel.type || '';
        const rawSubType = vesselInfo?.ship_sub_type || vessel.type_specific || '';
        const vesselClass = rawSubType || rawShipType || null;
        
        const vesselData = {
          name: vessel.name || `Vessel ${vessel.mmsi}`,
          type: mapVesselType(vessel.type || vessel.type_specific || ''),
          vessel_class: vesselClass, // Store original Datalastic type for display
          status: mapNavStatus(vessel.nav_status_code),
          position_lat: vessel.lat ?? vessel.latitude,
          position_lng: vessel.lon ?? vessel.longitude,
          heading: vessel.heading || vessel.course || 0,
          speed: vessel.speed || 0,
          // Additional fields from detailed info
          imo_number: vessel.imo || vesselInfo?.imo || null,
          mmsi: vessel.mmsi,
          call_sign: vessel.call_sign || vesselInfo?.call_sign || null,
          flag: vessel.flag || vesselInfo?.flag || null,
          length_overall: vessel.length || vesselInfo?.length || null,
          breadth: vessel.width || vesselInfo?.width || null,
          max_draught: vessel.draught || vesselInfo?.max_draught || null,
          year_built: vessel.year_built || vesselInfo?.year_built || null,
          gross_tonnage: vessel.grt || vesselInfo?.grt || null,
          deadweight: vessel.dwt || vesselInfo?.dwt || null,
          // Destination info
          destination_port: vessel.destination || null,
          eta: vessel.eta ? new Date(vessel.eta).toISOString() : null,
          // Generated/default values (ensure proper types for database)
          health_score: Math.round(75 + Math.random() * 25), // 75-100 integer
          fuel_level: Math.round(50 + Math.random() * 50),   // 50-100 integer
          crew_count: Math.floor(10 + Math.random() * 40),
          fuel_consumption: Math.round(Math.random() * 500 + 100),
          emissions_co2: Math.round((Math.random() * 2 + 0.5) * 100) / 100,
          emissions_nox: Math.round((Math.random() * 50 + 10) * 100) / 100,
          emissions_sox: Math.round((Math.random() * 20 + 5) * 100) / 100,
          updated_at: new Date().toISOString(),
        };

        vesselUpdates.push(vesselData);
      } catch (error) {
        console.error(`Error processing vessel ${vessel.mmsi}:`, error);
      }
    }

    console.log(`Prepared ${vesselUpdates.length} vessels for database sync`);

    // Sync to Supabase
    if (mode === 'full') {
      // Delete existing simulated vessels and insert new ones
      await supabase.from('vessels').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    }

    // Upsert vessels (update existing or insert new)
    let synced = 0;
    let errors = 0;

    for (const vesselData of vesselUpdates) {
      // Check if vessel exists by MMSI
      const { data: existing } = await supabase
        .from('vessels')
        .select('id')
        .eq('mmsi', vesselData.mmsi)
        .single();

      if (existing) {
        // Update existing vessel
        const { error } = await supabase
          .from('vessels')
          .update({
            position_lat: vesselData.position_lat,
            position_lng: vesselData.position_lng,
            heading: vesselData.heading,
            speed: vesselData.speed,
            status: vesselData.status,
            destination_port: vesselData.destination_port,
            eta: vesselData.eta,
            vessel_class: vesselData.vessel_class, // Update vessel class from Datalastic
            updated_at: vesselData.updated_at,
          })
          .eq('id', existing.id);

        if (error) {
          console.error('Update error:', error);
          errors++;
        } else {
          synced++;
        }
      } else {
        // Insert new vessel
        const { error } = await supabase.from('vessels').insert(vesselData);
        
        if (error) {
          console.error('Insert error:', error);
          errors++;
        } else {
          synced++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${synced} vessels from live AIS data`,
      stats: {
        found: vesselsData.length,
        filtered: filteredVessels.length,
        synced,
        errors,
        mode,
        region: UAE_REGION,
      },
    });

  } catch (error) {
    console.error('Sync live vessels error:', error);
    return NextResponse.json({
      success: false,
      error: 'Sync failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * POST /api/sync-live-vessels
 * 
 * Fetch live data for specific vessels by MMSI
 */
export async function POST(request: NextRequest) {
  if (!isDatalasticConfigured()) {
    return NextResponse.json({
      success: false,
      error: 'Datalastic API not configured',
    }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { mmsiList } = body;

    if (!mmsiList || !Array.isArray(mmsiList)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request',
        message: 'Please provide mmsiList array',
      }, { status: 400 });
    }

    const client = getDatalasticClient();
    const vessels = await client.getVesselsBulk(mmsiList.slice(0, 100));

    // Update each vessel in database
    let updated = 0;
    for (const vessel of vessels) {
      const { error } = await supabase
        .from('vessels')
        .update({
          position_lat: vessel.latitude,
          position_lng: vessel.longitude,
          heading: vessel.heading || vessel.course,
          speed: vessel.speed,
          status: mapNavStatus(vessel.nav_status_code),
          updated_at: new Date().toISOString(),
        })
        .eq('mmsi', vessel.mmsi);

      if (!error) updated++;
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} vessels`,
      stats: {
        requested: mmsiList.length,
        found: vessels.length,
        updated,
      },
    });

  } catch (error) {
    console.error('Bulk update error:', error);
    return NextResponse.json({
      success: false,
      error: 'Update failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

