#!/usr/bin/env npx ts-node
/**
 * Script to verify legacy marine energy vessel specs from Datalastic API
 * 
 * Run: npx ts-node scripts/verify-nmdc-energy-fleet.ts
 * 
 * Requires DATALASTIC_API_KEY in .env
 */

import 'dotenv/config';

const DATALASTIC_API_BASE = 'https://api.datalastic.com/api/v0';
const API_KEY = process.env.DATALASTIC_API_KEY;

// Legacy marine energy vessels with known/estimated MMSIs
const LEGACY_ENERGY_VESSELS = [
  { name: 'PLB-648', mmsi: '470285000', imo: '8758055' },
  { name: 'DLB-750', mmsi: '470339000', imo: '8758108' },
  { name: 'DLB-1000', mmsi: '470340000' },  // Estimated
  { name: 'DELMA 2000', mmsi: '471026000', imo: '9429455' },
  { name: 'DLS-4200', mmsi: '471026001', imo: '9429456' },  // Estimated - need to find
  { name: 'UMM SHAIF', mmsi: '470771497', imo: '8771497' },
  { name: 'SAADIYAT', mmsi: '470337000', imo: '9577513' },
  { name: 'YAS', mmsi: '470338000' },  // Estimated - sister vessel
  { name: 'SEP-450', mmsi: '470450000' },  // Estimated
  { name: 'SEP-550', mmsi: '470550000' },  // Estimated
  { name: 'SEP-750', mmsi: '470750000' },  // Estimated
];

interface DatalasticVesselInfo {
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
  year_built?: number;
  average_speed?: number;
  max_speed?: number;
  engine_power?: string;
}

async function fetchVesselInfo(identifier: { mmsi?: string; imo?: string; name?: string }): Promise<DatalasticVesselInfo | null> {
  const url = new URL(`${DATALASTIC_API_BASE}/vessel_info`);
  url.searchParams.set('api-key', API_KEY!);
  
  if (identifier.mmsi) url.searchParams.set('mmsi', identifier.mmsi);
  if (identifier.imo) url.searchParams.set('imo', identifier.imo);
  if (identifier.name) url.searchParams.set('name', identifier.name);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      const text = await response.text();
      console.log(`  ❌ API error: ${response.status} - ${text.slice(0, 100)}`);
      return null;
    }
    const data = await response.json();
    return data.data;
  } catch (e) {
    console.log(`  ❌ Fetch error: ${e}`);
    return null;
  }
}

async function searchVesselByName(name: string): Promise<any[]> {
  const url = new URL(`${DATALASTIC_API_BASE}/vessel_find`);
  url.searchParams.set('api-key', API_KEY!);
  url.searchParams.set('name', name);
  url.searchParams.set('limit', '5');

  try {
    const response = await fetch(url.toString());
    if (!response.ok) return [];
    const data = await response.json();
    return data.data || [];
  } catch {
    return [];
  }
}

async function main() {
  if (!API_KEY) {
    console.error('❌ DATALASTIC_API_KEY not set in .env');
    process.exit(1);
  }

  console.log('🚢 Verifying Legacy Marine Energy Fleet from Datalastic API\n');
  console.log('=' .repeat(80));

  const results: { name: string; found: boolean; data?: DatalasticVesselInfo; searchResults?: any[] }[] = [];

  for (const vessel of LEGACY_ENERGY_VESSELS) {
    console.log(`\n📍 ${vessel.name}`);
    console.log(`   MMSI: ${vessel.mmsi} | IMO: ${vessel.imo || 'N/A'}`);
    
    // Try by IMO first (more reliable)
    let info = vessel.imo ? await fetchVesselInfo({ imo: vessel.imo }) : null;
    
    // Then try by MMSI
    if (!info) {
      info = await fetchVesselInfo({ mmsi: vessel.mmsi });
    }
    
    if (info) {
      console.log(`   ✅ FOUND: ${info.name}`);
      console.log(`   📏 Length: ${info.length}m | Width: ${info.width}m | Draught: ${info.draught}m`);
      console.log(`   🏗️ Year Built: ${info.year_built} | Flag: ${info.country_iso}`);
      console.log(`   🚢 Type: ${info.ship_type} | Sub-type: ${info.ship_sub_type || 'N/A'}`);
      console.log(`   ⚓ GRT: ${info.grt} | DWT: ${info.dwt}`);
      results.push({ name: vessel.name, found: true, data: info });
    } else {
      console.log(`   ⚠️ Not found by MMSI/IMO. Searching by name...`);
      const searchResults = await searchVesselByName(vessel.name);
      if (searchResults.length > 0) {
        console.log(`   🔍 Found ${searchResults.length} results:`);
        searchResults.forEach((r, i) => {
          console.log(`      ${i + 1}. ${r.name} (MMSI: ${r.mmsi}, IMO: ${r.imo || 'N/A'})`);
        });
        results.push({ name: vessel.name, found: false, searchResults });
      } else {
        console.log(`   ❌ No results found`);
        results.push({ name: vessel.name, found: false });
      }
    }
    
    // Rate limiting - wait 500ms between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '=' .repeat(80));
  console.log('\n📊 SUMMARY\n');
  
  const found = results.filter(r => r.found);
  const notFound = results.filter(r => !r.found);
  
  console.log(`✅ Found: ${found.length}/${results.length} vessels`);
  console.log(`❌ Not found: ${notFound.length}/${results.length} vessels`);
  
  if (found.length > 0) {
    console.log('\n📋 Verified Vessel Data (for fleet.ts update):\n');
    found.forEach(r => {
      const d = r.data!;
      console.log(`// ${r.name}`);
      console.log(`{`);
      console.log(`  mmsi: '${d.mmsi}',`);
      if (d.imo) console.log(`  imo: '${d.imo}',`);
      console.log(`  name: '${d.name}',`);
      console.log(`  specs: {`);
      if (d.length) console.log(`    length: ${d.length},`);
      if (d.width) console.log(`    breadth: ${d.width},`);
      if (d.draught) console.log(`    depth: ${d.draught},`);
      if (d.year_built) console.log(`    yearBuilt: ${d.year_built},`);
      console.log(`  },`);
      console.log(`},\n`);
    });
  }
  
  if (notFound.length > 0) {
    console.log('\n⚠️ Vessels needing manual lookup:');
    notFound.forEach(r => {
      console.log(`  - ${r.name}`);
      if (r.searchResults && r.searchResults.length > 0) {
        console.log(`    Possible matches: ${r.searchResults.map(s => s.mmsi).join(', ')}`);
      }
    });
  }
}

main().catch(console.error);















