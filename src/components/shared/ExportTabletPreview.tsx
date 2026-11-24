import React, { useEffect, useMemo, useState } from 'react';
import type { QRStyleConfig } from '../../types/qr';
import { renderCompositeQRCanvas } from '../../utils/qrRenderer';

const TABLET_PREVIEW_CACHE = new Map<string, string>();
const MAX_CACHE_ENTRIES = 60;

function setCachedTabletPreview(key: string, value: string): void {
  if (TABLET_PREVIEW_CACHE.size >= MAX_CACHE_ENTRIES) {
    const firstKey = TABLET_PREVIEW_CACHE.keys().next().value;
    if (firstKey) TABLET_PREVIEW_CACHE.delete(firstKey);
  }
  TABLET_PREVIEW_CACHE.set(key, value);
}

function isLightHexColor(hex: string): boolean {
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 3 && clean.length !== 6) return true;
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return true;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance >= 0.72;
}

interface ExportTabletPreviewProps {
  data: string;
  style: QRStyleConfig;
  label?: string;
  transparent?: boolean;
}

export const ExportTabletPreview: React.FC<ExportTabletPreviewProps> = ({
  data,
  style,
  label,
  transparent = false,
}) => {
  const effectiveValue = data.trim() || 'https://example.com';
  const effectiveStyle = useMemo<QRStyleConfig>(
    () => ({
      ...style,
      transparentBackground: transparent,
    }),
    [style, transparent]
  );

  const styleKey = useMemo(() => JSON.stringify(effectiveStyle), [effectiveStyle]);
  const cacheKey = `${effectiveValue}::${styleKey}::512`;

  const [imgSrc, setImgSrc] = useState<string>(() => TABLET_PREVIEW_CACHE.get(cacheKey) ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = TABLET_PREVIEW_CACHE.get(cacheKey);
    if (cached) {
      setImgSrc(cached);
      setError(null);
      return;
    }

    let cancelled = false;
    setError(null);

    renderCompositeQRCanvas(effectiveValue, effectiveStyle, {
      targetWidth: 512,
      transparent,
    })
      .then((canvas) => {
        if (cancelled) return;
        const url = canvas.toDataURL('image/png');
        setCachedTabletPreview(cacheKey, url);
        setImgSrc(url);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unable to render QR preview');
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, effectiveValue, effectiveStyle, transparent]);

  const cleanLabel = (label || '').trim();
  const blendOnStone = transparent || isLightHexColor(effectiveStyle.backgroundColor);

  return (
    <div
      className="relative w-full max-w-[248px] sm:max-w-[272px] md:max-w-[264px] aspect-[853/1280] rounded-xl overflow-hidden shadow-[0_14px_34px_-12px_rgba(85,56,238,0.42)] border border-[#E5E8F0] dark:border-[#29344B] bg-[#8E2DE2] select-none mx-auto"
      data-testid="export-tablet-preview"
    >
      <img
        src="/assets/aistudio/IMG_20261124_204057_650_1544a0e4.jpg"
        alt="Classical statue holding carved QR Code display board"
        className="w-full h-full object-cover block pointer-events-none"
      />

      {/* Carved Marble Tablet Safe Area (clear of outer Greek-key border and left fingers) */}
      <div className="absolute left-[26%] top-[49.5%] w-[52%] h-[38%] flex flex-col items-center justify-center gap-1 px-1.5 py-1">
        {!imgSrc && !error && (
          <div className="w-[82%] aspect-square rounded-md bg-black/10 animate-pulse" />
        )}
        {error && (
          <div className="text-[10px] text-red-700 bg-white/80 rounded px-1.5 py-1 text-center leading-tight">
            {error}
          </div>
        )}
        {imgSrc && (
          <img
            src={imgSrc}
            alt={cleanLabel ? `QR Code for ${cleanLabel}` : 'Generated QR Code Preview'}
            referrerPolicy="no-referrer"
            className={`w-[82%] max-h-[82%] aspect-square object-contain pointer-events-none ${
              blendOnStone ? 'mix-blend-multiply' : 'rounded-md shadow-xs'
            }`}
          />
        )}
        {cleanLabel && (
          <div
            className="w-full px-1 text-center text-[11px] sm:text-xs font-bold tracking-[0.02em] text-[#2A2233] leading-tight truncate drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]"
            style={{ fontFamily: "'Plus Jakarta Sans', Georgia, serif" }}
            title={cleanLabel}
          >
            {cleanLabel}
          </div>
        )}
      </div>
    </div>
  );
};
