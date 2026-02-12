export interface TransformerHealthRecord {
  assetTag: string
  timestamp: string
  h2: number
  ch4: number
  c2h2: number
  c2h4: number
  c2h6: number
  co: number
  co2: number
  o2: number
  n2: number
  tdcg: number
  moisture: number
  acidity: number
  dielectricStrength: number
  interfacialTension: number
  colorNumber: number
  powerFactor: number
  furan2FAL: number
  topOilTemp: number
  windingHotSpot: number
  ambientTemp: number
  loadPercent: number
  healthIndex: number
  condition: 'Good' | 'Fair' | 'Poor' | 'Very Poor' | 'End of Life'
  remainingLifeYears: number
}

function dgaCondition(hi: number): TransformerHealthRecord['condition'] {
  if (hi >= 85) return 'Good'
  if (hi >= 70) return 'Fair'
  if (hi >= 50) return 'Poor'
  if (hi >= 30) return 'Very Poor'
  return 'End of Life'
}

function remainingLife(hi: number, age: number): number {
  const baseLife = 50
  const usedFraction = age / baseLife
  const healthFactor = hi / 100
  return Math.max(0, Math.round((baseLife - age) * healthFactor))
}

export const TRANSFORMER_HEALTH_DATA: TransformerHealthRecord[] = [
  // BGE-TF-001 — Westport 230/115kV — 1974, health 38, CRITICAL
  { assetTag: 'BGE-TF-001', timestamp: '2025-06-15', h2: 420, ch4: 185, c2h2: 8, c2h4: 210, c2h6: 95, co: 850, co2: 8200, o2: 3200, n2: 52000, tdcg: 1768, moisture: 28, acidity: 0.22, dielectricStrength: 32, interfacialTension: 18, colorNumber: 6, powerFactor: 1.8, furan2FAL: 2.1, topOilTemp: 78, windingHotSpot: 98, ambientTemp: 28, loadPercent: 82, healthIndex: 42, condition: 'Very Poor', remainingLifeYears: 5 },
  { assetTag: 'BGE-TF-001', timestamp: '2025-09-20', h2: 480, ch4: 210, c2h2: 12, c2h4: 245, c2h6: 110, co: 920, co2: 8800, o2: 3100, n2: 51500, tdcg: 1977, moisture: 30, acidity: 0.24, dielectricStrength: 30, interfacialTension: 17, colorNumber: 6.5, powerFactor: 2.0, furan2FAL: 2.5, topOilTemp: 82, windingHotSpot: 102, ambientTemp: 32, loadPercent: 85, healthIndex: 38, condition: 'Very Poor', remainingLifeYears: 4 },
  { assetTag: 'BGE-TF-001', timestamp: '2025-12-20', h2: 550, ch4: 240, c2h2: 18, c2h4: 290, c2h6: 128, co: 1020, co2: 9500, o2: 2900, n2: 51000, tdcg: 2246, moisture: 32, acidity: 0.27, dielectricStrength: 28, interfacialTension: 16, colorNumber: 7, powerFactor: 2.3, furan2FAL: 2.8, topOilTemp: 85, windingHotSpot: 105, ambientTemp: 18, loadPercent: 80, healthIndex: 35, condition: 'Very Poor', remainingLifeYears: 3 },
  { assetTag: 'BGE-TF-001', timestamp: '2026-02-10', h2: 620, ch4: 268, c2h2: 24, c2h4: 330, c2h6: 142, co: 1100, co2: 10200, o2: 2800, n2: 50500, tdcg: 2484, moisture: 35, acidity: 0.30, dielectricStrength: 26, interfacialTension: 15, colorNumber: 7.5, powerFactor: 2.6, furan2FAL: 3.2, topOilTemp: 80, windingHotSpot: 100, ambientTemp: 8, loadPercent: 78, healthIndex: 32, condition: 'Very Poor', remainingLifeYears: 2 },

  // COMED-TF-001 — Crawford 345/138kV — 1978, health 52
  { assetTag: 'COMED-TF-001', timestamp: '2025-03-10', h2: 180, ch4: 85, c2h2: 1, c2h4: 65, c2h6: 42, co: 480, co2: 5200, o2: 8500, n2: 58000, tdcg: 853, moisture: 25, acidity: 0.14, dielectricStrength: 38, interfacialTension: 22, colorNumber: 4.5, powerFactor: 1.2, furan2FAL: 1.2, topOilTemp: 72, windingHotSpot: 92, ambientTemp: 12, loadPercent: 70, healthIndex: 58, condition: 'Poor', remainingLifeYears: 10 },
  { assetTag: 'COMED-TF-001', timestamp: '2025-06-18', h2: 195, ch4: 92, c2h2: 1, c2h4: 72, c2h6: 45, co: 510, co2: 5500, o2: 8200, n2: 57500, tdcg: 915, moisture: 27, acidity: 0.15, dielectricStrength: 37, interfacialTension: 21, colorNumber: 4.8, powerFactor: 1.3, furan2FAL: 1.4, topOilTemp: 78, windingHotSpot: 98, ambientTemp: 30, loadPercent: 78, healthIndex: 55, condition: 'Poor', remainingLifeYears: 9 },
  { assetTag: 'COMED-TF-001', timestamp: '2025-09-22', h2: 210, ch4: 100, c2h2: 2, c2h4: 80, c2h6: 48, co: 540, co2: 5800, o2: 8000, n2: 57000, tdcg: 980, moisture: 29, acidity: 0.16, dielectricStrength: 36, interfacialTension: 21, colorNumber: 5, powerFactor: 1.4, furan2FAL: 1.6, topOilTemp: 76, windingHotSpot: 96, ambientTemp: 24, loadPercent: 75, healthIndex: 53, condition: 'Poor', remainingLifeYears: 8 },
  { assetTag: 'COMED-TF-001', timestamp: '2026-01-15', h2: 228, ch4: 110, c2h2: 2, c2h4: 88, c2h6: 52, co: 575, co2: 6100, o2: 7800, n2: 56500, tdcg: 1055, moisture: 32, acidity: 0.17, dielectricStrength: 35, interfacialTension: 20, colorNumber: 5.2, powerFactor: 1.5, furan2FAL: 1.8, topOilTemp: 74, windingHotSpot: 94, ambientTemp: 5, loadPercent: 72, healthIndex: 52, condition: 'Poor', remainingLifeYears: 8 },

  // COMED-TF-004 — Electric Junction 345/138kV — 1985, health 44, IN ACTIVE FAILURE
  { assetTag: 'COMED-TF-004', timestamp: '2025-06-01', h2: 800, ch4: 120, c2h2: 45, c2h4: 150, c2h6: 35, co: 600, co2: 7000, o2: 2000, n2: 48000, tdcg: 1750, moisture: 38, acidity: 0.28, dielectricStrength: 28, interfacialTension: 16, colorNumber: 7, powerFactor: 2.5, furan2FAL: 3.5, topOilTemp: 88, windingHotSpot: 115, ambientTemp: 28, loadPercent: 68, healthIndex: 32, condition: 'Very Poor', remainingLifeYears: 1 },
  { assetTag: 'COMED-TF-004', timestamp: '2025-09-15', h2: 1200, ch4: 180, c2h2: 120, c2h4: 220, c2h6: 45, co: 720, co2: 7800, o2: 1800, n2: 47000, tdcg: 2485, moisture: 42, acidity: 0.32, dielectricStrength: 26, interfacialTension: 15, colorNumber: 7.5, powerFactor: 3.0, furan2FAL: 4.2, topOilTemp: 92, windingHotSpot: 120, ambientTemp: 25, loadPercent: 65, healthIndex: 25, condition: 'End of Life', remainingLifeYears: 0 },
  { assetTag: 'COMED-TF-004', timestamp: '2025-12-01', h2: 2400, ch4: 280, c2h2: 280, c2h4: 380, c2h6: 62, co: 880, co2: 8500, o2: 1500, n2: 46000, tdcg: 4280, moisture: 48, acidity: 0.35, dielectricStrength: 24, interfacialTension: 14, colorNumber: 8, powerFactor: 3.8, furan2FAL: 5.1, topOilTemp: 95, windingHotSpot: 128, ambientTemp: 10, loadPercent: 55, healthIndex: 18, condition: 'End of Life', remainingLifeYears: 0 },

  // PEPCO-TF-001 — Benning Road 230/69kV — 1981, health 48
  { assetTag: 'PEPCO-TF-001', timestamp: '2025-04-10', h2: 280, ch4: 130, c2h2: 3, c2h4: 120, c2h6: 65, co: 620, co2: 6500, o2: 5500, n2: 55000, tdcg: 1218, moisture: 26, acidity: 0.18, dielectricStrength: 34, interfacialTension: 20, colorNumber: 5.5, powerFactor: 1.6, furan2FAL: 2.4, topOilTemp: 76, windingHotSpot: 96, ambientTemp: 18, loadPercent: 72, healthIndex: 52, condition: 'Poor', remainingLifeYears: 7 },
  { assetTag: 'PEPCO-TF-001', timestamp: '2025-08-15', h2: 310, ch4: 145, c2h2: 4, c2h4: 138, c2h6: 72, co: 680, co2: 7000, o2: 5200, n2: 54500, tdcg: 1349, moisture: 28, acidity: 0.19, dielectricStrength: 33, interfacialTension: 19, colorNumber: 5.8, powerFactor: 1.7, furan2FAL: 2.7, topOilTemp: 82, windingHotSpot: 102, ambientTemp: 34, loadPercent: 80, healthIndex: 49, condition: 'Very Poor', remainingLifeYears: 6 },
  { assetTag: 'PEPCO-TF-001', timestamp: '2026-01-20', h2: 345, ch4: 160, c2h2: 5, c2h4: 155, c2h6: 80, co: 740, co2: 7500, o2: 5000, n2: 54000, tdcg: 1485, moisture: 30, acidity: 0.20, dielectricStrength: 32, interfacialTension: 18, colorNumber: 6, powerFactor: 1.8, furan2FAL: 3.0, topOilTemp: 78, windingHotSpot: 98, ambientTemp: 6, loadPercent: 74, healthIndex: 48, condition: 'Very Poor', remainingLifeYears: 5 },

  // PECO-TF-001 — Plymouth Meeting 230/69kV — 1988, health 61
  { assetTag: 'PECO-TF-001', timestamp: '2025-05-20', h2: 120, ch4: 55, c2h2: 0.5, c2h4: 65, c2h6: 28, co: 320, co2: 3800, o2: 12000, n2: 62000, tdcg: 588, moisture: 20, acidity: 0.10, dielectricStrength: 42, interfacialTension: 26, colorNumber: 3.5, powerFactor: 0.8, furan2FAL: 0.8, topOilTemp: 68, windingHotSpot: 88, ambientTemp: 22, loadPercent: 65, healthIndex: 66, condition: 'Fair', remainingLifeYears: 15 },
  { assetTag: 'PECO-TF-001', timestamp: '2025-09-10', h2: 135, ch4: 62, c2h2: 0.5, c2h4: 75, c2h6: 32, co: 350, co2: 4100, o2: 11500, n2: 61500, tdcg: 654, moisture: 22, acidity: 0.11, dielectricStrength: 41, interfacialTension: 25, colorNumber: 3.8, powerFactor: 0.9, furan2FAL: 0.9, topOilTemp: 74, windingHotSpot: 94, ambientTemp: 28, loadPercent: 71, healthIndex: 63, condition: 'Fair', remainingLifeYears: 14 },
  { assetTag: 'PECO-TF-001', timestamp: '2026-01-25', h2: 148, ch4: 68, c2h2: 1, c2h4: 85, c2h6: 36, co: 380, co2: 4400, o2: 11000, n2: 61000, tdcg: 717, moisture: 25, acidity: 0.12, dielectricStrength: 40, interfacialTension: 24, colorNumber: 4, powerFactor: 1.0, furan2FAL: 1.1, topOilTemp: 70, windingHotSpot: 90, ambientTemp: 4, loadPercent: 68, healthIndex: 61, condition: 'Fair', remainingLifeYears: 13 },

  // ACE-TF-001 — Cardiff 230/69kV — 1986, health 58
  { assetTag: 'ACE-TF-001', timestamp: '2025-04-18', h2: 160, ch4: 72, c2h2: 1, c2h4: 55, c2h6: 38, co: 420, co2: 4800, o2: 9000, n2: 59000, tdcg: 746, moisture: 22, acidity: 0.14, dielectricStrength: 40, interfacialTension: 24, colorNumber: 4, powerFactor: 1.0, furan2FAL: 1.0, topOilTemp: 70, windingHotSpot: 88, ambientTemp: 16, loadPercent: 62, healthIndex: 62, condition: 'Fair', remainingLifeYears: 12 },
  { assetTag: 'ACE-TF-001', timestamp: '2025-10-25', h2: 178, ch4: 80, c2h2: 1.5, c2h4: 62, c2h6: 42, co: 455, co2: 5100, o2: 8700, n2: 58500, tdcg: 818, moisture: 25, acidity: 0.16, dielectricStrength: 38, interfacialTension: 23, colorNumber: 4.5, powerFactor: 1.1, furan2FAL: 1.2, topOilTemp: 72, windingHotSpot: 90, ambientTemp: 14, loadPercent: 67, healthIndex: 59, condition: 'Poor', remainingLifeYears: 11 },
  { assetTag: 'ACE-TF-001', timestamp: '2026-02-05', h2: 192, ch4: 88, c2h2: 2, c2h4: 70, c2h6: 45, co: 480, co2: 5400, o2: 8400, n2: 58000, tdcg: 877, moisture: 28, acidity: 0.18, dielectricStrength: 37, interfacialTension: 22, colorNumber: 4.8, powerFactor: 1.2, furan2FAL: 1.4, topOilTemp: 68, windingHotSpot: 86, ambientTemp: 2, loadPercent: 64, healthIndex: 58, condition: 'Poor', remainingLifeYears: 10 },

  // Healthy transformers for comparison
  // COMED-TF-003 — Lombard 138/12.47kV — 2005, health 82
  { assetTag: 'COMED-TF-003', timestamp: '2026-01-10', h2: 25, ch4: 12, c2h2: 0, c2h4: 8, c2h6: 5, co: 120, co2: 1800, o2: 18000, n2: 68000, tdcg: 170, moisture: 8, acidity: 0.04, dielectricStrength: 58, interfacialTension: 35, colorNumber: 1.5, powerFactor: 0.3, furan2FAL: 0.1, topOilTemp: 58, windingHotSpot: 72, ambientTemp: 5, loadPercent: 55, healthIndex: 82, condition: 'Good', remainingLifeYears: 28 },

  // PEPCO-TF-002 — Takoma 69/13.8kV — 2012, health 91
  { assetTag: 'PEPCO-TF-002', timestamp: '2026-01-10', h2: 10, ch4: 5, c2h2: 0, c2h4: 3, c2h6: 2, co: 80, co2: 1200, o2: 20000, n2: 70000, tdcg: 100, moisture: 5, acidity: 0.02, dielectricStrength: 65, interfacialTension: 38, colorNumber: 0.5, powerFactor: 0.2, furan2FAL: 0, topOilTemp: 52, windingHotSpot: 65, ambientTemp: 5, loadPercent: 42, healthIndex: 91, condition: 'Good', remainingLifeYears: 35 },

  // ACE-TF-002 — Oyster Creek 69/13.2kV — 2015, health 92
  { assetTag: 'ACE-TF-002', timestamp: '2026-01-10', h2: 8, ch4: 4, c2h2: 0, c2h4: 2, c2h6: 1, co: 65, co2: 1000, o2: 21000, n2: 71000, tdcg: 80, moisture: 4, acidity: 0.02, dielectricStrength: 68, interfacialTension: 40, colorNumber: 0.5, powerFactor: 0.15, furan2FAL: 0, topOilTemp: 48, windingHotSpot: 60, ambientTemp: 5, loadPercent: 38, healthIndex: 92, condition: 'Good', remainingLifeYears: 38 },
]

export const IEEE_C57_104_LIMITS = {
  h2: { condition1: 100, condition2: 200, condition3: 500, condition4: 700 },
  ch4: { condition1: 75, condition2: 125, condition3: 200, condition4: 400 },
  c2h2: { condition1: 2, condition2: 10, condition3: 35, condition4: 50 },
  c2h4: { condition1: 50, condition2: 100, condition3: 200, condition4: 300 },
  c2h6: { condition1: 20, condition2: 50, condition3: 100, condition4: 150 },
  co: { condition1: 350, condition2: 700, condition3: 1000, condition4: 1400 },
  tdcg: { condition1: 720, condition2: 1920, condition3: 4630, condition4: 10000 },
}

export function getDGAConditionLevel(gas: keyof typeof IEEE_C57_104_LIMITS, value: number): 1 | 2 | 3 | 4 {
  const limits = IEEE_C57_104_LIMITS[gas]
  if (value <= limits.condition1) return 1
  if (value <= limits.condition2) return 2
  if (value <= limits.condition3) return 3
  return 4
}

export function getDuvalTriangleZone(ch4: number, c2h4: number, c2h2: number): string {
  const total = ch4 + c2h4 + c2h2
  if (total === 0) return 'Normal'
  const pCH4 = (ch4 / total) * 100
  const pC2H4 = (c2h4 / total) * 100
  const pC2H2 = (c2h2 / total) * 100

  if (pC2H2 > 29) return 'D1 - High Energy Discharge'
  if (pC2H2 > 13) return 'D2 - Low Energy Discharge'
  if (pC2H4 > 50 && pC2H2 < 4) return 'T3 - Thermal Fault >700°C'
  if (pC2H4 > 20 && pCH4 < 50) return 'T2 - Thermal Fault 300-700°C'
  if (pCH4 > 80) return 'PD - Partial Discharge'
  if (pCH4 > 50) return 'T1 - Thermal Fault <300°C'
  return 'DT - Mix of Thermal & Electrical'
}

export {
  KAGGLE_TRANSFORMER_DATA,
  getKaggleHistoryForAsset,
  getKaggleLatestReading,
  getAllKaggleLatestReadings,
  type KaggleTransformerRecord,
} from './kaggle-transformer-health'

export function getHistoryForAsset(assetTag: string): TransformerHealthRecord[] {
  return TRANSFORMER_HEALTH_DATA.filter(r => r.assetTag === assetTag).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
}

export function getLatestReading(assetTag: string): TransformerHealthRecord | null {
  const records = getHistoryForAsset(assetTag)
  return records.length > 0 ? records[records.length - 1] : null
}

export function getAllLatestReadings(): TransformerHealthRecord[] {
  const latest = new Map<string, TransformerHealthRecord>()
  for (const record of TRANSFORMER_HEALTH_DATA) {
    const existing = latest.get(record.assetTag)
    if (!existing || new Date(record.timestamp) > new Date(existing.timestamp)) {
      latest.set(record.assetTag, record)
    }
  }
  return Array.from(latest.values())
}

