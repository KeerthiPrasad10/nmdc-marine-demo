import Exa from 'exa-js';
import { createClient } from '@supabase/supabase-js';
import { VESSEL_PROFILES } from '@/lib/vessel-profiles';

// Exa API for semantic search - only initialized if API key is available
const exaApiKey = process.env.EXA_API_KEY || '';
const exa = exaApiKey ? new Exa(exaApiKey) : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

interface DatasheetResult {
  vesselId: string;
  vesselName: string;
  vesselType: string;
  subtype: string;
  datasheets: {
    title: string;
    url: string;
    publishedDate?: string;
    author?: string;
    score: number;
    highlights?: string[];
    text?: string;
  }[];
  error?: string;
}

// Extract domain from URL
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

// Search for PDF datasheets for a specific vessel subtype
async function searchSubtypeDatasheets(vesselType: string, subtype: string): Promise<DatasheetResult> {
  // Return empty result if Exa API is not configured
  if (!exa) {
    return {
      vesselId: '',
      vesselName: '',
      vesselType: vesselType,
      subtype: subtype,
      datasheets: [],
      error: 'EXA_API_KEY not configured',
    };
  }

  try {
    const results = await exa.searchAndContents(
      `${subtype} technical specifications datasheet brochure PDF`,
      {
        type: 'auto',
        numResults: 10,
        highlights: true,
        text: { maxCharacters: 1000 },
      }
    );

    return {
      vesselId: '',
      vesselName: '',
      vesselType: vesselType,
      subtype: subtype,
      datasheets: results.results.map((r) => ({
        title: r.title || 'Untitled',
        url: r.url,
        publishedDate: r.publishedDate,
        author: r.author,
        score: r.score ?? 0,
        highlights: r.highlights,
        text: r.text,
      })),
    };
  } catch (error) {
    console.error(`Error searching datasheets for ${subtype}:`, error);
    return {
      vesselId: '',
      vesselName: '',
      vesselType: vesselType,
      subtype: subtype,
      datasheets: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get datasheets from database for a vessel
async function getDatasheetsFromDB(vesselId?: string, vesselType?: string, subtype?: string) {
  let query = supabase.from('vessel_datasheets').select('*');
  
  if (vesselId) {
    query = query.eq('vessel_id', vesselId);
  }
  if (vesselType) {
    query = query.eq('vessel_type', vesselType);
  }
  if (subtype) {
    query = query.eq('vessel_subtype', subtype);
  }
  
  const { data, error } = await query.order('score', { ascending: false });
  
  if (error) {
    console.error('Error fetching datasheets from DB:', error);
    return [];
  }
  
  return data || [];
}

// GET: Fetch datasheets from database
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vesselId = searchParams.get('vesselId');
  const vesselType = searchParams.get('type');
  const subtype = searchParams.get('subtype');
  const fromDb = searchParams.get('source') !== 'exa'; // Default to DB

  try {
    // If fetching from database (default)
    if (fromDb) {
      const datasheets = await getDatasheetsFromDB(vesselId || undefined, vesselType || undefined, subtype || undefined);
      
      // Group by vessel type and subtype
      const grouped: Record<string, typeof datasheets> = {};
      datasheets.forEach(ds => {
        const key = ds.vessel_subtype;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(ds);
      });

      return Response.json({
        source: 'database',
        count: datasheets.length,
        datasheets,
        groupedBySubtype: grouped,
      });
    }

    // If fetching fresh from Exa
    if (vesselId) {
      const vessel = VESSEL_PROFILES[vesselId];
      if (!vessel) {
        return Response.json({ error: 'Vessel not found' }, { status: 404 });
      }
      const result = await searchSubtypeDatasheets(vessel.type, vessel.subtype);
      return Response.json({ source: 'exa', ...result });
    }

    if (vesselType) {
      const vessels = Object.values(VESSEL_PROFILES).filter(v => v.type === vesselType);
      const subtypes = [...new Set(vessels.map(v => v.subtype))];
      
      const results = await Promise.all(
        subtypes.map(st => searchSubtypeDatasheets(vesselType, st))
      );

      return Response.json({
        source: 'exa',
        type: vesselType,
        vesselCount: vessels.length,
        datasheetsBySubtype: results,
      });
    }

    // Default: Get all subtypes
    const subtypes = [...new Set(Object.values(VESSEL_PROFILES).map(v => v.subtype))];
    const batchSize = 3;
    const allResults: DatasheetResult[] = [];
    
    for (let i = 0; i < subtypes.length; i += batchSize) {
      const batch = subtypes.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(st => {
          const vessel = Object.values(VESSEL_PROFILES).find(v => v.subtype === st);
          return searchSubtypeDatasheets(vessel?.type || 'unknown', st);
        })
      );
      allResults.push(...batchResults);
    }

    return Response.json({
      source: 'exa',
      summary: {
        totalVessels: Object.keys(VESSEL_PROFILES).length,
        subtypes,
      },
      datasheetsBySubtype: allResults,
    });
  } catch (error) {
    console.error('Error fetching datasheets:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch datasheets' },
      { status: 500 }
    );
  }
}

// POST: Seed datasheets from Exa into database
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (action !== 'seed') {
    return Response.json({ error: 'Invalid action. Use ?action=seed' }, { status: 400 });
  }

  try {
    // Get all vessels from database
    const { data: vessels, error: vesselsError } = await supabase
      .from('vessels')
      .select('id, name, type, asset_subtype');

    if (vesselsError) {
      throw new Error(`Failed to fetch vessels: ${vesselsError.message}`);
    }

    // Get unique subtypes from vessel profiles
    const subtypes = [...new Set(Object.values(VESSEL_PROFILES).map(v => v.subtype))];
    
    // Fetch datasheets for each subtype
    const allDatasheets: Array<{
      vessel_id: string | null;
      vessel_type: string;
      vessel_subtype: string;
      title: string;
      url: string;
      published_date: string | null;
      author: string | null;
      score: number;
      highlights: string[];
      text_content: string | null;
      source_domain: string;
      document_type: string;
      is_primary: boolean;
    }> = [];

    const batchSize = 3;
    for (let i = 0; i < subtypes.length; i += batchSize) {
      const batch = subtypes.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (subtype) => {
          const vessel = Object.values(VESSEL_PROFILES).find(v => v.subtype === subtype);
          if (!vessel) return [];
          
          const result = await searchSubtypeDatasheets(vessel.type, subtype);
          
          // Find matching database vessels for this subtype
          const matchingVessels = vessels?.filter(v => {
            // Match by vessel type or name patterns
            const profileMatch = Object.values(VESSEL_PROFILES).find(
              p => p.subtype === subtype && 
              (v.name.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]) || 
               p.name.toLowerCase().includes(v.name.toLowerCase().split(' ')[0]))
            );
            return profileMatch !== undefined;
          }) || [];
          
          // Create datasheet records
          return result.datasheets.map((ds, idx) => ({
            vessel_id: matchingVessels.length > 0 ? matchingVessels[0].id : null,
            vessel_type: vessel.type,
            vessel_subtype: subtype,
            title: ds.title,
            url: ds.url,
            published_date: ds.publishedDate || null,
            author: ds.author || null,
            score: ds.score,
            highlights: ds.highlights || [],
            text_content: ds.text || null,
            source_domain: extractDomain(ds.url),
            document_type: ds.url.toLowerCase().includes('.pdf') ? 'pdf' : 'webpage',
            is_primary: idx === 0, // First result is primary
          }));
        })
      );
      
      allDatasheets.push(...batchResults.flat());
    }

    // Clear existing datasheets and insert new ones
    const { error: deleteError } = await supabase
      .from('vessel_datasheets')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('Error clearing existing datasheets:', deleteError);
    }

    // Insert in batches
    const insertBatchSize = 50;
    let insertedCount = 0;
    
    for (let i = 0; i < allDatasheets.length; i += insertBatchSize) {
      const batch = allDatasheets.slice(i, i + insertBatchSize);
      const { error: insertError } = await supabase
        .from('vessel_datasheets')
        .insert(batch);
      
      if (insertError) {
        console.error('Error inserting datasheets batch:', insertError);
      } else {
        insertedCount += batch.length;
      }
    }

    return Response.json({
      success: true,
      message: `Seeded ${insertedCount} datasheets for ${subtypes.length} vessel subtypes`,
      subtypes,
      totalDatasheets: insertedCount,
    });
  } catch (error) {
    console.error('Error seeding datasheets:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to seed datasheets' },
      { status: 500 }
    );
  }
}
