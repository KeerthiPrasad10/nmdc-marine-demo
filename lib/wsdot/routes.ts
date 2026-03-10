export interface FerryTerminal {
  name: string
  lat: number
  lng: number
  city: string
}

export interface FerryRoute {
  id: string
  name: string
  abbreviation: string
  terminals: FerryTerminal[]
  crossingTimeMinutes: number
  distanceNm: number
  status: 'active' | 'suspended' | 'seasonal'
  description: string
}

export const FERRY_TERMINALS: Record<string, FerryTerminal> = {
  seattle: { name: 'Seattle (Colman Dock)', lat: 47.6023, lng: -122.3387, city: 'Seattle' },
  bainbridge: { name: 'Bainbridge Island', lat: 47.6235, lng: -122.5110, city: 'Bainbridge Island' },
  bremerton: { name: 'Bremerton', lat: 47.5618, lng: -122.6244, city: 'Bremerton' },
  edmonds: { name: 'Edmonds', lat: 47.8137, lng: -122.3844, city: 'Edmonds' },
  kingston: { name: 'Kingston', lat: 47.7965, lng: -122.4941, city: 'Kingston' },
  mukilteo: { name: 'Mukilteo', lat: 47.9483, lng: -122.3043, city: 'Mukilteo' },
  clinton: { name: 'Clinton', lat: 47.9750, lng: -122.3494, city: 'Clinton' },
  fauntleroy: { name: 'Fauntleroy', lat: 47.5226, lng: -122.3924, city: 'Seattle' },
  vashon: { name: 'Vashon Island', lat: 47.5082, lng: -122.4635, city: 'Vashon' },
  southworth: { name: 'Southworth', lat: 47.5131, lng: -122.5001, city: 'Southworth' },
  pointDefiance: { name: 'Point Defiance', lat: 47.3059, lng: -122.5145, city: 'Tacoma' },
  tahlequah: { name: 'Tahlequah', lat: 47.3318, lng: -122.5069, city: 'Vashon' },
  anacortes: { name: 'Anacortes', lat: 48.5073, lng: -122.6773, city: 'Anacortes' },
  fridayHarbor: { name: 'Friday Harbor', lat: 48.5350, lng: -123.0137, city: 'Friday Harbor' },
  lopezIsland: { name: 'Lopez Island', lat: 48.5712, lng: -122.8973, city: 'Lopez Island' },
  orcasIsland: { name: 'Orcas Island', lat: 48.5975, lng: -122.9435, city: 'Orcas Island' },
  shawIsland: { name: 'Shaw Island', lat: 48.5847, lng: -122.9293, city: 'Shaw Island' },
  coupeville: { name: 'Coupeville', lat: 48.1596, lng: -122.7554, city: 'Coupeville' },
  portTownsend: { name: 'Port Townsend', lat: 48.1130, lng: -122.7598, city: 'Port Townsend' },
}

export const FERRY_ROUTES: FerryRoute[] = [
  {
    id: 'sea-bi',
    name: 'Seattle - Bainbridge Island',
    abbreviation: 'SEA-BI',
    terminals: [FERRY_TERMINALS.seattle, FERRY_TERMINALS.bainbridge],
    crossingTimeMinutes: 35,
    distanceNm: 7.3,
    status: 'active',
    description: 'Most popular route - connects downtown Seattle to Bainbridge Island across Elliott Bay',
  },
  {
    id: 'sea-br',
    name: 'Seattle - Bremerton',
    abbreviation: 'SEA-BR',
    terminals: [FERRY_TERMINALS.seattle, FERRY_TERMINALS.bremerton],
    crossingTimeMinutes: 60,
    distanceNm: 14.5,
    status: 'active',
    description: 'Cross-Sound route connecting Seattle to the Puget Sound Naval Shipyard city of Bremerton',
  },
  {
    id: 'ed-ki',
    name: 'Edmonds - Kingston',
    abbreviation: 'ED-KI',
    terminals: [FERRY_TERMINALS.edmonds, FERRY_TERMINALS.kingston],
    crossingTimeMinutes: 30,
    distanceNm: 5.7,
    status: 'active',
    description: 'North Sound crossing connecting Snohomish County to Kitsap Peninsula',
  },
  {
    id: 'mu-cl',
    name: 'Mukilteo - Clinton',
    abbreviation: 'MU-CL',
    terminals: [FERRY_TERMINALS.mukilteo, FERRY_TERMINALS.clinton],
    crossingTimeMinutes: 20,
    distanceNm: 3.9,
    status: 'active',
    description: 'Gateway to Whidbey Island from Snohomish County',
  },
  {
    id: 'f-v-s',
    name: 'Fauntleroy - Vashon - Southworth',
    abbreviation: 'F-V-S',
    terminals: [FERRY_TERMINALS.fauntleroy, FERRY_TERMINALS.vashon, FERRY_TERMINALS.southworth],
    crossingTimeMinutes: 25,
    distanceNm: 4.8,
    status: 'active',
    description: 'Triangle route serving Vashon Island and Kitsap Peninsula from West Seattle',
  },
  {
    id: 'pd-ta',
    name: 'Point Defiance - Tahlequah',
    abbreviation: 'PD-TA',
    terminals: [FERRY_TERMINALS.pointDefiance, FERRY_TERMINALS.tahlequah],
    crossingTimeMinutes: 15,
    distanceNm: 1.6,
    status: 'active',
    description: 'Short crossing connecting Tacoma to the southern tip of Vashon Island',
  },
  {
    id: 'an-sj',
    name: 'Anacortes - San Juan Islands',
    abbreviation: 'AN-SJ',
    terminals: [
      FERRY_TERMINALS.anacortes,
      FERRY_TERMINALS.lopezIsland,
      FERRY_TERMINALS.shawIsland,
      FERRY_TERMINALS.orcasIsland,
      FERRY_TERMINALS.fridayHarbor,
    ],
    crossingTimeMinutes: 75,
    distanceNm: 22.0,
    status: 'active',
    description: 'Scenic route through the San Juan Islands archipelago in northern Puget Sound',
  },
  {
    id: 'co-pt',
    name: 'Coupeville - Port Townsend',
    abbreviation: 'CO-PT',
    terminals: [FERRY_TERMINALS.coupeville, FERRY_TERMINALS.portTownsend],
    crossingTimeMinutes: 30,
    distanceNm: 4.2,
    status: 'active',
    description: 'Connects Whidbey Island to the Olympic Peninsula across Admiralty Inlet',
  },
]

export function getRouteByAbbreviation(abbr: string): FerryRoute | undefined {
  return FERRY_ROUTES.find(r => r.abbreviation === abbr)
}

export function getRouteById(id: string): FerryRoute | undefined {
  return FERRY_ROUTES.find(r => r.id === id)
}

export function getActiveRoutes(): FerryRoute[] {
  return FERRY_ROUTES.filter(r => r.status === 'active')
}

export function getRouteStats() {
  const active = FERRY_ROUTES.filter(r => r.status === 'active').length
  const suspended = FERRY_ROUTES.filter(r => r.status === 'suspended').length
  const totalTerminals = Object.keys(FERRY_TERMINALS).length
  const totalDistanceNm = FERRY_ROUTES.reduce((sum, r) => sum + r.distanceNm, 0)

  return {
    active,
    suspended,
    total: FERRY_ROUTES.length,
    totalTerminals,
    totalDistanceNm: Math.round(totalDistanceNm * 10) / 10,
  }
}

