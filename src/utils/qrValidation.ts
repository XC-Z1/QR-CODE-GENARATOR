import type { QRRecord, AppSettings } from '../types/qr';

const DANGEROUS_SCHEMES = ['javascript:', 'data:', 'vbscript:', 'file:'];

export function isSafeHttpUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  if (DANGEROUS_SCHEMES.some((scheme) => lower.startsWith(scheme))) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeUrlInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  if (DANGEROUS_SCHEMES.some((scheme) => lower.startsWith(scheme))) {
    return '';
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export function isValidHexColor(hex: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex.trim());
}

export function getRelativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  if (clean.length !== 3 && clean.length !== 6) return 0;
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function getContrastRatio(hexA: string, hexB: string): number {
  const l1 = getRelativeLuminance(hexA);
  const l2 = getRelativeLuminance(hexB);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return Number(((brightest + 0.05) / (darkest + 0.05)).toFixed(2));
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export const ALLOWED_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
export const MAX_IMAGE_FILE_BYTES = 5 * 1024 * 1024; // 5MB

export function validateImageFileMeta(
  mimeType: string,
  sizeBytes: number,
  maxBytes = MAX_IMAGE_FILE_BYTES
): ImageValidationResult {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType.toLowerCase())) {
    return {
      valid: false,
      error: 'Unsupported image format. Please use PNG, JPG, JPEG, or WEBP.',
    };
  }
  if (sizeBytes <= 0) {
    return {
      valid: false,
      error: 'The selected image file is empty.',
    };
  }
  if (sizeBytes > maxBytes) {
    const maxMb = Math.round((maxBytes / (1024 * 1024)) * 10) / 10;
    return {
      valid: false,
      error: `Image exceeds the ${maxMb} MB file size limit.`,
    };
  }
  return { valid: true };
}

export interface ImportedWorkspaceValidation {
  valid: boolean;
  error?: string;
  qrs?: QRRecord[];
  favoriteTemplateIds?: string[];
  settings?: Partial<AppSettings>;
}

export function validateImportedWorkspace(payload: unknown): ImportedWorkspaceValidation {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Backup file must contain a valid JSON object.' };
  }
  const obj = payload as Record<string, unknown>;
  if (!Array.isArray(obj.qrs)) {
    return { valid: false, error: 'Backup file is missing a valid "qrs" array.' };
  }
  for (const item of obj.qrs) {
    if (
      !item ||
      typeof item !== 'object' ||
      typeof (item as QRRecord).id !== 'string' ||
      typeof (item as QRRecord).name !== 'string' ||
      typeof (item as QRRecord).encodedValue !== 'string'
    ) {
      return {
        valid: false,
        error: 'One or more QR records in the backup file are malformed.',
      };
    }
  }
  const favoriteTemplateIds = Array.isArray(obj.favoriteTemplateIds)
    ? obj.favoriteTemplateIds.filter((id): id is string => typeof id === 'string')
    : undefined;

  return {
    valid: true,
    qrs: obj.qrs as QRRecord[],
    favoriteTemplateIds,
    settings:
      obj.settings && typeof obj.settings === 'object'
        ? (obj.settings as Partial<AppSettings>)
        : undefined,
  };
}
