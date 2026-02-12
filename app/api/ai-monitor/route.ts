/**
 * Grid AI Monitor API
 * 
 * Analyzes grid asset health, DGA trends, weather impacts,
 * and generates AI-powered insights for the Exelon utility fleet.
 */

import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { EXELON_ASSETS } from '@/lib/exelon/fleet';
import { ASSET_ISSUES, getAssetIssueSummary } from '@/lib/asset-issues';
import { TRANSFORMER_HEALTH_DATA } from '@/lib/datasets/transformer-health';
import {
  getAssetSnapshots,
  getGridWeather,
  getPendingInsights,
} from '@/lib/simulation/grid-orchestrator';

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

// Gather grid data for analysis
function getGridDataForAnalysis() {
  const snapshots = getAssetSnapshots();
  const weather = getGridWeather();
  const simulationInsights = getPendingInsights();

  // Asset health analysis
  const criticalHealth = EXELON_ASSETS.filter(a => a.healthIndex < 40);
  const poorHealth = EXELON_ASSETS.filter(a => a.healthIndex >= 40 && a.healthIndex < 60);

  // DGA analysis
  const dgaAlerts: { name: string; tdcg: number; condition: string; h2: number; c2h2: number }[] = [];
  EXELON_ASSETS.forEach(asset => {
    const records = TRANSFORMER_HEALTH_DATA.filter(r => r.assetTag === asset.assetTag);
    const latest = records[records.length - 1];
    if (latest && latest.tdcg > 1000) {
      dgaAlerts.push({
        name: asset.name,
        tdcg: latest.tdcg,
        condition: latest.condition,
        h2: latest.h2,
        c2h2: latest.c2h2,
      });
    }
  });

  // Active issues — ASSET_ISSUES is a Record, so flatten all component issues
  const allComponentIssues = Object.values(ASSET_ISSUES).flatMap(a =>
    a.issues.map(i => ({ ...i, assetTag: a.assetTag, assetName: a.assetName, opCo: a.opCo }))
  );
  const criticalIssues = allComponentIssues.filter(i => i.status === 'critical');
  const highIssues = allComponentIssues.filter(i => i.status === 'warning');

  // Live data from simulation
  const overloadedAssets = snapshots.filter(s => s.loadPercent > 95);
  const thermalStress = snapshots.filter(s => s.hotSpotTemp > 100);

  return {
    issues: buildIssuesList(criticalHealth, poorHealth, dgaAlerts, criticalIssues, highIssues, overloadedAssets, thermalStress, weather),
    stats: {
      totalAssets: EXELON_ASSETS.length,
      criticalAssets: criticalHealth.length,
      poorHealthAssets: poorHealth.length,
      averageHealthIndex: Math.round(EXELON_ASSETS.reduce((s, a) => s + a.healthIndex, 0) / EXELON_ASSETS.length),
      activeIssues: allComponentIssues.length,
      dgaAlertsCount: dgaAlerts.length,
      overloadedCount: overloadedAssets.length,
      thermalStressCount: thermalStress.length,
    },
    simulationInsights,
  };
}

function buildIssuesList(
  criticalHealth: typeof EXELON_ASSETS,
  poorHealth: typeof EXELON_ASSETS,
  dgaAlerts: { name: string; tdcg: number; condition: string; h2: number; c2h2: number }[],
  criticalIssues: { componentName: string; category: string; issue: string; status: string; assetTag: string; assetName: string; opCo: string }[],
  highIssues: { componentName: string; category: string; issue: string; status: string; assetTag: string; assetName: string; opCo: string }[],
  overloadedAssets: { assetTag: string; name: string; loadPercent: number }[],
  thermalStress: { assetTag: string; name: string; hotSpotTemp: number }[],
  weather: ReturnType<typeof getGridWeather>
) {
  const issues: { type: string; severity: string; assets: string[]; details: Record<string, unknown> }[] = [];

  if (criticalHealth.length > 0) {
    issues.push({
      type: 'CRITICAL_HEALTH_INDEX',
      severity: 'critical',
      assets: criticalHealth.map(a => a.name),
      details: {
        assets: criticalHealth.map(a => ({ name: a.name, healthIndex: a.healthIndex, opCo: a.opCo, age: new Date().getFullYear() - a.yearInstalled })),
      },
    });
  }

  if (dgaAlerts.length > 0) {
    issues.push({
      type: 'DGA_GAS_TRENDING',
      severity: dgaAlerts.some(a => a.c2h2 > 10) ? 'critical' : 'warning',
      assets: dgaAlerts.map(a => a.name),
      details: {
        alerts: dgaAlerts.map(a => ({ name: a.name, tdcg: a.tdcg, h2: a.h2, c2h2: a.c2h2, condition: a.condition })),
      },
    });
  }

  if (overloadedAssets.length > 0) {
    issues.push({
      type: 'TRANSFORMER_OVERLOAD',
      severity: overloadedAssets.some(a => a.loadPercent > 110) ? 'critical' : 'warning',
      assets: overloadedAssets.map(a => a.name),
      details: {
        assets: overloadedAssets.map(a => ({ name: a.name, loadPercent: a.loadPercent })),
      },
    });
  }

  if (thermalStress.length > 0) {
    issues.push({
      type: 'THERMAL_STRESS',
      severity: thermalStress.some(a => a.hotSpotTemp > 110) ? 'critical' : 'warning',
      assets: thermalStress.map(a => a.name),
      details: {
        assets: thermalStress.map(a => ({ name: a.name, hotSpotTemp: a.hotSpotTemp })),
      },
    });
  }

  if (criticalIssues.length > 0) {
    issues.push({
      type: 'ACTIVE_CRITICAL_ISSUES',
      severity: 'critical',
      assets: criticalIssues.map(i => i.assetName),
      details: {
        issues: criticalIssues.map(i => ({
          componentName: i.componentName,
          category: i.category,
          issue: i.issue,
          assetTag: i.assetTag,
        })),
      },
    });
  }

  if (weather && weather.severity !== 'normal') {
    const zoneToOpCo: Record<string, string> = {
      'BGE Service Territory': 'BGE',
      'ComEd Chicago Metro': 'ComEd',
      'PECO Philadelphia': 'PECO',
      'Pepco DC Metro': 'Pepco',
      'ACE Atlantic Coast': 'ACE',
      'DPL Delaware Valley': 'DPL',
    };
    const affectedOpCo = zoneToOpCo[weather.zone];
    const weatherAffectedAssets = affectedOpCo
      ? EXELON_ASSETS.filter(a => a.opCo === affectedOpCo).map(a => a.name)
      : EXELON_ASSETS.slice(0, 5).map(a => a.name);

    issues.push({
      type: 'WEATHER_IMPACT',
      severity: weather.severity === 'severe' ? 'critical' : 'warning',
      assets: weatherAffectedAssets,
      details: {
        zone: weather.zone,
        condition: weather.condition,
        temperature: weather.temperature,
        windSpeed: weather.windSpeed,
        stormRisk: weather.stormRisk,
        affectedOpCo: affectedOpCo || 'multiple',
      },
    });
  }

  if (poorHealth.length > 0) {
    issues.push({
      type: 'POOR_HEALTH_INDEX',
      severity: 'warning',
      assets: poorHealth.map(a => a.name),
      details: {
        assets: poorHealth.map(a => ({ name: a.name, healthIndex: a.healthIndex, opCo: a.opCo })),
        count: poorHealth.length,
      },
    });
  }

  return issues;
}

export async function GET() {
  try {
    const analysis = getGridDataForAnalysis();

    // If simulation has insights, return those
    if (analysis.simulationInsights.length > 0) {
      return Response.json({
        success: true,
        insights: analysis.simulationInsights,
        stats: analysis.stats,
        source: 'simulation',
      });
    }

    // If no issues, return stats only
    if (analysis.issues.length === 0) {
      return Response.json({
        success: true,
        insights: [],
        stats: analysis.stats,
        message: 'Grid operating normally — no anomalies detected',
      });
    }

    // Use AI to generate insights from detected issues
    if (!process.env.ANTHROPIC_API_KEY) {
      // Generate fallback insights without AI
      const insights: AIInsight[] = analysis.issues.slice(0, 5).map((issue, index) => ({
        id: `insight-${Date.now()}-${index}`,
        type: 'alert' as const,
        severity: issue.severity as 'info' | 'warning' | 'critical',
        title: formatIssueTitle(issue.type),
        description: `Detected ${issue.type.toLowerCase().replace(/_/g, ' ')} affecting ${issue.assets.length} asset(s).`,
        affectedAssets: issue.assets,
        suggestedActions: ['Review affected assets', 'Schedule inspection if needed'],
        confidence: 0.85,
        createdAt: new Date().toISOString(),
      }));

      return Response.json({
        success: true,
        insights,
        stats: analysis.stats,
        source: 'rule-based',
      });
    }

    const issuesContext = JSON.stringify(analysis.issues, null, 2);
    const statsContext = JSON.stringify(analysis.stats, null, 2);

    const prompt = `You are an AI grid monitoring system for Exelon Utilities. Analyze the following detected issues across power transformers and substations and generate actionable insights.

## Detected Issues:
${issuesContext}

## Grid Statistics:
${statsContext}

Generate a JSON array of insights. Each insight should have:
- id: unique string (use format "insight-{timestamp}-{index}")
- type: "forecast" | "alert" | "recommendation" | "anomaly"
- severity: "info" | "warning" | "critical"
- title: short, actionable title (max 60 chars)
- description: detailed explanation (2-3 sentences). Reference IEEE C57.104 for DGA, IEEE C57.91 for loading, and Duval Triangle for fault classification.
- affectedAssets: array of transformer/substation names
- suggestedActions: array of 2-4 specific actions to take
- confidence: number 0.7-0.99
- timeframe: optional, e.g. "next 4 hours", "within 24 hours"

Rules:
1. Prioritize safety-critical issues first (overload, DGA trending with acetylene)
2. Reference industry standards: IEEE C57.104, IEEE C57.91, Duval Triangle
3. Be specific with asset names, DGA values, and temperatures
4. Suggest concrete actions: oil sampling, de-loading, cooling verification, mobile sub deployment
5. Consider weather impact on loading and thermal performance
6. Return ONLY valid JSON array, no other text

Generate 3-6 insights based on severity and importance.`;

    const result = await generateText({
      model: anthropic('claude-sonnet-4-20250514'),
      prompt,
    });

    let insights: AIInsight[] = [];
    try {
      const jsonMatch = result.text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
        insights = insights.map((insight, index) => ({
          ...insight,
          id: `insight-${Date.now()}-${index}`,
          createdAt: new Date().toISOString(),
        }));
      }
    } catch (parseError) {
      console.error('Failed to parse AI insights:', parseError);
      insights = analysis.issues.slice(0, 5).map((issue, index) => ({
        id: `insight-${Date.now()}-${index}`,
        type: 'alert' as const,
        severity: issue.severity as 'info' | 'warning' | 'critical',
        title: formatIssueTitle(issue.type),
        description: `Detected ${issue.type.toLowerCase().replace(/_/g, ' ')} affecting ${issue.assets.length} asset(s).`,
        affectedAssets: issue.assets,
        suggestedActions: ['Review affected assets', 'Schedule inspection if needed'],
        confidence: 0.85,
        createdAt: new Date().toISOString(),
      }));
    }

    return Response.json({
      success: true,
      insights,
      stats: analysis.stats,
      issueCount: analysis.issues.length,
      source: 'ai',
    });
  } catch (error) {
    console.error('Grid AI Monitor error:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to generate grid insights',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function formatIssueTitle(issueType: string): string {
  const titles: Record<string, string> = {
    CRITICAL_HEALTH_INDEX: 'Critical Health Index Alert',
    POOR_HEALTH_INDEX: 'Poor Health Index Warning',
    DGA_GAS_TRENDING: 'DGA Gas Trending Detected',
    TRANSFORMER_OVERLOAD: 'Transformer Overload Alert',
    THERMAL_STRESS: 'Thermal Stress Advisory',
    ACTIVE_CRITICAL_ISSUES: 'Active Critical Equipment Issues',
    WEATHER_IMPACT: 'Weather Impact on Grid Operations',
  };
  return titles[issueType] || issueType.replace(/_/g, ' ');
}
