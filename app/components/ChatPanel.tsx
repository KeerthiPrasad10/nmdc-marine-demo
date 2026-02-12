'use client';

import { useState, useRef, useEffect, FormEvent, useMemo } from 'react';
import {
  Send,
  Sparkles,
  User,
  Loader2,
  RotateCcw,
  Wrench,
  Zap,
  Shield,
  TrendingUp,
  Activity,
  BarChart3,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ChatPanelProps {
  selectedAsset?: { id: string; name: string; type: string } | null;
}

// Dynamic greetings focused on grid operations
const GREETINGS = [
  "What needs attention today?",
  "Ready to optimize grid operations.",
  "How can I help improve reliability?",
  "What should we prioritize?",
];

// Grid operations-focused actions
const OPTIMIZATION_ACTIONS = [
  { icon: Activity, text: "DGA trending", action: "Analyze DGA gas trends across all transformers and identify which units need immediate attention based on IEEE C57.104 thresholds" },
  { icon: Wrench, text: "Maintenance priorities", action: "Review health indices and create a prioritized maintenance schedule to prevent transformer failures" },
  { icon: Shield, text: "Mitigate risks", action: "Analyze current grid alerts, weather impacts, and asset health to recommend risk mitigation actions" },
  { icon: TrendingUp, text: "Improve reliability", action: "Provide a comprehensive analysis of grid reliability with actionable recommendations to achieve 100% blue-sky uptime" },
  { icon: BarChart3, text: "Loading analysis", action: "Identify transformers approaching or exceeding nameplate ratings and recommend load transfer options" },
  { icon: Zap, text: "Quick wins", action: "What are the top 3 immediate actions I can take right now to reduce outage risk and improve grid performance?" },
];

export function ChatPanel({ selectedAsset }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const greeting = useMemo(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)], []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setHasInteracted(true);
    
    let contextualContent = content.trim();
    if (selectedAsset && !content.toLowerCase().includes(selectedAsset.name.toLowerCase())) {
      contextualContent = `[Context: Regarding grid asset "${selectedAsset.name}" (${selectedAsset.type})] ${content.trim()}`;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { ...userMessage, content: contextualContent }].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          assetId: selectedAsset?.id,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      const assistantId = (Date.now() + 1).toString();

      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '' },
      ]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('0:')) {
              try {
                const textContent = JSON.parse(line.slice(2));
                assistantContent += textContent;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: assistantContent } : m
                  )
                );
              } catch {
                // Skip malformed chunks
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const resetChat = () => {
    setMessages([]);
    setHasInteracted(false);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Minimal Header - only show when there are messages */}
      {messages.length > 0 && (
        <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <span className="text-sm text-white/40">Grid Operations</span>
          <button
            onClick={resetChat}
            className="p-1.5 rounded-md text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
            title="New conversation"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {!hasInteracted && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <h3 className="text-xl font-medium text-white/90 mb-6">
              {greeting}
            </h3>
            
            {/* Optimization Actions Grid */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-md">
              {OPTIMIZATION_ACTIONS.map((item, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(item.action)}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/10 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-md bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="h-4 w-4 text-primary-400" />
                  </div>
                  <span className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                    {item.text}
                  </span>
                </button>
              ))}
            </div>
            
            <p className="text-xs text-white/30 mt-6 max-w-sm text-center">
              Select an action above or type your own request
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                  message.role === 'user' 
                    ? 'bg-primary-500/80' 
                    : 'bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-white/10'
                }`}>
                  {message.role === 'user' ? (
                    <User className="h-3.5 w-3.5 text-white" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  )}
                </div>

                <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div
                    className={`inline-block px-3.5 py-2.5 rounded-xl text-sm ${
                      message.role === 'user'
                        ? 'bg-primary-500/80 text-white rounded-tr-sm'
                        : 'bg-white/5 text-white/80 rounded-tl-sm'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div 
                        className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-p:leading-relaxed prose-ul:my-1.5 prose-li:my-0 prose-strong:text-white prose-headings:text-white prose-headings:font-medium prose-headings:mt-3 prose-headings:mb-1.5 prose-h1:text-base prose-h2:text-sm prose-h3:text-sm"
                        dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                      />
                    ) : (
                      <p className="leading-relaxed">{message.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl rounded-tl-sm bg-white/5">
                  <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
                  <span className="text-sm text-white/50">Analyzing grid data...</span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-white/5">
        <form onSubmit={handleFormSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for an optimization..."
            className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-white/8 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-3 py-2.5 rounded-lg bg-primary-500/80 text-white hover:bg-primary-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function formatMessage(content: string): string {
  // First, detect if this is a route analysis or structured recommendation
  const isRouteAnalysis = content.includes('Route Analysis') || content.includes('Optimizations Available') || content.includes('Critical Optimizations');
  const isVesselRecommendation = /\d+\.\s+\*\*[A-Za-z\s]+\*\*/.test(content);
  
  if (isRouteAnalysis || isVesselRecommendation) {
    return formatStructuredAnalysis(content);
  }
  
  // Standard markdown formatting for simpler messages
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-cyan-300 text-xs">$1</code>')
    .replace(/^### (.*$)/gm, '<h3 class="text-white font-medium mt-3 mb-1">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-white font-semibold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-white font-bold mt-4 mb-2 text-base">$1</h1>')
    .replace(/^- (.*$)/gm, '<div class="flex gap-2 my-1"><span class="text-cyan-400">•</span><span>$1</span></div>')
    .replace(/\n\n/g, '</p><p class="my-2">')
    .replace(/\n/g, '<br/>')
    .replace(/^([\s\S]*)$/, '<p>$1</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/<p><br\/><\/p>/g, '');
}

function formatStructuredAnalysis(content: string): string {
  let html = '<div class="space-y-3">';
  
  // Extract title/header
  const titleMatch = content.match(/^(.*?(?:Analysis|Available|Recommendations)[^\n]*)/m);
  if (titleMatch) {
    html += `
      <div class="flex items-center gap-2 pb-2 border-b border-white/10">
        <div class="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
          <svg class="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
          </svg>
        </div>
        <span class="font-semibold text-white">${titleMatch[1].replace(/\*\*/g, '')}</span>
      </div>
    `;
  }
  
  // Parse vessel recommendations (numbered items with vessel names)
  const vesselBlocks = content.split(/(?=\d+\.\s+\*\*)/g).filter(block => /^\d+\.\s+\*\*/.test(block));
  
  if (vesselBlocks.length > 0) {
    vesselBlocks.forEach(block => {
      // Extract vessel name and action
      const headerMatch = block.match(/^\d+\.\s+\*\*([^*]+)\*\*\s*[-–]\s*(.+?)(?:\n|$)/);
      if (!headerMatch) return;
      
      const vesselName = headerMatch[1].trim();
      const action = headerMatch[2].trim();
      const isUrgent = /URGENT|CRITICAL|NOW/i.test(action);
      
      // Extract details
      const savings = block.match(/Savings[:\s]+([^\n]+)/i)?.[1]?.trim();
      const impact = block.match(/Impact[:\s]+([^\n]+)/i)?.[1]?.trim();
      const actionItem = block.match(/Action[:\s]+([^\n]+)/i)?.[1]?.trim();
      const benefit = block.match(/Benefit[:\s]+([^\n]+)/i)?.[1]?.trim();
      const fuel = block.match(/Fuel(?:\s+impact)?[:\s]+([^\n]+)/i)?.[1]?.trim();
      const current = block.match(/Current[:\s]+([^\n]+)/i)?.[1]?.trim();
      
      html += `
        <div class="rounded-lg border ${isUrgent ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10 bg-white/[0.02]'} p-3">
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg ${isUrgent ? 'bg-amber-500/20' : 'bg-primary-500/20'} flex items-center justify-center flex-shrink-0">
                <svg class="w-4 h-4 ${isUrgent ? 'text-amber-400' : 'text-primary-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div>
                <span class="font-semibold text-white">${vesselName}</span>
                ${isUrgent ? '<span class="ml-2 text-[10px] font-medium text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">URGENT</span>' : ''}
              </div>
            </div>
          </div>
          
          <div class="text-sm text-white/80 mb-3">${action}</div>
          
          <div class="grid grid-cols-2 gap-2 text-xs">
            ${savings ? `
              <div class="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 rounded px-2 py-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>${savings}</span>
              </div>
            ` : ''}
            ${impact ? `
              <div class="flex items-center gap-1.5 bg-white/5 text-white/70 rounded px-2 py-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>${impact}</span>
              </div>
            ` : ''}
            ${current ? `
              <div class="col-span-2 flex items-center gap-1.5 bg-blue-500/10 text-blue-300 rounded px-2 py-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>${current}</span>
              </div>
            ` : ''}
            ${benefit ? `
              <div class="col-span-2 flex items-center gap-1.5 bg-cyan-500/10 text-cyan-300 rounded px-2 py-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <span>${benefit}</span>
              </div>
            ` : ''}
            ${fuel ? `
              <div class="col-span-2 flex items-center gap-1.5 bg-orange-500/10 text-orange-300 rounded px-2 py-1.5">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"/>
                </svg>
                <span>${fuel}</span>
              </div>
            ` : ''}
          </div>
          
          ${actionItem ? `
            <div class="mt-3 pt-2 border-t border-white/5">
              <div class="flex items-center gap-2 text-xs">
                <svg class="w-3.5 h-3.5 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
                </svg>
                <span class="text-white/80">${actionItem}</span>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    });
  }
  
  // Handle section headers like "Weather-Based Route Changes"
  const sections = content.match(/^[A-Z][A-Za-z\s-]+(?=\n\d+\.)/gm);
  if (sections) {
    sections.forEach(section => {
      if (!section.includes('Analysis') && !section.includes('Available')) {
        html = html.replace(
          '</div>',
          `<div class="text-xs font-medium text-white/50 uppercase tracking-wider mt-4 mb-2">${section}</div></div>`
        );
      }
    });
  }
  
  html += '</div>';
  return html;
}
