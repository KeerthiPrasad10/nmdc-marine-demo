'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Camera,
  Wrench,
  Zap,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Maximize2,
  Minimize2,
  Brain,
} from 'lucide-react';
import { TroubleshootPanel } from '@/app/components/TroubleshootPanel';

const FIELD_FAULT_URL = 'https://field-fault-pilot-mobile.vercel.app';

function TroubleshootContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showResolvePanel, setShowResolvePanel] = useState(false);

  // Get context from URL params
  const vesselId = searchParams.get('vessel') || '';
  const vesselName = searchParams.get('name') || '';
  const equipmentType = searchParams.get('equipment') || '';
  const project = searchParams.get('project') || '';
  const mmsi = searchParams.get('mmsi') || '';
  const initialQuery = searchParams.get('q') || '';
  const assetName = searchParams.get('asset') || '';

  // If there's a query param, show the resolve panel directly
  useEffect(() => {
    if (initialQuery) {
      setShowResolvePanel(true);
    }
  }, [initialQuery]);

  // Build iframe URL with context
  const buildIframeUrl = () => {
    const params = new URLSearchParams();
    if (vesselName) params.set('equipment', vesselName);
    if (project) params.set('plant', project);
    if (mmsi) params.set('work_center', mmsi);
    if (equipmentType) params.set('functional_location', equipmentType);
    
    const queryString = params.toString();
    return queryString ? `${FIELD_FAULT_URL}?${queryString}` : FIELD_FAULT_URL;
  };

  const iframeUrl = buildIframeUrl();

  useEffect(() => {
    // Simulate iframe load time
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`min-h-screen bg-[#0a0a0a] flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20">
              <Wrench className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white">Resolve</h1>
              <p className="text-xs text-white/40">AI-Powered Troubleshooting</p>
            </div>
          </div>
        </div>

        {/* Context Display */}
        <div className="flex items-center gap-4">
          {vesselName && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Zap className="w-4 h-4 text-primary-400" />
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

      {/* Quick Actions Bar */}
      <div className="h-12 border-b border-white/5 bg-white/[0.02] flex items-center gap-2 px-4 shrink-0 overflow-x-auto">
        <span className="text-xs text-white/40 shrink-0">Quick Start:</span>
        <button
          onClick={() => setShowResolvePanel(!showResolvePanel)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors shrink-0 ${
            showResolvePanel 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          AI Resolve
        </button>
        <a 
          href={`${iframeUrl}#upload`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white transition-colors shrink-0"
        >
          <Camera className="w-3.5 h-3.5" />
          Upload Photo
        </a>
        <a 
          href={`${iframeUrl}#report`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white transition-colors shrink-0"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Report Issue
        </a>
        {(equipmentType || assetName) && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-xs text-amber-400 shrink-0">
            <Wrench className="w-3.5 h-3.5" />
            {assetName || equipmentType}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 relative flex">
        {/* AI Resolve Panel */}
        {showResolvePanel && (
          <div className="w-[500px] border-r border-white/10 flex flex-col bg-[#0a0a0a]">
            <TroubleshootPanel
              equipmentType={assetName || equipmentType || undefined}
              initialSymptom={initialQuery}
            />
          </div>
        )}

        {/* iframe Container */}
        <div className="flex-1 relative">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 z-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
                <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-white font-medium">Loading Field Fault Pilot</p>
                <p className="text-sm text-white/40 mt-1">Visual troubleshooting system</p>
              </div>
            </div>
          )}

          {/* iframe */}
          <iframe
            src={iframeUrl}
            className="w-full h-full border-0"
            style={{ minHeight: 'calc(100vh - 7rem)' }}
            onLoad={() => setIsLoading(false)}
            allow="camera; microphone; geolocation"
            title="Field Fault Pilot - Visual Troubleshooting"
          />
        </div>
      </div>
    </div>
  );
}

export default function TroubleshootPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-amber-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading Resolve...</p>
        </div>
      </div>
    }>
      <TroubleshootContent />
    </Suspense>
  );
}

