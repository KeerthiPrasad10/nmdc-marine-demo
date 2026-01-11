import { FileText, Download, Copy, Check, Calendar, User } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { DocumentOutputData, DocumentSection } from "../types";
import ReactMarkdown from 'react-markdown';

// ============================================
// Section Renderer
// ============================================

interface SectionRendererProps {
  section: DocumentSection;
}

function SectionRenderer({ section }: SectionRendererProps) {
  switch (section.type) {
    case 'heading':
      const HeadingTag = section.level === 1 ? 'h1' : section.level === 2 ? 'h2' : 'h3';
      const headingClasses = {
        1: 'text-lg font-semibold text-[var(--nxb-text-primary)] mt-6 mb-3 first:mt-0',
        2: 'text-base font-semibold text-[var(--nxb-text-primary)] mt-4 mb-2',
        3: 'text-sm font-medium text-[var(--nxb-text-primary)] mt-3 mb-1.5'
      };
      return (
        <HeadingTag className={headingClasses[section.level || 1]}>
          {section.content}
        </HeadingTag>
      );

    case 'paragraph':
      return (
        <div className="prose prose-invert prose-sm max-w-none text-[var(--nxb-text-secondary)] leading-relaxed mb-3
          [&_strong]:text-[var(--nxb-text-primary)] [&_strong]:font-semibold
          [&_em]:text-[var(--nxb-text-secondary)]
          [&_code]:text-[var(--nxb-brand-purple)] [&_code]:bg-[var(--nxb-brand-purple-10)] [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs
        ">
          <ReactMarkdown>{section.content || ''}</ReactMarkdown>
        </div>
      );

    case 'list':
      return (
        <ul className="space-y-1.5 mb-3 ml-4">
          {section.items?.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-[var(--nxb-text-secondary)]">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--nxb-brand-purple)] mt-1.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case 'table':
      if (!section.tableData) return null;
      return (
        <div className="rounded-lg border border-white/[0.08] overflow-hidden mb-4">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--nxb-surface-5)]">
                {section.tableData.headers.map((header, index) => (
                  <th 
                    key={index}
                    className="px-3 py-2 text-left text-[10px] font-medium text-[var(--nxb-text-muted)] uppercase tracking-wide font-['PP_Supply_Mono',monospace]"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {section.tableData.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-[var(--nxb-surface-5)]">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-3 py-2 text-sm text-[var(--nxb-text-secondary)]">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'divider':
      return <hr className="border-white/[0.08] my-4" />;

    case 'quote':
      return (
        <blockquote className="border-l-2 border-[var(--nxb-brand-purple)] pl-4 my-3 italic text-sm text-[var(--nxb-text-secondary)]">
          {section.content}
        </blockquote>
      );

    default:
      return null;
  }
}

// ============================================
// Document Output Component
// ============================================

interface DocumentOutputProps {
  data: DocumentOutputData;
  onExport?: () => void;
}

export function DocumentOutput({ data, onExport }: DocumentOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    // Convert document to plain text
    const text = data.sections.map(section => {
      switch (section.type) {
        case 'heading':
          return `\n${'#'.repeat(section.level || 1)} ${section.content}\n`;
        case 'paragraph':
          return section.content;
        case 'list':
          return section.items?.map(item => `• ${item}`).join('\n');
        case 'table':
          if (!section.tableData) return '';
          const headers = section.tableData.headers.join('\t');
          const rows = section.tableData.rows.map(row => row.join('\t')).join('\n');
          return `${headers}\n${rows}`;
        case 'divider':
          return '\n---\n';
        case 'quote':
          return `> ${section.content}`;
        default:
          return '';
      }
    }).join('\n');

    await navigator.clipboard.writeText(`${data.title}\n\n${text}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPDF = () => {
    // In a real implementation, this would generate a PDF
    // For now, we'll just download as HTML
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>${data.title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1 { color: #333; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; }
    h2 { color: #444; margin-top: 24px; }
    h3 { color: #555; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    blockquote { border-left: 3px solid #7c3aed; margin: 16px 0; padding-left: 16px; color: #666; font-style: italic; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <h1>${data.title}</h1>
  ${data.documentType ? `<p style="color: #7c3aed; font-size: 14px;">${data.documentType}</p>` : ''}
  ${data.sections.map(section => {
    switch (section.type) {
      case 'heading':
        return `<h${section.level || 1}>${section.content}</h${section.level || 1}>`;
      case 'paragraph':
        return `<p>${section.content}</p>`;
      case 'list':
        return `<ul>${section.items?.map(item => `<li>${item}</li>`).join('')}</ul>`;
      case 'table':
        if (!section.tableData) return '';
        return `<table><thead><tr>${section.tableData.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${section.tableData.rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      case 'divider':
        return '<hr>';
      case 'quote':
        return `<blockquote>${section.content}</blockquote>`;
      default:
        return '';
    }
  }).join('\n')}
  ${data.footer ? `<div class="footer">${data.footer}</div>` : ''}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.title.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="font-['Suisse_Intl',sans-serif]">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--nxb-brand-purple-10)] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[var(--nxb-brand-purple)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--nxb-text-primary)]">{data.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              {data.documentType && (
                <span className="text-xs text-[var(--nxb-brand-purple)] font-['PP_Supply_Mono',monospace]">
                  {data.documentType}
                </span>
              )}
              {data.date && (
                <span className="text-xs text-[var(--nxb-text-muted)] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {data.date}
                </span>
              )}
              {data.author && (
                <span className="text-xs text-[var(--nxb-text-muted)] flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {data.author}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-[var(--nxb-surface-5)] transition-colors text-[var(--nxb-text-muted)] hover:text-[var(--nxb-text-primary)]"
            title="Copy to clipboard"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownloadPDF}
            className="p-2 rounded-lg hover:bg-[var(--nxb-surface-5)] transition-colors text-[var(--nxb-text-muted)] hover:text-[var(--nxb-text-primary)]"
            title="Download as HTML"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Document content */}
      <div className={cn(
        "rounded-lg border border-white/[0.08] bg-[var(--nxb-surface-5)] p-6",
        data.watermark && "relative overflow-hidden"
      )}>
        {/* Watermark */}
        {data.watermark && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-6xl font-bold text-white/[0.03] rotate-[-30deg] select-none">
              {data.watermark}
            </span>
          </div>
        )}

        {/* Sections */}
        <div className="relative">
          {data.sections.map((section, index) => (
            <SectionRenderer key={index} section={section} />
          ))}
        </div>

        {/* Footer */}
        {data.footer && (
          <div className="mt-6 pt-4 border-t border-white/[0.08]">
            <p className="text-xs text-[var(--nxb-text-muted)]">{data.footer}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentOutput;



