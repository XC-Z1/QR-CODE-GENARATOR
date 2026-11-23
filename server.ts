import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '.qr-studio-data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const STORE_FILE = path.resolve(DATA_DIR, 'dynamic-store.json');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

interface RedirectHistoryEntry {
  timestamp: string;
  previousUrl?: string;
  newUrl: string;
}

interface ScanEntry {
  id: string;
  timestamp: string;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
}

interface DynamicQRRecord {
  id: string;
  shortCode: string;
  name: string;
  destinationUrl: string;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  scanCount: number;
  redirectHistory: RedirectHistoryEntry[];
  scans: ScanEntry[];
}

interface StoreShape {
  dynamicQRs: DynamicQRRecord[];
}

function readStore(): StoreShape {
  try {
    if (!fs.existsSync(STORE_FILE)) {
      return { dynamicQRs: [] };
    }
    const raw = fs.readFileSync(STORE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as StoreShape;
    return {
      dynamicQRs: Array.isArray(parsed.dynamicQRs) ? parsed.dynamicQRs : [],
    };
  } catch {
    return { dynamicQRs: [] };
  }
}

function writeStore(store: StoreShape): void {
  const tmpFile = `${STORE_FILE}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(store, null, 2), 'utf8');
  fs.renameSync(tmpFile, STORE_FILE);
}

function isValidHttpUrl(raw: string): boolean {
  if (typeof raw !== 'string') return false;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2048) return false;
  try {
    const u = new URL(trimmed);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function detectDeviceType(userAgent: string | undefined): 'mobile' | 'desktop' | 'tablet' | 'unknown' {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android.*mobile|blackberry|opera mini/.test(ua)) return 'mobile';
  if (/mozilla|chrome|safari|firefox|edge|macintosh|windows|linux/.test(ua)) return 'desktop';
  return 'unknown';
}

function generateShortCode(): string {
  return crypto.randomBytes(4).toString('base64url').replace(/[_-]/g, '').slice(0, 7);
}

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
};

function renderStatusPage(title: string, message: string, statusCode: number): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)} — QR Code Generator</title>
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; background: #F5F6FA; color: #171B2B; display: flex; min-height: 100vh; align-items: center; justify-content: center; margin: 0; padding: 24px; }
      .card { background: #fff; border: 1px solid #E5E8F0; border-radius: 16px; padding: 32px; max-width: 440px; width: 100%; box-shadow: 0 8px 24px rgba(16,21,37,0.06); }
      .code { font-size: 13px; font-weight: 600; color: #6655EE; margin-bottom: 8px; }
      h1 { font-size: 20px; margin: 0 0 8px 0; }
      p { font-size: 14px; color: #747D91; line-height: 1.5; margin: 0 0 20px 0; }
      a { display: inline-block; background: #6655EE; color: #fff; text-decoration: none; padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 600; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="code">HTTP ${statusCode}</div>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
      <a href="/">Open QR Studio</a>
    </div>
  </body>
</html>`;
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '8mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      dynamicEnabled: true,
      imageHostingEnabled: true,
    });
  });

  app.get('/api/dynamic-qrs', (_req, res) => {
    const store = readStore();
    res.json(store.dynamicQRs);
  });

  app.post('/api/dynamic-qrs', (req, res) => {
    const { name, destinationUrl, expiresAt } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 120) {
      res.status(400).json({ error: 'QR name must be between 1 and 120 characters.' });
      return;
    }
    if (!isValidHttpUrl(destinationUrl)) {
      res.status(400).json({ error: 'Destination URL must be a valid http:// or https:// URL.' });
      return;
    }
    let parsedExpiry: string | null = null;
    if (expiresAt) {
      const d = new Date(String(expiresAt));
      if (Number.isNaN(d.getTime())) {
        res.status(400).json({ error: 'Invalid expiration date format.' });
        return;
      }
      parsedExpiry = d.toISOString();
    }

    const store = readStore();
    let shortCode = generateShortCode();
    while (store.dynamicQRs.some((q) => q.shortCode === shortCode)) {
      shortCode = generateShortCode();
    }

    const now = new Date().toISOString();
    const record: DynamicQRRecord = {
      id: crypto.randomUUID(),
      shortCode,
      name: name.trim(),
      destinationUrl: destinationUrl.trim(),
      active: true,
      expiresAt: parsedExpiry,
      createdAt: now,
      updatedAt: now,
      scanCount: 0,
      redirectHistory: [
        {
          timestamp: now,
          newUrl: destinationUrl.trim(),
        },
      ],
      scans: [],
    };

    store.dynamicQRs.unshift(record);
    writeStore(store);
    res.status(201).json(record);
  });

  app.patch('/api/dynamic-qrs/:id', (req, res) => {
    const id = req.params.id;
    const store = readStore();
    const idx = store.dynamicQRs.findIndex((q) => q.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Dynamic QR record not found.' });
      return;
    }

    const existing = store.dynamicQRs[idx];
    const { name, destinationUrl, active, expiresAt } = req.body ?? {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim() || name.trim().length > 120) {
        res.status(400).json({ error: 'Name must be between 1 and 120 characters.' });
        return;
      }
      existing.name = name.trim();
    }

    if (destinationUrl !== undefined) {
      if (!isValidHttpUrl(destinationUrl)) {
        res.status(400).json({ error: 'Destination URL must be a valid http:// or https:// URL.' });
        return;
      }
      const nextUrl = destinationUrl.trim();
      if (nextUrl !== existing.destinationUrl) {
        existing.redirectHistory.unshift({
          timestamp: new Date().toISOString(),
          previousUrl: existing.destinationUrl,
          newUrl: nextUrl,
        });
        existing.destinationUrl = nextUrl;
      }
    }

    if (typeof active === 'boolean') {
      existing.active = active;
    }

    if (expiresAt !== undefined) {
      if (expiresAt === null || expiresAt === '') {
        existing.expiresAt = null;
      } else {
        const d = new Date(String(expiresAt));
        if (Number.isNaN(d.getTime())) {
          res.status(400).json({ error: 'Invalid expiration timestamp.' });
          return;
        }
        existing.expiresAt = d.toISOString();
      }
    }

    existing.updatedAt = new Date().toISOString();
    store.dynamicQRs[idx] = existing;
    writeStore(store);
    res.json(existing);
  });

  app.delete('/api/dynamic-qrs/:id', (req, res) => {
    const id = req.params.id;
    const store = readStore();
    const next = store.dynamicQRs.filter((q) => q.id !== id);
    if (next.length === store.dynamicQRs.length) {
      res.status(404).json({ error: 'Dynamic QR record not found.' });
      return;
    }
    store.dynamicQRs = next;
    writeStore(store);
    res.json({ deleted: true });
  });

  app.get('/api/analytics', (_req, res) => {
    const store = readStore();
    const qrs = store.dynamicQRs;
    const totalDynamicQRs = qrs.length;
    const activeDynamicQRs = qrs.filter((q) => q.active).length;
    const totalDynamicScans = qrs.reduce((sum, q) => sum + q.scanCount, 0);

    const dailyMap = new Map<string, number>();
    const recentScans: Array<{
      id: string;
      qrName: string;
      shortCode: string;
      timestamp: string;
      deviceType: string;
    }> = [];

    for (const qr of qrs) {
      for (const scan of qr.scans) {
        const day = scan.timestamp.slice(0, 10);
        dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
        recentScans.push({
          id: scan.id,
          qrName: qr.name,
          shortCode: qr.shortCode,
          timestamp: scan.timestamp,
          deviceType: scan.deviceType,
        });
      }
    }

    const dailyScans = Array.from(dailyMap.entries())
      .map(([date, scans]) => ({ date, scans }))
      .sort((a, b) => a.date.localeCompare(b.date));

    recentScans.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const topDynamicQRs = [...qrs]
      .sort((a, b) => b.scanCount - a.scanCount)
      .slice(0, 10)
      .map((q) => ({
        id: q.id,
        shortCode: q.shortCode,
        name: q.name,
        destinationUrl: q.destinationUrl,
        scanCount: q.scanCount,
        active: q.active,
      }));

    res.json({
      totalDynamicQRs,
      totalDynamicScans,
      activeDynamicQRs,
      dailyScans,
      topDynamicQRs,
      recentScans: recentScans.slice(0, 50),
    });
  });

  app.post('/api/images', (req, res) => {
    const { mimeType, dataBase64 } = req.body ?? {};
    if (typeof mimeType !== 'string' || !MIME_TO_EXT[mimeType.toLowerCase()]) {
      res.status(400).json({ error: 'Only PNG, JPG, JPEG, and WEBP images are supported.' });
      return;
    }
    if (typeof dataBase64 !== 'string' || !dataBase64) {
      res.status(400).json({ error: 'Missing image payload.' });
      return;
    }

    const cleanBase64 = dataBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    if (buffer.length === 0 || buffer.length > 5 * 1024 * 1024) {
      res.status(400).json({ error: 'Image must be between 1 byte and 5 MB.' });
      return;
    }

    const ext = MIME_TO_EXT[mimeType.toLowerCase()];
    const id = `${crypto.randomUUID()}.${ext}`;
    const targetPath = path.resolve(UPLOADS_DIR, id);
    if (!targetPath.startsWith(UPLOADS_DIR + path.sep)) {
      res.status(400).json({ error: 'Invalid upload path.' });
      return;
    }

    fs.writeFileSync(targetPath, buffer);
    res.status(201).json({
      id,
      url: `/api/images/${id}`,
      mimeType: mimeType.toLowerCase(),
      size: buffer.length,
    });
  });

  app.get('/api/images/:id', (req, res) => {
    const id = req.params.id;
    if (!/^[a-f0-9-]{36}\.(png|jpg|webp)$/i.test(id)) {
      res.status(400).json({ error: 'Invalid image identifier.' });
      return;
    }
    const targetPath = path.resolve(UPLOADS_DIR, id);
    if (!targetPath.startsWith(UPLOADS_DIR + path.sep) || !fs.existsSync(targetPath)) {
      res.status(404).json({ error: 'Image not found.' });
      return;
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(targetPath);
  });

  app.get('/r/:shortCode', (req, res) => {
    const code = req.params.shortCode;
    if (!/^[a-zA-Z0-9]{4,16}$/.test(code)) {
      res.status(404).send(renderStatusPage('QR Link Not Found', 'This dynamic QR code identifier is invalid.', 404));
      return;
    }

    const store = readStore();
    const idx = store.dynamicQRs.findIndex((q) => q.shortCode === code);
    if (idx === -1) {
      res
        .status(404)
        .send(
          renderStatusPage(
            'Dynamic QR Not Found',
            'This dynamic QR code does not exist or may have been deleted by its creator.',
            404
          )
        );
      return;
    }

    const record = store.dynamicQRs[idx];
    if (!record.active) {
      res
        .status(410)
        .send(
          renderStatusPage(
            'QR Code Paused',
            'This dynamic QR code is currently paused and cannot redirect until reactivated.',
            410
          )
        );
      return;
    }

    if (record.expiresAt && new Date(record.expiresAt).getTime() <= Date.now()) {
      res
        .status(410)
        .send(
          renderStatusPage(
            'QR Code Expired',
            'This dynamic QR code has passed its scheduled expiration date.',
            410
          )
        );
      return;
    }

    if (!isValidHttpUrl(record.destinationUrl)) {
      res
        .status(400)
        .send(renderStatusPage('Invalid Destination', 'Destination URL failed safety validation.', 400));
      return;
    }

    record.scanCount += 1;
    record.scans.unshift({
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      deviceType: detectDeviceType(req.get('user-agent')),
    });
    if (record.scans.length > 500) {
      record.scans = record.scans.slice(0, 500);
    }
    store.dynamicQRs[idx] = record;
    writeStore(store);

    res.redirect(302, record.destinationUrl);
  });

  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist'));
  if (isProd) {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT || 3000);
  app.listen(port, '0.0.0.0', () => {
    console.log(`QR Code Generator server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
