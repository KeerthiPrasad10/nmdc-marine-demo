'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Zap,
  Bell,
  RefreshCw,
  Menu,
  Brain,
  X,
  LayoutGrid,
  Leaf,
  Activity,
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

  // Navigation items — Exelon GridIQ modules
  const navItems = [
    { href: '/grid-iq', label: 'Grid IQ', icon: Brain },
    { href: '/transformer-iot', label: 'Asset IoT', icon: Activity },
    { href: '/orchestration', label: 'Dispatch', icon: LayoutGrid },
    { href: '/esg', label: 'ESG', icon: Leaf },
  ];

  return (
    <header className="h-12 border-b border-white/10 bg-black sticky top-0 z-50">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Logo - always links to home */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image 
            src="/IFS NB.png" 
            alt="IFS" 
            width={80} 
            height={24} 
            className="h-5 w-auto"
          />
          <span className="text-sm text-white/40 hidden sm:block">//</span>
          <Zap className="h-3.5 w-3.5 text-white/50 hidden sm:block" />
          <span className="text-sm font-bold text-white/80 hidden sm:block tracking-wide">GridIQ</span>
        </Link>
        
        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                isActive(href)
                  ? 'bg-white/[0.08] text-white/90'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
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
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-white/40' : 'bg-white/15'}`} />
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
              <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-white/50" />
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
              <Image 
                src="/IFS NB.png" 
                alt="IFS" 
                width={60} 
                height={20} 
                className="h-4 w-auto"
              />
              <span className="text-white/40">//</span>
              <Zap className="h-3 w-3 text-white/50" />
              <span>GridIQ</span>
            </Link>
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-all ${
                  isActive(href)
                    ? 'bg-white/[0.08] text-white/90'
                    : 'text-white/45'
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
