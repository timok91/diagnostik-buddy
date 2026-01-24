'use client';
import { useState } from 'react';
import { Play, ExternalLink } from 'lucide-react';

function getVimeoId(url) {
  // Unterstützt verschiedene Vimeo-URL-Formate
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /vimeo\.com\/video\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function isVimeoUrl(src) {
  return src.includes('vimeo.com');
}

export default function Video({ src, title, poster }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const isVimeo = isVimeoUrl(src);
  const vimeoId = isVimeo ? getVimeoId(src) : null;
  
  // Vimeo Embed
  if (isVimeo && vimeoId) {
    return (
      <div className="my-8">
        {title && (
          <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Play className="w-4 h-4 text-primary" />
            {title}
          </p>
        )}
        <div className="relative w-full rounded-xl overflow-hidden shadow-lg bg-gray-900" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}?h=0&title=0&byline=0&portrait=0`}
            className="absolute inset-0 w-full h-full"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={title || 'Video'}
          />
        </div>
        <a 
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 text-xs text-gray-500 hover:text-primary flex items-center gap-1 w-fit"
        >
          <ExternalLink className="w-3 h-3" />
          Auf Vimeo ansehen
        </a>
      </div>
    );
  }
  
  // Lokales Video
  return (
    <div className="my-8">
      {title && (
        <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Play className="w-4 h-4 text-primary" />
          {title}
        </p>
      )}
      <div className="relative w-full rounded-xl overflow-hidden shadow-lg bg-gray-900">
        <video
          src={src}
          poster={poster}
          controls
          preload="metadata"
          className="w-full"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={src} type="video/mp4" />
          Ihr Browser unterstützt keine Videos.
        </video>
      </div>
    </div>
  );
}