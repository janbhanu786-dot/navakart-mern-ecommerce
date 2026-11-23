import { useState } from 'react';
import { Package } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  accentHex?: string;
  title?: string;
}

export function SafeImage({
  src,
  alt,
  className = '',
  accentHex = '#1D4ED8',
  title,
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-6 text-center select-none ${className}`}
        style={{
          background: `linear-gradient(135deg, ${accentHex}18 0%, #f4f4f5 60%, ${accentHex}10 100%)`,
        }}
        role="img"
        aria-label={alt}
      >
        <Package className="w-8 h-8 text-zinc-500 mb-2" strokeWidth={1.5} />
        <span className="text-xs font-medium text-zinc-600 max-w-[180px] truncate">
          {title || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
