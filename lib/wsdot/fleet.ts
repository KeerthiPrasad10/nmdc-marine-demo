export interface WSDOTVessel {
  vesselId: number
  mmsi: string
  name: string
  vesselClass: 'jumbo_mark_ii' | 'jumbo' | 'super' | 'issaquah_130' | 'olympic' | 'evergreen_state'
  classDisplayName: string
  route?: string
  captain?: string
  crewCount?: number
  passengerCapacity: number
  vehicleCapacity: number
  specs?: {
    length?: number
    breadth?: number
    displacement?: number
    maxSpeed?: number
    horsepower?: number
    yearBuilt?: number
    yearRebuilt?: number
    propulsionType?: string
  }
}

export const WSDOT_FLEET: WSDOTVessel[] = [
  // === JUMBO MARK II CLASS (Largest) ===
  {
    vesselId: 1,
    mmsi: '366709770',
    name: 'M/V Puyallup',
    vesselClass: 'jumbo_mark_ii',
    classDisplayName: 'Jumbo Mark II',
    route: 'Seattle - Bainbridge Island',
    captain: 'Capt. James Mitchell',
    crewCount: 18,
    passengerCapacity: 2500,
    vehicleCapacity: 202,
    specs: {
      length: 140,
      breadth: 27,
      displacement: 5950,
      maxSpeed: 18,
      horsepower: 13000,
      yearBuilt: 1999,
      propulsionType: 'Diesel-Electric',
    },
  },
  {
    vesselId: 2,
    mmsi: '366709780',
    name: 'M/V Tacoma',
    vesselClass: 'jumbo_mark_ii',
    classDisplayName: 'Jumbo Mark II',
    route: 'Seattle - Bainbridge Island',
    captain: 'Capt. Sarah Lindstrom',
    crewCount: 18,
    passengerCapacity: 2500,
    vehicleCapacity: 202,
    specs: {
      length: 140,
      breadth: 27,
      displacement: 5950,
      maxSpeed: 18,
      horsepower: 13000,
      yearBuilt: 1997,
      propulsionType: 'Diesel-Electric',
    },
  },
  {
    vesselId: 3,
    mmsi: '366709790',
    name: 'M/V Wenatchee',
    vesselClass: 'jumbo_mark_ii',
    classDisplayName: 'Jumbo Mark II',
    route: 'Seattle - Bremerton',
    captain: 'Capt. David Johansson',
    crewCount: 18,
    passengerCapacity: 2500,
    vehicleCapacity: 202,
    specs: {
      length: 140,
      breadth: 27,
      displacement: 5950,
      maxSpeed: 18,
      horsepower: 13000,
      yearBuilt: 1998,
      propulsionType: 'Diesel-Electric',
    },
  },

  // === JUMBO CLASS ===
  {
    vesselId: 4,
    mmsi: '366709810',
    name: 'M/V Spokane',
    vesselClass: 'jumbo',
    classDisplayName: 'Jumbo',
    route: 'Edmonds - Kingston',
    captain: 'Capt. Mark Peterson',
    crewCount: 16,
    passengerCapacity: 2000,
    vehicleCapacity: 188,
    specs: {
      length: 134,
      breadth: 24,
      displacement: 5000,
      maxSpeed: 17,
      horsepower: 10000,
      yearBuilt: 1972,
      yearRebuilt: 2004,
      propulsionType: 'Diesel',
    },
  },
  {
    vesselId: 5,
    mmsi: '366709820',
    name: 'M/V Walla Walla',
    vesselClass: 'jumbo',
    classDisplayName: 'Jumbo',
    route: 'Seattle - Bremerton',
    captain: 'Capt. Karen Nguyen',
    crewCount: 16,
    passengerCapacity: 2000,
    vehicleCapacity: 188,
    specs: {
      length: 134,
      breadth: 24,
      displacement: 5000,
      maxSpeed: 17,
      horsepower: 10000,
      yearBuilt: 1973,
      yearRebuilt: 2003,
      propulsionType: 'Diesel',
    },
  },

  // === SUPER CLASS ===
  {
    vesselId: 6,
    mmsi: '366709830',
    name: 'M/V Hyak',
    vesselClass: 'super',
    classDisplayName: 'Super',
    route: 'Point Defiance - Tahlequah',
    captain: 'Capt. Robert Chen',
    crewCount: 14,
    passengerCapacity: 2000,
    vehicleCapacity: 144,
    specs: {
      length: 116,
      breadth: 22,
      displacement: 3250,
      maxSpeed: 16,
      horsepower: 6000,
      yearBuilt: 1967,
      yearRebuilt: 2017,
      propulsionType: 'Diesel',
    },
  },
  {
    vesselId: 7,
    mmsi: '366709840',
    name: 'M/V Kaleetan',
    vesselClass: 'super',
    classDisplayName: 'Super',
    route: 'Fauntleroy - Vashon - Southworth',
    captain: 'Capt. Daniel Brooks',
    crewCount: 14,
    passengerCapacity: 2000,
    vehicleCapacity: 144,
    specs: {
      length: 116,
      breadth: 22,
      displacement: 3250,
      maxSpeed: 16,
      horsepower: 6000,
      yearBuilt: 1967,
      yearRebuilt: 2016,
      propulsionType: 'Diesel',
    },
  },

  // === ISSAQUAH 130 CLASS ===
  {
    vesselId: 8,
    mmsi: '366709850',
    name: 'M/V Cathlamet',
    vesselClass: 'issaquah_130',
    classDisplayName: 'Issaquah 130',
    route: 'Fauntleroy - Vashon - Southworth',
    captain: 'Capt. Lisa Anderson',
    crewCount: 12,
    passengerCapacity: 1200,
    vehicleCapacity: 124,
    specs: {
      length: 100,
      breadth: 24,
      displacement: 2700,
      maxSpeed: 15,
      horsepower: 4000,
      yearBuilt: 1981,
      propulsionType: 'Diesel',
    },
  },
  {
    vesselId: 9,
    mmsi: '366709860',
    name: 'M/V Chelan',
    vesselClass: 'issaquah_130',
    classDisplayName: 'Issaquah 130',
    route: 'Anacortes - San Juan Islands',
    captain: 'Capt. Thomas Reed',
    crewCount: 12,
    passengerCapacity: 1200,
    vehicleCapacity: 124,
    specs: {
      length: 100,
      breadth: 24,
      displacement: 2700,
      maxSpeed: 15,
      horsepower: 4000,
      yearBuilt: 1981,
      propulsionType: 'Diesel',
    },
  },
  {
    vesselId: 10,
    mmsi: '366709870',
    name: 'M/V Issaquah',
    vesselClass: 'issaquah_130',
    classDisplayName: 'Issaquah 130',
    route: 'Fauntleroy - Vashon - Southworth',
    captain: 'Capt. William Torres',
    crewCount: 12,
    passengerCapacity: 1200,
    vehicleCapacity: 124,
    specs: {
      length: 100,
      breadth: 24,
      displacement: 2700,
      maxSpeed: 15,
      horsepower: 4000,
      yearBuilt: 1979,
      propulsionType: 'Diesel',
    },
  },
  {
    vesselId: 11,
    mmsi: '366709880',
    name: 'M/V Kitsap',
    vesselClass: 'issaquah_130',
    classDisplayName: 'Issaquah 130',
    route: 'Mukilteo - Clinton',
    captain: 'Capt. Angela Martinez',
    crewCount: 12,
    passengerCapacity: 1200,
    vehicleCapacity: 124,
    specs: {
      length: 100,
      breadth: 24,
      displacement: 2700,
      maxSpeed: 15,
      horsepower: 4000,
      yearBuilt: 1980,
      propulsionType: 'Diesel',
    },
  },
  {
    vesselId: 12,
    mmsi: '366709890',
    name: 'M/V Kittitas',
    vesselClass: 'issaquah_130',
    classDisplayName: 'Issaquah 130',
    route: 'Mukilteo - Clinton',
    captain: 'Capt. Michael Olson',
    crewCount: 12,
    passengerCapacity: 1200,
    vehicleCapacity: 124,
    specs: {
      length: 100,
      breadth: 24,
      displacement: 2700,
      maxSpeed: 15,
      horsepower: 4000,
      yearBuilt: 1980,
      propulsionType: 'Diesel',
    },
  },
  {
    vesselId: 13,
    mmsi: '366709900',
    name: 'M/V Yakima',
    vesselClass: 'issaquah_130',
    classDisplayName: 'Issaquah 130',
    route: 'Anacortes - San Juan Islands',
    captain: 'Capt. Patricia Wong',
    crewCount: 12,
    passengerCapacity: 1200,
    vehicleCapacity: 124,
    specs: {
      length: 100,
      breadth: 24,
      displacement: 2700,
      maxSpeed: 15,
      horsepower: 4000,
      yearBuilt: 1967,
      yearRebuilt: 1982,
      propulsionType: 'Diesel',
    },
  },

  // === OLYMPIC (KWA-DI TABIL) CLASS ===
  {
    vesselId: 14,
    mmsi: '366709910',
    name: 'M/V Chetzemoka',
    vesselClass: 'olympic',
    classDisplayName: 'Olympic (Kwa-di Tabil)',
    route: 'Coupeville - Port Townsend',
    captain: 'Capt. Ryan Sullivan',
    crewCount: 10,
    passengerCapacity: 750,
    vehicleCapacity: 64,
    specs: {
      length: 84,
      breadth: 19,
      displacement: 1820,
      maxSpeed: 15,
      horsepower: 4000,
      yearBuilt: 2010,
      propulsionType: 'Diesel-Electric',
    },
  },
  {
    vesselId: 15,
    mmsi: '366709920',
    name: 'M/V Kennewick',
    vesselClass: 'olympic',
    classDisplayName: 'Olympic (Kwa-di Tabil)',
    route: 'Point Defiance - Tahlequah',
    captain: 'Capt. Jennifer Hayes',
    crewCount: 10,
    passengerCapacity: 750,
    vehicleCapacity: 64,
    specs: {
      length: 84,
      breadth: 19,
      displacement: 1820,
      maxSpeed: 15,
      horsepower: 4000,
      yearBuilt: 2011,
      propulsionType: 'Diesel-Electric',
    },
  },
  {
    vesselId: 16,
    mmsi: '366709930',
    name: 'M/V Samish',
    vesselClass: 'olympic',
    classDisplayName: 'Olympic (Kwa-di Tabil)',
    route: 'Anacortes - San Juan Islands',
    captain: 'Capt. Scott Yamamoto',
    crewCount: 10,
    passengerCapacity: 750,
    vehicleCapacity: 64,
    specs: {
      length: 84,
      breadth: 19,
      displacement: 1820,
      maxSpeed: 15,
      horsepower: 4000,
      yearBuilt: 2015,
      propulsionType: 'Diesel-Electric',
    },
  },
  {
    vesselId: 17,
    mmsi: '366709940',
    name: 'M/V Chimacum',
    vesselClass: 'olympic',
    classDisplayName: 'Olympic (Kwa-di Tabil)',
    route: 'Coupeville - Port Townsend',
    captain: 'Capt. Emily Parker',
    crewCount: 10,
    passengerCapacity: 750,
    vehicleCapacity: 64,
    specs: {
      length: 84,
      breadth: 19,
      displacement: 1820,
      maxSpeed: 15,
      horsepower: 4000,
      yearBuilt: 2017,
      propulsionType: 'Diesel-Electric',
    },
  },
  {
    vesselId: 18,
    mmsi: '366709950',
    name: 'M/V Suquamish',
    vesselClass: 'olympic',
    classDisplayName: 'Olympic (Kwa-di Tabil)',
    route: 'Mukilteo - Clinton',
    captain: 'Capt. Brian Richardson',
    crewCount: 10,
    passengerCapacity: 750,
    vehicleCapacity: 64,
    specs: {
      length: 84,
      breadth: 19,
      displacement: 1820,
      maxSpeed: 15,
      horsepower: 4000,
      yearBuilt: 2018,
      propulsionType: 'Diesel-Electric',
    },
  },

  // === EVERGREEN STATE CLASS ===
  {
    vesselId: 19,
    mmsi: '366709960',
    name: 'M/V Sealth',
    vesselClass: 'evergreen_state',
    classDisplayName: 'Evergreen State',
    route: 'Fauntleroy - Vashon - Southworth',
    captain: 'Capt. John Crawford',
    crewCount: 12,
    passengerCapacity: 1090,
    vehicleCapacity: 87,
    specs: {
      length: 94,
      breadth: 22,
      displacement: 2560,
      maxSpeed: 14,
      horsepower: 3600,
      yearBuilt: 1982,
      propulsionType: 'Diesel',
    },
  },
  {
    vesselId: 20,
    mmsi: '366709970',
    name: 'M/V Tillikum',
    vesselClass: 'evergreen_state',
    classDisplayName: 'Evergreen State',
    route: 'Fauntleroy - Vashon - Southworth',
    captain: 'Capt. Maria Gonzalez',
    crewCount: 12,
    passengerCapacity: 1090,
    vehicleCapacity: 87,
    specs: {
      length: 94,
      breadth: 22,
      displacement: 2560,
      maxSpeed: 14,
      horsepower: 3600,
      yearBuilt: 1959,
      yearRebuilt: 1994,
      propulsionType: 'Diesel',
    },
  },
]

export function getWSDOTVesselColor(vesselClass: WSDOTVessel['vesselClass']): string {
  const colors: Record<WSDOTVessel['vesselClass'], string> = {
    jumbo_mark_ii: '#3b82f6',
    jumbo: '#6366f1',
    super: '#10b981',
    issaquah_130: '#f97316',
    olympic: '#06b6d4',
    evergreen_state: '#a855f7',
  }
  return colors[vesselClass] || '#9ca3af'
}

export function getWSDOTVesselClassName(vesselClass: WSDOTVessel['vesselClass']): string {
  const names: Record<WSDOTVessel['vesselClass'], string> = {
    jumbo_mark_ii: 'Jumbo Mark II',
    jumbo: 'Jumbo',
    super: 'Super',
    issaquah_130: 'Issaquah 130',
    olympic: 'Olympic (Kwa-di Tabil)',
    evergreen_state: 'Evergreen State',
  }
  return names[vesselClass] || vesselClass
}

export function getWSDOTVesselByMMSI(mmsi: string): WSDOTVessel | undefined {
  return WSDOT_FLEET.find(v => v.mmsi === mmsi)
}

export function getWSDOTVesselById(vesselId: number): WSDOTVessel | undefined {
  return WSDOT_FLEET.find(v => v.vesselId === vesselId)
}

export function getWSDOTFleetMMSIs(): string[] {
  return WSDOT_FLEET.map(v => v.mmsi)
}

export function getWSDOTActiveRoutes(): { route: string; vessels: WSDOTVessel[] }[] {
  const routeMap = new Map<string, WSDOTVessel[]>()

  WSDOT_FLEET.forEach(vessel => {
    if (vessel.route) {
      const existing = routeMap.get(vessel.route) || []
      existing.push(vessel)
      routeMap.set(vessel.route, existing)
    }
  })

  return Array.from(routeMap.entries())
    .map(([route, vessels]) => ({ route, vessels }))
    .sort((a, b) => b.vessels.length - a.vessels.length)
}

