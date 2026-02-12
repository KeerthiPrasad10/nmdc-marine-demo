// @ts-nocheck - Routes page with dynamic routing data
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NMDC_FLEET as LEGACY_FLEET } from '@/lib/nmdc/fleet';
import { RouteOptimizationPanel } from '@/app/components/RouteOptimization';
import { RouteOptimizationResult } from '@/lib/route-optimization/types';
import {
  ArrowLeft,
  Route,
  Ship,
  Loader2,
  Sparkles,
  ChevronDown,
  Anchor,
  Check,
  X,
} from 'lucide-react';

// Comprehensive Middle East ports - verified coordinates
const DESTINATIONS = [
  // === UAE Ports ===
  { id: 'musaffah', name: '🇦🇪 Musaffah (Marine Base)', lat: 24.33506, lng: 54.43968 },
  { id: 'abu-dhabi', name: '🇦🇪 Abu Dhabi Port', lat: 24.4821, lng: 54.50214 },
  { id: 'khalifa', name: '🇦🇪 Khalifa Port', lat: 24.78751, lng: 54.67621 },
  { id: 'jebel-ali', name: '🇦🇪 Jebel Ali (Dubai)', lat: 25.00328, lng: 55.05206 },
  { id: 'dubai', name: '🇦🇪 Port Rashid, Dubai', lat: 25.27754, lng: 55.29378 },
  { id: 'das-island', name: '🇦🇪 Das Island (ADNOC)', lat: 25.1465, lng: 52.891 },
  { id: 'ruwais', name: '🇦🇪 Ruwais Terminal', lat: 24.15887, lng: 52.73211 },
  { id: 'jebel-dhanna', name: '🇦🇪 Jebel Dhanna', lat: 24.18434, lng: 52.59507 },
  { id: 'fujairah', name: '🇦🇪 Port of Fujairah', lat: 25.16122, lng: 56.36583 },
  { id: 'zirku', name: '🇦🇪 Zirku Island', lat: 24.87291, lng: 53.08971 },
  { id: 'sharjah', name: '🇦🇪 Sharjah Port', lat: 25.36205, lng: 55.37989 },
  { id: 'khor-fakkan', name: '🇦🇪 Khor Fakkan', lat: 25.35783, lng: 56.36544 },
  { id: 'arzanah', name: '🇦🇪 Arzanah Island', lat: 24.77533, lng: 52.5631 },
  { id: 'mubarraz', name: '🇦🇪 Mubarraz Island', lat: 24.53195, lng: 53.34188 },
  { id: 'zakum', name: '🇦🇪 Zakum Field', lat: 24.88638, lng: 53.68538 },
  // === Qatar Ports ===
  { id: 'doha', name: '🇶🇦 Doha Port', lat: 25.305, lng: 51.552 },
  { id: 'ras-laffan', name: '🇶🇦 Ras Laffan', lat: 25.90255, lng: 51.61554 },
  { id: 'mesaieed', name: '🇶🇦 Mesaieed', lat: 24.93598, lng: 51.59607 },
  { id: 'hamad-port', name: '🇶🇦 Hamad Port', lat: 25.02946, lng: 51.6245 },
  // === Saudi Arabia Ports ===
  { id: 'dammam', name: '🇸🇦 Dammam', lat: 26.441, lng: 50.1485 },
  { id: 'ras-tanura', name: '🇸🇦 Ras Tanura', lat: 26.67255, lng: 50.1219 },
  { id: 'jubail', name: '🇸🇦 Al Jubail', lat: 27.035, lng: 49.6795 },
  // === Kuwait Ports ===
  { id: 'kuwait', name: '🇰🇼 Kuwait Port', lat: 29.3663, lng: 48.00172 },
  { id: 'mina-ahmadi', name: '🇰🇼 Mina Al Ahmadi', lat: 29.0663, lng: 48.16348 },
  // === Bahrain Ports ===
  { id: 'mina-sulman', name: '🇧🇭 Mina Sulman', lat: 26.18934, lng: 50.6087 },
  { id: 'khalifa-salman', name: '🇧🇭 Khalifa Bin Salman', lat: 26.19784, lng: 50.71145 },
  // === Oman Ports ===
  { id: 'muscat', name: '🇴🇲 Muscat', lat: 23.62733, lng: 58.57026 },
  { id: 'sohar', name: '🇴🇲 Sohar', lat: 24.50074, lng: 56.62371 },
  { id: 'salalah', name: '🇴🇲 Salalah', lat: 16.95312, lng: 54.00435 },
  { id: 'duqm', name: '🇴🇲 Duqm', lat: 19.67459, lng: 57.70646 },
  // === Iran Ports ===
  { id: 'bandar-abbas', name: '🇮🇷 Bandar Abbas', lat: 27.17667, lng: 56.27861 },
  // === Iraq Ports ===
  { id: 'basrah', name: '🇮🇶 Basrah', lat: 30.54325, lng: 47.80325 },
  { id: 'umm-qasr', name: '🇮🇶 Umm Qasr', lat: 30.02737, lng: 47.973 },
];

// Custom dropdown component
function Dropdown<T extends { id?: string; mmsi?: string; name: string }>({
  options,
  value,
  onChange,
  placeholder,
  icon: Icon,
  renderOption,
  getKey,
}: {
  options: T[];
  value: T | null;
  onChange: (val: T | null) => void;
  placeholder: string;
  icon: React.ElementType;
  renderOption?: (option: T) => React.ReactNode;
  getKey: (option: T) => string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={dropdownRef} className="relative z-[9999]">
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className={`
          flex items-center gap-3 px-4 py-3 rounded-xl border transition-all w-full min-w-[280px] cursor-pointer
          ${isOpen 
            ? 'bg-white/10 border-cyan-500/50 ring-2 ring-cyan-500/20' 
            : value 
              ? 'bg-white/[0.08] border-white/20 hover:border-white/30' 
              : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
          }
        `}
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          value ? 'bg-cyan-500/20' : 'bg-white/10'
        }`}>
          <Icon className={`w-4.5 h-4.5 ${value ? 'text-cyan-400' : 'text-white/50'}`} />
        </div>
        <div className="flex-1 text-left min-w-0">
          {value ? (
            <>
              <div className="text-sm font-medium text-white truncate">{value.name}</div>
              <div className="text-[11px] text-white/40">
                {'type' in value ? (value as { type?: string }).type : 'Destination'}
              </div>
            </>
          ) : (
            <span className="text-sm text-white/40">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {value && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="p-1 rounded-md hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a0a] border border-white/15 rounded-xl shadow-2xl shadow-black/50 z-[9999] overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-white/10">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          
          {/* Options list */}
          <div className="max-h-[300px] overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-white/40 text-center">No results found</div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value && getKey(value) === getKey(option);
                return (
                  <button
                    key={getKey(option)}
                    onClick={() => {
                      onChange(option);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                      ${isSelected 
                        ? 'bg-cyan-500/15 text-cyan-400' 
                        : 'hover:bg-white/[0.06] text-white'
                      }
                    `}
                  >
                    {renderOption ? (
                      renderOption(option)
                    ) : (
                      <>
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
                          isSelected ? 'bg-cyan-500/20' : 'bg-white/5'
                        }`}>
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-white/50'}`} />
                        </div>
                        <span className="text-sm flex-1 truncate">{option.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                      </>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RoutesPage() {
  const router = useRouter();
  const [selectedVessel, setSelectedVessel] = useState<typeof LEGACY_FLEET[0] | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<typeof DESTINATIONS[0] | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<RouteOptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runOptimization = useCallback(async () => {
    if (!selectedVessel || !selectedDestination) return;

    setIsOptimizing(true);
    setError(null);

    try {
      // Use Musaffah (Marine Base) as the default origin
      // This is where most legacy vessels are stationed
      const musaffahLat = 24.335;
      const musaffahLng = 54.44;
      
      // Add small random offset to simulate vessels in the Musaffah area
      const vesselLat = musaffahLat + (Math.random() - 0.5) * 0.05;
      const vesselLng = musaffahLng + (Math.random() - 0.5) * 0.05;

      const response = await fetch('/api/route-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vessel: {
            id: selectedVessel.mmsi,
            name: selectedVessel.name,
            type: selectedVessel.type,
            currentLat: vesselLat,
            currentLng: vesselLng,
            speed: 10,
          },
          origin: {
            lat: vesselLat,
            lng: vesselLng,
            name: `${selectedVessel.name} (Current Position)`,
          },
          destination: {
            lat: selectedDestination.lat,
            lng: selectedDestination.lng,
            name: selectedDestination.name,
          },
          preferences: {
            prioritize: 'balanced',
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.result) {
        setOptimizationResult(data.result);
      } else {
        setError(data.error || 'Failed to optimize route');
      }
    } catch (err) {
      console.error('Route optimization error:', err);
      setError('Failed to connect to optimization service');
    } finally {
      setIsOptimizing(false);
    }
  }, [selectedVessel, selectedDestination]);

  const handleApplyRoute = (routeId: string) => {
    console.log('Applying route:', routeId);
    // In a real app, this would save the route to the vessel's voyage plan
  };

  const canOptimize = selectedVessel && selectedDestination && !isOptimizing;

  return (
    <div className="min-h-screen bg-black">
      {/* Header with Selection Controls */}
      <header className="sticky top-0 z-[10000] bg-black/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          {/* Top row - Title and back button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white/70" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center">
                  <Route className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white">Route Optimization</h1>
                  <p className="text-xs text-white/50">Voyage Planning with Weather Routing</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row - Selection dropdowns and optimize button */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Vessel Dropdown */}
            <Dropdown
              options={LEGACY_FLEET}
              value={selectedVessel}
              onChange={setSelectedVessel}
              placeholder="Select vessel..."
              icon={Ship}
              getKey={(v) => v.mmsi}
              renderOption={(vessel) => (
                <>
                  <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center">
                    <Ship className="w-3.5 h-3.5 text-white/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{vessel.name}</div>
                    <div className="text-[10px] text-white/40 capitalize">{vessel.type.replace(/_/g, ' ')}</div>
                  </div>
                  {selectedVessel?.mmsi === vessel.mmsi && <Check className="w-4 h-4 text-cyan-400" />}
                </>
              )}
            />

            {/* Arrow indicator */}
            <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-white/5">
              <Route className="w-4 h-4 text-white/30" />
            </div>

            {/* Destination Dropdown */}
            <Dropdown
              options={DESTINATIONS}
              value={selectedDestination}
              onChange={setSelectedDestination}
              placeholder="Select destination..."
              icon={Anchor}
              getKey={(d) => d.id}
              renderOption={(dest) => (
                <>
                  <div className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center">
                    <Anchor className="w-3.5 h-3.5 text-white/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{dest.name}</div>
                    <div className="text-[10px] text-white/40">
                      {dest.lat.toFixed(2)}°N, {dest.lng.toFixed(2)}°E
                    </div>
                  </div>
                  {selectedDestination?.id === dest.id && <Check className="w-4 h-4 text-cyan-400" />}
                </>
              )}
            />

            {/* Optimize Button */}
            <button
              onClick={runOptimization}
              disabled={!canOptimize}
              className={`
                flex items-center gap-2.5 px-6 py-3 rounded-xl font-medium transition-all ml-auto
                ${canOptimize
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/25'
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
                }
              `}
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Calculating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Optimize Route</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 mb-6">
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}

        {optimizationResult ? (
          <RouteOptimizationPanel
            result={optimizationResult}
            onApplyRoute={handleApplyRoute}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-32">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 flex items-center justify-center mb-8">
              <Route className="w-12 h-12 text-white/15" />
            </div>
            <h3 className="text-xl font-medium text-white/70 mb-3">Ready to Optimize</h3>
            <p className="text-sm text-white/40 max-w-lg leading-relaxed">
              Select a vessel and destination from the dropdowns above, then click 
              "Optimize Route" to calculate the best path considering weather conditions, 
              currents, and hazards.
            </p>
            
            {/* Quick hints */}
            <div className="flex items-center gap-6 mt-8 text-xs text-white/30">
              <div className="flex items-center gap-2">
                <Ship className="w-4 h-4" />
                <span>{LEGACY_FLEET.length} legacy vessels</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <div className="flex items-center gap-2">
                <Anchor className="w-4 h-4" />
                <span>{DESTINATIONS.length} Middle East ports</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
