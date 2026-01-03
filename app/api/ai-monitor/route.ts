import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseKey);

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Types for AI insights
interface AIInsight {
  id: string;
  type: 'forecast' | 'alert' | 'recommendation' | 'anomaly';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  affectedAssets: string[];
  suggestedActions: string[];
  confidence: number;
  timeframe?: string;
  createdAt: string;
}

// Fetch comprehensive fleet data for analysis
async function getFleetDataForAnalysis() {
  const [vesselsRes, alertsRes, weatherRes, offshoreRes] = await Promise.all([
    supabase.from('vessels').select('*').order('name'),
    supabase.from('alerts').select('*, vessels(name, type)').eq('resolved', false).order('created_at', { ascending: false }),
    supabase.from('weather').select('*').limit(1).single(),
    supabase.from('offshore_assets').select('*'),
  ]);

  return {
    vessels: vesselsRes.data || [],
    alerts: alertsRes.data || [],
    weather: weatherRes.data,
    offshoreAssets: offshoreRes.data || [],
  };
}

// Analyze data and detect issues
function analyzeFleetData(data: Awaited<ReturnType<typeof getFleetDataForAnalysis>>) {
  const issues: {
    type: string;
    severity: 'info' | 'warning' | 'critical';
    assets: string[];
    details: Record<string, unknown>;
  }[] = [];

  const { vessels, alerts, weather, offshoreAssets } = data;

  // Fuel level analysis
  const criticalFuel = vessels.filter(v => (v.fuel_level ?? 100) < 20);
  const lowFuel = vessels.filter(v => (v.fuel_level ?? 100) >= 20 && (v.fuel_level ?? 100) < 40);
  
  if (criticalFuel.length > 0) {
    issues.push({
      type: 'CRITICAL_FUEL',
      severity: 'critical',
      assets: criticalFuel.map(v => v.name),
      details: { 
        vessels: criticalFuel.map(v => ({ name: v.name, fuel: v.fuel_level, speed: v.speed })),
        averageFuel: Math.round(criticalFuel.reduce((sum, v) => sum + (v.fuel_level ?? 0), 0) / criticalFuel.length)
      }
    });
  }

  if (lowFuel.length > 0) {
    issues.push({
      type: 'LOW_FUEL',
      severity: 'warning',
      assets: lowFuel.map(v => v.name),
      details: { 
        vessels: lowFuel.map(v => ({ name: v.name, fuel: v.fuel_level })),
        count: lowFuel.length
      }
    });
  }

  // Health score analysis
  const criticalHealth = vessels.filter(v => (v.health_score ?? 100) < 60);
  const degradingHealth = vessels.filter(v => (v.health_score ?? 100) >= 60 && (v.health_score ?? 100) < 75);

  if (criticalHealth.length > 0) {
    issues.push({
      type: 'CRITICAL_HEALTH',
      severity: 'critical',
      assets: criticalHealth.map(v => v.name),
      details: { 
        vessels: criticalHealth.map(v => ({ 
          name: v.name, 
          health: v.health_score,
          hullFouling: v.hull_fouling_idx,
          lubeOil: v.lube_oil_ferro_ppm,
          ropeHealth: v.rope_health_score
        }))
      }
    });
  }

  if (degradingHealth.length > 0) {
    issues.push({
      type: 'DEGRADING_HEALTH',
      severity: 'warning',
      assets: degradingHealth.map(v => v.name),
      details: { 
        vessels: degradingHealth.map(v => ({ name: v.name, health: v.health_score })),
        count: degradingHealth.length
      }
    });
  }

  // Equipment analysis - Hull fouling
  const highFouling = vessels.filter(v => (v.hull_fouling_idx ?? 0) > 5);
  if (highFouling.length > 0) {
    issues.push({
      type: 'HIGH_HULL_FOULING',
      severity: 'warning',
      assets: highFouling.map(v => v.name),
      details: { 
        vessels: highFouling.map(v => ({ 
          name: v.name, 
          foulingIndex: v.hull_fouling_idx,
          estimatedFuelPenalty: `+${Math.round((v.hull_fouling_idx ?? 0) * 3)}%`
        }))
      }
    });
  }

  // Equipment analysis - Lube oil contamination
  const highLubeOil = vessels.filter(v => (v.lube_oil_ferro_ppm ?? 0) > 60);
  if (highLubeOil.length > 0) {
    issues.push({
      type: 'LUBE_OIL_CONTAMINATION',
      severity: highLubeOil.some(v => (v.lube_oil_ferro_ppm ?? 0) > 80) ? 'critical' : 'warning',
      assets: highLubeOil.map(v => v.name),
      details: { 
        vessels: highLubeOil.map(v => ({ 
          name: v.name, 
          ferroPpm: v.lube_oil_ferro_ppm
        }))
      }
    });
  }

  // Rope health analysis
  const lowRopeHealth = vessels.filter(v => (v.rope_health_score ?? 100) < 70);
  if (lowRopeHealth.length > 0) {
    issues.push({
      type: 'LOW_ROPE_HEALTH',
      severity: lowRopeHealth.some(v => (v.rope_health_score ?? 100) < 60) ? 'critical' : 'warning',
      assets: lowRopeHealth.map(v => v.name),
      details: { 
        vessels: lowRopeHealth.map(v => ({ 
          name: v.name, 
          ropeHealth: v.rope_health_score
        }))
      }
    });
  }

  // Weather impact analysis
  if (weather) {
    if (weather.wave_height > 2.5 || weather.wind_speed > 25) {
      const affectedVessels = vessels.filter(v => v.op_mode === 'TRANSIT' || v.op_mode === 'WORK');
      if (affectedVessels.length > 0) {
        issues.push({
          type: 'WEATHER_RISK',
          severity: weather.wave_height > 3 || weather.wind_speed > 35 ? 'critical' : 'warning',
          assets: affectedVessels.map(v => v.name),
          details: { 
            waveHeight: weather.wave_height,
            windSpeed: weather.wind_speed,
            condition: weather.condition,
            activeVessels: affectedVessels.length
          }
        });
      }
    }

    if (weather.visibility < 2) {
      issues.push({
        type: 'LOW_VISIBILITY',
        severity: weather.visibility < 1 ? 'critical' : 'warning',
        assets: vessels.filter(v => v.op_mode === 'TRANSIT').map(v => v.name),
        details: { visibility: weather.visibility }
      });
    }
  }

  // Offshore asset analysis
  const criticalAssets = offshoreAssets.filter(a => (a.health_score ?? 100) < 70 || a.safety_state === 'RED');
  if (criticalAssets.length > 0) {
    issues.push({
      type: 'OFFSHORE_ASSET_CRITICAL',
      severity: 'critical',
      assets: criticalAssets.map(a => a.name),
      details: { 
        assets: criticalAssets.map(a => ({ 
          name: a.name, 
          type: a.asset_subtype,
          health: a.health_score,
          safetyState: a.safety_state
        }))
      }
    });
  }

  // Unacknowledged critical alerts
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged);
  if (criticalAlerts.length > 0) {
    issues.push({
      type: 'UNACKNOWLEDGED_CRITICAL_ALERTS',
      severity: 'critical',
      assets: criticalAlerts.map(a => a.vessels?.name || 'Unknown'),
      details: { 
        alerts: criticalAlerts.map(a => ({
          title: a.title,
          vessel: a.vessels?.name,
          type: a.type,
          age: Math.round((Date.now() - new Date(a.created_at).getTime()) / 60000) + ' minutes'
        })),
        count: criticalAlerts.length
      }
    });
  }

  // Fleet-wide statistics for trending
  const avgFuel = Math.round(vessels.reduce((sum, v) => sum + (v.fuel_level ?? 100), 0) / vessels.length);
  const avgHealth = Math.round(vessels.reduce((sum, v) => sum + (v.health_score ?? 100), 0) / vessels.length);
  const operationalCount = vessels.filter(v => v.status === 'operational').length;

  return {
    issues,
    stats: {
      totalVessels: vessels.length,
      operationalVessels: operationalCount,
      averageFuel: avgFuel,
      averageHealth: avgHealth,
      activeAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
    }
  };
}

export async function GET() {
  try {
    const fleetData = await getFleetDataForAnalysis();
    const analysis = analyzeFleetData(fleetData);

    // If no significant issues, return early with just stats
    if (analysis.issues.length === 0) {
      return Response.json({
        success: true,
        insights: [],
        stats: analysis.stats,
        message: 'Fleet operating normally - no issues detected'
      });
    }

    // Use AI to generate insights from the detected issues
    const issuesContext = JSON.stringify(analysis.issues, null, 2);
    const statsContext = JSON.stringify(analysis.stats, null, 2);

    const prompt = `You are an AI fleet monitoring system for NMDC Marine Operations. Analyze the following detected issues and generate actionable insights.

## Detected Issues:
${issuesContext}

## Fleet Statistics:
${statsContext}

Generate a JSON array of insights. Each insight should have:
- id: unique string (use format "insight-{timestamp}-{index}")
- type: "forecast" | "alert" | "recommendation" | "anomaly"
- severity: "info" | "warning" | "critical"
- title: short, actionable title (max 60 chars)
- description: detailed explanation (2-3 sentences)
- affectedAssets: array of vessel/asset names
- suggestedActions: array of 2-4 specific actions to take
- confidence: number 0.7-0.99
- timeframe: optional, e.g. "next 4 hours", "within 24 hours"

Rules:
1. Prioritize safety-critical issues first
2. Group related issues when appropriate
3. Be specific with vessel names and numbers
4. Suggest concrete, actionable mitigations
5. Include fuel consumption forecasts when relevant
6. Consider weather impact on operations
7. Return ONLY valid JSON array, no other text

Generate 3-6 insights based on severity and importance.`;

    const result = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      prompt,
    });

    // Parse the AI response
    let insights: AIInsight[] = [];
    try {
      // Extract JSON from the response
      const jsonMatch = result.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
        // Add timestamps
        insights = insights.map((insight, index) => ({
          ...insight,
          id: `insight-${Date.now()}-${index}`,
          createdAt: new Date().toISOString(),
        }));
      }
    } catch (parseError) {
      console.error('Failed to parse AI insights:', parseError);
      // Generate fallback insights from detected issues
      insights = analysis.issues.slice(0, 5).map((issue, index) => ({
        id: `insight-${Date.now()}-${index}`,
        type: 'alert' as const,
        severity: issue.severity,
        title: formatIssueTitle(issue.type),
        description: `Detected ${issue.type.toLowerCase().replace(/_/g, ' ')} affecting ${issue.assets.length} asset(s).`,
        affectedAssets: issue.assets,
        suggestedActions: ['Review affected assets', 'Schedule maintenance if needed'],
        confidence: 0.85,
        createdAt: new Date().toISOString(),
      }));
    }

    return Response.json({
      success: true,
      insights,
      stats: analysis.stats,
      issueCount: analysis.issues.length,
    });
  } catch (error) {
    console.error('AI Monitor error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to generate AI insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function formatIssueTitle(issueType: string): string {
  const titles: Record<string, string> = {
    CRITICAL_FUEL: 'Critical Fuel Level Alert',
    LOW_FUEL: 'Low Fuel Warning',
    CRITICAL_HEALTH: 'Critical Equipment Health',
    DEGRADING_HEALTH: 'Equipment Health Degradation',
    HIGH_HULL_FOULING: 'Hull Fouling Detected',
    LUBE_OIL_CONTAMINATION: 'Lube Oil Contamination',
    LOW_ROPE_HEALTH: 'Rope Wear Detected',
    WEATHER_RISK: 'Adverse Weather Conditions',
    LOW_VISIBILITY: 'Low Visibility Warning',
    OFFSHORE_ASSET_CRITICAL: 'Offshore Asset Critical',
    UNACKNOWLEDGED_CRITICAL_ALERTS: 'Unacknowledged Alerts',
  };
  return titles[issueType] || issueType.replace(/_/g, ' ');
}

