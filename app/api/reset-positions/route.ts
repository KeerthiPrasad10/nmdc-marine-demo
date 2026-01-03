import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Known water locations in the Persian Gulf / UAE waters
const WATER_POSITIONS = [
  { lat: 24.45, lng: 54.37, name: 'Abu Dhabi Port' },
  { lat: 25.27, lng: 55.28, name: 'Dubai Maritime' },
  { lat: 25.02, lng: 55.03, name: 'Jebel Ali' },
  { lat: 25.13, lng: 56.35, name: 'Fujairah' },
  { lat: 25.15, lng: 52.87, name: 'Das Island' },
  { lat: 24.88, lng: 53.07, name: 'Zirku Island' },
  { lat: 24.23, lng: 53.35, name: 'Mubarraz Field' },
  { lat: 24.8, lng: 53.5, name: 'Offshore Field A' },
  { lat: 25.5, lng: 54.2, name: 'Offshore Field B' },
  { lat: 24.6, lng: 54.8, name: 'Offshore Field C' },
  { lat: 25.35, lng: 55.65, name: 'Sharjah Waters' },
  { lat: 24.75, lng: 54.55, name: 'Central Gulf' },
  { lat: 25.0, lng: 53.8, name: 'Western Field' },
  { lat: 24.95, lng: 55.15, name: 'Eastern Field' },
  { lat: 25.22, lng: 54.75, name: 'North Abu Dhabi' },
  { lat: 24.55, lng: 53.95, name: 'South Field' },
  { lat: 25.4, lng: 54.9, name: 'Ajman Waters' },
  { lat: 24.65, lng: 54.25, name: 'Abu Dhabi Offshore' },
  { lat: 25.08, lng: 55.35, name: 'Dubai Offshore' },
  { lat: 24.38, lng: 54.0, name: 'Southwest Field' },
];

function randomOffset() {
  return (Math.random() - 0.5) * 0.1; // Small random offset
}

export async function POST() {
  try {
    // Get all vessels
    const { data: vessels, error: fetchError } = await supabase
      .from('vessels')
      .select('id, name')
      .order('name');

    if (fetchError || !vessels) {
      throw new Error(`Failed to fetch vessels: ${fetchError?.message}`);
    }

    // Update each vessel with a water position
    const updates = vessels.map((vessel, index) => {
      const pos = WATER_POSITIONS[index % WATER_POSITIONS.length];
      return supabase
        .from('vessels')
        .update({
          position_lat: pos.lat + randomOffset(),
          position_lng: pos.lng + randomOffset(),
          heading: Math.random() * 360,
        })
        .eq('id', vessel.id);
    });

    await Promise.all(updates);

    return NextResponse.json({
      success: true,
      message: `Reset ${vessels.length} vessel positions to water coordinates`,
      vessels: vessels.length,
    });
  } catch (error) {
    console.error('Error resetting positions:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}

