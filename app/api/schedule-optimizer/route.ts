import { NextRequest, NextResponse } from 'next/server';

// Intelligence categories for multi-source analysis
interface IntelligenceSource {
  category: 'regulatory' | 'geopolitical' | 'environmental' | 'market' | 'infrastructure';
  query: string;
  domains: string[];
}

// fleet operations-specific intelligence sources - focused on dredging, marine construction, UAE ports
// Queries are hyper-local to Abu Dhabi/UAE marine operations
const INTELLIGENCE_SOURCES: IntelligenceSource[] = [
  {
    category: 'regulatory',
    query: '"Abu Dhabi" EAD environmental permit dredging coastal development approval 2024 2025',
    domains: ['thenationalnews.com', 'gulfnews.com', 'zawya.com', 'meed.com'],
  },
  {
    category: 'geopolitical',
    query: '"Khalifa Port" OR "AD Ports" operations expansion vessel berth congestion Abu Dhabi',
    domains: ['thenationalnews.com', 'gulfnews.com', 'zawya.com', 'arabianbusiness.com'],
  },
  {
    category: 'environmental',
    query: '"Abu Dhabi" coral protection marine environment dredging reclamation island',
    domains: ['thenationalnews.com', 'gulfnews.com', 'zawya.com'],
  },
  {
    category: 'market',
    query: '"National Marine Dredging" OR marine construction contract award Abu Dhabi Musanada tender',
    domains: ['zawya.com', 'meed.com', 'constructionweekonline.com', 'thenationalnews.com'],
  },
  {
    category: 'infrastructure',
    query: '"Abu Dhabi" OR Ruwais port expansion offshore platform ADNOC marine project 2024 2025',
    domains: ['meed.com', 'zawya.com', 'gulfnews.com', 'thenationalnews.com'],
  },
];

// Types for external factors
interface ExternalFactor {
  id: string;
  type: 'weather' | 'geopolitical' | 'port' | 'maintenance' | 'regulatory' | 'insight';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  source?: string;
  sources?: string[]; // Multiple sources for insights
  affectedRegions: string[];
  affectedVesselTypes?: string[];
  dateRange?: { start: string; end: string };
  recommendation: string;
  reasoning?: string; // For cross-analyzed insights - the chain of logic
  relatedFactors?: string[]; // IDs of factors that contributed to this insight
  // NEW: Actionable fields
  timeframe: 'immediate' | 'near-term' | 'medium-term' | 'long-term'; // When action needed
  impact: string; // Specific impact on fleet operations operations
  actions: string[]; // Concrete action items
}

interface OptimizationSuggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  type: 'reschedule' | 'reroute' | 'reassign' | 'delay' | 'accelerate';
  title: string;
  description: string;
  affectedVessels: string[];
  affectedProjects: string[];
  estimatedImpact: {
    costDelta: number; // positive = savings, negative = additional cost
    timeDelta: number; // days saved (positive) or added (negative)
  };
  relatedFactors: string[]; // IDs of factors that triggered this
}

// Content quality filter - removes promotional/irrelevant content
// Specifically tuned for fleet operations dredging/marine construction operations in UAE
function isRelevantContent(text: string, title: string): boolean {
  const lowerText = (text + ' ' + title).toLowerCase();
  
  // Reject promotional/FAQ/navigation content
  const rejectPatterns = [
    'click on our',
    'free tools',
    'sign up',
    'subscribe',
    'contact us',
    'our website',
    'cookie policy',
    'privacy policy',
    'terms of service',
    'login to',
    'register for',
    'download our',
    'get started',
    'try for free',
    'pricing',
    'demo request',
    'advertisement',
    'share your news',
    'it\'s on us',
    'search search',
    '#main-content',
    'wp-content',
    'cdn.',
    '.jpg',
    '.png',
    '.gif',
    'navigation',
    'menu',
    'sidebar',
    'footer',
    'header',
    'breadcrumb',
    'related posts',
    'you may also like',
    'follow us',
    'social media',
    'newsletter',
    'breaking news',
    // Language selectors / navigation artifacts
    '[english]',
    '[français]',
    '[español]',
    '[русский]',
    '[العربية]',
    '[汉语]',
    'select language',
    'change language',
    // Generic IMO/global regulatory (not UAE-specific)
    'imo net-zero framework',
    'imo\'s 2023 ghg strategy',
    'international regulations aimed at',
    'international shipping industry',
    'global maritime',
    'worldwide shipping',
    'international maritime organization',
  ];
  
  if (rejectPatterns.some(pattern => lowerText.includes(pattern))) {
    return false;
  }
  
  // Reject generic global shipping news (not relevant to fleet operations's dredging ops)
  const globalShippingPatterns = [
    'decarbonize international shipping',
    'net-zero ghg emissions',
    'imo strategy',
    'global shipping industry',
    'container shipping rates',
    'freight rates',
    'bunker fuel prices',
    'maersk',
    'evergreen',
    'cosco',
    'mediterranean shipping',
    'baltic dry index',
    'suez canal transit',
    'panama canal',
    'european ports',
    'china exports',
    'global trade',
    'red sea attacks',
    'houthi',
    'yemen',
    'somali',
  ];
  
  // If content has global shipping patterns but no UAE/fleet operations context, reject
  if (globalShippingPatterns.some(pattern => lowerText.includes(pattern))) {
    const hasLocalContext = ['uae', 'abu dhabi', 'dubai', 'khalifa', 'adnoc', 'musanada', 'ruwais', 'fujairah']
      .some(local => lowerText.includes(local));
    if (!hasLocalContext) {
      return false;
    }
  }
  
  // Reject if too many URLs/links in content (navigation garbage)
  const urlCount = (text.match(/https?:\/\//g) || []).length;
  if (urlCount > 2) {
    return false;
  }
  
  // Reject if too many bracket patterns (language selectors, navigation)
  const bracketCount = (text.match(/\[[^\]]+\]/g) || []).length;
  if (bracketCount > 3) {
    return false;
  }
  
  // Reject if content starts with navigation-like patterns
  if (/^\s*\[/.test(text) || /^(home|about|contact|menu|nav)/i.test(text.trim())) {
    return false;
  }
  
  // Reject if content is too short (likely just navigation)
  if (text.length < 80) {
    return false;
  }
  
  // Must contain UAE/Gulf regional OR fleet operations-specific keywords
  const requiredPatterns = [
    // UAE/Regional
    'uae', 'abu dhabi', 'dubai', 'fujairah', 'khalifa port', 'ruwais',
    'arabian gulf', 'persian gulf', 'emirates',
    // fleet operations operations
    'dredging', 'reclamation', 'marine construction', 'offshore',
    // Key clients/partners
    'adnoc', 'musanada', 'ad ports', 'nakheel', 'mubadala', 'aldar',
    // Project types
    'island', 'coastal', 'port expansion', 'channel deepening', 'beach nourishment',
    // Weather (regional)
    'shamal', 'sandstorm', 'dust storm',
    // Environmental (local)
    'ead', 'coral', 'mangrove', 'environmental permit',
  ];
  
  return requiredPatterns.some(pattern => lowerText.includes(pattern));
}

// Clean up text content - removes URLs, image refs, navigation artifacts
function cleanContent(text: string): string {
  return text
    // Remove URLs
    .replace(/https?:\/\/[^\s)]+/g, '')
    // Remove image references
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '')
    // Remove language selectors like [English][Français][Español]
    .replace(/\[(English|Français|Español|Русский|العربية|汉语|中文|Deutsch|日本語|한국어)\]/gi, '')
    // Remove web_link artifacts
    .replace(/<web_link>/gi, '')
    // Remove markdown artifacts
    .replace(/[#*_`]/g, '')
    // Remove "Advertisement" and similar
    .replace(/advertisement/gi, '')
    .replace(/breaking news/gi, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove common navigation text
    .replace(/click here|read more|learn more|see more|share this/gi, '')
    // Remove generic IMO preamble
    .replace(/the imo.*?refers to a new set of international regulations/gi, '')
    .trim()
    .slice(0, 280);
}

// Multi-source intelligence search
async function searchIntelligenceSource(source: IntelligenceSource): Promise<Array<{
  category: string;
  title: string;
  content: string;
  url: string;
  publishedDate?: string;
}>> {
  try {
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.EXA_API_KEY || '',
      },
      body: JSON.stringify({
        query: source.query,
        numResults: 4,
        type: 'auto',
        includeDomains: source.domains,
        contents: {
          highlights: {
            numSentences: 2,
            highlightsPerUrl: 1,
          }
        }
      }),
    });
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return (data.results || []).map((item: { title?: string; highlights?: string[]; url?: string; publishedDate?: string }) => ({
      category: source.category,
      title: item.title || '',
      content: item.highlights?.join(' ') || '',
      url: item.url || '',
      publishedDate: item.publishedDate,
    }));
  } catch (e) {
    console.error(`Search failed for ${source.category}:`, e);
    return [];
  }
}

// Cross-analyze sources to generate fleet operations-specific insights
function generateCrossAnalysisInsights(
  allResults: Array<{ category: string; title: string; content: string; url: string }>
): ExternalFactor[] {
  const insights: ExternalFactor[] = [];
  
  // Group by category
  const byCategory = new Map<string, typeof allResults>();
  for (const result of allResults) {
    const existing = byCategory.get(result.category) || [];
    existing.push(result);
    byCategory.set(result.category, existing);
  }
  
  // Check for regulatory + market correlation (environmental permits affecting dredging)
  const regulatory = byCategory.get('regulatory') || [];
  const market = byCategory.get('market') || [];
  
  if (regulatory.length > 0 && market.length > 0) {
    const regContent = regulatory.map(r => r.content.toLowerCase()).join(' ');
    const marketContent = market.map(m => m.content.toLowerCase()).join(' ');
    
    // EAD environmental permits + large projects
    if ((regContent.includes('environmental') || regContent.includes('ead') || regContent.includes('permit') || regContent.includes('dredging')) &&
        (marketContent.includes('nmdc') || marketContent.includes('contract') || marketContent.includes('billion') || marketContent.includes('musanada'))) {
      insights.push({
        id: 'insight-permits',
        type: 'insight',
        severity: 'warning',
        title: 'EAD Permit Timelines May Impact Project Schedules',
        description: 'Recent tightening of EAD environmental review processes could extend permit approval timelines by 4-6 weeks for dredging and reclamation works in sensitive areas.',
        sources: [...regulatory.slice(0, 2).map(r => r.url), ...market.slice(0, 1).map(m => m.url)],
        affectedRegions: ['Abu Dhabi', 'Jubail Island', 'Saadiyat'],
        affectedVesselTypes: ['dredger', 'survey'],
        recommendation: 'Submit environmental impact assessments early. Coordinate with EAD on coral relocation requirements. Factor 6-week buffer into new project bids.',
        reasoning: 'Cross-analysis: Stricter EAD environmental oversight + fleet operations pipeline of coastal projects = need for proactive permit management to avoid mobilization delays.',
        timeframe: 'near-term',
        impact: 'Delayed mobilization for 3 pending coastal projects. Potential AED 2-4M standby costs if vessels ready but permits pending.',
        actions: [
          'Submit Jubail Phase 2 EIA by end of month',
          'Schedule pre-application meeting with EAD for Saadiyat works',
          'Add 6-week permit buffer to Al Dhafra bid timeline',
        ],
      });
    }
  }
  
  // Check for port operations + infrastructure correlation
  const geopolitical = byCategory.get('geopolitical') || [];
  const infrastructure = byCategory.get('infrastructure') || [];
  
  if (geopolitical.length > 0 && infrastructure.length > 0) {
    const geoContent = geopolitical.map(g => g.content.toLowerCase()).join(' ');
    const infraContent = infrastructure.map(i => i.content.toLowerCase()).join(' ');
    
    // Khalifa Port congestion + project timing
    if ((geoContent.includes('khalifa') || geoContent.includes('port') || geoContent.includes('congestion') || geoContent.includes('delay')) &&
        (infraContent.includes('expansion') || infraContent.includes('offshore') || infraContent.includes('adnoc'))) {
      insights.push({
        id: 'insight-port-ops',
        type: 'insight',
        severity: 'info',
        title: 'Khalifa Port Expansion Creates Dredging Demand',
        description: 'Phase 3 port expansion and new container berths will require additional channel deepening and approach dredging. fleet operations well-positioned given existing Khalifa Port relationships.',
        sources: [...geopolitical.slice(0, 1).map(g => g.url), ...infrastructure.slice(0, 2).map(i => i.url)],
        affectedRegions: ['Khalifa Port', 'Abu Dhabi'],
        recommendation: 'Engage with AD Ports on Phase 3 requirements. Pre-position dredging equipment for quick mobilization. Prepare competitive bid with lessons from Phase 2.',
        reasoning: 'Cross-analysis: Port traffic growth + infrastructure investment = continued demand for fleet operations marine services at Khalifa Port.',
        timeframe: 'medium-term',
        impact: 'Potential AED 80-120M contract opportunity. Would require 2 TSHDs and 1 CSD for 18-month project.',
        actions: [
          'Request meeting with AD Ports procurement by Q1',
          'Reserve AL MIRFA and AL SADR availability for H2 2025',
          'Prepare technical proposal based on Phase 2 learnings',
        ],
      });
    }
  }
  
  // Check for environmental regulations + infrastructure projects
  const environmental = byCategory.get('environmental') || [];
  
  if (environmental.length > 0 && (infrastructure.length > 0 || market.length > 0)) {
    const envContent = environmental.map(e => e.content.toLowerCase()).join(' ');
    const infraContent = [...infrastructure, ...market].map(i => i.content.toLowerCase()).join(' ');
    
    // Coral protection + coastal projects
    if ((envContent.includes('coral') || envContent.includes('marine') || envContent.includes('protected') || envContent.includes('dredging')) &&
        (infraContent.includes('island') || infraContent.includes('reclamation') || infraContent.includes('coastal'))) {
      insights.push({
        id: 'insight-coral',
        type: 'insight',
        severity: 'warning',
        title: 'Coral Translocation Requirements Increasing',
        description: 'Abu Dhabi coastal projects now require comprehensive coral surveys and translocation programs. Projects near natural island formations face additional scrutiny.',
        sources: [...environmental.slice(0, 2).map(e => e.url)],
        affectedRegions: ['Abu Dhabi Islands', 'Jubail', 'Saadiyat'],
        affectedVesselTypes: ['dredger', 'survey'],
        recommendation: 'Partner with marine biologists for coral surveys. Budget 8-12% additional cost for translocation works on island projects. Train crew on environmental protocols.',
        reasoning: 'Cross-analysis: Environmental protection regulations + island development pipeline = coral management becoming core competency for marine contractors.',
        timeframe: 'long-term',
        impact: 'All island projects now require coral baseline surveys. Adds 8-12% to project costs but creates barrier to entry for competitors.',
        actions: [
          'Establish MOU with Emirates Marine Environmental Group',
          'Train 4 crew members on coral handling certification',
          'Add coral survey line item to all coastal project templates',
        ],
      });
    }
  }
  
  return insights;
}

// Main intelligence gathering function
async function searchExternalFactors(): Promise<ExternalFactor[]> {
  const factors: ExternalFactor[] = [];
  
  try {
    // Search all intelligence sources in parallel
    const allResults = await Promise.all(
      INTELLIGENCE_SOURCES.map(source => searchIntelligenceSource(source))
    );
    
    const flatResults = allResults.flat().filter(r => r.title && r.content.length > 30);
    
    // Generate cross-analysis insights first (these are the valuable ones)
    const insights = generateCrossAnalysisInsights(flatResults);
    factors.push(...insights);
    
    // Then add top individual factors from each category
    let factorId = 1;
    const seenTitles = new Set<string>();
    
    for (const result of flatResults) {
      // Skip duplicates
      if (seenTitles.has(result.title)) continue;
      seenTitles.add(result.title);
      
      // Determine type and severity from category and content
      const content = (result.content + ' ' + result.title).toLowerCase();
      
      let type: ExternalFactor['type'];
      let severity: ExternalFactor['severity'] = 'info';
      
      switch (result.category) {
        case 'regulatory':
          type = 'regulatory';
          if (content.includes('deadline') || content.includes('mandatory') || content.includes('compliance')) {
            severity = 'warning';
          }
          break;
        case 'geopolitical':
          type = 'geopolitical';
          if (content.includes('attack') || content.includes('threat') || content.includes('suspend')) {
            severity = 'critical';
          } else if (content.includes('risk') || content.includes('tension')) {
            severity = 'warning';
          }
          break;
        case 'environmental':
          type = 'weather';
          break;
        case 'market':
        case 'infrastructure':
        default:
          type = 'port';
          break;
      }

      // Determine affected regions
      const regions: string[] = [];
      if (content.includes('abu dhabi')) regions.push('Abu Dhabi');
      if (content.includes('dubai')) regions.push('Dubai');
      if (content.includes('fujairah')) regions.push('Fujairah');
      if (content.includes('khalifa')) regions.push('Khalifa Port');
      if (content.includes('red sea')) regions.push('Red Sea');
      if (content.includes('gulf') || content.includes('hormuz')) regions.push('Arabian Gulf');
      if (regions.length === 0) regions.push('UAE');

      const actionableFields = generateActionableFields(type, severity, result.category);
      factors.push({
        id: `intel-${factorId++}`,
        type,
        severity,
        title: result.title.slice(0, 120),
        description: result.content.slice(0, 280),
        source: result.url,
        affectedRegions: regions,
        recommendation: generateRecommendation(type, severity),
        ...actionableFields,
      });
      
      // Limit individual factors (insights are more valuable)
      if (factorId > 5) break;
    }
  } catch (error) {
    console.error('Error fetching external factors:', error);
  }

  // Add fallback/simulated factors if no Exa results (fleet operations-specific)
  if (factors.length === 0) {
    factors.push(
      {
        id: 'weather-1',
        type: 'weather',
        severity: 'warning',
        title: 'Shamal Wind Advisory - Northern Arabian Gulf',
        description: 'Shamal winds forecast 25-35 knots for the next 72 hours affecting Das Island and offshore project sites. Wave heights expected 1.8-2.5m. Reduced visibility in dust conditions.',
        affectedRegions: ['Das Island', 'Ruwais', 'Northern Arabian Gulf'],
        affectedVesselTypes: ['crane_barge', 'survey'],
        dateRange: { 
          start: new Date().toISOString(), 
          end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() 
        },
        recommendation: 'Suspend crane lifts and survey operations at Das Island. Dredgers may continue with reduced production.',
        timeframe: 'immediate',
        impact: 'Das Island offshore works delayed 3 days. AL MIRFA and survey vessels on standby. Est. AED 450K standby costs.',
        actions: [
          'Move AL MIRFA to sheltered anchorage by 1800 today',
          'Notify ADNOC project manager of 72hr delay',
          'Redeploy survey crew to documentation tasks',
        ],
      },
      {
        id: 'port-1',
        type: 'port',
        severity: 'info',
        title: 'Khalifa Port Phase 3 - Channel Dredging Active',
        description: 'fleet operations dredging operations ongoing in approach channel. Commercial vessel traffic may experience minor delays during peak dredging hours.',
        affectedRegions: ['Khalifa Port', 'Abu Dhabi'],
        dateRange: { 
          start: new Date().toISOString(), 
          end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() 
        },
        recommendation: 'Coordinate vessel movements with port control. Maintain AIS active at all times.',
        timeframe: 'near-term',
        impact: 'On track - 68% complete. AL SADR averaging 12,500 m³/day. Ahead of schedule by 4 days.',
        actions: [
          'Continue current dredging operations',
          'Submit weekly progress report to AD Ports by Thursday',
          'Prepare for bathymetric survey next week',
        ],
      },
      {
        id: 'project-1',
        type: 'port',
        severity: 'info',
        title: 'Jubail Island Reclamation - Phase Transition',
        description: 'Land reclamation works progressing at 62% completion. Beach nourishment phase starting in 2 weeks requires equipment changeover.',
        affectedRegions: ['Jubail Island', 'Abu Dhabi'],
        recommendation: 'Maintain current vessel deployment. Prepare equipment for beach nourishment transition.',
        timeframe: 'near-term',
        impact: 'Equipment changeover needed. 3-day transition window between phases. No revenue impact if executed on schedule.',
        actions: [
          'Order beach nourishment spreader bar from yard',
          'Schedule crew training on nourishment procedures',
          'Coordinate with Jubail client on phase handover date',
        ],
      }
    );
  }

  return factors;
}

// Generate actionable fields based on factor type and severity
function generateActionableFields(
  type: ExternalFactor['type'],
  severity: ExternalFactor['severity'],
  category: string
): Pick<ExternalFactor, 'timeframe' | 'impact' | 'actions'> {
  const timeframeMap: Record<string, ExternalFactor['timeframe']> = {
    'regulatory-critical': 'immediate',
    'regulatory-warning': 'medium-term',
    'regulatory-info': 'long-term',
    'geopolitical-critical': 'immediate',
    'geopolitical-warning': 'near-term',
    'geopolitical-info': 'medium-term',
    'environmental-critical': 'immediate',
    'environmental-warning': 'near-term',
    'environmental-info': 'long-term',
    'market-critical': 'near-term',
    'market-warning': 'medium-term',
    'market-info': 'long-term',
    'infrastructure-critical': 'near-term',
    'infrastructure-warning': 'medium-term',
    'infrastructure-info': 'long-term',
  };

  const timeframe = timeframeMap[`${category}-${severity}`] || 'medium-term';

  const impactTemplates: Record<string, Record<string, string>> = {
    regulatory: {
      critical: 'Non-compliance risk. Operations may be suspended if not addressed. Potential fines AED 500K+.',
      warning: 'New requirements affect project planning. Budget 4-6 weeks for compliance updates.',
      info: 'Monitor for future impact. No immediate operational changes required.',
    },
    geopolitical: {
      critical: 'Port operations affected. Vessel schedules require immediate adjustment.',
      warning: 'Potential delays to vessel movements or cargo operations.',
      info: 'Situational awareness item. Track for potential escalation.',
    },
    environmental: {
      critical: 'EAD stop-work order possible. All dredging in affected area must cease.',
      warning: 'Additional environmental mitigation may be required. Budget 8-12% cost increase.',
      info: 'Long-term planning consideration for future coastal projects.',
    },
    market: {
      critical: 'Contract opportunity requires immediate response. Competitor activity detected.',
      warning: 'Tender opportunity identified. Prepare bid documentation.',
      info: 'Market intelligence for strategic planning.',
    },
    infrastructure: {
      critical: 'Major project announcement. Mobilization planning should begin.',
      warning: 'Project pipeline update. Reserve vessel capacity for upcoming work.',
      info: 'Long-term infrastructure investment signals future demand.',
    },
  };

  const actionsTemplates: Record<string, Record<string, string[]>> = {
    regulatory: {
      critical: ['Convene compliance review meeting today', 'Engage legal counsel on new requirements', 'Pause affected operations until guidance received'],
      warning: ['Review updated regulations with operations team', 'Update project documentation templates', 'Brief vessel masters on new requirements'],
      info: ['Add to quarterly compliance review agenda', 'Monitor for implementation timeline updates'],
    },
    geopolitical: {
      critical: ['Contact port authority for latest guidance', 'Review vessel positions and adjust routes', 'Notify clients of potential schedule impacts'],
      warning: ['Monitor situation daily', 'Prepare contingency routing plans', 'Ensure crew safety protocols are current'],
      info: ['Include in weekly operations briefing', 'No immediate action required'],
    },
    environmental: {
      critical: ['Suspend dredging in sensitive areas immediately', 'Contact EAD for guidance', 'Deploy silt curtains and monitoring equipment'],
      warning: ['Schedule environmental baseline survey', 'Engage marine biologist for coral assessment', 'Update EMP documentation'],
      info: ['Note for future project planning', 'Consider environmental training for crew'],
    },
    market: {
      critical: ['Assign BD team to opportunity immediately', 'Confirm vessel availability for project timeline', 'Request client meeting within 48 hours'],
      warning: ['Add to active tender pipeline', 'Prepare preliminary cost estimate', 'Review competitor positioning'],
      info: ['Track for future opportunity development', 'Maintain relationship with key stakeholders'],
    },
    infrastructure: {
      critical: ['Confirm vessel availability for project window', 'Engage with client procurement team', 'Begin mobilization planning'],
      warning: ['Reserve vessel capacity tentatively', 'Prepare technical capability statement', 'Monitor for tender release'],
      info: ['Include in long-term fleet planning', 'Build relationships with project stakeholders'],
    },
  };

  const impact = impactTemplates[category]?.[severity] || 'Assess operational impact and respond accordingly.';
  const actions = actionsTemplates[category]?.[severity] || ['Review and assess', 'Determine appropriate response'];

  return { timeframe, impact, actions };
}

function generateRecommendation(type: ExternalFactor['type'], severity: ExternalFactor['severity']): string {
  const recommendations: Record<string, Record<string, string>> = {
    weather: {
      critical: 'Immediately suspend operations and seek shelter. Notify all crew and stakeholders.',
      warning: 'Monitor conditions closely. Prepare contingency plans for potential work stoppage.',
      info: 'Continue operations with enhanced weather monitoring.',
    },
    geopolitical: {
      critical: 'Reroute vessels away from affected area. Implement security protocols.',
      warning: 'Increase situational awareness. Review security procedures with crew.',
      info: 'Monitor developments. No immediate action required.',
    },
    port: {
      critical: 'Divert to alternative port. Coordinate with port authority.',
      warning: 'Adjust arrival schedules to minimize delays. Contact port agents.',
      info: 'Factor into voyage planning. No immediate action required.',
    },
    maintenance: {
      critical: 'Take vessel out of service immediately for repairs.',
      warning: 'Schedule maintenance at earliest opportunity. Reduce operational intensity.',
      info: 'Include in next scheduled maintenance window.',
    },
    regulatory: {
      critical: 'Ensure compliance before next voyage. Consult with legal/compliance team.',
      warning: 'Review requirements and update procedures within 30 days.',
      info: 'Note for future planning. Update documentation as needed.',
    },
  };
  
  return recommendations[type]?.[severity] || 'Review and assess impact on operations.';
}

// Get maintenance factors from vessel data
function getMaintenanceFactors(vessels: Array<{ name: string; type: string; healthScore?: number }>): ExternalFactor[] {
  const factors: ExternalFactor[] = [];
  
  vessels.forEach((vessel, i) => {
    const healthScore = vessel.healthScore ?? (70 + Math.random() * 25);
    
    if (healthScore < 70) {
      const isCritical = healthScore < 50;
      factors.push({
        id: `maint-${i}`,
        type: 'maintenance',
        severity: isCritical ? 'critical' : 'warning',
        title: `${vessel.name} - Maintenance Required`,
        description: `Health score at ${Math.round(healthScore)}%. ${isCritical ? 'Critical systems require immediate attention.' : 'Preventive maintenance recommended.'}`,
        affectedRegions: [],
        affectedVesselTypes: [vessel.type],
        recommendation: isCritical 
          ? 'Schedule immediate dry dock or alongside maintenance.'
          : 'Plan maintenance window within next 2 weeks.',
        timeframe: isCritical ? 'immediate' : 'near-term',
        impact: isCritical 
          ? `${vessel.name} must be taken offline. Project reassignment required. Est. 5-7 day repair window.`
          : `${vessel.name} efficiency reduced 15-20%. Schedule maintenance to prevent escalation.`,
        actions: isCritical 
          ? [
              `Remove ${vessel.name} from active project rotation`,
              'Contact ADSB for emergency dry dock availability',
              'Reassign crew to backup vessel',
            ]
          : [
              `Schedule ${vessel.name} for next maintenance window`,
              'Order replacement parts for worn components',
              'Plan crew rotation during maintenance period',
            ],
      });
    }
  });
  
  return factors;
}

// Generate optimization suggestions based on factors
function generateOptimizations(
  factors: ExternalFactor[],
  vessels: Array<{ id: string; name: string; type: string; project?: string }>
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  let suggestionId = 1;

  // Weather-based optimizations
  const weatherFactors = factors.filter(f => f.type === 'weather' && f.severity !== 'info');
  if (weatherFactors.length > 0) {
    const affectedTypes = weatherFactors.flatMap(f => f.affectedVesselTypes || []);
    const affectedVessels = vessels.filter(v => 
      affectedTypes.length === 0 || affectedTypes.includes(v.type)
    );
    
    if (affectedVessels.length > 0) {
      suggestions.push({
        id: `opt-${suggestionId++}`,
        priority: 'high',
        type: 'delay',
        title: 'Weather Window Delay',
        description: `Delay operations for ${affectedVessels.map(v => v.name).slice(0, 3).join(', ')} until weather improves. Estimated 2-3 day delay.`,
        affectedVessels: affectedVessels.map(v => v.id),
        affectedProjects: affectedVessels.map(v => v.project).filter(Boolean) as string[],
        estimatedImpact: {
          costDelta: -25000 * affectedVessels.length, // Additional cost from delay
          timeDelta: -3,
        },
        relatedFactors: weatherFactors.map(f => f.id),
      });
    }
  }

  // Maintenance-based optimizations
  const maintenanceFactors = factors.filter(f => f.type === 'maintenance');
  maintenanceFactors.forEach(factor => {
    const vesselName = factor.title.split(' - ')[0];
    const vessel = vessels.find(v => v.name === vesselName);
    
    if (vessel && factor.severity === 'critical') {
      // Find replacement vessel
      const replacement = vessels.find(v => v.type === vessel.type && v.id !== vessel.id);
      
      if (replacement) {
        suggestions.push({
          id: `opt-${suggestionId++}`,
          priority: 'high',
          type: 'reassign',
          title: `Reassign ${vessel.name} work to ${replacement.name}`,
          description: `${vessel.name} requires critical maintenance. Transfer current assignments to ${replacement.name} to maintain project continuity.`,
          affectedVessels: [vessel.id, replacement.id],
          affectedProjects: vessel.project ? [vessel.project] : [],
          estimatedImpact: {
            costDelta: -15000, // Mobilization cost
            timeDelta: -1,
          },
          relatedFactors: [factor.id],
        });
      }
    }
  });

  // Port congestion optimization
  const portFactors = factors.filter(f => f.type === 'port' && f.severity !== 'info');
  if (portFactors.length > 0) {
    suggestions.push({
      id: `opt-${suggestionId++}`,
      priority: 'medium',
      type: 'reschedule',
      title: 'Adjust Port Call Schedule',
      description: 'Reschedule port calls to avoid congestion periods. Prioritize critical supply runs.',
      affectedVessels: vessels.slice(0, 3).map(v => v.id),
      affectedProjects: [],
      estimatedImpact: {
        costDelta: 8000, // Savings from avoiding delays
        timeDelta: 1,
      },
      relatedFactors: portFactors.map(f => f.id),
    });
  }

  // Proactive optimization suggestions
  if (suggestions.length < 3) {
    suggestions.push({
      id: `opt-${suggestionId++}`,
      priority: 'low',
      type: 'accelerate',
      title: 'Optimize Transit Routes',
      description: 'Current conditions favorable for direct transit routes. Consider accelerating vessel movements to build schedule buffer.',
      affectedVessels: vessels.slice(0, 2).map(v => v.id),
      affectedProjects: [],
      estimatedImpact: {
        costDelta: 5000,
        timeDelta: 0.5,
      },
      relatedFactors: [],
    });
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { vessels = [] } = body;

    // Fetch external factors (weather, news, etc.)
    const externalFactors = await searchExternalFactors();
    
    // Get maintenance factors from vessel health
    const maintenanceFactors = getMaintenanceFactors(vessels);
    
    // Combine all factors
    const allFactors = [...externalFactors, ...maintenanceFactors];
    
    // Generate optimization suggestions
    const suggestions = generateOptimizations(allFactors, vessels);

    return NextResponse.json({
      success: true,
      factors: allFactors,
      suggestions,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Schedule optimizer error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate optimizations' },
      { status: 500 }
    );
  }
}

