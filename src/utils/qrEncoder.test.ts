import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeQRContent, inspectScannedPayload } from './qrEncoder';
import {
  getContrastRatio,
  isSafeHttpUrl,
  normalizeUrlInput,
  validateImageFileMeta,
  validateImportedWorkspace,
} from './qrValidation';

test('URL encoding normalizes bare domains and rejects unsafe schemes', () => {
  const valid = encodeQRContent('url', { url: 'example.com/launch' });
  assert.equal(valid.valid, true);
  assert.equal(valid.encodedValue, 'https://example.com/launch');

  const blocked = encodeQRContent('url', { url: 'javascript:alert(1)' });
  assert.equal(blocked.valid, false);
  assert.ok(blocked.errors.url);
});

test('Wi-Fi encoding escapes special characters properly', () => {
  const res = encodeQRContent('wifi', {
    ssid: 'Studio;Guest:Net',
    password: 'pass,word\\123',
    security: 'WPA',
    hidden: 'true',
  });
  assert.equal(res.valid, true);
  assert.equal(res.encodedValue, 'WIFI:T:WPA;S:Studio\\;Guest\\:Net;P:pass\\,word\\\\123;H:true;;');
});

test('Wi-Fi validation requires password for WPA networks', () => {
  const res = encodeQRContent('wifi', {
    ssid: 'OfficeNet',
    password: '',
    security: 'WPA',
    hidden: 'false',
  });
  assert.equal(res.valid, false);
  assert.ok(res.errors.password);
});

test('vCard encoding generates valid VCARD 3.0 payload', () => {
  const res = encodeQRContent('vcard', {
    firstName: 'Ada',
    lastName: 'Lovelace',
    organization: 'Analytical Engine',
    email: 'ada@example.com',
    website: 'https://example.com',
  });
  assert.equal(res.valid, true);
  assert.ok(res.encodedValue.includes('BEGIN:VCARD'));
  assert.ok(res.encodedValue.includes('FN:Ada Lovelace'));
  assert.ok(res.encodedValue.includes('ORG:Analytical Engine'));
  assert.ok(res.encodedValue.includes('END:VCARD'));
});

test('GPS validation checks coordinate bounds', () => {
  const bad = encodeQRContent('gps', { latitude: '120', longitude: '10' });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.latitude);

  const ok = encodeQRContent('gps', { latitude: '37.7749', longitude: '-122.4194' });
  assert.equal(ok.valid, true);
  assert.equal(ok.encodedValue, 'geo:37.7749,-122.4194');
});

test('Scanned payload safety inspector blocks dangerous schemes and classifies QR types', () => {
  const xss = inspectScannedPayload('javascript:alert(document.cookie)');
  assert.equal(xss.detectedType, 'unsafe');
  assert.equal(xss.isSafeUrl, false);

  const httpsUrl = inspectScannedPayload('https://stripe.com/docs');
  assert.equal(httpsUrl.detectedType, 'url');
  assert.equal(httpsUrl.isSafeUrl, true);

  const wifi = inspectScannedPayload('WIFI:T:WPA;S:Guest;P:secret;;');
  assert.equal(wifi.detectedType, 'wifi');
});

test('Contrast ratio and image file validation behave accurately', () => {
  assert.ok(getContrastRatio('#101525', '#FFFFFF') > 15);
  assert.ok(getContrastRatio('#EEEEEE', '#FFFFFF') < 1.5);

  assert.equal(validateImageFileMeta('image/png', 1024 * 500).valid, true);
  assert.equal(validateImageFileMeta('image/svg+xml', 1024).valid, false);
  assert.equal(validateImageFileMeta('image/jpeg', 6 * 1024 * 1024).valid, false);
  assert.equal(isSafeHttpUrl(normalizeUrlInput('docs.example.org')), true);
});

test('Workspace import validation rejects malformed payloads', () => {
  assert.equal(validateImportedWorkspace(null).valid, false);
  assert.equal(validateImportedWorkspace({ qrs: [{ id: 123 }] }).valid, false);
  assert.equal(
    validateImportedWorkspace({
      qrs: [{ id: '1', name: 'Test', encodedValue: 'https://example.com' }],
    }).valid,
    true
  );
});
