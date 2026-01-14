'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Ship,
  Bell,
  RefreshCw,
  Menu,
  Radio,
  Cpu,
  X,
  LayoutGrid,
  Leaf,
  Navigation,
} from 'lucide-react';

interface HeaderProps {
  alertCount: number;
  isConnected: boolean;
  onRefresh: () => void;
}

export function Header({ 
  alertCount, 
  isConnected, 
  onRefresh, 
}: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isActive = (path: string) => pathname === path;
  const isHome = pathname === '/';

  // Navigation items - different pages to navigate to
  const navItems = [
    { href: '/live', label: 'Live', icon: Radio },
    { href: '/routes', label: 'Routes', icon: Navigation },
    { href: '/crane-iot', label: 'Crane IoT', icon: Cpu, highlight: true },
    { href: '/orchestration', label: 'Orchestration', icon: LayoutGrid },
    { href: '/esg', label: 'ESG', icon: Leaf },
  ];

  return (
    <header className="h-12 border-b border-white/10 bg-black sticky top-0 z-50">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Logo - always links to home */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
            isHome ? 'bg-white/15' : 'bg-white/10 group-hover:bg-white/15'
          }`}>
            <Ship className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white hidden sm:block">NMDC</span>
        </Link>
        
        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon, highlight }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                isActive(href)
                  ? 'bg-white/15 text-white'
                  : highlight
                  ? 'text-amber-400 hover:bg-amber-500/10'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Right - Status & Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-white/40 mr-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-white/30'}`} />
            <span className="font-mono">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <button
            onClick={onRefresh}
            className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/5 transition-all"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <button className="relative p-1.5 rounded text-white/40 hover:text-white hover:bg-white/5 transition-all">
            <Bell className="h-3.5 w-3.5" />
            {alertCount > 0 && (
              <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
            )}
          </button>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            {mobileMenuOpen ? <X className="h-3.5 w-3.5" /> : <Menu className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-12 left-0 right-0 bg-black border-b border-white/10 p-2">
          <nav className="flex flex-col gap-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-all ${
                isHome ? 'bg-white/15 text-white' : 'text-white/60'
              }`}
            >
              <Ship className="w-4 h-4" />
              Home
            </Link>
            {navItems.map(({ href, label, icon: Icon, highlight }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-all ${
                  isActive(href)
                    ? 'bg-white/15 text-white'
                    : highlight
                    ? 'text-amber-400'
                    : 'text-white/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
