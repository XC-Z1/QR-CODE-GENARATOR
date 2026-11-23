import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { QRStyleConfig } from '../../types/qr';
import { renderCompositeQRCanvas } from '../../utils/qrRenderer';
import { getContrastRatio } from '../../utils/qrValidation';

const PREVIEW_CACHE = new Map<string, string>();
const MAX_CACHE_ENTRIES = 80;

function setCachedPreview(key: string, value: string): void {
  if (PREVIEW_CACHE.size >= MAX_CACHE_ENTRIES) {
    const firstKey = PREVIEW_CACHE.keys().next().value;
    if (firstKey) PREVIEW_CACHE.delete(firstKey);
  }
  PREVIEW_CACHE.set(key, value);
}

interface QRPreviewCardProps {
  data: string;
  style: QRStyleConfig;
  size?: number;
  className?: string;
  showReliabilityCheck?: boolean;
  bordered?: boolean;
  alt?: string;
}

export const QRPreviewCard: React.FC<QRPreviewCardProps> = ({
  data,
  style,
  size = 280,
  className = '',
  showReliabilityCheck = false,
  bordered = true,
  alt = 'QR code preview',
}) => {
  const effectiveValue = data.trim() || 'https://example.com';
  const targetWidth = size <= 160 ? Math.max(Math.round(size * 1.5), 220) : Math.max(size * 2, 420);
  const styleKey = useMemo(() => JSON.stringify(style), [style]);
  const cacheKey = `${effectiveValue}::${styleKey}::${targetWidth}`;

  const [imgSrc, setImgSrc] = useState<string>(() => PREVIEW_CACHE.get(cacheKey) ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = PREVIEW_CACHE.get(cacheKey);
    if (cached) {
      setImgSrc(cached);
      setError(null);
      return;
    }

    let cancelled = false;
    setError(null);

    renderCompositeQRCanvas(effectiveValue, style, {
      targetWidth,
      transparent: style.transparentBackground,
    })
      .then((canvas) => {
        if (cancelled) return;
        const url = canvas.toDataURL('image/png');
        setCachedPreview(cacheKey, url);
        setImgSrc(url);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Unable to render QR preview');
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, effectiveValue, style, targetWidth]);

  const fg = style.useGradient ? style.gradientColor1 : style.foregroundColor;
  const bg = style.transparentBackground ? '#FFFFFF' : style.backgroundColor;
  const contrast = getContrastRatio(fg, bg);
  const lowContrast = contrast < 3.0;

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div
        className={`relative flex items-center justify-center rounded-xl transition-colors ${
          bordered
            ? 'border border-[#E5E8F0] dark:border-[#29344B] p-3'
            : 'p-1'
        }`}
        style={{
          width: bordered ? size + 24 : size + 8,
          minHeight: bordered ? size + 24 : size + 8,
          backgroundImage: style.transparentBackground
            ? 'linear-gradient(45deg, #e5e8f0 25%, transparent 25%), linear-gradient(-45deg, #e5e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e8f0 75%), linear-gradient(-45deg, transparent 75%, #e5e8f0 75%)'
            : undefined,
          backgroundSize: style.transparentBackground ? '16px 16px' : undefined,
          backgroundPosition: style.transparentBackground ? '0 0, 0 8px, 8px -8px, -8px 0px' : undefined,
          backgroundColor: style.transparentBackground ? '#ffffff' : undefined,
        }}
        data-testid="qr-preview-canvas-box"
      >
        {!imgSrc && !error && (
          <div className="w-full aspect-square rounded-lg bg-[#F0F2F8] dark:bg-[#19243A] animate-pulse" />
        )}
        {error && (
          <div className="text-xs text-red-600 dark:text-red-400 text-center px-3">{error}</div>
        )}
        {imgSrc && (
          <img
            src={imgSrc}
            alt={alt}
            referrerPolicy="no-referrer"
            className="max-w-full h-auto rounded-lg select-none"
            style={{ width: size }}
          />
        )}
      </div>

      {showReliabilityCheck && (
        <div className="flex items-center gap-2 text-xs text-[#747D91] dark:text-[#A4ADC1]">
          {lowContrast ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="text-amber-700 dark:text-amber-300 font-medium">
                Low contrast ({contrast}:1) — increase foreground/background separation for reliable scanning
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                Scan contrast {contrast}:1 · EC Level{' '}
                {style.logoDataUrl && (style.errorCorrection === 'L' || style.errorCorrection === 'M')
                  ? 'Q (auto-elevated for logo)'
                  : style.errorCorrection}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
