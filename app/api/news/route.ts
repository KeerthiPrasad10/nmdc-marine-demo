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
  | 'weather_alert'      // Storms, wind, high seas
  | 'port_disruption'    // Terminal closures, congestion
  | 'fuel_prices'        // Fuel price changes
  | 'regulatory'         // New regulations, compliance
  | 'security'           // Security risks, threats
  | 'market'             // Ridership trends, service changes
  | 'environmental'      // Emissions, marine protection
  | 'incident'           // Accidents, groundings, spills
  | 'infrastructure'     // Terminal upgrades, new routes
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
    keywords: ['storm', 'wind advisory', 'high seas', 'rough weather', 'wind warning', 'wave height', 'swell', 'flooding', 'fog', 'visibility', 'gale'],
    operations: ['Ferry sailings', 'Passenger safety', 'Schedule delays'],
    description: 'Weather conditions may affect ferry operations',
  },
  port_disruption: {
    keywords: ['terminal closure', 'terminal congestion', 'berth', 'dock strike', 'terminal delay', 'slip closure', 'loading ramp'],
    operations: ['Ferry scheduling', 'Passenger routing', 'Vehicle loading'],
    description: 'Terminal conditions may impact ferry schedules',
  },
  fuel_prices: {
    keywords: ['oil price', 'fuel price', 'diesel', 'marine diesel', 'fuel cost', 'energy price', 'bunker fuel'],
    operations: ['Operating costs', 'Fuel budgeting', 'Fare planning'],
    description: 'Fuel cost changes affect operating expenses',
  },
  regulatory: {
    keywords: ['uscg', 'regulation', 'compliance', 'emission standard', 'solas', 'fhwa', 'dot regulation', 'inspection', 'coast guard', 'ada compliance'],
    operations: ['Compliance', 'Fleet upgrades', 'Documentation'],
    description: 'Regulatory changes may require action',
  },
  security: {
    keywords: ['security alert', 'threat', 'suspicious', 'terrorism', 'security breach', 'homeland security', 'tsa maritime'],
    operations: ['Security protocols', 'Passenger screening', 'Emergency response'],
    description: 'Security situation may affect operations',
  },
  environmental: {
    keywords: ['emission', 'carbon', 'orca', 'whale', 'marine mammal', 'decarbonization', 'sustainability', 'environmental', 'pollution', 'noise reduction'],
    operations: ['Environmental compliance', 'Speed restrictions', 'Route adjustments'],
    description: 'Environmental requirements impact',
  },
  incident: {
    keywords: ['collision', 'grounding', 'fire', 'ferry accident', 'sinking', 'allision', 'oil spill', 'rescue', 'mayday', 'accident', 'casualty'],
    operations: ['Safety protocols', 'Risk assessment', 'Insurance'],
    description: 'Industry incident - review safety protocols',
  },
  infrastructure: {
    keywords: ['terminal upgrade', 'new ferry', 'expansion', 'infrastructure', 'electrification', 'hybrid ferry', 'charging station', 'terminal renovation'],
    operations: ['Route access', 'Service planning', 'Fleet modernization'],
    description: 'Infrastructure changes may affect operations',
  },
  market: {
    keywords: ['ridership', 'passenger volume', 'tourism', 'commuter', 'fare', 'service expansion', 'fleet', 'new vessel', 'ferry service'],
    operations: ['Service planning', 'Capacity management', 'Revenue forecasting'],
    description: 'Market developments for awareness',
  },
};

// Region detection and vessel mapping
const REGION_CONFIG: Record<string, {
  keywords: string[];
  vessels: string[]; // vessel names in this region
  isHomeRegion: boolean;
}> = {
  puget_sound: {
    keywords: ['puget sound', 'seattle', 'bainbridge', 'bremerton', 'kingston', 'edmonds',
      'anacortes', 'friday harbor', 'san juan', 'orcas island', 'lopez island',
      'whidbey island', 'mukilteo', 'clinton', 'vashon', 'southworth', 'fauntleroy',
      'wsdot', 'washington state ferries', 'wsf', 'washington dot'],
    vessels: ['M/V PUYALLUP', 'M/V TACOMA', 'M/V WENATCHEE', 'M/V SPOKANE',
      'M/V WALLA WALLA', 'M/V HYAK', 'M/V KALEETAN', 'M/V YAKIMA',
      'M/V ELWHA', 'M/V CATHLAMET', 'M/V CHELAN', 'M/V ISSAQUAH',
      'M/V KITSAP', 'M/V KITTITAS', 'M/V SAMISH', 'M/V TOKITAE',
      'M/V CHIMACUM', 'M/V SUQUAMISH', 'M/V TILLIKUM', 'M/V SEALTH',
      'M/V SALISH', 'M/V KENNEWICK'],
    isHomeRegion: true,
  },
  pacific_northwest: {
    keywords: ['pacific northwest', 'washington state', 'oregon coast', 'british columbia', 'strait of juan de fuca', 'admiralty inlet'],
    vessels: [], // Vessels potentially affected by regional events
    isHomeRegion: false,
  },
  west_coast: {
    keywords: ['west coast', 'pacific coast', 'california', 'alaska marine highway'],
    vessels: [],
    isHomeRegion: false,
  },
  global: {
    keywords: ['global', 'worldwide', 'international'],
    vessels: [], // All vessels potentially affected
    isHomeRegion: false,
  },
};

// Ferry/passenger vessel specific keywords
const INDUSTRY_KEYWORDS = [
  'ferry', 'passenger vessel', 'vehicle ferry', 'ro-ro', 'car ferry',
  'commuter ferry', 'ferry terminal', 'ferry service', 'ferry route',
  'ferry ridership', 'ferry schedule', 'passenger safety', 'ferry electrification',
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
        estimatedImpact: 'May affect ferry operations',
      });
      if (region === 'puget_sound') {
        actions.push({
          id: actionId(),
          type: 'alert_crew',
          priority: 'immediate',
          description: 'Brief ferry crews on security protocols and passenger screening',
          affectedVessels: affectedVessels.slice(0, 5),
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
    (impactAnalysis.level === 'high' && regionInfo.region === 'puget_sound');
  
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

// WSDOT ferry-specific queries - ferry operations, Puget Sound, passenger transport
const WSDOT_QUERIES = [
  // Direct ferry terms
  '"Washington State Ferries"',
  '"WSDOT ferry"',
  '"Puget Sound ferry"',
  // Ferry routes and terminals
  '"Seattle Bainbridge ferry"',
  '"Anacortes San Juan ferry"',
  '"Edmonds Kingston ferry"',
  '"Mukilteo Clinton ferry"',
  // Regional maritime
  '"Puget Sound" maritime',
  '"ferry service" Washington',
  // Industry topics
  '"ferry electrification"',
  '"passenger ferry" safety',
  // Weather affecting ferry operations
  '"Puget Sound" weather maritime',
  '"strait of juan de fuca" shipping',
];

// MUST match one of these - very strict
const MUST_MATCH_KEYWORDS = [
  // Core WSDOT ferry business
  'ferry', 'ferries', 'passenger vessel', 'car ferry',
  'washington state ferries', 'wsdot ferry', 'wsf',
  // Puget Sound operations
  'puget sound', 'seattle ferry', 'bainbridge ferry',
  'san juan ferry', 'anacortes ferry',
  // Ferry terminals
  'ferry terminal', 'colman dock', 'pier 52',
  // Regional maritime
  'strait of juan de fuca', 'admiralty inlet',
  // Ferry industry
  'ferry electrification', 'hybrid ferry', 'passenger safety',
  'ferry ridership', 'ferry service',
];

// MUST NOT match these - filters out noise
const MUST_NOT_KEYWORDS = [
  'cricket', 'football', 'racing', 'horse', 'tennis', 'golf',
  'restaurant', 'hotel', 'tourism', 'airline', 'flight',
  'real estate', 'property', 'apartment', 'villa',
  'concert', 'entertainment', 'movie', 'music',
  'fashion', 'luxury', 'retail', 'shopping',
];

// Check if article is relevant to WSDOT ferry operations
function isRelevantToWSDOT(article: PerigonArticle): boolean {
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
    // Fetch news using WSDOT-specific queries
    const allArticles: PerigonArticle[] = [];
    const seenIds = new Set<string>();
    
    // Run queries in parallel for speed - use all WSDOT queries
    const queryPromises = WSDOT_QUERIES.map(async (query) => {
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
        q: '"ferry" OR "Washington State Ferries" OR "Puget Sound" OR "ferry terminal" OR "passenger ferry"',
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
    
    // STRICT FILTER: Only keep articles relevant to WSDOT ferry operations
    const relevantArticles = allArticles.filter(isRelevantToWSDOT);
    
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
        message: 'No news matching Puget Sound ferry operations found',
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
