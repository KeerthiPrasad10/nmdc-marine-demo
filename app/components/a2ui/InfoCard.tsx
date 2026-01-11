'use client';

/**
 * InfoCard - Generic Information Display
 * A2UI Component for displaying informational responses that don't fit other types
 */

import { Info, CheckCircle2, AlertTriangle, AlertCircle, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface InfoCardProps {
  data: Record<string, unknown>;
}

export function InfoCard({ data }: InfoCardProps) {
  const [copied, setCopied] = useState(false);

  // Try to extract common info fields
  const title = String(data.title || data.subject || data.heading || '');
  const message = String(data.message || data.content || data.text || data.body || data.description || '');
  const type = data.type || data.severity || data.variant || 'info';
  
  // Determine styling based on type
  const getTypeStyles = () => {
    const t = String(type).toLowerCase();
    if (t.includes('error') || t.includes('danger') || t.includes('critical')) {
      return { bg: 'bg-rose-500/10', border: 'border-rose-500/30', icon: AlertCircle, iconColor: 'text-rose-400' };
    }
    if (t.includes('warning') || t.includes('caution')) {
      return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: AlertTriangle, iconColor: 'text-amber-400' };
    }
    if (t.includes('success') || t.includes('complete')) {
      return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: CheckCircle2, iconColor: 'text-emerald-400' };
    }
    return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Info, iconColor: 'text-blue-400' };
  };

  const styles = getTypeStyles();
  const Icon = styles.icon;

  // Extract any array fields for list rendering
  const listFields = Object.entries(data).filter(([, v]) => Array.isArray(v));
  
  // Extract simple key-value fields
  const simpleFields = Object.entries(data).filter(([key, value]) => {
    if (['title', 'subject', 'heading', 'message', 'content', 'text', 'body', 
         'description', 'type', 'severity', 'variant', 'responseType'].includes(key)) return false;
    if (Array.isArray(value)) return false;
    if (typeof value === 'object') return false;
    return true;
  });

  const handleCopy = () => {
    const text = typeof message === 'string' ? message : JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} overflow-hidden`}>
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <Icon className={`w-5 h-5 ${styles.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="font-semibold text-white mb-1">{title}</h3>
          )}
          {message && (
            <p className="text-sm text-white/80 whitespace-pre-wrap">{message}</p>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 p-1.5 rounded hover:bg-white/10 transition-colors"
          title="Copy"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Copy className="w-4 h-4 text-white/40" />
          )}
        </button>
      </div>

      {/* Simple Fields */}
      {simpleFields.length > 0 && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-2">
            {simpleFields.map(([key, value]) => (
              <div key={key} className="text-sm">
                <span className="text-white/40">{formatKey(key)}:</span>
                <span className="text-white/80 ml-1">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List Fields */}
      {listFields.map(([key, value]) => (
        <div key={key} className="px-4 pb-4">
          <div className="text-[10px] uppercase text-white/40 mb-2">{formatKey(key)}</div>
          <ul className="space-y-1">
            {(value as unknown[]).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-white/40">•</span>
                <span className="text-white/70">
                  {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
}

export default InfoCard;

