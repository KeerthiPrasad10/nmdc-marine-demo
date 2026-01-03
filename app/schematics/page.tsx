'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Ship,
  Loader2,
  ExternalLink,
  Maximize2,
  Minimize2,
  MessageSquare,
  Layers,
  Cpu,
  Gauge,
  Anchor,
  Wrench,
} from 'lucide-react';

const PNID_RESOLVE_URL = 'https://resolve-pnid.vercel.app';

// Vessel system categories for quick access
const SYSTEM_CATEGORIES = [
  { id: 'dredging', label: 'Dredging Systems', icon: Anchor, color: 'text-blue-400' },
  { id: 'propulsion', label: 'Propulsion', icon: Cpu, color: 'text-emerald-400' },
  { id: 'hydraulic', label: 'Hydraulics', icon: Gauge, color: 'text-amber-400' },
  { id: 'electrical', label: 'Electrical', icon: Layers, color: 'text-purple-400' },
  { id: 'navigation', label: 'Navigation', icon: Ship, color: 'text-cyan-400' },
];

function SchematicsContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);

  // Get context from URL params
  const vesselId = searchParams.get('vessel') || '';
  const vesselName = searchParams.get('name') || '';
  const vesselType = searchParams.get('type') || '';

  // Build iframe URL with context
  const buildIframeUrl = () => {
    const params = new URLSearchParams();
    if (vesselName) params.set('vessel', vesselName);
    if (vesselType) params.set('equipment_type', vesselType);
    if (selectedSystem) params.set('system', selectedSystem);
    
    const queryString = params.toString();
    return queryString ? `${PNID_RESOLVE_URL}?${queryString}` : PNID_RESOLVE_URL;
  };

  const iframeUrl = buildIframeUrl();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`min-h-screen bg-[#0a0a0a] flex ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Sidebar - System Categories */}
      {!isFullscreen && (
        <aside className="w-56 border-r border-white/8 bg-white/[0.02] flex flex-col shrink-0 hidden lg:flex">
          <div className="p-4 border-b border-white/8">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-400" />
              <span className="text-sm font-medium text-white">P&ID Systems</span>
            </div>
          </div>

          <div className="flex-1 p-3 space-y-1">
            {SYSTEM_CATEGORIES.map((system) => {
              const Icon = system.icon;
              const isSelected = selectedSystem === system.id;
              return (
                <button
                  key={system.id}
                  onClick={() => setSelectedSystem(isSelected ? null : system.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? system.color : ''}`} />
                  <span className="text-sm">{system.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-4 border-t border-white/8">
            <div className="text-xs text-white/40 mb-2">Tips:</div>
            <ul className="text-xs text-white/50 space-y-1">
              <li>• Upload P&ID drawings</li>
              <li>• Ask questions about equipment</li>
              <li>• Trace process flows</li>
            </ul>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 border-b border-white/8 bg-[#0a0a0a]/95 backdrop-blur-xl flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-4">
            <Link
              href={vesselId ? `/vessel/${vesselId}` : '/'}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back</span>
            </Link>

            <div className="w-px h-6 bg-white/10" />

            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500/20">
                <FileText className="h-4 w-4 text-primary-400" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-white">P&ID Schematics</h1>
                <p className="text-xs text-white/40">AI-Powered Diagram Analysis</p>
              </div>
            </div>
          </div>

          {/* Context Display */}
          <div className="flex items-center gap-4">
            {vesselName && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <Ship className="w-4 h-4 text-primary-400" />
                <span className="text-sm text-white/70">{vesselName}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>

              <a
                href={iframeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </header>

        {/* Feature Bar */}
        <div className="h-12 border-b border-white/5 bg-white/[0.02] flex items-center gap-2 px-4 shrink-0 overflow-x-auto">
          <span className="text-xs text-white/40 shrink-0">Features:</span>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-500/10 text-xs text-primary-400 shrink-0">
            <MessageSquare className="w-3.5 h-3.5" />
            Chat with Diagrams
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-xs text-white/60 shrink-0">
            <Layers className="w-3.5 h-3.5" />
            Equipment Extraction
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-xs text-white/60 shrink-0">
            <Wrench className="w-3.5 h-3.5" />
            Instrument Analysis
          </div>
        </div>

        {/* iframe Container */}
        <div className="flex-1 relative">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 z-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/20 to-blue-500/20">
                <Loader2 className="h-8 w-8 text-primary-400 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-white font-medium">Loading P&ID Resolve</p>
                <p className="text-sm text-white/40 mt-1">AI schematic analysis system</p>
              </div>
            </div>
          )}

          {/* iframe */}
          <iframe
            src={iframeUrl}
            className="w-full h-full border-0"
            style={{ minHeight: 'calc(100vh - 7rem)' }}
            onLoad={() => setIsLoading(false)}
            allow="clipboard-write"
            title="P&ID Resolve - Schematic Analysis"
          />
        </div>
      </div>
    </div>
  );
}

export default function SchematicsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading Schematics...</p>
        </div>
      </div>
    }>
      <SchematicsContent />
    </Suspense>
  );
}

