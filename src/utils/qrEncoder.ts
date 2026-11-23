import type { QRContentType, ScanHistoryItem } from '../types/qr';
import { isSafeHttpUrl, normalizeUrlInput } from './qrValidation';

export interface ContentValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  encodedValue: string;
}

function escapeWifiValue(value: string): string {
  return value.replace(/([\\;,:"'])/g, '\\$1');
}

function cleanVCardValue(value: string): string {
  return value.replace(/\r?\n/g, ' ').replace(/;/g, '\\;').trim();
}

function formatICSDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function encodeQRContent(
  type: QRContentType,
  fields: Record<string, string>
): ContentValidationResult {
  const errors: Record<string, string> = {};
  const val = (key: string) => (fields[key] ?? '').trim();

  switch (type) {
    case 'url':
    case 'custom-url':
    case 'business-website':
    case 'restaurant-menu':
    case 'product-info':
    case 'event-registration':
    case 'app-download':
    case 'location-share':
    case 'maps-url': {
      const rawUrl = val('url');
      if (!rawUrl) {
        errors.url = 'Please enter a valid destination URL.';
        return { valid: false, errors, encodedValue: '' };
      }
      const normalized = normalizeUrlInput(rawUrl);
      if (!isSafeHttpUrl(normalized)) {
        errors.url = 'URL must start with https:// or http:// and use a valid domain.';
        return { valid: false, errors, encodedValue: '' };
      }
      return { valid: true, errors, encodedValue: normalized };
    }

    case 'text':
    case 'custom-data': {
      const text = val('text');
      if (!text) {
        errors.text = 'Please enter content to encode.';
        return { valid: false, errors, encodedValue: '' };
      }
      if (text.length > 2500) {
        errors.text = 'Content exceeds 2,500 characters for reliable scanning.';
        return { valid: false, errors, encodedValue: '' };
      }
      return { valid: true, errors, encodedValue: text };
    }

    case 'phone': {
      const phone = val('phone').replace(/[^\d+\-() ]/g, '');
      if (!phone || phone.replace(/\D/g, '').length < 5) {
        errors.phone = 'Enter a valid phone number including country or area code.';
        return { valid: false, errors, encodedValue: '' };
      }
      return { valid: true, errors, encodedValue: `tel:${phone.replace(/\s+/g, '')}` };
    }

    case 'email': {
      const email = val('email');
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'Enter a valid email address.';
        return { valid: false, errors, encodedValue: '' };
      }
      const params = new URLSearchParams();
      if (val('subject')) params.set('subject', val('subject'));
      if (val('body')) params.set('body', val('body'));
      const qs = params.toString();
      return { valid: true, errors, encodedValue: `mailto:${email}${qs ? `?${qs}` : ''}` };
    }

    case 'sms': {
      const phone = val('phone').replace(/[^\d+]/g, '');
      if (!phone || phone.length < 5) {
        errors.phone = 'Enter a valid recipient phone number.';
        return { valid: false, errors, encodedValue: '' };
      }
      const msg = val('message');
      return { valid: true, errors, encodedValue: `SMSTO:${phone}:${msg}` };
    }

    case 'whatsapp': {
      const phone = val('phone').replace(/\D/g, '');
      if (!phone || phone.length < 7) {
        errors.phone = 'Enter WhatsApp number with country code (digits only, e.g. 15551234567).';
        return { valid: false, errors, encodedValue: '' };
      }
      const text = val('message');
      const query = text ? `?text=${encodeURIComponent(text)}` : '';
      return { valid: true, errors, encodedValue: `https://wa.me/${phone}${query}` };
    }

    case 'telegram': {
      const username = val('username').replace(/^@/, '');
      if (!username || !/^[a-zA-Z0-9_]{3,32}$/.test(username)) {
        errors.username = 'Enter a valid Telegram username (3–32 letters, numbers, or underscores).';
        return { valid: false, errors, encodedValue: '' };
      }
      return { valid: true, errors, encodedValue: `https://t.me/${username}` };
    }

    case 'vcard':
    case 'business-contact': {
      const firstName = val('firstName');
      const lastName = val('lastName');
      const org = val('organization');
      if (!firstName && !lastName && !org) {
        errors.firstName = 'Provide at least a name or organization.';
        return { valid: false, errors, encodedValue: '' };
      }
      const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
      const fullName = [firstName, lastName].filter(Boolean).join(' ') || org;
      lines.push(`N:${cleanVCardValue(lastName)};${cleanVCardValue(firstName)};;;`);
      lines.push(`FN:${cleanVCardValue(fullName)}`);
      if (org) lines.push(`ORG:${cleanVCardValue(org)}`);
      if (val('title')) lines.push(`TITLE:${cleanVCardValue(val('title'))}`);
      if (val('phone')) lines.push(`TEL;TYPE=WORK,VOICE:${cleanVCardValue(val('phone'))}`);
      if (val('email')) lines.push(`EMAIL:${cleanVCardValue(val('email'))}`);
      if (val('website')) {
        const site = normalizeUrlInput(val('website'));
        if (site && !isSafeHttpUrl(site)) {
          errors.website = 'Website must be a valid http(s) URL.';
          return { valid: false, errors, encodedValue: '' };
        }
        if (site) lines.push(`URL:${site}`);
      }
      if (val('address')) lines.push(`ADR;TYPE=WORK:;;${cleanVCardValue(val('address'))};;;;`);
      lines.push('END:VCARD');
      return { valid: true, errors, encodedValue: lines.join('\n') };
    }

    case 'wifi': {
      const ssid = val('ssid');
      if (!ssid) {
        errors.ssid = 'Network SSID name is required.';
        return { valid: false, errors, encodedValue: '' };
      }
      const security = val('security') || 'WPA';
      const password = val('password');
      if (security !== 'nopass' && !password) {
        errors.password = 'Password is required for WPA/WEP secured networks.';
        return { valid: false, errors, encodedValue: '' };
      }
      const hidden = val('hidden') === 'true' ? 'true' : 'false';
      const escapedSsid = escapeWifiValue(ssid);
      const escapedPass = security === 'nopass' ? '' : escapeWifiValue(password);
      return {
        valid: true,
        errors,
        encodedValue: `WIFI:T:${security};S:${escapedSsid};P:${escapedPass};H:${hidden};;`,
      };
    }

    case 'instagram':
    case 'facebook':
    case 'youtube':
    case 'tiktok':
    case 'linkedin':
    case 'twitter':
    case 'snapchat':
    case 'pinterest': {
      const handle = val('handle').replace(/^@/, '');
      if (!handle) {
        errors.handle = 'Enter a username or full profile URL.';
        return { valid: false, errors, encodedValue: '' };
      }
      if (/^https?:\/\//i.test(handle)) {
        if (!isSafeHttpUrl(handle)) {
          errors.handle = 'Profile URL must be valid https:// or http://.';
          return { valid: false, errors, encodedValue: '' };
        }
        return { valid: true, errors, encodedValue: handle };
      }
      const baseMap: Record<string, string> = {
        instagram: `https://instagram.com/${encodeURIComponent(handle)}`,
        facebook: `https://facebook.com/${encodeURIComponent(handle)}`,
        youtube: `https://youtube.com/@${encodeURIComponent(handle)}`,
        tiktok: `https://tiktok.com/@${encodeURIComponent(handle)}`,
        linkedin: `https://linkedin.com/in/${encodeURIComponent(handle)}`,
        twitter: `https://x.com/${encodeURIComponent(handle)}`,
        snapchat: `https://snapchat.com/add/${encodeURIComponent(handle)}`,
        pinterest: `https://pinterest.com/${encodeURIComponent(handle)}`,
      };
      return { valid: true, errors, encodedValue: baseMap[type] };
    }

    case 'gps': {
      const lat = Number(val('latitude'));
      const lng = Number(val('longitude'));
      if (!val('latitude') || Number.isNaN(lat) || lat < -90 || lat > 90) {
        errors.latitude = 'Latitude must be between -90 and 90.';
      }
      if (!val('longitude') || Number.isNaN(lng) || lng < -180 || lng > 180) {
        errors.longitude = 'Longitude must be between -180 and 180.';
      }
      if (Object.keys(errors).length > 0) {
        return { valid: false, errors, encodedValue: '' };
      }
      return { valid: true, errors, encodedValue: `geo:${lat},${lng}` };
    }

    case 'calendar-event': {
      const title = val('title');
      const start = formatICSDate(val('start'));
      const end = formatICSDate(val('end'));
      if (!title) errors.title = 'Event title is required.';
      if (!start) errors.start = 'Valid start date & time is required.';
      if (!end) errors.end = 'Valid end date & time is required.';
      if (Object.keys(errors).length > 0) {
        return { valid: false, errors, encodedValue: '' };
      }
      const lines = [
        'BEGIN:VEVENT',
        `SUMMARY:${cleanVCardValue(title)}`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
      ];
      if (val('location')) lines.push(`LOCATION:${cleanVCardValue(val('location'))}`);
      if (val('description')) lines.push(`DESCRIPTION:${cleanVCardValue(val('description'))}`);
      lines.push('END:VEVENT');
      return { valid: true, errors, encodedValue: lines.join('\n') };
    }

    case 'bitcoin': {
      const address = val('address');
      if (!address || address.length < 20) {
        errors.address = 'Enter a valid Bitcoin wallet address.';
        return { valid: false, errors, encodedValue: '' };
      }
      const params = new URLSearchParams();
      if (val('amount')) {
        const amt = Number(val('amount'));
        if (Number.isNaN(amt) || amt <= 0) {
          errors.amount = 'Amount must be a positive number.';
          return { valid: false, errors, encodedValue: '' };
        }
        params.set('amount', String(amt));
      }
      if (val('label')) params.set('label', val('label'));
      const qs = params.toString();
      return { valid: true, errors, encodedValue: `bitcoin:${address}${qs ? `?${qs}` : ''}` };
    }

    case 'crypto': {
      const coin = (val('coin') || 'ethereum').toLowerCase();
      const address = val('address');
      if (!address || address.length < 16) {
        errors.address = 'Enter a valid cryptocurrency wallet address.';
        return { valid: false, errors, encodedValue: '' };
      }
      const amount = val('amount');
      const qs = amount ? `?amount=${encodeURIComponent(amount)}` : '';
      return { valid: true, errors, encodedValue: `${coin}:${address}${qs}` };
    }
  }
}

export function inspectScannedPayload(
  rawText: string
): Pick<ScanHistoryItem, 'detectedType' | 'safetyNote' | 'isSafeUrl'> {
  const trimmed = rawText.trim();
  const lower = trimmed.toLowerCase();

  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:')
  ) {
    return {
      detectedType: 'unsafe',
      safetyNote: 'Blocked potentially unsafe URI scheme. Do not execute this payload.',
      isSafeUrl: false,
    };
  }

  if (lower.startsWith('https://')) {
    return {
      detectedType: 'url',
      safetyNote: 'Encrypted HTTPS link. Review domain before opening.',
      isSafeUrl: true,
    };
  }

  if (lower.startsWith('http://')) {
    return {
      detectedType: 'url',
      safetyNote: 'Unencrypted HTTP link. Verify destination carefully.',
      isSafeUrl: true,
    };
  }

  if (trimmed.toUpperCase().startsWith('WIFI:')) {
    return {
      detectedType: 'wifi',
      safetyNote: 'Wi-Fi network configuration payload.',
      isSafeUrl: false,
    };
  }

  if (trimmed.toUpperCase().startsWith('BEGIN:VCARD')) {
    return {
      detectedType: 'vcard',
      safetyNote: 'vCard contact card payload.',
      isSafeUrl: false,
    };
  }

  if (lower.startsWith('mailto:')) {
    return {
      detectedType: 'email',
      safetyNote: 'Email composition URI.',
      isSafeUrl: false,
    };
  }

  if (lower.startsWith('tel:')) {
    return {
      detectedType: 'phone',
      safetyNote: 'Phone call URI.',
      isSafeUrl: false,
    };
  }

  if (lower.startsWith('geo:')) {
    return {
      detectedType: 'geo',
      safetyNote: 'Geographic coordinates.',
      isSafeUrl: false,
    };
  }

  if (lower.startsWith('bitcoin:') || lower.startsWith('ethereum:')) {
    return {
      detectedType: 'crypto',
      safetyNote: 'Cryptocurrency payment request. Double-check wallet address.',
      isSafeUrl: false,
    };
  }

  return {
    detectedType: 'text',
    safetyNote: 'Plain text content.',
    isSafeUrl: false,
  };
}
