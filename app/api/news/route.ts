import { NextResponse } from 'next/server';

// Perigon API types
interface PerigonArticle {
  articleId: string;
  title: string;
  description: string;
  content: string;
  url: string;
  imageUrl: string;
  source: {
    domain: string;
    name: string;
    country: string;
  };
  pubDate: string;
  categories: Array<{ name: string }>;
  topics: Array<{ name: string }>;
  entities: Array<{
    type: string;
    name: string;
    wikidataId?: string;
  }>;
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

interface PerigonResponse {
  status: number;
  numResults: number;
  articles: PerigonArticle[];
}

// Impact category for fleet operations
export type FleetImpact = 
  | 'weather_alert'      // Storms, cyclones, high seas
  | 'port_disruption'    // Port closures, congestion
  | 'fuel_prices'        // Oil/fuel price changes
  | 'regulatory'         // New regulations, compliance
  | 'security'           // Piracy, geopolitical risks
  | 'market'             // Industry trends, contracts
  | 'environmental'      // Emissions, environmental rules
  | 'incident'           // Accidents, groundings, spills
  | 'infrastructure'     // New ports, channel dredging
  | 'general';           // General industry news

// Recommended action based on news
export interface RecommendedAction {
  id: string;
  type: 'reroute' | 'delay' | 'accelerate' | 'standby' | 'fuel_adjust' | 'review' | 'monitor' | 'alert_crew';
  priority: 'immediate' | 'today' | 'this_week';
  description: string;
  estimatedImpact?: string;
  affectedVessels?: string[]; // vessel names
}

// Formatted article for frontend
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
  // Actionable intel
  detectedRegion: string | null;
  affectedVessels: string[]; // vessel names potentially affected
  recommendedActions: RecommendedAction[];
  isActionable: boolean;
}

// Cache for rate limiting
let newsCache: {
  articles: NewsArticle[];
  fetchedAt: Date;
} | null = null;

const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

// Keywords that indicate operational impact
const IMPACT_KEYWORDS = {
  weather_alert: {
    keywords: ['storm', 'cyclone', 'hurricane', 'typhoon', 'monsoon', 'high seas', 'rough weather', 'wind warning', 'wave height', 'swell', 'flooding'],
    operations: ['Vessel movements', 'Offshore operations', 'Crew safety'],
    description: 'Weather conditions may affect vessel operations',
  },
  port_disruption: {
    keywords: ['port closure', 'port congestion', 'berth', 'terminal', 'dock strike', 'port delay', 'anchorage', 'waiting time'],
    operations: ['Supply chain', 'Vessel scheduling', 'Cargo operations'],
    description: 'Port conditions may impact scheduling',
  },
  fuel_prices: {
    keywords: ['oil price', 'fuel price', 'bunker', 'brent crude', 'wti', 'diesel', 'lng price', 'opec', 'fuel cost', 'energy price'],
    operations: ['Operating costs', 'Fuel budgeting', 'Route planning'],
    description: 'Fuel cost changes affect operating expenses',
  },
  regulatory: {
    keywords: ['imo', 'regulation', 'compliance', 'emission standard', 'ballast water', 'solas', 'marpol', 'flag state', 'classification', 'inspection'],
    operations: ['Compliance', 'Fleet upgrades', 'Documentation'],
    description: 'Regulatory changes may require action',
  },
  security: {
    keywords: ['piracy', 'hijack', 'armed robbery', 'security alert', 'geopolitical', 'sanctions', 'war risk', 'red sea', 'houthi', 'iran', 'strait of hormuz'],
    operations: ['Route planning', 'Security protocols', 'Insurance'],
    description: 'Security situation may affect operations',
  },
  environmental: {
    keywords: ['emission', 'carbon', 'ets', 'green shipping', 'decarbonization', 'sustainability', 'environmental', 'pollution', 'scrubber'],
    operations: ['Environmental compliance', 'Fleet strategy', 'Reporting'],
    description: 'Environmental requirements impact',
  },
  incident: {
    keywords: ['collision', 'grounding', 'fire', 'explosion', 'sinking', 'capsize', 'oil spill', 'rescue', 'mayday', 'accident', 'casualty'],
    operations: ['Safety protocols', 'Risk assessment', 'Insurance'],
    description: 'Industry incident - review safety protocols',
  },
  infrastructure: {
    keywords: ['dredging', 'channel', 'new port', 'expansion', 'infrastructure', 'waterway', 'navigation', 'depth'],
    operations: ['Route access', 'Project opportunities', 'Navigation'],
    description: 'Infrastructure changes may create opportunities',
  },
  market: {
    keywords: ['contract', 'tender', 'charter rate', 'freight rate', 'market', 'demand', 'fleet', 'newbuild', 'acquisition', 'merger'],
    operations: ['Business development', 'Market positioning', 'Fleet planning'],
    description: 'Market developments for awareness',
  },
};

// Region detection and vessel mapping
const REGION_CONFIG: Record<string, {
  keywords: string[];
  vessels: string[]; // vessel names in this region
  isHomeRegion: boolean;
}> = {
  uae_gulf: {
    keywords: ['uae', 'abu dhabi', 'dubai', 'qatar', 'saudi', 'bahrain', 'oman', 'kuwait',
      'persian gulf', 'arabian gulf', 'gulf of oman', 'strait of hormuz',
      'jebel ali', 'khalifa port', 'mina zayed', 'fujairah', 'khor fakkan',
      'adnoc', 'nmdc', 'dp world', 'adpc', 'npcc', 'ruwais', 'zakum', 'ghasha'],
    vessels: ['GHASHA', 'ARZANA', 'AL SADR', 'AL MIRFA', 'AL HAMRA', 'KHALEEJ BAY', 
      'MARAWAH', 'AL YASSAT', 'SHARK BAY', 'JANANAH', 'AL JABER XII', 'AL GHALLAN',
      'BARRACUDA', 'INCHCAPE 5', 'UNIQUE SURVEYOR 1', 'DLS-4200', 'DELMA 2000',
      'PLB-648', 'DLB-750', 'DLB-1000', 'SEP-450', 'SEP-550', 'SEP-650', 'SEP-750',
      'UMM SHAIF', 'NPCC SAADIYAT', 'NPCC YAS'],
    isHomeRegion: true,
  },
  red_sea: {
    keywords: ['red sea', 'suez', 'bab el mandeb', 'houthi', 'yemen', 'egypt suez'],
    vessels: [], // Vessels transiting through
    isHomeRegion: false,
  },
  indian_ocean: {
    keywords: ['indian ocean', 'arabian sea', 'india', 'pakistan', 'somalia', 'maldives'],
    vessels: [],
    isHomeRegion: false,
  },
  global: {
    keywords: ['global', 'worldwide', 'international'],
    vessels: [], // All vessels potentially affected
    isHomeRegion: false,
  },
};

// Dredging/offshore specific keywords
const INDUSTRY_KEYWORDS = [
  'dredging', 'offshore', 'marine construction', 'reclamation', 'subsea',
  'anchor handling', 'supply vessel', 'tug', 'barge', 'jack-up',
  'offshore oil', 'offshore gas', 'platform', 'pipeline', 'drilling',
];

// Generate recommended actions based on news type and region
function generateRecommendedActions(
  impact: FleetImpact,
  region: string | null,
  affectedVessels: string[],
  title: string
): RecommendedAction[] {
  const actions: RecommendedAction[] = [];
  const actionId = () => `action-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  
  switch (impact) {
    case 'weather_alert':
      if (affectedVessels.length > 0) {
        actions.push({
          id: actionId(),
          type: 'standby',
          priority: 'immediate',
          description: `Review weather exposure for ${affectedVessels.slice(0, 3).join(', ')}${affectedVessels.length > 3 ? ` +${affectedVessels.length - 3} more` : ''}`,
          estimatedImpact: 'Potential 12-24h operational delay',
          affectedVessels: affectedVessels.slice(0, 5),
        });
        actions.push({
          id: actionId(),
          type: 'alert_crew',
          priority: 'immediate',
          description: 'Brief vessel masters on weather conditions',
          affectedVessels: affectedVessels.slice(0, 5),
        });
      }
      actions.push({
        id: actionId(),
        type: 'monitor',
        priority: 'today',
        description: 'Monitor weather forecasts for next 48 hours',
      });
      break;
      
    case 'port_disruption':
      actions.push({
        id: actionId(),
        type: 'review',
        priority: 'today',
        description: 'Check vessel schedules for port dependencies',
        estimatedImpact: 'Schedule adjustments may be needed',
      });
      if (affectedVessels.length > 0) {
        actions.push({
          id: actionId(),
          type: 'delay',
          priority: 'today',
          description: `Assess delay impact on ${affectedVessels[0]}`,
          affectedVessels: affectedVessels.slice(0, 3),
        });
      }
      break;
      
    case 'fuel_prices':
      actions.push({
        id: actionId(),
        type: 'fuel_adjust',
        priority: 'this_week',
        description: 'Review fuel procurement strategy',
        estimatedImpact: title.toLowerCase().includes('rise') || title.toLowerCase().includes('surge') 
          ? 'Operating costs may increase 5-15%' 
          : 'Potential cost savings opportunity',
      });
      actions.push({
        id: actionId(),
        type: 'review',
        priority: 'this_week',
        description: 'Optimize vessel speeds to reduce consumption',
      });
      break;
      
    case 'security':
      actions.push({
        id: actionId(),
        type: 'review',
        priority: 'immediate',
        description: 'Review security protocols and risk assessment',
        estimatedImpact: 'May affect routing decisions',
      });
      if (region === 'red_sea' || title.toLowerCase().includes('red sea')) {
        actions.push({
          id: actionId(),
          type: 'reroute',
          priority: 'immediate',
          description: 'Consider Cape of Good Hope routing for transiting vessels',
          estimatedImpact: '+7-10 days transit time',
        });
      }
      break;
      
    case 'regulatory':
      actions.push({
        id: actionId(),
        type: 'review',
        priority: 'this_week',
        description: 'Assess compliance requirements and timeline',
      });
      actions.push({
        id: actionId(),
        type: 'review',
        priority: 'this_week',
        description: 'Brief operations team on regulatory changes',
      });
      break;
      
    case 'incident':
      actions.push({
        id: actionId(),
        type: 'review',
        priority: 'today',
        description: 'Review safety protocols related to this incident type',
      });
      actions.push({
        id: actionId(),
        type: 'alert_crew',
        priority: 'today',
        description: 'Share incident learnings with vessel crews',
      });
      break;
      
    case 'market':
    case 'infrastructure':
      actions.push({
        id: actionId(),
        type: 'monitor',
        priority: 'this_week',
        description: 'Track developments for business opportunities',
      });
      break;
      
    default:
      actions.push({
        id: actionId(),
        type: 'monitor',
        priority: 'this_week',
        description: 'Monitor for fleet-relevant developments',
      });
  }
  
  return actions;
}

// Detect region from article content
function detectRegion(text: string): { region: string | null; vessels: string[] } {
  const lowerText = text.toLowerCase();
  
  for (const [regionKey, config] of Object.entries(REGION_CONFIG)) {
    const matchCount = config.keywords.filter(kw => lowerText.includes(kw)).length;
    if (matchCount >= 1) {
      return {
        region: regionKey,
        vessels: config.isHomeRegion ? config.vessels : [],
      };
    }
  }
  
  return { region: null, vessels: [] };
}

// Helper: get all region keywords for relevance checking
function isRegionalArticle(text: string): boolean {
  const lowerText = text.toLowerCase();
  return Object.values(REGION_CONFIG).some(config => 
    config.keywords.some(kw => lowerText.includes(kw))
  );
}

// Determine fleet impact category
function categorizeImpact(article: PerigonArticle): { 
  impact: FleetImpact; 
  level: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  operations: string[];
} {
  const text = `${article.title} ${article.description}`.toLowerCase();
  
  // Check each impact category
  for (const [category, config] of Object.entries(IMPACT_KEYWORDS)) {
    const matchCount = config.keywords.filter(kw => text.includes(kw)).length;
    
    if (matchCount >= 2) {
      // Multiple keyword matches = higher confidence
      const isRegional = isRegionalArticle(text);
      const isIndustry = INDUSTRY_KEYWORDS.some(kw => text.includes(kw));
      
      let level: 'critical' | 'high' | 'medium' | 'low' = 'medium';
      
      // Critical: weather alerts, security, or incidents in our region
      if ((category === 'weather_alert' || category === 'security' || category === 'incident') && isRegional) {
        level = 'critical';
      } else if (isRegional && isIndustry) {
        level = 'high';
      } else if (isRegional || isIndustry) {
        level = 'high';
      }
      
      return {
        impact: category as FleetImpact,
        level,
        description: config.description,
        operations: config.operations,
      };
    } else if (matchCount === 1) {
      const isRegional = isRegionalArticle(text);
      
      return {
        impact: category as FleetImpact,
        level: isRegional ? 'medium' : 'low',
        description: config.description,
        operations: config.operations,
      };
    }
  }
  
  // Default: general maritime news
  return {
    impact: 'general',
    level: 'low',
    description: 'Industry news for awareness',
    operations: ['General awareness'],
  };
}

// Get dominant sentiment
function getSentiment(sentiment: PerigonArticle['sentiment']): 'positive' | 'negative' | 'neutral' {
  if (!sentiment) return 'neutral';
  if (sentiment.positive > sentiment.negative && sentiment.positive > sentiment.neutral) {
    return 'positive';
  }
  if (sentiment.negative > sentiment.positive && sentiment.negative > sentiment.neutral) {
    return 'negative';
  }
  return 'neutral';
}

// Format article for frontend with actionable intel
function formatArticle(article: PerigonArticle): NewsArticle {
  const impactAnalysis = categorizeImpact(article);
  const text = `${article.title} ${article.description}`;
  const regionInfo = detectRegion(text);
  
  // Generate recommended actions
  const recommendedActions = generateRecommendedActions(
    impactAnalysis.impact,
    regionInfo.region,
    regionInfo.vessels,
    article.title
  );
  
  // Determine if actionable (has specific actions for our fleet)
  const isActionable = 
    regionInfo.vessels.length > 0 || 
    impactAnalysis.level === 'critical' ||
    (impactAnalysis.level === 'high' && regionInfo.region === 'uae_gulf');
  
  return {
    id: article.articleId,
    title: article.title,
    summary: article.description?.slice(0, 400) || '',
    url: article.url,
    imageUrl: article.imageUrl || null,
    source: article.source?.name || article.source?.domain || 'Unknown',
    sourceDomain: article.source?.domain || '',
    publishedAt: article.pubDate,
    category: article.categories?.[0]?.name || 'General',
    topics: article.topics?.map(t => t.name).slice(0, 5) || [],
    sentiment: getSentiment(article.sentiment),
    fleetImpact: impactAnalysis.impact,
    impactLevel: impactAnalysis.level,
    impactDescription: impactAnalysis.description,
    affectedOperations: impactAnalysis.operations,
    // Actionable intel
    detectedRegion: regionInfo.region,
    affectedVessels: regionInfo.vessels.slice(0, 10), // Limit to 10 vessels
    recommendedActions,
    isActionable,
  };
}

// NMDC-specific queries - dredging, marine construction, offshore EPC
const NMDC_QUERIES = [
  // Direct industry terms
  'dredging',
  '"marine construction"',
  '"land reclamation"',
  '"offshore construction"',
  // ADNOC projects (NMDC's main client)
  'ADNOC offshore',
  'ADNOC pipeline',
  'ADNOC platform',
  // UAE ports (maritime operations only)
  '"Khalifa Port"',
  '"Jebel Ali Port"',
  '"Fujairah Port"',
  '"Ruwais"',
  // Offshore oil & gas UAE
  '"offshore UAE"',
  '"subsea pipeline"',
  // Shipping disruptions affecting Gulf
  '"Strait of Hormuz" shipping',
  '"Red Sea" shipping',
];

// MUST match one of these - very strict
const MUST_MATCH_KEYWORDS = [
  // Core NMDC business
  'dredging', 'dredger', 'reclamation', 
  'marine construction', 'offshore construction',
  'subsea', 'pipeline', 'pipelay',
  'offshore platform', 'offshore oil', 'offshore gas',
  // Key UAE clients/projects
  'adnoc', 'nmdc', 'npcc',
  // UAE ports (only in maritime context)
  'khalifa port', 'jebel ali port', 'fujairah port', 'ruwais terminal',
  // Critical shipping lanes
  'strait of hormuz', 'bab el-mandeb',
  // Vessels/shipping in Gulf
  'persian gulf', 'arabian gulf',
];

// MUST NOT match these - filters out noise
const MUST_NOT_KEYWORDS = [
  'cricket', 'football', 'racing', 'horse', 'tennis', 'golf',
  'restaurant', 'hotel', 'tourism', 'airline', 'flight',
  'real estate', 'property', 'apartment', 'villa',
  'concert', 'entertainment', 'movie', 'music',
  'fashion', 'luxury', 'retail', 'shopping',
];

// Check if article is relevant to NMDC operations
function isRelevantToNMDC(article: PerigonArticle): boolean {
  const text = `${article.title} ${article.description}`.toLowerCase();
  
  // Must NOT contain noise keywords
  if (MUST_NOT_KEYWORDS.some(kw => text.includes(kw))) {
    return false;
  }
  
  // MUST contain at least one relevant keyword
  return MUST_MATCH_KEYWORDS.some(kw => text.includes(kw));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const impactFilter = searchParams.get('impact'); // weather_alert, port_disruption, etc.
  const refresh = searchParams.get('refresh') === 'true';
  const limit = parseInt(searchParams.get('limit') || '25');
  
  const apiKey = process.env.PERIGON_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: 'Perigon API key not configured. Add PERIGON_API_KEY to your .env file.',
      articles: [],
    }, { status: 500 });
  }
  
  // Check cache unless refresh requested
  if (!refresh && newsCache && (Date.now() - newsCache.fetchedAt.getTime()) < CACHE_DURATION_MS) {
    let articles = newsCache.articles;
    
    // Filter by impact type if specified
    if (impactFilter) {
      articles = articles.filter(a => a.fleetImpact === impactFilter);
    }
    
    return NextResponse.json({
      success: true,
      cached: true,
      fetchedAt: newsCache.fetchedAt.toISOString(),
      articles: articles.slice(0, limit),
      total: articles.length,
      impactSummary: getImpactSummary(newsCache.articles),
    });
  }

  try {
    // Fetch news using NMDC-specific queries
    const allArticles: PerigonArticle[] = [];
    const seenIds = new Set<string>();
    
    // Run queries in parallel for speed - use all NMDC queries
    const queryPromises = NMDC_QUERIES.map(async (query) => {
      const params = new URLSearchParams({
        apiKey,
        q: query,
        size: '20',
        sortBy: 'date',
        showReprints: 'false',
        language: 'en',
      });
      
      try {
        const response = await fetch(`https://api.goperigon.com/v1/all?${params.toString()}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });
        
        if (response.ok) {
          const data = await response.json() as PerigonResponse;
          return data.articles || [];
        }
      } catch {
        console.error('Query failed:', query);
      }
      return [];
    });
    
    const results = await Promise.all(queryPromises);
    
    // Deduplicate and collect articles
    for (const articles of results) {
      for (const article of articles) {
        if (!seenIds.has(article.articleId)) {
          seenIds.add(article.articleId);
          allArticles.push(article);
        }
      }
    }
    
    // If we don't have enough, do a broader fallback with strict filtering
    if (allArticles.length < 5) {
      const fallbackParams = new URLSearchParams({
        apiKey,
        q: 'dredging OR "offshore oil" OR "marine construction" OR ADNOC OR "subsea pipeline"',
        size: '30',
        sortBy: 'date',
        showReprints: 'false',
        language: 'en',
      });
      
      try {
        const fallbackResponse = await fetch(`https://api.goperigon.com/v1/all?${fallbackParams.toString()}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        });
        
        if (fallbackResponse.ok) {
          const data = await fallbackResponse.json() as PerigonResponse;
          for (const article of (data.articles || [])) {
            if (!seenIds.has(article.articleId)) {
              seenIds.add(article.articleId);
              allArticles.push(article);
            }
          }
        }
      } catch {
        console.error('Fallback query failed');
      }
    }
    
    // STRICT FILTER: Only keep articles relevant to NMDC operations
    const relevantArticles = allArticles.filter(isRelevantToNMDC);
    
    // If no relevant articles found, return empty with message
    if (relevantArticles.length === 0) {
      // Return cached data if available
      if (newsCache && newsCache.articles.length > 0) {
        return NextResponse.json({
          success: true,
          cached: true,
          stale: true,
          fetchedAt: newsCache.fetchedAt.toISOString(),
          articles: newsCache.articles.slice(0, limit),
          message: 'No new relevant news - showing cached results',
          impactSummary: getImpactSummary(newsCache.articles),
        });
      }
      
      return NextResponse.json({
        success: true,
        cached: false,
        fetchedAt: new Date().toISOString(),
        articles: [],
        total: 0,
        message: 'No news matching UAE/Gulf maritime operations found',
        impactSummary: {},
      });
    }
    
    // Format articles and sort by relevance
    const formattedArticles = relevantArticles
      .map(formatArticle)
      .sort((a, b) => {
        // Sort by impact level first (critical > high > medium > low)
        const levelOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        if (levelOrder[a.impactLevel] !== levelOrder[b.impactLevel]) {
          return levelOrder[a.impactLevel] - levelOrder[b.impactLevel];
        }
        // Then by date
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
    
    // Update cache
    newsCache = {
      articles: formattedArticles,
      fetchedAt: new Date(),
    };
    
    let articles = formattedArticles;
    if (impactFilter) {
      articles = articles.filter(a => a.fleetImpact === impactFilter);
    }
    
    return NextResponse.json({
      success: true,
      cached: false,
      fetchedAt: newsCache.fetchedAt.toISOString(),
      articles: articles.slice(0, limit),
      total: formattedArticles.length,
      impactSummary: getImpactSummary(formattedArticles),
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    
    // Return cached data if available
    if (newsCache) {
      return NextResponse.json({
        success: true,
        cached: true,
        stale: true,
        fetchedAt: newsCache.fetchedAt.toISOString(),
        articles: newsCache.articles.slice(0, limit),
        error: 'Using cached data due to fetch error',
        impactSummary: getImpactSummary(newsCache.articles),
      });
    }
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      articles: [],
    }, { status: 500 });
  }
}

// Generate summary of impacts for the fleet
function getImpactSummary(articles: NewsArticle[]): Record<FleetImpact, { count: number; criticalCount: number }> {
  const summary: Record<string, { count: number; criticalCount: number }> = {};
  
  for (const article of articles) {
    if (!summary[article.fleetImpact]) {
      summary[article.fleetImpact] = { count: 0, criticalCount: 0 };
    }
    summary[article.fleetImpact].count++;
    if (article.impactLevel === 'critical') {
      summary[article.fleetImpact].criticalCount++;
    }
  }
  
  return summary as Record<FleetImpact, { count: number; criticalCount: number }>;
}
