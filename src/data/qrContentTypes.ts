import type { QRContentCategory, QRContentType, QRStyleConfig, AppSettings } from '../types/qr';

export interface QRFieldSchema {
  key: string;
  label: string;
  placeholder: string;
  inputType?: 'text' | 'url' | 'email' | 'tel' | 'textarea' | 'select' | 'datetime-local' | 'number' | 'checkbox';
  required?: boolean;
  hint?: string;
  options?: Array<{ value: string; label: string }>;
}

export interface QRContentTypeSpec {
  type: QRContentType;
  label: string;
  shortLabel: string;
  category: QRContentCategory;
  description: string;
  supportsDynamic: boolean;
  defaultFields: Record<string, string>;
  fields: QRFieldSchema[];
}

export const QR_CONTENT_CATEGORIES: Array<{ id: QRContentCategory; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'communication', label: 'Communication' },
  { id: 'contact', label: 'Contact' },
  { id: 'network', label: 'Network' },
  { id: 'social', label: 'Social Media' },
  { id: 'location', label: 'Location' },
  { id: 'business', label: 'Business' },
  { id: 'other', label: 'Other' },
];

export const DEFAULT_QR_STYLE: QRStyleConfig = {
  pattern: 'rounded',
  cornerSquare: 'extra-rounded',
  cornerDot: 'dot',
  foregroundColor: '#101525',
  backgroundColor: '#FFFFFF',
  transparentBackground: false,
  useGradient: false,
  gradientType: 'linear',
  gradientRotation: 45,
  gradientColor1: '#6655EE',
  gradientColor2: '#3984F6',
  logoSize: 0.28,
  logoMargin: 6,
  logoBackgroundColor: '#FFFFFF',
  logoHideBackgroundDots: true,
  logoShape: 'rounded',
  frameType: 'none',
  frameCaption: 'SCAN ME',
  frameColor: '#101525',
  frameCaptionColor: '#FFFFFF',
  frameFont: 'manrope',
  errorCorrection: 'Q',
  size: 360,
  margin: 12,
  quietZone: 12,
  resolution: 2,
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: 'light',
  defaultStyle: DEFAULT_QR_STYLE,
  defaultExport: {
    format: 'png',
    width: 1024,
    height: 1024,
    quality: 0.95,
    transparent: false,
  },
};

export const CURATED_PALETTES: Array<{
  id: string;
  name: string;
  fg: string;
  bg: string;
  useGradient?: boolean;
  g1?: string;
  g2?: string;
}> = [
  { id: 'obsidian', name: 'Obsidian Crisp', fg: '#101525', bg: '#FFFFFF' },
  { id: 'indigo', name: 'Electric Indigo', fg: '#6655EE', bg: '#FFFFFF' },
  { id: 'indigo-grad', name: 'Indigo to Blue', fg: '#6655EE', bg: '#FFFFFF', useGradient: true, g1: '#6655EE', g2: '#3984F6' },
  { id: 'violet-grad', name: 'Royal Violet', fg: '#8874FF', bg: '#FFFFFF', useGradient: true, g1: '#151D32', g2: '#6655EE' },
  { id: 'midnight', name: 'Deep Navy Dark', fg: '#F5F6FC', bg: '#101525' },
  { id: 'emerald', name: 'Forest Slate', fg: '#0F5132', bg: '#F8FBF9' },
  { id: 'gold', name: 'Warm Brass', fg: '#8A6315', bg: '#FFFDF7' },
  { id: 'cobalt', name: 'Cobalt Studio', fg: '#1D4ED8', bg: '#F8FAFC' },
];

export const QR_CONTENT_TYPES: QRContentTypeSpec[] = [
  {
    type: 'url',
    label: 'Website URL',
    shortLabel: 'Website',
    category: 'general',
    description: 'Open any webpage, landing page, or campaign link.',
    supportsDynamic: true,
    defaultFields: { url: 'https://example.com' },
    fields: [
      {
        key: 'url',
        label: 'Destination URL',
        placeholder: 'https://yourcompany.com/launch',
        inputType: 'url',
        required: true,
        hint: 'Use https:// for faster, trusted browser opening.',
      },
    ],
  },
  {
    type: 'text',
    label: 'Plain Text',
    shortLabel: 'Text',
    category: 'general',
    description: 'Display offline plain text, serial numbers, or instructions.',
    supportsDynamic: false,
    defaultFields: { text: '' },
    fields: [
      {
        key: 'text',
        label: 'Text Content',
        placeholder: 'Enter text, serial code, or message...',
        inputType: 'textarea',
        required: true,
        hint: 'Works 100% offline. Shorter text yields denser, easier-to-scan modules.',
      },
    ],
  },
  {
    type: 'custom-url',
    label: 'Custom URL',
    shortLabel: 'Custom URL',
    category: 'general',
    description: 'Deep links, UTM-tagged campaign links, or custom web endpoints.',
    supportsDynamic: true,
    defaultFields: { url: '' },
    fields: [
      {
        key: 'url',
        label: 'Custom URL',
        placeholder: 'https://app.example.com/?utm_source=qr',
        inputType: 'url',
        required: true,
      },
    ],
  },
  {
    type: 'phone',
    label: 'Phone Number',
    shortLabel: 'Phone',
    category: 'communication',
    description: 'Prompt the scanner to dial a phone number immediately.',
    supportsDynamic: false,
    defaultFields: { phone: '' },
    fields: [
      {
        key: 'phone',
        label: 'Phone Number',
        placeholder: '+1 415 555 0199',
        inputType: 'tel',
        required: true,
        hint: 'Include country code for international reliability.',
      },
    ],
  },
  {
    type: 'email',
    label: 'Email',
    shortLabel: 'Email',
    category: 'communication',
    description: 'Pre-fill recipient address, subject line, and message body.',
    supportsDynamic: false,
    defaultFields: { email: '', subject: '', body: '' },
    fields: [
      { key: 'email', label: 'Recipient Email', placeholder: 'hello@company.com', inputType: 'email', required: true },
      { key: 'subject', label: 'Subject Line', placeholder: 'Inquiry from QR Code', inputType: 'text' },
      { key: 'body', label: 'Message Body', placeholder: 'Hi team, I would like to learn more...', inputType: 'textarea' },
    ],
  },
  {
    type: 'sms',
    label: 'SMS Message',
    shortLabel: 'SMS',
    category: 'communication',
    description: 'Open the default messaging app with a pre-filled text.',
    supportsDynamic: false,
    defaultFields: { phone: '', message: '' },
    fields: [
      { key: 'phone', label: 'Recipient Number', placeholder: '+14155550199', inputType: 'tel', required: true },
      { key: 'message', label: 'Pre-filled SMS Text', placeholder: 'CONFIRM', inputType: 'textarea' },
    ],
  },
  {
    type: 'whatsapp',
    label: 'WhatsApp',
    shortLabel: 'WhatsApp',
    category: 'communication',
    description: 'Start a direct WhatsApp conversation with an optional message.',
    supportsDynamic: true,
    defaultFields: { phone: '', message: '' },
    fields: [
      {
        key: 'phone',
        label: 'WhatsApp Number (Country Code + Digits)',
        placeholder: '14155550199',
        inputType: 'tel',
        required: true,
        hint: 'Digits only including country code, without + or spaces.',
      },
      { key: 'message', label: 'Greeting Message', placeholder: 'Hello! I scanned your QR code.', inputType: 'textarea' },
    ],
  },
  {
    type: 'telegram',
    label: 'Telegram',
    shortLabel: 'Telegram',
    category: 'communication',
    description: 'Link directly to a Telegram user, channel, or bot.',
    supportsDynamic: true,
    defaultFields: { username: '' },
    fields: [
      { key: 'username', label: 'Telegram Username', placeholder: 'yourhandle', inputType: 'text', required: true },
    ],
  },
  {
    type: 'vcard',
    label: 'vCard Contact',
    shortLabel: 'Contact',
    category: 'contact',
    description: 'Save a full contact card directly to iOS or Android Contacts.',
    supportsDynamic: false,
    defaultFields: {
      firstName: '',
      lastName: '',
      organization: '',
      title: '',
      phone: '',
      email: '',
      website: '',
      address: '',
    },
    fields: [
      { key: 'firstName', label: 'First Name', placeholder: 'Elena', required: true },
      { key: 'lastName', label: 'Last Name', placeholder: 'Rostova' },
      { key: 'organization', label: 'Company / Organization', placeholder: 'Studio North' },
      { key: 'title', label: 'Job Title', placeholder: 'Product Director' },
      { key: 'phone', label: 'Phone Number', placeholder: '+1 415 555 0140', inputType: 'tel' },
      { key: 'email', label: 'Email Address', placeholder: 'elena@studionorth.co', inputType: 'email' },
      { key: 'website', label: 'Website', placeholder: 'https://studionorth.co', inputType: 'url' },
      { key: 'address', label: 'Street Address', placeholder: '540 Howard St, San Francisco, CA' },
    ],
  },
  {
    type: 'business-contact',
    label: 'Business Contact',
    shortLabel: 'Business Card',
    category: 'contact',
    description: 'Company front-desk or sales representative digital card.',
    supportsDynamic: false,
    defaultFields: {
      organization: '',
      firstName: '',
      lastName: '',
      title: '',
      phone: '',
      email: '',
      website: '',
      address: '',
    },
    fields: [
      { key: 'organization', label: 'Business Name', placeholder: 'Northstar Logistics', required: true },
      { key: 'firstName', label: 'Contact First Name', placeholder: 'Marcus' },
      { key: 'lastName', label: 'Contact Last Name', placeholder: 'Chen' },
      { key: 'title', label: 'Department / Role', placeholder: 'Client Relations' },
      { key: 'phone', label: 'Business Phone', placeholder: '+1 212 555 0180', inputType: 'tel' },
      { key: 'email', label: 'Support Email', placeholder: 'sales@northstar.io', inputType: 'email' },
      { key: 'website', label: 'Company Website', placeholder: 'https://northstar.io', inputType: 'url' },
      { key: 'address', label: 'Office Location', placeholder: '100 Main St, Suite 400' },
    ],
  },
  {
    type: 'wifi',
    label: 'Wi-Fi Network',
    shortLabel: 'Wi-Fi',
    category: 'network',
    description: 'Let guests join Wi-Fi automatically without typing passwords.',
    supportsDynamic: false,
    defaultFields: { ssid: '', password: '', security: 'WPA', hidden: 'false' },
    fields: [
      { key: 'ssid', label: 'Network Name (SSID)', placeholder: 'Studio-Guest-5G', required: true },
      {
        key: 'security',
        label: 'Security Protocol',
        placeholder: 'WPA',
        inputType: 'select',
        options: [
          { value: 'WPA', label: 'WPA / WPA2 / WPA3' },
          { value: 'WEP', label: 'WEP' },
          { value: 'nopass', label: 'Open (No Password)' },
        ],
      },
      { key: 'password', label: 'Wi-Fi Password', placeholder: 'Enter network password' },
      {
        key: 'hidden',
        label: 'Hidden SSID Network',
        placeholder: 'false',
        inputType: 'checkbox',
      },
    ],
  },
  {
    type: 'instagram',
    label: 'Instagram',
    shortLabel: 'Instagram',
    category: 'social',
    description: 'Open an Instagram profile or reel.',
    supportsDynamic: true,
    defaultFields: { handle: '' },
    fields: [{ key: 'handle', label: 'Username or Profile URL', placeholder: 'designstudio', required: true }],
  },
  {
    type: 'facebook',
    label: 'Facebook',
    shortLabel: 'Facebook',
    category: 'social',
    description: 'Link to a Facebook Page, group, or event.',
    supportsDynamic: true,
    defaultFields: { handle: '' },
    fields: [{ key: 'handle', label: 'Page Name or URL', placeholder: 'yourbrandpage', required: true }],
  },
  {
    type: 'youtube',
    label: 'YouTube',
    shortLabel: 'YouTube',
    category: 'social',
    description: 'Open a YouTube channel or specific video URL.',
    supportsDynamic: true,
    defaultFields: { handle: '' },
    fields: [{ key: 'handle', label: 'Channel Handle or Video URL', placeholder: 'yourchannel', required: true }],
  },
  {
    type: 'tiktok',
    label: 'TikTok',
    shortLabel: 'TikTok',
    category: 'social',
    description: 'Direct visitors to a TikTok creator profile.',
    supportsDynamic: true,
    defaultFields: { handle: '' },
    fields: [{ key: 'handle', label: 'TikTok Handle or URL', placeholder: 'creatorname', required: true }],
  },
  {
    type: 'linkedin',
    label: 'LinkedIn',
    shortLabel: 'LinkedIn',
    category: 'social',
    description: 'Connect visitors to a LinkedIn profile or company page.',
    supportsDynamic: true,
    defaultFields: { handle: '' },
    fields: [{ key: 'handle', label: 'Profile Slug or Full URL', placeholder: 'in/username', required: true }],
  },
  {
    type: 'twitter',
    label: 'X / Twitter',
    shortLabel: 'X / Twitter',
    category: 'social',
    description: 'Link to an X (Twitter) handle or post.',
    supportsDynamic: true,
    defaultFields: { handle: '' },
    fields: [{ key: 'handle', label: 'X Handle or Post URL', placeholder: 'brandhandle', required: true }],
  },
  {
    type: 'snapchat',
    label: 'Snapchat',
    shortLabel: 'Snapchat',
    category: 'social',
    description: 'Add a Snapchat profile quickly.',
    supportsDynamic: true,
    defaultFields: { handle: '' },
    fields: [{ key: 'handle', label: 'Snapchat Username', placeholder: 'username', required: true }],
  },
  {
    type: 'pinterest',
    label: 'Pinterest',
    shortLabel: 'Pinterest',
    category: 'social',
    description: 'Open a Pinterest board or creator profile.',
    supportsDynamic: true,
    defaultFields: { handle: '' },
    fields: [{ key: 'handle', label: 'Pinterest Username or Board URL', placeholder: 'username', required: true }],
  },
  {
    type: 'gps',
    label: 'GPS Coordinates',
    shortLabel: 'Location',
    category: 'location',
    description: 'Encode exact latitude and longitude via geo: URI.',
    supportsDynamic: false,
    defaultFields: { latitude: '', longitude: '' },
    fields: [
      { key: 'latitude', label: 'Latitude (-90 to 90)', placeholder: '37.7749', inputType: 'number', required: true },
      { key: 'longitude', label: 'Longitude (-180 to 180)', placeholder: '-122.4194', inputType: 'number', required: true },
    ],
  },
  {
    type: 'maps-url',
    label: 'Google Maps URL',
    shortLabel: 'Maps Link',
    category: 'location',
    description: 'Link directly to a pinned place or directions URL.',
    supportsDynamic: true,
    defaultFields: { url: '' },
    fields: [
      { key: 'url', label: 'Maps Share URL', placeholder: 'https://maps.google.com/?q=...', inputType: 'url', required: true },
    ],
  },
  {
    type: 'location-share',
    label: 'Location Sharing',
    shortLabel: 'Venue Link',
    category: 'location',
    description: 'Venue check-in or map link for events and storefronts.',
    supportsDynamic: true,
    defaultFields: { url: '' },
    fields: [
      { key: 'url', label: 'Location Page URL', placeholder: 'https://maps.apple.com/?q=...', inputType: 'url', required: true },
    ],
  },
  {
    type: 'restaurant-menu',
    label: 'Restaurant Menu',
    shortLabel: 'Menu',
    category: 'business',
    description: 'Tabletop contactless digital menu link.',
    supportsDynamic: true,
    defaultFields: { url: '' },
    fields: [
      { key: 'url', label: 'Digital Menu URL', placeholder: 'https://bistro.example.com/menu', inputType: 'url', required: true },
    ],
  },
  {
    type: 'business-website',
    label: 'Business Website',
    shortLabel: 'Business Site',
    category: 'business',
    description: 'Storefront, booking portal, or corporate homepage.',
    supportsDynamic: true,
    defaultFields: { url: '' },
    fields: [
      { key: 'url', label: 'Business URL', placeholder: 'https://company.com', inputType: 'url', required: true },
    ],
  },
  {
    type: 'product-info',
    label: 'Product Information',
    shortLabel: 'Product Info',
    category: 'business',
    description: 'Packaging QR for manuals, specs, or warranty registration.',
    supportsDynamic: true,
    defaultFields: { url: '' },
    fields: [
      { key: 'url', label: 'Product Spec / Manual URL', placeholder: 'https://brand.com/manual/x1', inputType: 'url', required: true },
    ],
  },
  {
    type: 'event-registration',
    label: 'Event Registration',
    shortLabel: 'Event RSVP',
    category: 'business',
    description: 'Conference ticketing, RSVP, or check-in portal.',
    supportsDynamic: true,
    defaultFields: { url: '' },
    fields: [
      { key: 'url', label: 'Registration URL', placeholder: 'https://events.example.com/rsvp', inputType: 'url', required: true },
    ],
  },
  {
    type: 'calendar-event',
    label: 'Calendar Event',
    shortLabel: 'Calendar',
    category: 'other',
    description: 'Add a scheduled event directly to the visitor’s calendar.',
    supportsDynamic: false,
    defaultFields: { title: '', start: '', end: '', location: '', description: '' },
    fields: [
      { key: 'title', label: 'Event Title', placeholder: 'Product Design Review', required: true },
      { key: 'start', label: 'Start Date & Time', placeholder: '', inputType: 'datetime-local', required: true },
      { key: 'end', label: 'End Date & Time', placeholder: '', inputType: 'datetime-local', required: true },
      { key: 'location', label: 'Location / Meeting Link', placeholder: 'Room 4B or Video Link' },
      { key: 'description', label: 'Agenda / Notes', placeholder: 'Optional event details...', inputType: 'textarea' },
    ],
  },
  {
    type: 'app-download',
    label: 'App Download',
    shortLabel: 'App Store',
    category: 'other',
    description: 'Route users to your iOS App Store or Google Play listing.',
    supportsDynamic: true,
    defaultFields: { url: '' },
    fields: [
      { key: 'url', label: 'App Store / Play Store URL', placeholder: 'https://apps.apple.com/app/...', inputType: 'url', required: true },
    ],
  },
  {
    type: 'bitcoin',
    label: 'Bitcoin Address',
    shortLabel: 'Bitcoin',
    category: 'other',
    description: 'Generate a BIP-21 Bitcoin payment request QR.',
    supportsDynamic: false,
    defaultFields: { address: '', amount: '', label: '' },
    fields: [
      { key: 'address', label: 'Bitcoin Address', placeholder: 'bc1q...', required: true },
      { key: 'amount', label: 'Amount (BTC, optional)', placeholder: '0.005', inputType: 'number' },
      { key: 'label', label: 'Payment Label (optional)', placeholder: 'Invoice #1042' },
    ],
  },
  {
    type: 'crypto',
    label: 'Cryptocurrency Address',
    shortLabel: 'Crypto',
    category: 'other',
    description: 'Encode an Ethereum, Solana, or USDC wallet URI.',
    supportsDynamic: false,
    defaultFields: { coin: 'ethereum', address: '', amount: '' },
    fields: [
      {
        key: 'coin',
        label: 'Network / Asset',
        placeholder: 'ethereum',
        inputType: 'select',
        options: [
          { value: 'ethereum', label: 'Ethereum (ETH)' },
          { value: 'solana', label: 'Solana (SOL)' },
          { value: 'polygon', label: 'Polygon (MATIC)' },
          { value: 'litecoin', label: 'Litecoin (LTC)' },
        ],
      },
      { key: 'address', label: 'Wallet Address', placeholder: '0x...', required: true },
      { key: 'amount', label: 'Amount (optional)', placeholder: '1.0', inputType: 'number' },
    ],
  },
  {
    type: 'custom-data',
    label: 'Custom Data',
    shortLabel: 'Raw Data',
    category: 'other',
    description: 'Encode raw JSON, deep-link schemes, or structured payload strings.',
    supportsDynamic: false,
    defaultFields: { text: '' },
    fields: [
      {
        key: 'text',
        label: 'Raw Payload String',
        placeholder: '{"sku":"QR-2026","batch":"A1"}',
        inputType: 'textarea',
        required: true,
      },
    ],
  },
];

export function getContentTypeSpec(type: QRContentType): QRContentTypeSpec {
  return QR_CONTENT_TYPES.find((t) => t.type === type) ?? QR_CONTENT_TYPES[0];
}
