// @ts-nocheck - Routes page with dynamic routing data
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WSDOT_FLEET } from '@/lib/wsdot/fleet';
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

// Puget Sound ferry terminals - verified coordinates
const DESTINATIONS = [
  // === Central Puget Sound ===
  { id: 'seattle', name: '⛴️ Seattle (Colman Dock)', lat: 47.6023, lng: -122.3393 },
  { id: 'bainbridge', name: '⛴️ Bainbridge Island', lat: 47.6234, lng: -122.5092 },
  { id: 'bremerton', name: '⛴️ Bremerton', lat: 47.5618, lng: -122.6264 },
  // === North Sound ===
  { id: 'edmonds', name: '⛴️ Edmonds', lat: 47.8137, lng: -122.3838 },
  { id: 'kingston', name: '⛴️ Kingston', lat: 47.7965, lng: -122.4946 },
  { id: 'mukilteo', name: '⛴️ Mukilteo', lat: 47.9482, lng: -122.3044 },
  { id: 'clinton', name: '⛴️ Clinton (Whidbey)', lat: 47.9752, lng: -122.3494 },
  // === San Juan Islands ===
  { id: 'anacortes', name: '⛴️ Anacortes', lat: 48.5071, lng: -122.6779 },
  { id: 'friday-harbor', name: '⛴️ Friday Harbor', lat: 48.5353, lng: -123.0137 },
  { id: 'orcas', name: '⛴️ Orcas Island', lat: 48.5975, lng: -122.9083 },
  { id: 'lopez', name: '⛴️ Lopez Island', lat: 48.5709, lng: -122.8852 },
  { id: 'shaw', name: '⛴️ Shaw Island', lat: 48.5841, lng: -122.9297 },
  // === South Sound ===
  { id: 'fauntleroy', name: '⛴️ Fauntleroy', lat: 47.5227, lng: -122.3934 },
  { id: 'vashon', name: '⛴️ Vashon Island', lat: 47.5085, lng: -122.4635 },
  { id: 'southworth', name: '⛴️ Southworth', lat: 47.5117, lng: -122.5005 },
  { id: 'tahlequah', name: '⛴️ Tahlequah', lat: 47.3327, lng: -122.5074 },
  { id: 'pt-defiance', name: '⛴️ Point Defiance', lat: 47.3067, lng: -122.5144 },
  // === Strait of Juan de Fuca ===
  { id: 'port-townsend', name: '⛴️ Port Townsend', lat: 48.1134, lng: -122.7603 },
  { id: 'coupeville', name: '⛴️ Coupeville (Whidbey)', lat: 48.1594, lng: -122.6741 },
  { id: 'sidney-bc', name: '🇨🇦 Sidney, BC', lat: 48.6508, lng: -123.3993 },
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
  const [selectedVessel, setSelectedVessel] = useState<typeof WSDOT_FLEET[0] | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<typeof DESTINATIONS[0] | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<RouteOptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runOptimization = useCallback(async () => {
    if (!selectedVessel || !selectedDestination) return;

    setIsOptimizing(true);
    setError(null);

    try {
      // Use Seattle (Colman Dock) as the default origin
      // This is where most WSDOT ferries are stationed
      const seattleLat = 47.6023;
      const seattleLng = -122.3393;
      
      // Add small random offset to simulate vessels in the Seattle area
      const vesselLat = seattleLat + (Math.random() - 0.5) * 0.05;
      const vesselLng = seattleLng + (Math.random() - 0.5) * 0.05;

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
              options={WSDOT_FLEET}
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
                <span>{WSDOT_FLEET.length} WSDOT ferries</span>
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
