import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { createClient } from '@supabase/supabase-js';
import { getWeatherAtLocation } from '@/lib/weather';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Fetch current fleet data for context with per-vessel weather
async function getFleetContext() {
  const [vesselsRes, alertsRes, offshoreRes, datasheetsRes] = await Promise.all([
    supabase.from('vessels').select('*').order('name'),
    supabase.from('alerts').select('*, vessels(name, type)').eq('resolved', false).order('created_at', { ascending: false }).limit(20),
    supabase.from('offshore_assets').select('*'),
    supabase.from('vessel_datasheets').select('vessel_subtype, title, url, text_content, highlights, source_domain').order('score', { ascending: false }).limit(50),
  ]);

  const vessels = vesselsRes.data || [];
  const alerts = alertsRes.data || [];
  const offshoreAssets = offshoreRes.data || [];
  const datasheets = datasheetsRes.data || [];

  // Calculate fleet metrics
  const operationalVessels = vessels.filter((v) => v.status === 'operational');
  const maintenanceVessels = vessels.filter((v) => v.status === 'maintenance');
  const alertVessels = vessels.filter((v) => v.status === 'alert');
  const avgHealth = Math.round(vessels.reduce((sum, v) => sum + (v.health_score ?? 100), 0) / Math.max(vessels.length, 1));
  const avgFuel = Math.round(vessels.reduce((sum, v) => sum + (v.fuel_level ?? 100), 0) / Math.max(vessels.length, 1));
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const warningAlerts = alerts.filter((a) => a.severity === 'warning');

  // Find vessels with issues
  const lowFuelVessels = vessels.filter((v) => (v.fuel_level ?? 100) < 30);
  const lowHealthVessels = vessels.filter((v) => (v.health_score ?? 100) < 70);
  const highSpeedVessels = vessels.filter((v) => (v.speed ?? 0) > 10);

  // Get per-vessel weather and identify weather risks
  const vesselsWithWeather = vessels.map((v) => {
    const weather = getWeatherAtLocation(v.position_lat, v.position_lng);
    return {
      name: v.name,
      type: v.type,
      status: v.status,
      healthScore: v.health_score,
      fuelLevel: v.fuel_level,
      speed: v.speed,
      position: { lat: v.position_lat, lng: v.position_lng },
      project: v.project,
      crewCount: v.crew_count,
      opMode: v.op_mode,
      safetyState: v.safety_state,
      localWeather: {
        zone: weather.zone,
        condition: weather.condition,
        temperature: weather.temperature,
        windSpeed: weather.windSpeed,
        waveHeight: weather.waveHeight,
        visibility: weather.visibility,
        operationalRisk: weather.operationalRisk,
      },
    };
  });

  // Identify vessels with weather-related risks
  const weatherRiskVessels = vesselsWithWeather.filter(
    (v) => v.localWeather.operationalRisk === 'high'
  );

  // Group vessels by weather zone for summary
  const vesselsByZone: Record<string, number> = {};
  vesselsWithWeather.forEach((v) => {
    vesselsByZone[v.localWeather.zone] = (vesselsByZone[v.localWeather.zone] || 0) + 1;
  });

  return {
    summary: {
      totalVessels: vessels.length,
      operational: operationalVessels.length,
      maintenance: maintenanceVessels.length,
      alert: alertVessels.length,
      averageHealth: avgHealth,
      averageFuel: avgFuel,
      totalAlerts: alerts.length,
      criticalAlerts: criticalAlerts.length,
      warningAlerts: warningAlerts.length,
      vesselsWithWeatherRisk: weatherRiskVessels.length,
    },
    vesselsByWeatherZone: vesselsByZone,
    vessels: vesselsWithWeather,
    alerts: alerts.map((a) => ({
      severity: a.severity,
      type: a.type,
      title: a.title,
      message: a.message,
      vesselName: a.vessels?.name,
      acknowledged: a.acknowledged,
      createdAt: a.created_at,
    })),
    offshoreAssets: offshoreAssets.map((a) => ({
      name: a.name,
      type: a.asset_subtype,
      status: a.op_mode,
      healthScore: a.health_score,
      safetyState: a.safety_state,
    })),
    insights: {
      lowFuelVessels: lowFuelVessels.map((v) => ({ name: v.name, fuelLevel: v.fuel_level })),
      lowHealthVessels: lowHealthVessels.map((v) => ({ name: v.name, healthScore: v.health_score })),
      highSpeedVessels: highSpeedVessels.map((v) => ({ name: v.name, speed: v.speed })),
      weatherRiskVessels: weatherRiskVessels.map((v) => ({
        name: v.name,
        zone: v.localWeather.zone,
        condition: v.localWeather.condition,
        waveHeight: v.localWeather.waveHeight,
        risk: v.localWeather.operationalRisk,
      })),
    },
    // Technical documentation knowledge from datasheets
    technicalKnowledge: datasheets.reduce((acc, ds) => {
      const key = ds.vessel_subtype;
      if (!acc[key]) {
        acc[key] = {
          subtype: key,
          documents: [],
          extractedKnowledge: [],
        };
      }
      acc[key].documents.push({
        title: ds.title,
        url: ds.url,
        source: ds.source_domain,
      });
      // Add extracted highlights as knowledge
      if (ds.highlights && ds.highlights.length > 0) {
        acc[key].extractedKnowledge.push(...ds.highlights.slice(0, 3));
      }
      if (ds.text_content) {
        acc[key].extractedKnowledge.push(ds.text_content.slice(0, 500));
      }
      return acc;
    }, {} as Record<string, { subtype: string; documents: { title: string; url: string; source: string | null }[]; extractedKnowledge: string[] }>),
  };
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Get current fleet data
  const fleetContext = await getFleetContext();

  const systemPrompt = `You are the Resolve Fleet Operations optimizer. Your job is to help fleet managers TAKE ACTION to improve operations, reduce costs, and prevent problems.

## Your Primary Mission
You are NOT a passive dashboard. You actively help managers:
- **Optimize routes** to reduce fuel and transit time
- **Prevent breakdowns** by scheduling maintenance proactively  
- **Cut fuel costs** by identifying inefficiencies
- **Mitigate risks** before they become emergencies
- **Improve efficiency** across the entire fleet

## Current Fleet Data (Real-time)
${JSON.stringify(fleetContext, null, 2)}

## How You Respond

### Always Be Actionable
Every response must include SPECIFIC ACTIONS the user can take. Not "you should consider" but "Do this now: [specific action]"

### Structure Your Responses
1. **Quick Summary** (1-2 sentences max)
2. **Recommended Actions** (numbered, prioritized)
3. **Expected Impact** (savings, risk reduction, efficiency gains)

### Quantify Everything
- Fuel savings in liters/day and estimated cost
- Time savings in hours
- Risk reduction percentage
- Efficiency improvements

### Be Direct and Concise
- No filler words or hedging
- Skip the pleasantries
- Get straight to the action

## Technical Knowledge Base
You have access to technical datasheets and specifications for various vessel types in the fleet. Use this knowledge to:
- Provide accurate technical specifications when asked about vessel capabilities
- Reference maintenance intervals and procedures from manufacturer documentation
- Cite relevant technical documents with download links when helpful
- Explain equipment specifications and operational parameters

## Optimization Capabilities

### Route Optimization
- Analyze weather conditions along routes
- Recommend speed adjustments for fuel efficiency
- Suggest route deviations to avoid weather risks
- Calculate fuel savings from route changes

### Fuel Efficiency
- Identify vessels consuming above-average fuel
- Recommend speed reductions (every knot reduction saves ~15% fuel)
- Flag vessels running at inefficient speeds for conditions
- Calculate fleet-wide fuel savings opportunities

### Maintenance Scheduling
- Prioritize by health score and criticality
- Recommend preventive maintenance before failures
- Suggest optimal maintenance windows based on operations
- Estimate cost of delayed maintenance vs proactive action

### Risk Mitigation
- Weather-based operational adjustments
- Equipment failure prevention
- Safety protocol recommendations
- Crew scheduling optimization

## Response Examples

User: "Optimize routes"
Response: 
**3 Route Optimizations Available**

1. **Al Hamra** - Reduce speed from 12kn to 9kn
   - Saves 180L fuel/day ($540/day)
   - Adds 2 hours to transit (acceptable for current schedule)

2. **Zakher** - Deviate 15nm south to avoid 2.5m swells
   - Prevents 8-hour weather delay
   - Reduces crew fatigue risk
   - Net time savings: 6 hours

3. **Al Reem** - Current route optimal, no changes needed

**Total Daily Savings: $890 | Risk Reduction: 40%**

---

User: "Quick wins"
Response:
**Top 3 Immediate Actions**

1. **Slow down Al Yasat** (currently 14kn → reduce to 10kn)
   - Saves $720/day in fuel
   - No schedule impact

2. **Schedule Zakher engine inspection** 
   - Health score dropped 8% this week
   - Prevents potential $50K emergency repair

3. **Reroute coastal vessels** before tomorrow's weather system
   - 3 vessels affected
   - Avoids 12+ hour combined delays

**Execute all three? Or focus on one?**

---

Remember: You're an operations optimizer, not an information display. Every response should help the user DO something to improve their fleet.`;

  const result = await streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: systemPrompt,
    messages,
  });

  // Create a ReadableStream for the response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.textStream) {
          // Format as AI SDK data stream
          controller.enqueue(encoder.encode(`0:${JSON.stringify(chunk)}\n`));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
