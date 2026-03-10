import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

// Known water locations in Puget Sound / WSDOT ferry routes
const WATER_POSITIONS = [
  { lat: 47.6023, lng: -122.3393, name: 'Seattle - Colman Dock' },
  { lat: 47.6235, lng: -122.5105, name: 'Bainbridge Island' },
  { lat: 47.5130, lng: -122.4530, name: 'Vashon Island' },
  { lat: 47.3168, lng: -122.5116, name: 'Point Defiance' },
  { lat: 47.3600, lng: -122.5140, name: 'Tahlequah' },
  { lat: 47.8040, lng: -122.3840, name: 'Edmonds' },
  { lat: 47.8037, lng: -122.4460, name: 'Kingston' },
  { lat: 47.7626, lng: -122.5095, name: 'Indianola' },
  { lat: 48.5070, lng: -122.6120, name: 'Anacortes' },
  { lat: 48.5350, lng: -123.0140, name: 'San Juan Island' },
  { lat: 48.5960, lng: -123.1540, name: 'Sidney BC' },
  { lat: 47.5632, lng: -122.3842, name: 'West Seattle' },
  { lat: 48.1170, lng: -122.7600, name: 'Port Townsend' },
  { lat: 48.0350, lng: -122.7610, name: 'Coupeville' },
  { lat: 47.9535, lng: -122.3040, name: 'Mukilteo' },
  { lat: 47.9790, lng: -122.2245, name: 'South Whidbey' },
  { lat: 47.5260, lng: -122.6140, name: 'Southworth' },
  { lat: 47.5860, lng: -122.6110, name: 'Bremerton' },
  { lat: 48.4620, lng: -122.9420, name: 'Lopez Island' },
  { lat: 48.5540, lng: -122.8930, name: 'Orcas Island' },
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

