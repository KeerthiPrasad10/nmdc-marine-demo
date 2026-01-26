'use client';

import React, { useState } from 'react';
import { ImageCardData } from '../types';
import { ZoomIn, X, Download, FileImage, ExternalLink, AlertTriangle, ChevronRight } from 'lucide-react';

interface ImageCardProps {
  data: ImageCardData;
}

export const ImageCard: React.FC<ImageCardProps> = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const dataAny = data as unknown as Record<string, unknown>;
  
  const title = data.title || (dataAny.name as string) || 'Image';
  const description = data.description || (dataAny.caption as string) || '';
  const source_document = data.source_document || (dataAny.sourceDocument as string) || (dataAny.source as string);
  const source_page = data.source_page || (dataAny.sourcePage as number) || (dataAny.page as number);
  const detected_equipment = data.detected_equipment || (dataAny.detectedEquipment as string[]) || (dataAny.equipment as string[]);
  
  const image_url = data.image_url || 
    (dataAny.imageUrl as string) || 
    (dataAny.url as string) || 
    (dataAny.src as string) ||
    (dataAny.imageSrc as string);
  
  const image_base64 = data.image_base64 || 
    (dataAny.imageBase64 as string) || 
    (dataAny.base64 as string);
  
  let imageSrc: string | null = null;
  
  if (image_url) {
    imageSrc = image_url;
  } else if (image_base64) {
    if (image_base64.startsWith('data:')) {
      imageSrc = image_base64;
    } else {
      let mimeType = 'image/png';
      if (image_base64.startsWith('/9j/')) mimeType = 'image/jpeg';
      else if (image_base64.startsWith('R0lGOD')) mimeType = 'image/gif';
      else if (image_base64.startsWith('UklGR')) mimeType = 'image/webp';
      imageSrc = `data:${mimeType};base64,${image_base64}`;
    }
  }
  
  const handleDownload = () => {
    if (!imageSrc) return;
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `${title.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shortTitle = title.length > 60 ? title.substring(0, 60) + '...' : title;
  
  return (
    <>
      {/* Compact Card - Click to expand */}
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 transition-all text-left group"
      >
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-lg bg-slate-800 flex-shrink-0 overflow-hidden flex items-center justify-center">
          {imageSrc && !imageError ? (
            <img
              src={imageSrc}
              alt=""
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <FileImage className="w-6 h-6 text-white/30" />
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white/80 truncate">
              {shortTitle}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {source_document && (
              <span className="text-xs text-white/40 truncate">
                {source_document}{source_page ? ` • p.${source_page}` : ''}
              </span>
            )}
          </div>
          {detected_equipment && detected_equipment.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {detected_equipment.slice(0, 3).map((tag, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300">
                  {tag}
                </span>
              ))}
              {detected_equipment.length > 3 && (
                <span className="text-[10px] text-white/40">+{detected_equipment.length - 3}</span>
              )}
            </div>
          )}
        </div>
        
        {/* Expand icon */}
        <div className="flex-shrink-0 text-white/30 group-hover:text-white/60 transition-colors">
          <ZoomIn className="w-5 h-5" />
        </div>
      </button>
      
      {/* Full Modal */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setIsExpanded(false)}
        >
          <div className="relative w-full max-w-5xl max-h-[90vh] mx-4 flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-t-xl border-b border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <FileImage className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-white truncate">{title}</h3>
                  {source_document && (
                    <p className="text-xs text-white/50">
                      {source_document}{source_page ? `, Page ${source_page}` : ''}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {imageSrc && !imageError && (
                  <button
                    onClick={handleDownload}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-white/60" />
                  </button>
                )}
                {image_url && (
                  <a
                    href={image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4 text-white/60" />
                  </a>
                )}
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>
            
            {/* Modal Body - Image */}
            <div className="flex-1 overflow-auto bg-black/50 flex items-center justify-center p-4">
              {imageSrc && !imageError ? (
                <img
                  src={imageSrc}
                  alt={title}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                    {imageError ? (
                      <AlertTriangle className="w-10 h-10 text-amber-400/70" />
                    ) : (
                      <FileImage className="w-10 h-10 text-white/30" />
                    )}
                  </div>
                  <p className="text-white/60 font-medium mb-2">
                    {imageError ? 'Image could not be loaded' : 'No image available'}
                  </p>
                  <p className="text-sm text-white/40 max-w-md mx-auto">
                    {imageError && image_base64 && image_base64.length < 10000 
                      ? 'The image data appears to be incomplete or corrupted.'
                      : description.substring(0, 200)}
                  </p>
                  {image_url && imageError && (
                    <a
                      href={image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm text-white/70 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Try opening in new tab
                    </a>
                  )}
                </div>
              )}
            </div>
            
            {/* Modal Footer - Description & Equipment */}
            <div className="px-4 py-3 bg-white/5 rounded-b-xl border-t border-white/10">
              {description && (
                <p className="text-sm text-white/70 leading-relaxed mb-3">
                  {description}
                </p>
              )}
              {detected_equipment && detected_equipment.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-white/40">Equipment:</span>
                  {detected_equipment.map((tag, i) => (
                    <span 
                      key={i}
                      className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageCard;
