import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';

export function BookCover({ src, alt, title, author, className, placeholderClassName, iconSize = 48, ...props }) {
  const [failedSources, setFailedSources] = useState({});
  const hasError = !src || failedSources[src];

  if (!src || hasError) {
    const accent = buildAccentColor(title || alt || 'Library');
    return (
      <div
        className={placeholderClassName}
        style={{
          background: `linear-gradient(160deg, ${accent} 0%, rgba(10, 10, 10, 0.92) 72%)`,
          color: '#fff',
          flexDirection: 'column',
          alignItems: 'flex-start',
          padding: '1rem',
          gap: '0.75rem',
        }}
      >
        <BookOpen size={iconSize} />
        <div style={{ fontWeight: 700, lineHeight: 1.25, fontSize: '1rem' }}>{title || alt}</div>
        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>{author || 'Library Edition'}</div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailedSources((current) => ({ ...current, [src]: true }))}
      {...props}
    />
  );
}

function buildAccentColor(seed) {
  const palette = ['#991b1b', '#b91c1c', '#7f1d1d', '#dc2626', '#ef4444', '#9f1239'];
  const source = String(seed || 'Library');
  const total = source.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palette[total % palette.length];
}
