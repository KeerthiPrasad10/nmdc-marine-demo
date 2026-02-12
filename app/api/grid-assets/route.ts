/**
 * Exelon Grid Assets API
 * 
 * Provides grid asset data, health metrics, and fleet statistics
 * for the Exelon service territory. Replaces the marine fleet API.
 * 
 * Endpoints:
 * - GET /api/grid-assets?action=fleet — All grid assets with metrics
 * - GET /api/grid-assets?action=asset&assetTag=XXX — Single asset detail
 * - GET /api/grid-assets?action=stats — Fleet-wide statistics
 * - GET /api/grid-assets?action=health — Health summary across territories
 */

import { NextRequest, NextResponse } from 'next/server';
import { EXELON_ASSETS, type ExelonAsset } from '@/lib/exelon/fleet';
import { ASSET_ISSUES, getAssetIssueSummary } from '@/lib/asset-issues';
import { TRANSFORMER_HEALTH_DATA, type TransformerHealthRecord } from '@/lib/datasets/transformer-health';
import {
  getAssetSnapshots,
  getGridWeather,
  getPendingInsights,
  getSimulationState,
} from '@/lib/simulation/grid-orchestrator';

export const dynamic = 'force-dynamic';

// ============================================================================
// Enriched Asset Type
// ============================================================================

interface EnrichedGridAsset extends ExelonAsset {
  latestDGA?: {
    h2: number;
    ch4: number;
    c2h2: number;
    c2h4: number;
    c2h6: number;
    co: number;
    co2: number;
    tdcg: number;
    moisture: number;
    healthIndex: number;
    condition: string;
  };
  issuesSummary: {
    total: number;
    worstPriority: string | null;
    hasCritical: boolean;
    hasHighPriority: boolean;
    customersAtRisk: number;
  };
  liveData?: {
    loadPercent: number;
    topOilTemp: number;
    hotSpotTemp: number;
    tdcg: number;
    moisture: number;
    status: string;
  };
}

// ============================================================================
// Helpers
// ============================================================================

function getLatestDGA(assetTag: string): TransformerHealthRecord | undefined {
  return TRANSFORMER_HEALTH_DATA.filter(r => r.assetTag === assetTag).pop();
}

function enrichAsset(asset: ExelonAsset): EnrichedGridAsset {
  const dga = getLatestDGA(asset.assetTag);
  const issues = getAssetIssueSummary(asset.assetTag);
  const snapshots = getAssetSnapshots();
  const liveSnapshot = snapshots.find(s => s.assetTag === asset.assetTag);

  return {
    ...asset,
    latestDGA: dga ? {
      h2: dga.h2,
      ch4: dga.ch4,
      c2h2: dga.c2h2,
      c2h4: dga.c2h4,
      c2h6: dga.c2h6,
      co: dga.co,
      co2: dga.co2,
      tdcg: dga.tdcg,
      moisture: dga.moisture,
      healthIndex: dga.healthIndex,
      condition: dga.condition,
    } : undefined,
    issuesSummary: {
      total: issues.issueCount,
      worstPriority: issues.worstPriority,
      hasCritical: issues.hasCritical,
      hasHighPriority: issues.hasHighPriority,
      customersAtRisk: issues.totalCustomersAtRisk,
    },
    liveData: liveSnapshot ? {
      loadPercent: liveSnapshot.loadPercent,
      topOilTemp: liveSnapshot.topOilTemp,
      hotSpotTemp: liveSnapshot.hotSpotTemp,
      tdcg: liveSnapshot.tdcg,
      moisture: liveSnapshot.moisture,
      status: liveSnapshot.status,
    } : undefined,
  };
}

// ============================================================================
// GET Handler
// ============================================================================

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action') || 'fleet';

  try {
    switch (action) {
      case 'fleet': {
        const enrichedAssets = EXELON_ASSETS.map(enrichAsset);

        // Sort: critical assets first, then by health index
        enrichedAssets.sort((a, b) => {
          if (a.issuesSummary.hasCritical !== b.issuesSummary.hasCritical) {
            return a.issuesSummary.hasCritical ? -1 : 1;
          }
          return a.healthIndex - b.healthIndex;
        });

        // Compute stats
        const criticalCount = enrichedAssets.filter(a => a.healthIndex < 40).length;
        const watchCount = enrichedAssets.filter(a => a.healthIndex >= 40 && a.healthIndex < 70).length;
        const healthyCount = enrichedAssets.filter(a => a.healthIndex >= 70).length;
        const avgHealth = Math.round(
          enrichedAssets.reduce((sum, a) => sum + a.healthIndex, 0) / enrichedAssets.length
        );
        const totalIssues = enrichedAssets.reduce((sum, a) => sum + a.issuesSummary.total, 0);

        // Group by OpCo
        const byOpCo: Record<string, number> = {};
        enrichedAssets.forEach(a => {
          byOpCo[a.opCo] = (byOpCo[a.opCo] || 0) + 1;
        });

        return NextResponse.json({
          success: true,
          assets: enrichedAssets,
          stats: {
            totalAssets: EXELON_ASSETS.length,
            criticalAssets: criticalCount,
            watchAssets: watchCount,
            healthyAssets: healthyCount,
            averageHealthIndex: avgHealth,
            totalActiveIssues: totalIssues,
            assetsByOpCo: byOpCo,
          },
          simulation: getSimulationState(),
          weather: getGridWeather(),
          meta: {
            source: 'local',
            fetchedAt: new Date().toISOString(),
          },
        });
      }

      case 'asset': {
        const assetTag = searchParams.get('assetTag');
        if (!assetTag) {
          return NextResponse.json(
            { success: false, error: 'Missing assetTag parameter' },
            { status: 400 }
          );
        }

        const asset = EXELON_ASSETS.find(a => a.assetTag === assetTag);
        if (!asset) {
          return NextResponse.json(
            { success: false, error: 'Asset not found' },
            { status: 404 }
          );
        }

        const enriched = enrichAsset(asset);
        const dgaHistory = TRANSFORMER_HEALTH_DATA.filter(r => r.assetTag === assetTag);
        const assetIssues = ASSET_ISSUES[assetTag] ?? null;

        return NextResponse.json({
          success: true,
          asset: enriched,
          dgaHistory,
          issues: assetIssues ? assetIssues.issues : [],
          insights: getPendingInsights().filter(
            ins => ins.affectedAssets.includes(asset.name)
          ),
        });
      }

      case 'stats': {
        const byOpCo: Record<string, { count: number; avgHealth: number; critical: number }> = {};
        EXELON_ASSETS.forEach(a => {
          if (!byOpCo[a.opCo]) {
            byOpCo[a.opCo] = { count: 0, avgHealth: 0, critical: 0 };
          }
          byOpCo[a.opCo].count++;
          byOpCo[a.opCo].avgHealth += a.healthIndex;
          if (a.healthIndex < 40) byOpCo[a.opCo].critical++;
        });
        Object.values(byOpCo).forEach(v => {
          v.avgHealth = Math.round(v.avgHealth / v.count);
        });

        const byType: Record<string, number> = {};
        EXELON_ASSETS.forEach(a => {
          byType[a.type] = (byType[a.type] || 0) + 1;
        });

        const avgHealth = Math.round(
          EXELON_ASSETS.reduce((sum, a) => sum + a.healthIndex, 0) / EXELON_ASSETS.length
        );

        return NextResponse.json({
          success: true,
          stats: {
            totalAssets: EXELON_ASSETS.length,
            averageHealthIndex: avgHealth,
            assetsByOpCo: byOpCo,
            assetsByType: byType,
            criticalAssets: EXELON_ASSETS.filter(a => a.healthIndex < 40).length,
            totalActiveIssues: Object.values(ASSET_ISSUES).reduce((sum, a) => sum + a.issues.length, 0),
          },
        });
      }

      case 'health': {
        // Health distribution summary
        const healthBuckets = {
          critical: EXELON_ASSETS.filter(a => a.healthIndex < 30).map(a => ({ name: a.name, health: a.healthIndex, opCo: a.opCo })),
          poor: EXELON_ASSETS.filter(a => a.healthIndex >= 30 && a.healthIndex < 50).map(a => ({ name: a.name, health: a.healthIndex, opCo: a.opCo })),
          fair: EXELON_ASSETS.filter(a => a.healthIndex >= 50 && a.healthIndex < 70).map(a => ({ name: a.name, health: a.healthIndex, opCo: a.opCo })),
          good: EXELON_ASSETS.filter(a => a.healthIndex >= 70 && a.healthIndex < 85).map(a => ({ name: a.name, health: a.healthIndex, opCo: a.opCo })),
          excellent: EXELON_ASSETS.filter(a => a.healthIndex >= 85).map(a => ({ name: a.name, health: a.healthIndex, opCo: a.opCo })),
        };

        return NextResponse.json({
          success: true,
          healthDistribution: healthBuckets,
          summary: {
            total: EXELON_ASSETS.length,
            critical: healthBuckets.critical.length,
            poor: healthBuckets.poor.length,
            fair: healthBuckets.fair.length,
            good: healthBuckets.good.length,
            excellent: healthBuckets.excellent.length,
          },
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Grid Assets API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'API error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

