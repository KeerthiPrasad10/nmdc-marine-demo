import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
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

// Fetch current grid data for context
function getGridContext() {
  const snapshots = getAssetSnapshots();
  const weather = getGridWeather();
  const insights = getPendingInsights();

  // Enrich assets with DGA and issues
  const assetsWithDetails = EXELON_ASSETS.map(asset => {
    const dgaRecords = TRANSFORMER_HEALTH_DATA.filter(r => r.assetTag === asset.assetTag);
    const latestDGA = dgaRecords[dgaRecords.length - 1];
    const issues = getAssetIssueSummary(asset.assetTag);
    const snapshot = snapshots.find(s => s.assetTag === asset.assetTag);

    return {
      name: asset.name,
      assetTag: asset.assetTag,
      type: asset.type,
      opCo: asset.opCo,
      substationName: asset.substationName,
      voltageClassKV: asset.voltageClassKV,
      ratedMVA: asset.ratedMVA,
      yearInstalled: asset.yearInstalled,
      healthIndex: asset.healthIndex,
      status: asset.status,
      age: new Date().getFullYear() - asset.yearInstalled,
      latestDGA: latestDGA ? {
        tdcg: latestDGA.tdcg,
        h2: latestDGA.h2,
        c2h2: latestDGA.c2h2,
        c2h4: latestDGA.c2h4,
        moisture: latestDGA.moisture,
        condition: latestDGA.condition,
        healthIndex: latestDGA.healthIndex,
      } : null,
      activeIssues: issues.issueCount,
      criticalIssues: issues.hasCritical ? 'yes' : 'no',
      liveLoad: snapshot?.loadPercent ?? null,
      liveTemp: snapshot?.hotSpotTemp ?? null,
    };
  });

  // Compute fleet stats
  const avgHealth = Math.round(EXELON_ASSETS.reduce((s, a) => s + a.healthIndex, 0) / EXELON_ASSETS.length);
  const criticalAssets = EXELON_ASSETS.filter(a => a.healthIndex < 40);
  const allIssues = Object.values(ASSET_ISSUES).flatMap(a => a.issues);
  const activeIssues = allIssues;

  // Group by OpCo
  const byOpCo: Record<string, { count: number; avgHealth: number }> = {};
  EXELON_ASSETS.forEach(a => {
    if (!byOpCo[a.opCo]) byOpCo[a.opCo] = { count: 0, avgHealth: 0 };
    byOpCo[a.opCo].count++;
    byOpCo[a.opCo].avgHealth += a.healthIndex;
  });
  Object.keys(byOpCo).forEach(k => {
    byOpCo[k].avgHealth = Math.round(byOpCo[k].avgHealth / byOpCo[k].count);
  });

  return {
    summary: {
      totalAssets: EXELON_ASSETS.length,
      averageHealthIndex: avgHealth,
      criticalAssets: criticalAssets.length,
      activeIssues: activeIssues.length,
      criticalIssues: activeIssues.filter(i => i.status === 'critical').length,
      assetsByOpCo: byOpCo,
    },
    assets: assetsWithDetails,
    weather,
    recentInsights: insights.slice(0, 5),
    topCriticalIssues: activeIssues
      .filter(i => i.status === 'critical')
      .slice(0, 5)
      .map(i => ({
        componentName: i.componentName,
        category: i.category,
        issue: i.issue,
        healthScore: i.healthScore,
        recommendedAction: i.pmPrediction.recommendedAction,
      })),
  };
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Get current grid data
  const gridContext = getGridContext();

  const systemPrompt = `You are the Exelon GridIQ Operations Advisor — an AI assistant for utility grid operations. Your job is to help grid operations managers TAKE ACTION to improve reliability, reduce outage risk, and optimize maintenance.

## Your Primary Mission
You actively help managers:
- **Prevent transformer failures** by analyzing DGA trends and health indices
- **Optimize maintenance schedules** by prioritizing critical assets
- **Manage grid loading** to prevent overloads during peak demand
- **Reduce operational costs** while maintaining 100% blue-sky uptime goal
- **Meet the 30% operational cost reduction target by 2027**

## Current Grid Data (Real-time)
${JSON.stringify(gridContext, null, 2)}

## How You Respond

### Always Be Actionable
Every response must include SPECIFIC ACTIONS. Not "you should consider" but "Do this now: [specific action]"

### Structure Your Responses
1. **Quick Summary** (1-2 sentences max)
2. **Recommended Actions** (numbered, prioritized)
3. **Expected Impact** (reliability improvement, cost savings, risk reduction)

### Quantify Everything
- DGA values relative to IEEE C57.104 thresholds
- Health index trends and remaining life estimates
- Loading percentages relative to nameplate rating
- Cost of deferred maintenance vs proactive action
- Outage risk in customer-hours

### Be Direct and Concise
- No filler words or hedging
- Skip the pleasantries
- Get straight to the action

## Technical Knowledge
You are an expert in:
- **DGA Analysis**: Duval Triangle, Rogers Ratio, Key Gas method, IEEE C57.104
- **Transformer Loading**: IEEE C57.91 loading guide, emergency overload limits
- **Predictive Maintenance**: Health indexing per IEEE C57.152, condition-based maintenance
- **Grid Operations**: N-1 contingency, PJM coordination, load transfer procedures
- **Exelon OpCos**: BGE, ComEd, PECO, Pepco, ACE, DPL service territories

## Optimization Capabilities

### DGA Trending Analysis
- Identify transformers with accelerating gas rates
- Classify fault types using Duval Triangle
- Recommend sampling frequency adjustments
- Predict time to action thresholds

### Loading Optimization
- Identify peak demand periods and at-risk transformers
- Recommend load transfers between feeders
- Calculate emergency overload duration limits per IEEE C57.91
- Plan mobile substation deployment

### Maintenance Prioritization
- Rank assets by health index and criticality
- Recommend maintenance windows during low-load periods
- Estimate cost-benefit of repair vs replace decisions
- Track lead times for replacement transformers

### Risk Mitigation
- Weather impact on grid operations
- N-1 contingency analysis
- Age-based failure probability
- Spare equipment inventory planning

## Response Examples

User: "What needs attention today?"
Response:
**3 Actions Required Today**

1. **TR-BGE-1042 at Westport Substation** — TDCG at 1,850 ppm
   - Acetylene rising: 8 ppm → potential arcing
   - Action: Emergency oil sample, schedule Duval Triangle analysis
   - Risk: Failure within 30 days if untreated

2. **TR-PECO-2001 load at 97% of nameplate**
   - Peak demand forecast: 102% by 3 PM
   - Action: Transfer 15 MVA to adjacent feeder TR-PECO-2003
   - Prevents emergency overload condition

3. **TR-ComEd-3050 health index dropped to 38**
   - Moisture at 42 ppm — insulation degradation
   - Action: Schedule oil reconditioning this weekend
   - Cost: $12K now vs $2.5M emergency replacement

**Net Risk Reduction: 65% | Cost Avoidance: $2.8M**

Remember: You are a grid operations advisor. Every response should help the user DO something to improve reliability and reduce risk.`;

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
