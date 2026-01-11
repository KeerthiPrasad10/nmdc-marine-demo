/**
 * Datalastic Maritime API Integration
 * 
 * API Reference: https://datalastic.com/api-reference/
 * 
 * Provides access to:
 * - Live vessel tracking (AIS data)
 * - Location-based vessel traffic
 * - Historical vessel positions
 * - Vessel specifications
 * - Port information
 */

const DATALASTIC_API_BASE = 'https://api.datalastic.com/api/v0';
const DATALASTIC_SANDBOX_BASE = 'https://api.datalastic.com/api/sandbox';
const DATALASTIC_EXT_BASE = 'https://api.datalastic.com/api/ext';

// ============================================================================
// Types for Datalastic API Responses
// ============================================================================

export interface DatalasticVessel {
  uuid: string;
  name: string;
  mmsi: string;
  imo?: string;
  eni?: string;
  call_sign?: string;
  // Type fields - API uses different formats for different endpoints
  type?: string;
  type_specific?: string;
  ship_type?: string;
  ship_sub_type?: string;
  flag?: string;
  country_iso?: string;
  length?: number;
  width?: number;
  draught?: number;
  grt?: number; // Gross Registered Tonnage
  dwt?: number; // Deadweight Tonnage
  year_built?: number;
  speed?: number;
  course?: number;
  heading?: number;
  // Position fields - API uses lat/lon
  lat?: number;
  lon?: number;
  latitude?: number;
  longitude?: number;
  last_position_epoch?: number;
  last_position_UTC?: string;
  last_position_utc?: string;
  destination?: string;
  eta?: string;
  eta_epoch?: number;
  eta_UTC?: string;
  nav_status?: string;
  nav_status_code?: number;
  distance?: number; // Distance from search point (for radius queries)
}

export interface DatalasticPort {
  uuid: string;
  port_name: string;
  name?: string; // alias
  unlocode?: string;
  code?: string;
  country_name?: string;
  country: string;
  country_iso?: string;
  lat: number;
  lon: number;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  port_type?: string;
  type?: string;
  size?: string;
  area_lvl1?: string;
  area_lvl2?: string;
}

export interface SimplifiedPort {
  id: string;
  name: string;
  code?: string;
  country: string;
  countryCode: string;
  position: {
    lat: number;
    lng: number;
  };
  type: string;
  area?: string;
}

export interface DatalasticVesselHistory {
  uuid: string;
  mmsi: string;
  name: string;
  positions: {
    latitude: number;
    longitude: number;
    speed: number;
    course: number;
    timestamp: string;
    epoch: number;
  }[];
}

export interface DatalasticVesselInfo {
  uuid: string;
  imo?: string;
  mmsi: string;
  name: string;
  call_sign?: string;
  ship_type: string;
  ship_sub_type?: string;
  flag?: string;
  country_iso?: string;
  homeport?: string;
  length?: number;
  width?: number;
  draught?: number;
  max_draught?: number;
  grt?: number;
  dwt?: number;
  teu?: number;
  liquid_gas?: number;
  year_built?: number;
  average_speed?: number;
  max_speed?: number;
  engine_power?: string;
  engine_type?: string;
}

export interface DatalasticRadiusResponse {
  data: {
    point: {
      lat: number;
      lon: number;
      radius: number;
    };
    total: number;
    vessels: DatalasticVessel[];
  };
  meta?: {
    duration: number;
    endpoint: string;
    success: boolean;
  };
}

export interface DatalasticError {
  error: string;
  message: string;
  code?: number;
}

// ============================================================================
// Sea Routes API Types
// ============================================================================

export interface SeaRouteWaypoint {
  lat: number;
  lon: number;
  name?: string;
  note?: string;
}

export interface SeaRouteResponse {
  data: {
    route: SeaRouteWaypoint[];
    distance: number; // Distance in nautical miles
    duration?: number; // Estimated duration in hours
  };
  meta?: {
    success: boolean;
    duration: number;
  };
}

export interface SeaRouteRequest {
  // Origin - use either coordinates or port identifiers
  lat_from?: number;
  lon_from?: number;
  port_uuid_from?: string;
  port_unlocode_from?: string;
  // Destination - use either coordinates or port identifiers
  lat_to?: number;
  lon_to?: number;
  port_uuid_to?: string;
  port_unlocode_to?: string;
}

// ============================================================================
// Vessel Type Mappings
// ============================================================================

export const VESSEL_TYPE_MAP: Record<string, string> = {
  'cargo': 'cargo_vessel',
  'tanker': 'tanker',
  'container': 'container_ship',
  'bulk_carrier': 'bulk_carrier',
  'passenger': 'passenger_vessel',
  'tugboat': 'tugboat',
  'tug': 'tugboat',
  'offshore': 'offshore_vessel',
  'supply': 'supply_vessel',
  'platform': 'platform',
  'dredger': 'dredger',
  'fishing': 'fishing_vessel',
  'sailing': 'sailing_vessel',
  'pleasure': 'pleasure_craft',
  'military': 'military',
  'pilot': 'pilot_vessel',
  'sar': 'search_rescue',
  'law_enforcement': 'law_enforcement',
  'anti_pollution': 'anti_pollution',
  'medical': 'medical_transport',
  'diving': 'diving_vessel',
  'spare_1': 'other',
  'spare_2': 'other',
  'unknown': 'unknown',
};

export const NAV_STATUS_MAP: Record<number, string> = {
  0: 'Under way using engine',
  1: 'At anchor',
  2: 'Not under command',
  3: 'Restricted manoeuvrability',
  4: 'Constrained by draught',
  5: 'Moored',
  6: 'Aground',
  7: 'Engaged in fishing',
  8: 'Under way sailing',
  9: 'Reserved for HSC',
  10: 'Reserved for WIG',
  11: 'Reserved',
  12: 'Reserved',
  13: 'Reserved',
  14: 'AIS-SART active',
  15: 'Not defined',
};

// ============================================================================
// API Client Class
// ============================================================================

class DatalasticAPI {
  private apiKey: string;
  private baseUrl: string;
  private sandboxUrl: string;
  private extUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = DATALASTIC_API_BASE;
    this.sandboxUrl = DATALASTIC_SANDBOX_BASE;
    this.extUrl = DATALASTIC_EXT_BASE;
  }

  /**
   * Make an authenticated request to the Datalastic API
   */
  private async request<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('api-key', this.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    console.log('[Datalastic] Requesting:', url.toString().replace(this.apiKey, '***'));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Datalastic] Error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      // Handle different error message formats
      let errorMessage = `Datalastic API error: ${response.status} ${response.statusText}`;
      if (errorData.meta?.message) {
        errorMessage = typeof errorData.meta.message === 'string' 
          ? errorData.meta.message 
          : JSON.stringify(errorData.meta.message);
      } else if (errorData.message) {
        errorMessage = typeof errorData.message === 'string'
          ? errorData.message
          : JSON.stringify(errorData.message);
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Make an authenticated request to the Datalastic Sandbox API (for sea routes)
   */
  private async sandboxRequest<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
    const url = new URL(`${this.sandboxUrl}${endpoint}`);
    url.searchParams.set('api-key', this.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    console.log('[Datalastic Sandbox] Requesting:', url.toString().replace(this.apiKey, '***'));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Datalastic Sandbox] Error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      let errorMessage = `Datalastic Sandbox API error: ${response.status} ${response.statusText}`;
      if (errorData.meta?.message) {
        errorMessage = typeof errorData.meta.message === 'string' 
          ? errorData.meta.message 
          : JSON.stringify(errorData.meta.message);
      } else if (errorData.message) {
        errorMessage = typeof errorData.message === 'string'
          ? errorData.message
          : JSON.stringify(errorData.message);
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Make an authenticated request to the Datalastic Ext API (for sea routes)
   */
  private async extRequest<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
    const url = new URL(`${this.extUrl}${endpoint}`);
    url.searchParams.set('api-key', this.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    console.log('[Datalastic Ext] Requesting:', url.toString().replace(this.apiKey, '***'));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Datalastic Ext] Error response:', errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      let errorMessage = `Datalastic Ext API error: ${response.status} ${response.statusText}`;
      if (errorData.meta?.message) {
        errorMessage = typeof errorData.meta.message === 'string' 
          ? errorData.meta.message 
          : JSON.stringify(errorData.meta.message);
      } else if (errorData.message) {
        errorMessage = typeof errorData.message === 'string'
          ? errorData.message
          : JSON.stringify(errorData.message);
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // ==========================================================================
  // Live Vessel Tracking
  // ==========================================================================

  /**
   * Get a single vessel by MMSI number
   * Endpoint: /vessel
   * Credits: 1 per request
   */
  async getVesselByMMSI(mmsi: string): Promise<DatalasticVessel> {
    const data = await this.request<{ data: DatalasticVessel }>('/vessel', { mmsi });
    return data.data;
  }

  /**
   * Get a single vessel by IMO number
   */
  async getVesselByIMO(imo: string): Promise<DatalasticVessel> {
    const data = await this.request<{ data: DatalasticVessel }>('/vessel', { imo });
    return data.data;
  }

  /**
   * Get multiple vessels by MMSI numbers (bulk request)
   * Endpoint: /vessel_bulk
   * Credits: 1 per successfully found vessel
   * Max: 100 vessels per request
   * 
   * Falls back to individual requests if bulk returns empty
   * (bulk may require specific subscription tier)
   */
  async getVesselsBulk(mmsiList: string[]): Promise<DatalasticVessel[]> {
    if (mmsiList.length === 0) return [];
    if (mmsiList.length > 100) {
      throw new Error('Maximum 100 vessels per bulk request');
    }
    
    // Try bulk first
    try {
      const data = await this.request<{ data: { total: number; vessels: DatalasticVessel[] } }>('/vessel_bulk', {
        mmsi: mmsiList.join(','),
      });
      
      if (data.data.vessels && data.data.vessels.length > 0) {
        return data.data.vessels;
      }
    } catch (e) {
      // Re-throw rate limit errors
      if (e instanceof Error && e.message.includes('Rate Limit')) {
        throw e;
      }
      console.log('[Datalastic] Bulk API failed, falling back to individual requests');
    }
    
    // Fallback: fetch each vessel individually
    const vessels: DatalasticVessel[] = [];
    let rateLimitHit = false;
    
    for (const mmsi of mmsiList) {
      if (rateLimitHit) break; // Stop if we hit rate limit
      
      try {
        const vessel = await this.getVesselByMMSI(mmsi);
        if (vessel) {
          vessels.push(vessel);
        }
      } catch (e) {
        if (e instanceof Error && e.message.includes('Rate Limit')) {
          rateLimitHit = true;
          console.log(`[Datalastic] Rate limit hit at vessel ${mmsi}`);
        } else {
          console.log(`[Datalastic] Failed to fetch vessel ${mmsi}:`, e);
        }
      }
    }
    
    // If rate limited and got no vessels, throw error
    if (rateLimitHit && vessels.length === 0) {
      throw new Error('Rate Limit');
    }
    
    return vessels;
  }

  /**
   * Get all vessels within a radius of a point
   * Endpoint: /vessel_inradius
   * Credits: 1 per vessel found (max 500 credits)
   */
  async getVesselsInRadius(
    lat: number,
    lon: number,
    radius: number, // nautical miles, max 500
    options: {
      type?: string; // vessel type filter
      country?: string; // flag country filter
    } = {}
  ): Promise<DatalasticRadiusResponse> {
    return this.request<DatalasticRadiusResponse>('/vessel_inradius', {
      lat,
      lon,
      radius: Math.min(radius, 500),
      ...options,
    });
  }

  // ==========================================================================
  // Vessel Information
  // ==========================================================================

  /**
   * Get detailed vessel specifications
   * Endpoint: /vessel_info
   * Credits: 1 per request
   */
  async getVesselInfo(params: { mmsi?: string; imo?: string; name?: string }): Promise<DatalasticVesselInfo> {
    const data = await this.request<{ data: DatalasticVesselInfo }>('/vessel_info', params);
    return data.data;
  }

  /**
   * Search for vessels by various criteria
   * Endpoint: /vessel_find
   * Credits: 1 per vessel found
   */
  async searchVessels(params: {
    name?: string;
    type?: string;
    country?: string;
    imo?: string;
    mmsi?: string;
    call_sign?: string;
    min_length?: number;
    max_length?: number;
    min_year?: number;
    max_year?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ data: DatalasticVessel[]; meta: { total: number } }> {
    return this.request('/vessel_find', params);
  }

  // ==========================================================================
  // Historical Data
  // ==========================================================================

  /**
   * Get historical positions for a vessel
   * Endpoint: /vessel_history
   * Credits: 1 per day per vessel
   */
  async getVesselHistory(
    mmsi: string,
    options: {
      from?: string; // YYYY-MM-DD
      to?: string;   // YYYY-MM-DD
      days?: number; // alternative: last N days
    } = {}
  ): Promise<DatalasticVesselHistory> {
    const params: Record<string, string | number> = { mmsi };
    
    if (options.from) params.from = options.from;
    if (options.to) params.to = options.to;
    if (options.days) params.days = options.days;
    
    const data = await this.request<{ data: DatalasticVesselHistory }>('/vessel_history', params);
    return data.data;
  }

  // ==========================================================================
  // Port Data
  // ==========================================================================

  /**
   * Search for ports
   * Endpoint: /port_find
   * Credits: 1 per port found
   */
  async searchPorts(params: {
    name?: string;
    country_iso?: string;
    unlocode?: string;
    uuid?: string;
    port_type?: string;
    lat?: number;
    lon?: number;
    radius?: number;
    limit?: number;
  }): Promise<{ data: DatalasticPort[]; meta: { total: number } }> {
    return this.request('/port_find', params);
  }

  /**
   * Get ports near a location
   */
  async getPortsNearby(lat: number, lon: number, radiusNm: number = 50): Promise<DatalasticPort[]> {
    const result = await this.searchPorts({ lat, lon, radius: radiusNm, limit: 50 });
    return result.data;
  }

  /**
   * Get port by UNLOCODE (e.g., AEAUH for Abu Dhabi)
   */
  async getPortByCode(unlocode: string): Promise<DatalasticPort | null> {
    const result = await this.searchPorts({ unlocode, limit: 1 });
    return result.data[0] || null;
  }

  /**
   * Get all ports in a country
   */
  async getPortsByCountry(countryCode: string, limit: number = 100): Promise<DatalasticPort[]> {
    const result = await this.searchPorts({ country_iso: countryCode, limit });
    return result.data;
  }

  // ==========================================================================
  // Sea Routes
  // ==========================================================================

  /**
   * Get optimal sea route between two points
   * Endpoint: /route (ext API)
   * Returns realistic maritime routes that avoid land
   * 
   * Points can be specified using:
   * - Coordinates (lat_from, lon_from, lat_to, lon_to)
   * - Port UUIDs (port_uuid_from, port_uuid_to)
   * - UN/LOCODEs (port_unlocode_from, port_unlocode_to)
   */
  async getSeaRoute(params: SeaRouteRequest): Promise<SeaRouteResponse> {
    const queryParams: Record<string, string | number> = {};
    
    // Origin
    if (params.lat_from !== undefined) queryParams.lat_from = params.lat_from;
    if (params.lon_from !== undefined) queryParams.lon_from = params.lon_from;
    if (params.port_uuid_from) queryParams.port_uuid_from = params.port_uuid_from;
    if (params.port_unlocode_from) queryParams.port_unlocode_from = params.port_unlocode_from;
    
    // Destination
    if (params.lat_to !== undefined) queryParams.lat_to = params.lat_to;
    if (params.lon_to !== undefined) queryParams.lon_to = params.lon_to;
    if (params.port_uuid_to) queryParams.port_uuid_to = params.port_uuid_to;
    if (params.port_unlocode_to) queryParams.port_unlocode_to = params.port_unlocode_to;

    // Call ext API which returns GeoJSON format
    interface ExtRouteResponse {
      data: {
        from: {
          type: string;
          geometry: { type: string; coordinates: [number, number] };
          properties: { type: string };
        };
        route: {
          type: string;
          geometry: { type: string; coordinates: [number, number][] };
          properties: { total_dist: number; total_dist_nm: number };
        };
        to: {
          type: string;
          geometry: { type: string; coordinates: [number, number] };
          properties: { type: string };
        };
      };
      meta: { duration: number; endpoint: string; success: boolean };
    }

    const extResponse = await this.extRequest<ExtRouteResponse>('/route', queryParams);
    
    // Convert GeoJSON coordinates [lon, lat] to our format { lat, lon }
    const coordinates = extResponse.data.route.geometry.coordinates;
    const waypoints: SeaRouteWaypoint[] = coordinates.map(([lon, lat]) => ({
      lat,
      lon,
    }));

    // Return in our standard format
    return {
      data: {
        route: waypoints,
        distance: extResponse.data.route.properties.total_dist_nm,
      },
      meta: {
        success: extResponse.meta.success,
        duration: extResponse.meta.duration,
      },
    };
  }

  /**
   * Get sea route between two coordinate points
   * Convenience method for coordinate-based routing
   */
  async getSeaRouteByCoordinates(
    fromLat: number,
    fromLon: number,
    toLat: number,
    toLon: number
  ): Promise<SeaRouteResponse> {
    return this.getSeaRoute({
      lat_from: fromLat,
      lon_from: fromLon,
      lat_to: toLat,
      lon_to: toLon,
    });
  }

  /**
   * Get sea route between two ports by UNLOCODE
   * Convenience method for port-based routing
   */
  async getSeaRouteBetweenPorts(
    fromUnlocode: string,
    toUnlocode: string
  ): Promise<SeaRouteResponse> {
    return this.getSeaRoute({
      port_unlocode_from: fromUnlocode,
      port_unlocode_to: toUnlocode,
    });
  }

  // ==========================================================================
  // Account & Statistics
  // ==========================================================================

  /**
   * Get API usage statistics
   * Endpoint: /stat
   */
  async getStats(): Promise<{
    requests_used: number;
    requests_remaining: number;
    plan: string;
  }> {
    const result = await this.request<{
      data: {
        user_id: string;
        key_status: string;
        requests_made: number;
        requests_remaining: number;
      };
      meta: {
        success: boolean;
      };
    }>('/stat');
    
    return {
      requests_used: result.data?.requests_made || 0,
      requests_remaining: result.data?.requests_remaining || 0,
      plan: result.data?.key_status || 'Unknown',
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let datalasticInstance: DatalasticAPI | null = null;

/**
 * Get the Datalastic API client instance
 * Requires DATALASTIC_API_KEY environment variable
 */
export function getDatalasticClient(): DatalasticAPI {
  if (!datalasticInstance) {
    const apiKey = process.env.DATALASTIC_API_KEY;
    if (!apiKey) {
      throw new Error('DATALASTIC_API_KEY environment variable is not set');
    }
    datalasticInstance = new DatalasticAPI(apiKey);
  }
  return datalasticInstance;
}

/**
 * Check if Datalastic API is configured
 */
export function isDatalasticConfigured(): boolean {
  return !!process.env.DATALASTIC_API_KEY;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert Datalastic vessel to simplified format for UI
 */
export interface SimplifiedVessel {
  id: string;
  mmsi: string;
  imo?: string;
  name: string;
  type: string;
  subType?: string;
  flag?: string;
  position: {
    lat: number;
    lng: number;
  };
  heading?: number;
  course?: number;
  speed?: number;
  destination?: string;
  eta?: string;
  navStatus: string;
  navStatusCode?: number;
  length?: number;
  width?: number;
  draught?: number;
  yearBuilt?: number;
  lastUpdate?: Date;
}

export function convertToSimplifiedVessel(vessel: DatalasticVessel): SimplifiedVessel {
  // Handle different API response formats for position
  const lat = vessel.lat ?? vessel.latitude ?? 0;
  const lng = vessel.lon ?? vessel.longitude ?? 0;
  
  // Handle different type field names
  const vesselType = vessel.type || vessel.ship_type || 'unknown';
  const vesselSubType = vessel.type_specific || vessel.ship_sub_type;
  
  // Handle different timestamp formats
  const lastPositionTime = vessel.last_position_epoch 
    ? new Date(vessel.last_position_epoch * 1000)
    : (vessel.last_position_UTC || vessel.last_position_utc)
      ? new Date(vessel.last_position_UTC || vessel.last_position_utc || '')
      : undefined;
  
  // Handle ETA
  const eta = vessel.eta || (vessel.eta_UTC ? vessel.eta_UTC : undefined);

  return {
    id: vessel.uuid || vessel.mmsi,
    mmsi: vessel.mmsi,
    imo: vessel.imo,
    name: vessel.name || `Unknown (${vessel.mmsi})`,
    type: vesselType.toLowerCase(),
    subType: vesselSubType,
    flag: vessel.country_iso || vessel.flag,
    position: {
      lat,
      lng,
    },
    heading: vessel.heading,
    course: vessel.course,
    speed: vessel.speed,
    destination: vessel.destination,
    eta,
    navStatus: vessel.nav_status || NAV_STATUS_MAP[vessel.nav_status_code ?? 15] || 'Active',
    navStatusCode: vessel.nav_status_code,
    length: vessel.length,
    width: vessel.width,
    draught: vessel.draught,
    yearBuilt: vessel.year_built,
    lastUpdate: lastPositionTime,
  };
}

/**
 * Get vessel type icon/color for UI
 */
export function getVesselTypeColor(type: string): string {
  const typeColors: Record<string, string> = {
    tanker: '#ef4444',
    cargo: '#3b82f6',
    container: '#8b5cf6',
    passenger: '#ec4899',
    tug: '#10b981',
    tugboat: '#10b981',
    offshore: '#f59e0b',
    supply: '#06b6d4',
    dredger: '#a855f7',
    fishing: '#22c55e',
    sailing: '#0ea5e9',
    military: '#6b7280',
    other: '#f97316',
    reserved: '#14b8a6',
    pleasure: '#f472b6',
    hsc: '#fbbf24',
    wig: '#84cc16',
    unknown: '#9ca3af',
  };

  const lowerType = type.toLowerCase();
  return typeColors[lowerType] || typeColors.unknown;
}

/**
 * Convert Datalastic port to simplified format for UI
 */
export function convertToSimplifiedPort(port: DatalasticPort): SimplifiedPort {
  return {
    id: port.uuid,
    name: port.port_name || port.name || 'Unknown Port',
    code: port.unlocode || port.code,
    country: port.country_name || port.country,
    countryCode: port.country_iso || '',
    position: {
      lat: port.lat ?? port.latitude ?? 0,
      lng: port.lon ?? port.longitude ?? 0,
    },
    type: port.port_type || port.type || 'Port',
    area: port.area_lvl1 || port.area_lvl2,
  };
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in nautical miles
 */
export function calculateDistanceNm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Estimate voyage duration based on distance and speed
 */
export function estimateVoyageDuration(
  distanceNm: number,
  speedKnots: number = 12
): { hours: number; days: number; formatted: string } {
  const hours = distanceNm / speedKnots;
  const days = hours / 24;
  
  if (days >= 1) {
    const wholeDays = Math.floor(days);
    const remainingHours = Math.round((days - wholeDays) * 24);
    return {
      hours,
      days,
      formatted: `${wholeDays}d ${remainingHours}h`,
    };
  }
  
  return {
    hours,
    days,
    formatted: `${Math.round(hours)}h`,
  };
}

/**
 * Calculate bearing between two points
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  const bearing = Math.atan2(y, x);
  return (bearing * 180 / Math.PI + 360) % 360;
}

export default DatalasticAPI;

