import React, { useState } from 'react';
import { ImageCardData } from '../types';
import { ZoomIn, ZoomOut, X, Download, FileImage, ExternalLink } from 'lucide-react';

interface ImageCardProps {
  data: ImageCardData;
}

/**
 * ImageCard - Displays diagrams and images from the knowledge base
 * 
 * Features:
 * - Shows image with title and description
 * - Click to expand/zoom
 * - Shows source document and page
 * - Lists detected equipment tags
 * - Download option
 */
export const ImageCard: React.FC<ImageCardProps> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const { 
    title, 
    description, 
    source_document, 
    source_page, 
    image_url, 
    image_base64,
    detected_equipment 
  } = data;
  
  // Determine image source
  const imageSrc = image_url || (image_base64 ? `data:image/png;base64,${image_base64}` : null);
  
  const handleDownload = () => {
    if (!imageSrc) return;
    
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `${title.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <>
      {/* Main Card */}
      <div className="rounded-lg border overflow-hidden"
        style={{
          backgroundColor: 'var(--nxb-surface-secondary)',
          borderColor: 'var(--nxb-border-primary)',
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--nxb-border-primary)' }}
        >
          <div className="flex items-center gap-2">
            <FileImage className="w-5 h-5" style={{ color: 'var(--nxb-accent-primary)' }} />
            <span className="font-medium" style={{ color: 'var(--nxb-text-primary)' }}>
              {title}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {imageSrc && (
              <>
                <button
                  onClick={() => setIsExpanded(true)}
                  className="p-1.5 rounded hover:bg-white/10 transition-colors"
                  title="Expand"
                >
                  <ZoomIn className="w-4 h-4" style={{ color: 'var(--nxb-text-secondary)' }} />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-1.5 rounded hover:bg-white/10 transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4" style={{ color: 'var(--nxb-text-secondary)' }} />
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Image Container */}
        {imageSrc && !imageError ? (
          <div 
            className="relative cursor-pointer group"
            onClick={() => setIsExpanded(true)}
          >
            <img
              src={imageSrc}
              alt={title}
              className="w-full max-h-80 object-contain bg-black/20"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity" 
                style={{ color: 'var(--nxb-text-primary)' }} 
              />
            </div>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center" 
            style={{ backgroundColor: 'var(--nxb-surface-tertiary)' }}
          >
            <div className="text-center">
              <FileImage className="w-12 h-12 mx-auto mb-2 opacity-40" 
                style={{ color: 'var(--nxb-text-secondary)' }} 
              />
              <span className="text-sm" style={{ color: 'var(--nxb-text-tertiary)' }}>
                {imageError ? 'Failed to load image' : 'No image available'}
              </span>
            </div>
          </div>
        )}
        
        {/* Description & Metadata */}
        <div className="p-4 space-y-3">
          <p className="text-sm" style={{ color: 'var(--nxb-text-secondary)' }}>
            {description}
          </p>
          
          {/* Source Info */}
          {(source_document || source_page) && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--nxb-text-tertiary)' }}>
              <span>Source:</span>
              <span style={{ color: 'var(--nxb-text-secondary)' }}>
                {source_document}
                {source_page && `, Page ${source_page}`}
              </span>
            </div>
          )}
          
          {/* Detected Equipment */}
          {detected_equipment && detected_equipment.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs" style={{ color: 'var(--nxb-text-tertiary)' }}>
                Equipment:
              </span>
              {detected_equipment.map((tag, i) => (
                <span 
                  key={i}
                  className="px-2 py-0.5 rounded text-xs font-mono"
                  style={{ 
                    backgroundColor: 'var(--nxb-accent-primary)',
                    color: 'var(--nxb-text-on-accent)',
                    opacity: 0.9
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Expanded Modal */}
      {isExpanded && imageSrc && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-8"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
          onClick={() => setIsExpanded(false)}
        >
          <div className="relative max-w-full max-h-full">
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute -top-12 right-0 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" style={{ color: 'var(--nxb-text-primary)' }} />
            </button>
            
            <img
              src={imageSrc}
              alt={title}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="absolute -bottom-12 left-0 right-0 text-center">
              <span className="text-sm" style={{ color: 'var(--nxb-text-secondary)' }}>
                {title}
                {source_document && ` • ${source_document}`}
                {source_page && `, Page ${source_page}`}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageCard;




