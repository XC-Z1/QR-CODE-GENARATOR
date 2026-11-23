export type NavRoute =
  | 'dashboard'
  | 'generator'
  | 'image-to-qr'
  | 'templates'
  | 'scanner'
  | 'library'
  | 'favorites'
  | 'activity'
  | 'analytics'
  | 'settings'
  | 'help';

export type QRContentCategory =
  | 'general'
  | 'communication'
  | 'contact'
  | 'network'
  | 'social'
  | 'location'
  | 'business'
  | 'other';

export type QRContentType =
  | 'url'
  | 'text'
  | 'custom-url'
  | 'phone'
  | 'email'
  | 'sms'
  | 'whatsapp'
  | 'telegram'
  | 'vcard'
  | 'business-contact'
  | 'wifi'
  | 'instagram'
  | 'facebook'
  | 'youtube'
  | 'tiktok'
  | 'linkedin'
  | 'twitter'
  | 'snapchat'
  | 'pinterest'
  | 'gps'
  | 'maps-url'
  | 'location-share'
  | 'restaurant-menu'
  | 'business-website'
  | 'product-info'
  | 'event-registration'
  | 'calendar-event'
  | 'app-download'
  | 'bitcoin'
  | 'crypto'
  | 'custom-data';

export type QRPatternType =
  | 'square'
  | 'dots'
  | 'rounded'
  | 'classy'
  | 'classy-rounded'
  | 'extra-rounded';

export type QRCornerSquareType = 'square' | 'extra-rounded' | 'dot' | 'rounded';
export type QRCornerDotType = 'square' | 'dot' | 'rounded';
export type QRErrorCorrection = 'L' | 'M' | 'Q' | 'H';
export type QRLogoShape = 'square' | 'rounded' | 'circle';
export type QRFrameType = 'none' | 'scan-me' | 'scan-here' | 'scan-to-open' | 'custom';
export type QRFrameFont = 'manrope' | 'jakarta' | 'mono';
export type QRMode = 'static' | 'dynamic';
export type ExportFormat = 'png' | 'png-hd' | 'png-transparent' | 'jpg' | 'svg' | 'pdf';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface QRStyleConfig {
  pattern: QRPatternType;
  cornerSquare: QRCornerSquareType;
  cornerDot: QRCornerDotType;
  foregroundColor: string;
  backgroundColor: string;
  transparentBackground: boolean;
  useGradient: boolean;
  gradientType: 'linear' | 'radial';
  gradientRotation: number;
  gradientColor1: string;
  gradientColor2: string;
  logoDataUrl?: string;
  logoName?: string;
  logoSize: number; // 0.15 to 0.42
  logoMargin: number; // 0 to 16
  logoBackgroundColor: string;
  logoHideBackgroundDots: boolean;
  logoShape: QRLogoShape;
  frameType: QRFrameType;
  frameCaption: string;
  frameColor: string;
  frameCaptionColor: string;
  frameFont: QRFrameFont;
  errorCorrection: QRErrorCorrection;
  size: number; // 200 to 1000
  margin: number; // 0 to 40
  quietZone: number; // 0 to 32
  resolution: 1 | 2 | 4;
}

export interface QRRecord {
  id: string;
  name: string;
  type: QRContentType;
  mode: QRMode;
  fields: Record<string, string>;
  encodedValue: string;
  style: QRStyleConfig;
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
  downloadCount: number;
  // Dynamic QR metadata (only populated when mode === 'dynamic' and backed by server)
  dynamicId?: string;
  shortCode?: string;
  shortUrl?: string;
  destinationUrl?: string;
  active?: boolean;
  expiresAt?: string | null;
  scanCount?: number;
}

export type TemplateCategory =
  | 'Minimal'
  | 'Modern'
  | 'Business'
  | 'Elegant'
  | 'Premium Gold'
  | 'Neon'
  | 'Gradient'
  | 'Restaurant'
  | 'Social Media'
  | 'Technology'
  | 'Creative'
  | 'Professional';

export interface QRTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  sampleType: QRContentType;
  sampleValue: string;
  style: QRStyleConfig;
}

export type ActivityType =
  | 'created'
  | 'updated'
  | 'downloaded'
  | 'copied'
  | 'scanned'
  | 'duplicated'
  | 'deleted'
  | 'favorited'
  | 'dynamic_created'
  | 'dynamic_updated';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  qrId?: string;
  qrName: string;
  qrType?: QRContentType;
  detail: string;
  timestamp: string;
}

export interface ScanHistoryItem {
  id: string;
  decodedText: string;
  format: string;
  detectedType: 'url' | 'wifi' | 'vcard' | 'email' | 'phone' | 'geo' | 'crypto' | 'text' | 'unsafe';
  safetyNote: string;
  isSafeUrl: boolean;
  source: 'camera' | 'image';
  timestamp: string;
}

export interface AppSettings {
  theme: ThemePreference;
  defaultStyle: QRStyleConfig;
  defaultExport: {
    format: ExportFormat;
    width: number;
    height: number;
    quality: number;
    transparent: boolean;
  };
}

export interface DynamicQRServerRecord {
  id: string;
  shortCode: string;
  name: string;
  destinationUrl: string;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  scanCount: number;
  redirectHistory: Array<{
    timestamp: string;
    previousUrl?: string;
    newUrl: string;
  }>;
  scans: Array<{
    id: string;
    timestamp: string;
    deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  }>;
}

export interface AnalyticsSummary {
  totalDynamicQRs: number;
  totalDynamicScans: number;
  activeDynamicQRs: number;
  dailyScans: Array<{ date: string; scans: number }>;
  topDynamicQRs: Array<{
    id: string;
    shortCode: string;
    name: string;
    destinationUrl: string;
    scanCount: number;
    active: boolean;
  }>;
  recentScans: Array<{
    id: string;
    qrName: string;
    shortCode: string;
    timestamp: string;
    deviceType: string;
  }>;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'error' | 'info' | 'warning';
}
