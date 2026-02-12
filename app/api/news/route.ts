import { NextResponse } from 'next/server';

// Impact category for grid operations
export type FleetImpact = 
  | 'weather_alert'      // Extreme heat, storms, cold snaps
  | 'port_disruption'    // Substation outage, grid disruption
  | 'fuel_prices'        // Energy market prices
  | 'regulatory'         // NERC, FERC, PJM regulations
  | 'security'           // Cyber threats, physical security
  | 'market'             // Industry trends, capacity markets
  | 'environmental'      // SF6 reduction, decarbonization
  | 'incident'           // Grid failures, transformer incidents
  | 'infrastructure'     // Grid modernization, new substations
  | 'general';           // General utility news

export interface RecommendedAction {
  id: string;
  type: 'reroute' | 'delay' | 'accelerate' | 'standby' | 'fuel_adjust' | 'review' | 'monitor' | 'alert_crew';
  priority: 'immediate' | 'today' | 'this_week';
  description: string;
  estimatedImpact?: string;
  affectedVessels?: string[];
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  imageUrl: string | null;
  source: string;
  sourceDomain: string;
  publishedAt: string;
  category: string;
  topics: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  fleetImpact: FleetImpact;
  impactLevel: 'critical' | 'high' | 'medium' | 'low';
  impactDescription: string;
  affectedOperations: string[];
  detectedRegion: string | null;
  affectedVessels: string[];
  recommendedActions: RecommendedAction[];
  isActionable: boolean;
}

// Mock grid industry news articles
function generateGridNews(): NewsArticle[] {
  const now = new Date();
  const articles: NewsArticle[] = [
    {
      id: 'news-1',
      title: 'PJM Issues Heat Wave Advisory for Mid-Atlantic Region',
      summary: 'PJM Interconnection has issued an operational advisory for extreme heat expected across the mid-Atlantic service territory. Peak demand forecasts indicate potential for 95th percentile loading on transmission transformers. Emergency operating procedures may be activated.',
      url: 'https://www.pjm.com/operations',
      imageUrl: null,
      source: 'PJM Interconnection',
      sourceDomain: 'pjm.com',
      publishedAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
      category: 'Operations',
      topics: ['Peak Demand', 'Heat Wave', 'Grid Reliability'],
      sentiment: 'negative',
      fleetImpact: 'weather_alert',
      impactLevel: 'critical',
      impactDescription: 'Extreme heat will push transformer loading to emergency levels across service territory',
      affectedOperations: ['Load Management', 'Emergency Operations', 'Crew Deployment'],
      detectedRegion: 'Mid-Atlantic',
      affectedVessels: ['BGE Service Territory', 'PECO Philadelphia', 'Pepco DC Metro'],
      recommendedActions: [
        {
          id: 'act-1a',
          type: 'monitor',
          priority: 'immediate',
          description: 'Activate enhanced monitoring on all transformers above 80% nameplate loading',
          estimatedImpact: 'Prevents undetected overload conditions',
        },
        {
          id: 'act-1b',
          type: 'standby',
          priority: 'immediate',
          description: 'Pre-position mobile substations at critical locations identified in N-1 analysis',
          estimatedImpact: 'Reduces outage response time by 4-6 hours',
        },
      ],
      isActionable: true,
    },
    {
      id: 'news-2',
      title: 'NERC Proposes New Transformer Monitoring Standards for 2027',
      summary: 'The North American Electric Reliability Corporation has proposed mandatory DGA online monitoring for all power transformers rated 100 MVA and above. The new standard would require continuous dissolved gas analysis with automated alerting by Q1 2027.',
      url: 'https://www.nerc.com/standards',
      imageUrl: null,
      source: 'NERC',
      sourceDomain: 'nerc.com',
      publishedAt: new Date(now.getTime() - 8 * 3600000).toISOString(),
      category: 'Regulatory',
      topics: ['DGA Monitoring', 'IEEE C57.104', 'Compliance'],
      sentiment: 'neutral',
      fleetImpact: 'regulatory',
      impactLevel: 'high',
      impactDescription: 'New mandatory DGA monitoring requirements will affect fleet-wide instrumentation strategy',
      affectedOperations: ['Asset Management', 'Capital Planning', 'Compliance'],
      detectedRegion: null,
      affectedVessels: [],
      recommendedActions: [
        {
          id: 'act-2a',
          type: 'review',
          priority: 'this_week',
          description: 'Audit current DGA monitoring coverage across all transformers ≥100 MVA',
          estimatedImpact: 'Identifies compliance gaps ahead of regulation',
        },
      ],
      isActionable: true,
    },
    {
      id: 'news-3',
      title: 'Exelon Achieves 15% Reduction in SF6 Emissions Ahead of Schedule',
      summary: 'Exelon Utilities reported a 15% year-over-year reduction in SF6 greenhouse gas emissions through aggressive leak detection programs and replacement of aging circuit breakers with SF6-free alternatives.',
      url: 'https://www.exeloncorp.com/sustainability',
      imageUrl: null,
      source: 'Exelon Corporation',
      sourceDomain: 'exeloncorp.com',
      publishedAt: new Date(now.getTime() - 24 * 3600000).toISOString(),
      category: 'ESG',
      topics: ['SF6 Reduction', 'Decarbonization', 'Sustainability'],
      sentiment: 'positive',
      fleetImpact: 'environmental',
      impactLevel: 'medium',
      impactDescription: 'Positive progress toward emission reduction goals accelerates timeline',
      affectedOperations: ['Environmental Compliance', 'Capital Planning'],
      detectedRegion: null,
      affectedVessels: [],
      recommendedActions: [],
      isActionable: false,
    },
    {
      id: 'news-4',
      title: 'Major Transformer Failure at ComEd Substation Highlights Aging Grid Risk',
      summary: 'A 345/138 kV power transformer at a ComEd substation in suburban Chicago failed catastrophically after 47 years of service. DGA records showed accelerating gas trending in the months prior. The failure caused a 6-hour outage affecting 45,000 customers.',
      url: 'https://www.utilitydive.com',
      imageUrl: null,
      source: 'Utility Dive',
      sourceDomain: 'utilitydive.com',
      publishedAt: new Date(now.getTime() - 48 * 3600000).toISOString(),
      category: 'Incident',
      topics: ['Transformer Failure', 'Aging Infrastructure', 'Outage'],
      sentiment: 'negative',
      fleetImpact: 'incident',
      impactLevel: 'high',
      impactDescription: 'Industry incident reinforces need for proactive condition-based maintenance',
      affectedOperations: ['Maintenance Planning', 'Risk Assessment', 'Spare Inventory'],
      detectedRegion: 'ComEd Chicago',
      affectedVessels: ['ComEd Chicago Metro'],
      recommendedActions: [
        {
          id: 'act-4a',
        type: 'review',
        priority: 'today',
          description: 'Review DGA trending for all transformers over 40 years old in the fleet',
          estimatedImpact: 'Identifies units at similar risk for proactive replacement',
        },
        {
          id: 'act-4b',
          type: 'monitor',
          priority: 'today',
          description: 'Verify spare transformer inventory and lead times for critical ratings',
          estimatedImpact: 'Ensures emergency replacement capability',
        },
      ],
      isActionable: true,
    },
    {
      id: 'news-5',
      title: 'DOE Announces $3.5B Grid Resilience Grant Program for Utilities',
      summary: 'The Department of Energy has announced a new $3.5 billion grant program for grid modernization and resilience improvements. Eligible projects include advanced monitoring systems, grid hardening, and predictive maintenance technologies.',
      url: 'https://www.energy.gov/grid-resilience',
      imageUrl: null,
      source: 'Department of Energy',
      sourceDomain: 'energy.gov',
      publishedAt: new Date(now.getTime() - 72 * 3600000).toISOString(),
      category: 'Infrastructure',
      topics: ['Grid Modernization', 'Federal Funding', 'Resilience'],
      sentiment: 'positive',
      fleetImpact: 'infrastructure',
      impactLevel: 'medium',
      impactDescription: 'Federal funding opportunity for grid modernization and predictive maintenance investments',
      affectedOperations: ['Capital Planning', 'Technology Strategy', 'Grant Management'],
      detectedRegion: null,
      affectedVessels: [],
      recommendedActions: [
        {
          id: 'act-5a',
        type: 'review',
        priority: 'this_week',
          description: 'Evaluate eligibility and prepare grant application for DGA monitoring expansion',
          estimatedImpact: 'Potential $50-100M in matching funds',
        },
      ],
      isActionable: true,
    },
    {
      id: 'news-6',
      title: 'PJM Capacity Market Prices Rise 30% on Tightening Reserve Margins',
      summary: 'PJM capacity auction results show a 30% increase in clearing prices driven by tighter reserve margins. Demand growth from data centers and electrification is outpacing new generation and grid capacity additions.',
      url: 'https://www.rtoinsider.com',
      imageUrl: null,
      source: 'RTO Insider',
      sourceDomain: 'rtoinsider.com',
      publishedAt: new Date(now.getTime() - 96 * 3600000).toISOString(),
      category: 'Market',
      topics: ['Capacity Market', 'PJM', 'Reserve Margin'],
      sentiment: 'negative',
      fleetImpact: 'market',
      impactLevel: 'medium',
      impactDescription: 'Rising capacity costs and tighter margins increase importance of grid reliability',
      affectedOperations: ['Grid Planning', 'Load Forecasting', 'Asset Utilization'],
      detectedRegion: 'PJM Territory',
      affectedVessels: [],
      recommendedActions: [],
      isActionable: false,
    },
  ];

  return articles;
}

export async function GET() {
  try {
    const articles = generateGridNews();
    
    return NextResponse.json({
      success: true,
      articles,
      count: articles.length,
      meta: {
        source: 'grid-intel',
        fetchedAt: new Date().toISOString(),
        region: 'Exelon Service Territories',
      },
    });
  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      {
      success: false,
        error: 'Failed to fetch grid news',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
