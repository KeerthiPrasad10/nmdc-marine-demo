import { NextRequest, NextResponse } from 'next/server';

// Intelligence categories for multi-source analysis
interface IntelligenceSource {
  category: 'regulatory' | 'geopolitical' | 'environmental' | 'market' | 'infrastructure';
  query: string;
  domains: string[];
}

// WSDOT-specific intelligence sources - focused on ferry operations, Puget Sound
// Queries are hyper-local to Washington State ferry operations
const INTELLIGENCE_SOURCES: IntelligenceSource[] = [
  {
    category: 'regulatory',
    query: 'WSDOT "Washington State Ferries" regulation USCG safety inspection compliance 2025 2026',
    domains: ['seattletimes.com', 'king5.com', 'wsdot.wa.gov', 'kuow.org'],
  },
  {
    category: 'geopolitical',
    query: '"Puget Sound" ferry terminal construction expansion dock repair',
    domains: ['seattletimes.com', 'king5.com', 'kitsapsun.com', 'islandssounder.com'],
  },
  {
    category: 'environmental',
    query: '"Puget Sound" orca whale protection marine environment ferry emissions',
    domains: ['seattletimes.com', 'kuow.org', 'crosscut.com'],
  },
  {
    category: 'market',
    query: 'WSDOT ferry "new vessel" contract shipyard construction electrification',
    domains: ['seattletimes.com', 'marinelog.com', 'workboat.com', 'king5.com'],
  },
  {
    category: 'infrastructure',
    query: '"Washington State Ferries" terminal dock improvement infrastructure 2025 2026',
    domains: ['seattletimes.com', 'kitsapsun.com', 'king5.com', 'wsdot.wa.gov'],
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
  impact: string; // Specific impact on WSDOT ferry operations
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
// Specifically tuned for WSDOT ferry operations in Puget Sound
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
  
  // Reject generic global shipping news (not relevant to WSDOT ferry ops)
  const globalShippingPatterns = [
    'decarbonize international shipping',
    'net-zero ghg emissions',
    'imo strategy',
    'global shipping industry',
    'container shipping rates',
    'freight rates',
    'bunker fuel prices',
    'maersk',
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
  
  // If content has global shipping patterns but no WSDOT/Puget Sound context, reject
  if (globalShippingPatterns.some(pattern => lowerText.includes(pattern))) {
    const hasLocalContext = ['wsdot', 'washington', 'puget sound', 'seattle', 'bainbridge', 'bremerton', 'anacortes', 'san juan', 'whidbey']
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
  
  // Must contain Puget Sound/WA regional OR WSDOT-specific keywords
  const requiredPatterns = [
    // Washington/Regional
    'washington', 'seattle', 'puget sound', 'bainbridge', 'bremerton',
    'anacortes', 'san juan', 'whidbey', 'edmonds', 'kingston',
    // WSDOT operations
    'wsdot', 'ferry', 'ferries', 'passenger vessel', 'vehicle ferry',
    // Key partners/agencies
    'uscg', 'coast guard', 'noaa', 'wsdot ferries',
    // Project types
    'island', 'coastal', 'port expansion', 'channel deepening', 'beach nourishment',
    // Weather (regional)
    'storm', 'wind advisory', 'fog', 'heavy rain',
    // Environmental (local)
    'orca', 'salmon', 'marine mammal', 'environmental permit',
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

// Cross-analyze sources to generate WSDOT-specific insights
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
  
  // Check for regulatory + market correlation (USCG inspections affecting ferry service)
  const regulatory = byCategory.get('regulatory') || [];
  const market = byCategory.get('market') || [];
  
  if (regulatory.length > 0 && market.length > 0) {
    const regContent = regulatory.map(r => r.content.toLowerCase()).join(' ');
    const marketContent = market.map(m => m.content.toLowerCase()).join(' ');
    
    // USCG inspections + new vessel construction
    if ((regContent.includes('inspection') || regContent.includes('uscg') || regContent.includes('compliance') || regContent.includes('safety')) &&
        (marketContent.includes('wsdot') || marketContent.includes('contract') || marketContent.includes('vessel') || marketContent.includes('shipyard'))) {
      insights.push({
        id: 'insight-inspections',
        type: 'insight',
        severity: 'warning',
        title: 'USCG Inspection Schedule May Impact Route Coverage',
        description: 'Upcoming USCG annual inspections could require pulling vessels from service for 3-5 day periods. Combined with new vessel construction delays, fleet capacity may be strained.',
        sources: [...regulatory.slice(0, 2).map(r => r.url), ...market.slice(0, 1).map(m => m.url)],
        affectedRegions: ['Seattle - Bainbridge', 'Anacortes - San Juan Islands'],
        affectedVesselTypes: ['ferry'],
        recommendation: 'Stagger inspection schedules across routes. Coordinate backup vessel assignments. Pre-stage spare parts for common inspection findings.',
        reasoning: 'Cross-analysis: USCG inspection requirements + aging fleet + new build delays = need for proactive maintenance scheduling to maintain route coverage.',
        timeframe: 'near-term',
        impact: 'Potential 2-3 route service reductions during inspection periods. Estimated $150K-300K in lost revenue per vessel per inspection week.',
        actions: [
          'Submit proposed inspection schedule to USCG Sector Puget Sound',
          'Arrange relief vessel assignments for peak inspection period',
          'Pre-stage common inspection repair items at Eagle Harbor maintenance facility',
        ],
      });
    }
  }
  
  // Check for terminal operations + infrastructure correlation
  const geopolitical = byCategory.get('geopolitical') || [];
  const infrastructure = byCategory.get('infrastructure') || [];
  
  if (geopolitical.length > 0 && infrastructure.length > 0) {
    const geoContent = geopolitical.map(g => g.content.toLowerCase()).join(' ');
    const infraContent = infrastructure.map(i => i.content.toLowerCase()).join(' ');
    
    // Terminal construction + service disruption
    if ((geoContent.includes('terminal') || geoContent.includes('dock') || geoContent.includes('construction') || geoContent.includes('repair')) &&
        (infraContent.includes('expansion') || infraContent.includes('improvement') || infraContent.includes('infrastructure'))) {
      insights.push({
        id: 'insight-terminal-ops',
        type: 'insight',
        severity: 'info',
        title: 'Terminal Improvements Create Temporary Service Adjustments',
        description: 'Planned terminal dock improvements at multiple locations will require temporary slip closures. This creates opportunities for schedule optimization and route consolidation.',
        sources: [...geopolitical.slice(0, 1).map(g => g.url), ...infrastructure.slice(0, 2).map(i => i.url)],
        affectedRegions: ['Colman Dock', 'Mukilteo', 'Edmonds'],
        recommendation: 'Coordinate construction windows with low-ridership periods. Develop temporary shuttle routes. Communicate schedule changes to commuters early.',
        reasoning: 'Cross-analysis: Terminal construction timelines + ridership patterns = opportunity to minimize disruption by scheduling work during off-peak periods.',
        timeframe: 'medium-term',
        impact: 'Temporary capacity reduction on 2-3 routes. Potential 15% ridership diversion to alternate routes.',
        actions: [
          'Publish construction impact schedule 60 days in advance',
          'Deploy additional vessels on alternate routes during closures',
          'Coordinate with King County Metro for bus bridge service',
        ],
      });
    }
  }
  
  // Check for environmental regulations + ferry operations
  const environmental = byCategory.get('environmental') || [];
  
  if (environmental.length > 0 && (infrastructure.length > 0 || market.length > 0)) {
    const envContent = environmental.map(e => e.content.toLowerCase()).join(' ');
    const infraContent = [...infrastructure, ...market].map(i => i.content.toLowerCase()).join(' ');
    
    // Orca protection + speed restrictions
    if ((envContent.includes('orca') || envContent.includes('whale') || envContent.includes('marine mammal') || envContent.includes('emissions')) &&
        (infraContent.includes('ferry') || infraContent.includes('vessel') || infraContent.includes('electrification'))) {
      insights.push({
        id: 'insight-orca',
        type: 'insight',
        severity: 'warning',
        title: 'Orca Protection Zones May Require Speed Reductions',
        description: 'Expanded Southern Resident Killer Whale critical habitat designations may require ferry speed reductions in key transit corridors, particularly in Haro Strait and San Juan Channel.',
        sources: [...environmental.slice(0, 2).map(e => e.url)],
        affectedRegions: ['San Juan Islands', 'Haro Strait', 'Rosario Strait'],
        affectedVesselTypes: ['ferry'],
        recommendation: 'Implement voluntary speed reduction zones. Adjust schedules to accommodate longer transit times. Accelerate hybrid-electric conversion to reduce underwater noise.',
        reasoning: 'Cross-analysis: Orca protection mandates + ferry electrification program = opportunity to lead in green maritime operations while maintaining service reliability.',
        timeframe: 'long-term',
        impact: 'San Juan routes may require 10-15% longer transit times. Potential $2-3M annual fuel savings from slower speeds partially offset schedule impact.',
        actions: [
          'Coordinate with NOAA on voluntary speed reduction protocols',
          'Adjust San Juan Island route schedules with 10-minute buffer',
          'Prioritize hybrid-electric conversion for San Juan route vessels',
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
      if (content.includes('seattle')) regions.push('Seattle');
      if (content.includes('bainbridge')) regions.push('Bainbridge Island');
      if (content.includes('bremerton')) regions.push('Bremerton');
      if (content.includes('anacortes') || content.includes('san juan')) regions.push('San Juan Islands');
      if (content.includes('edmonds') || content.includes('kingston')) regions.push('Edmonds - Kingston');
      if (content.includes('whidbey') || content.includes('mukilteo')) regions.push('Whidbey Island');
      if (regions.length === 0) regions.push('Puget Sound');

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

  // Add fallback/simulated factors if no Exa results (WSDOT-specific)
  if (factors.length === 0) {
    factors.push(
      {
        id: 'weather-1',
        type: 'weather',
        severity: 'warning',
        title: 'Wind Advisory - Central Puget Sound',
        description: 'South winds forecast 25-35 knots for the next 48 hours affecting cross-Sound routes. Wave heights expected 1.2-2.0m in exposed waters. Reduced visibility in rain.',
        affectedRegions: ['Seattle - Bainbridge', 'Edmonds - Kingston', 'Mukilteo - Whidbey'],
        affectedVesselTypes: ['ferry'],
        dateRange: { 
          start: new Date().toISOString(), 
          end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() 
        },
        recommendation: 'Monitor conditions for possible service adjustments on cross-Sound routes. Smaller class vessels may need to hold at dock in peak gusts.',
        timeframe: 'immediate',
        impact: 'Potential 2-day service disruptions on 3 routes. Estimated $180K revenue impact if sailings cancelled.',
        actions: [
          'Issue passenger advisory for cross-Sound routes',
          'Pre-position Jumbo Mark II vessels on exposed routes',
          'Coordinate with USCG on vessel operating limits',
        ],
      },
      {
        id: 'port-1',
        type: 'port',
        severity: 'info',
        title: 'Colman Dock Terminal - Slip 2 Maintenance',
        description: 'Scheduled maintenance on Slip 2 transfer span at Colman Dock. Ferry operations temporarily consolidated to Slip 1 during low-traffic windows.',
        affectedRegions: ['Seattle', 'Bainbridge Island'],
        dateRange: { 
          start: new Date().toISOString(), 
          end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() 
        },
        recommendation: 'Coordinate vessel movements with terminal operations. Adjust sailing schedule to accommodate single-slip operations during maintenance windows.',
        timeframe: 'near-term',
        impact: 'Slip 2 unavailable during overnight hours for 2 weeks. No peak-hour impact. Minor schedule adjustments for early morning and late evening sailings.',
        actions: [
          'Publish adjusted schedule for Bainbridge route',
          'Coordinate maintenance windows with terminal crew',
          'Ensure backup transfer span components are on-site',
        ],
      },
      {
        id: 'project-1',
        type: 'port',
        severity: 'info',
        title: 'San Juan Islands - Summer Schedule Preparation',
        description: 'Transition to summer schedule in 3 weeks. Additional sailings require vessel repositioning and crew scheduling adjustments.',
        affectedRegions: ['Anacortes', 'San Juan Islands'],
        recommendation: 'Finalize crew assignments and vessel positioning plan for expanded summer service.',
        timeframe: 'near-term',
        impact: 'Schedule transition requires 2-day vessel repositioning. Crew overtime for training on expanded routes.',
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
      critical: 'Environmental protection order possible. Ferry routes through sensitive areas may be suspended.',
      warning: 'Additional environmental mitigation may be required. Adjust vessel speeds in protected zones.',
      info: 'Long-term planning consideration for environmental compliance.',
    },
    market: {
      critical: 'Ridership surge expected. Additional sailings may be needed immediately.',
      warning: 'Seasonal ridership trends indicate capacity adjustments needed.',
      info: 'Market intelligence for service planning.',
    },
    infrastructure: {
      critical: 'Terminal closure announced. Rerouting and schedule changes required.',
      warning: 'Terminal upgrade planned. Prepare contingency berthing arrangements.',
      info: 'Long-term infrastructure investment signals future capacity growth.',
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
      critical: ['Reduce speed in protected zones immediately', 'Contact WDFW for guidance', 'Implement whale strike avoidance protocols'],
      warning: ['Schedule environmental compliance review', 'Engage marine biologist for habitat assessment', 'Update environmental management plan'],
      info: ['Note for future route planning', 'Consider environmental training for crew'],
    },
    market: {
      critical: ['Add extra sailings to high-demand routes immediately', 'Confirm vessel availability for peak schedule', 'Coordinate with terminal operations within 48 hours'],
      warning: ['Review ridership forecasts', 'Prepare preliminary schedule adjustments', 'Review competitor (private ferry) positioning'],
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

