'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Ship,
  Bell,
  Settings,
  RefreshCw,
  Wifi,
  WifiOff,
  Menu,
  LayoutGrid,
  Leaf,
  Radio,
  Anchor,
  Wrench,
  FileText,
  Navigation,
} from 'lucide-react';

interface HeaderProps {
  alertCount: number;
  isConnected: boolean;
  onRefresh: () => void;
  onlineCount?: number;
  totalCount?: number;
  hideSecondaryNav?: boolean;
}

export function Header({ 
  alertCount, 
  isConnected, 
  onRefresh, 
  onlineCount = 0,
  totalCount = 0,
  hideSecondaryNav = false,
}: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-white/8 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 border border-white/10">
              <Ship className="h-5 w-5 text-white/80" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-white tracking-tight">NMDC Fleet Operations</h1>
              <p className="text-xs text-white/40">National Marine Dredging Company</p>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 ml-6">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Ship className="w-4 h-4" />
              Fleet
            </Link>
            <Link
              href="/orchestration"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <LayoutGrid className="w-4 h-4" />
              Orchestration
            </Link>
            <Link
              href="/esg"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Leaf className="w-4 h-4" />
              ESG
            </Link>
            <Link
              href="/live"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Radio className="w-4 h-4" />
              Live AIS
            </Link>
            <Link
              href="/routes"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              Routes
            </Link>
            {!hideSecondaryNav && (
              <Link
                href="/projects"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Anchor className="w-4 h-4" />
                Projects
              </Link>
            )}
            {!hideSecondaryNav && (
              <>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <Link
                  href="/troubleshoot"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
                >
                  <Wrench className="w-4 h-4" />
                  Troubleshoot
                </Link>
                <Link
                  href="/schematics"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Schematics
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Center - Status */}
        <div className="hidden md:flex items-center gap-3">
          {/* Fleet Online Status */}
          <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-white/50" />
            ) : (
              <WifiOff className="h-4 w-4 text-white/30" />
            )}
            <span className="text-white/50">Fleet:</span>
            <span className={`font-medium ${onlineCount > 0 ? 'text-white/70' : 'text-white/40'}`}>
              {onlineCount}/{totalCount}
            </span>
            <span className="text-white/40">online</span>
          </div>
          
          <div className="w-px h-4 bg-white/10" />
          
          <div className="text-sm text-white/50 font-mono">
            {currentTime.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>

        {/* Right - Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all duration-150"
            title="Refresh data"
          >
            <RefreshCw className="h-5 w-5" />
          </button>

          <button className="relative p-2 rounded-lg text-white/50 hover:text-white/70 hover:bg-white/5 transition-all duration-150">
            <Bell className="h-4 w-4" />
            {alertCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-white/20 text-[9px] font-medium flex items-center justify-center text-white/80">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </button>

          <button className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all duration-150">
            <Settings className="h-5 w-5" />
          </button>

          <button className="md:hidden p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition-all duration-150">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
