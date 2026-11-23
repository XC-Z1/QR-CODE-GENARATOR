import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Lock,
  Radio,
  RotateCcw,
  Save,
} from 'lucide-react';
import type { QRContentType, QRMode, QRRecord, QRStyleConfig } from '../types/qr';
import { getContentTypeSpec } from '../data/qrContentTypes';
import { encodeQRContent } from '../utils/qrEncoder';
import { useStudio } from '../hooks/useStudioState';
import { apiService } from '../services/apiService';
import { ContentFormPanel } from '../components/generator/ContentFormPanel';
import { CustomizationPanel } from '../components/customization/CustomizationPanel';
import { QRPreviewCard } from '../components/shared/QRPreviewCard';
import { ExportModal } from '../components/shared/ExportModal';

export const GeneratorPage: React.FC = () => {
  const {
    settings,
    qrs,
    draftIntent,
    clearDraftIntent,
    saveQR,
    backendHealth,
    pushToast,
  } = useStudio();

  const [editId, setEditId] = useState<string | undefined>(undefined);
  const [name, setName] = useState<string>('Untitled QR Code');
  const [contentType, setContentType] = useState<QRContentType>('url');
  const [fields, setFields] = useState<Record<string, string>>({ url: 'https://example.com' });
  const [style, setStyle] = useState<QRStyleConfig>(() => ({ ...settings.defaultStyle }));
  const [mode, setMode] = useState<QRMode>('static');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [exportOpen, setExportOpen] = useState<boolean>(false);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);

  // Hydrate draft intent when navigated from Quick Create, Templates, or Library Edit
  useEffect(() => {
    if (!draftIntent) return;
    const nextType = draftIntent.type ?? 'url';
    const spec = getContentTypeSpec(nextType);
    setEditId(draftIntent.editRecordId);
    setContentType(nextType);
    setFields(
      draftIntent.fields
        ? { ...draftIntent.fields }
        : { ...spec.defaultFields }
    );
    if (draftIntent.style) {
      setStyle({ ...draftIntent.style });
    }
    if (draftIntent.name) {
      setName(draftIntent.name);
    } else if (!draftIntent.editRecordId) {
      setName(`${spec.shortLabel} QR Code`);
    }
    if (draftIntent.editRecordId) {
      const existing = qrs.find((q) => q.id === draftIntent.editRecordId);
      if (existing) {
        setMode(existing.mode);
        setExpiresAt(existing.expiresAt ? existing.expiresAt.slice(0, 16) : '');
      }
    } else {
      setMode('static');
      setExpiresAt('');
    }
    clearDraftIntent();
  }, [draftIntent, clearDraftIntent, qrs]);

  const spec = getContentTypeSpec(contentType);
  const validation = useMemo(() => encodeQRContent(contentType, fields), [contentType, fields]);

  const existingRecord = editId ? qrs.find((q) => q.id === editId) : undefined;
  const previewValue =
    mode === 'dynamic' && existingRecord?.shortUrl
      ? existingRecord.shortUrl
      : validation.encodedValue || 'https://example.com';

  const handleTypeChange = (nextType: QRContentType) => {
    const nextSpec = getContentTypeSpec(nextType);
    setContentType(nextType);
    setFields({ ...nextSpec.defaultFields });
    if (!editId) {
      setName(`${nextSpec.shortLabel} QR Code`);
    }
    if (!nextSpec.supportsDynamic && mode === 'dynamic') {
      setMode('static');
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    const resetSpec = getContentTypeSpec(contentType);
    setEditId(undefined);
    setFields({ ...resetSpec.defaultFields });
    setStyle({ ...settings.defaultStyle });
    setMode('static');
    setExpiresAt('');
    setName(`${resetSpec.shortLabel} QR Code`);
    pushToast({ title: 'Studio reset to defaults', variant: 'info' });
  };

  const handleSave = async () => {
    if (!validation.valid) {
      pushToast({
        title: 'Check required fields',
        description: 'Please resolve the highlighted input validation errors before saving.',
        variant: 'error',
      });
      return;
    }

    const trimmedName = name.trim() || `${spec.shortLabel} QR Code`;
    const now = new Date().toISOString();
    setSaving(true);

    try {
      if (mode === 'dynamic') {
        if (!backendHealth.ok) {
          pushToast({
            title: 'Dynamic QR requires backend connection',
            description: 'Reconnect to the studio backend or switch to Static mode.',
            variant: 'error',
          });
          setSaving(false);
          return;
        }

        let dyn;
        if (existingRecord?.dynamicId) {
          dyn = await apiService.updateDynamicQR(existingRecord.dynamicId, {
            name: trimmedName,
            destinationUrl: validation.encodedValue,
            expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          });
        } else {
          dyn = await apiService.createDynamicQR({
            name: trimmedName,
            destinationUrl: validation.encodedValue,
            expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          });
        }

        const shortUrl = `${window.location.origin}/r/${dyn.shortCode}`;
        const record: QRRecord = {
          id: existingRecord?.id ?? crypto.randomUUID(),
          name: trimmedName,
          type: contentType,
          mode: 'dynamic',
          fields: { ...fields },
          encodedValue: shortUrl,
          style: { ...style },
          createdAt: existingRecord?.createdAt ?? now,
          updatedAt: now,
          favorite: existingRecord?.favorite ?? false,
          downloadCount: existingRecord?.downloadCount ?? 0,
          dynamicId: dyn.id,
          shortCode: dyn.shortCode,
          shortUrl,
          destinationUrl: dyn.destinationUrl,
          active: dyn.active,
          expiresAt: dyn.expiresAt,
          scanCount: dyn.scanCount,
        };
        await saveQR(record, Boolean(existingRecord));
        setEditId(record.id);
        pushToast({
          title: existingRecord ? 'Dynamic QR updated' : 'Dynamic QR created',
          description: `Redirect URL: ${shortUrl}`,
          variant: 'success',
        });
      } else {
        const record: QRRecord = {
          id: existingRecord?.id ?? crypto.randomUUID(),
          name: trimmedName,
          type: contentType,
          mode: 'static',
          fields: { ...fields },
          encodedValue: validation.encodedValue,
          style: { ...style },
          createdAt: existingRecord?.createdAt ?? now,
          updatedAt: now,
          favorite: existingRecord?.favorite ?? false,
          downloadCount: existingRecord?.downloadCount ?? 0,
        };
        await saveQR(record, Boolean(existingRecord));
        setEditId(record.id);
        pushToast({
          title: existingRecord ? 'QR code updated' : 'QR code saved to library',
          variant: 'success',
        });
      }
    } catch (err) {
      pushToast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Unable to save QR code.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyPayload = async () => {
    try {
      await navigator.clipboard.writeText(previewValue);
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 1800);
      pushToast({ title: 'Encoded payload copied', variant: 'success' });
    } catch {
      pushToast({ title: 'Clipboard copy denied', variant: 'error' });
    }
  };

  return (
    <div className="space-y-5">
      {/* Studio Top Toolbar */}
      <div className="rounded-2xl bg-white dark:bg-[#11192C] border border-[#E2E7F2] dark:border-[#232F4A] studio-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[220px]">
          <input
            type="text"
            aria-label="QR Code Title"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name your QR code..."
            className="flex-1 min-w-[180px] max-w-xs px-3.5 py-2 text-sm font-semibold rounded-xl border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120] text-[#171B2B] dark:text-[#F5F6FC] focus:outline-none focus:ring-2 focus:ring-[#6655EE]"
          />
          <span className="text-xs font-medium text-[#747D91] dark:text-[#A4ADC1]">
            {spec.label} · {mode === 'dynamic' ? 'Dynamic Redirect' : 'Static Offline'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl border border-[#E5E8F0] dark:border-[#29344B] hover:border-[#747D91] transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-[#6655EE] text-[#6655EE] dark:text-[#8978FF] hover:bg-[#6655EE]/10 transition-colors whitespace-nowrap disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : editId ? 'Update' : 'Save'}
          </button>

          <button
            type="button"
            onClick={() => {
              if (!validation.valid) {
                pushToast({
                  title: 'Fix content errors first',
                  description: 'Complete required fields to export this QR code.',
                  variant: 'warning',
                });
                return;
              }
              setExportOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl studio-btn-primary text-white transition-all whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      {/* 3-Column Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Content & Mode Configuration */}
        <section className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#11192C] border border-[#E2E7F2] dark:border-[#232F4A] studio-card p-5 space-y-5">
          {/* Static vs Dynamic Mode Selector */}
          <div>
            <div className="text-xs font-semibold text-[#171B2B] dark:text-[#F5F6FC] mb-2">
              QR Architecture Mode
            </div>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#F0F2F8] dark:bg-[#0C1120] border border-[#E5E8F0] dark:border-[#29344B]">
              <button
                type="button"
                onClick={() => setMode('static')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-colors ${
                  mode === 'static'
                    ? 'bg-white dark:bg-[#19243A] text-[#171B2B] dark:text-[#F5F6FC] shadow-xs'
                    : 'text-[#747D91] dark:text-[#A4ADC1]'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Static (Offline)
              </button>
              <button
                type="button"
                disabled={!spec.supportsDynamic}
                onClick={() => setMode('dynamic')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 ${
                  mode === 'dynamic'
                    ? 'bg-white dark:bg-[#19243A] text-[#6655EE] dark:text-[#8978FF] shadow-xs'
                    : 'text-[#747D91] dark:text-[#A4ADC1]'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                Dynamic (Tracked)
              </button>
            </div>

            {!spec.supportsDynamic && (
              <p className="mt-1.5 text-[11px] text-[#747D91] dark:text-[#A4ADC1]">
                {spec.label} encodes structured payload data directly inside the QR and runs offline as Static.
              </p>
            )}
            {mode === 'dynamic' && !backendHealth.ok && (
              <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400">
                Dynamic QR redirect endpoints require an active server connection. Switch to Static for offline creation.
              </p>
            )}
            {mode === 'dynamic' && backendHealth.ok && (
              <div className="mt-3">
                <label
                  htmlFor="dynamic-expiry-input"
                  className="block text-[11px] font-semibold text-[#747D91] dark:text-[#A4ADC1] mb-1"
                >
                  Optional Expiration Date
                </label>
                <input
                  id="dynamic-expiry-input"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120]"
                />
              </div>
            )}
          </div>

          <ContentFormPanel
            selectedType={contentType}
            fields={fields}
            errors={validation.errors}
            onSelectType={handleTypeChange}
            onFieldChange={handleFieldChange}
          />
        </section>

        {/* Center: Live QR Preview */}
        <section className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#11192C] border border-[#E2E7F2] dark:border-[#232F4A] studio-card p-6 flex flex-col items-center lg:sticky lg:top-20">
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-[#171B2B] dark:text-[#F5F6FC]">
              Live Preview
            </span>
            <span className="text-xs text-[#747D91] dark:text-[#A4ADC1] font-mono tabular-nums">
              {style.size}px
            </span>
          </div>

          <QRPreviewCard
            data={previewValue}
            style={style}
            size={260}
            showReliabilityCheck
            alt={`Live preview of ${name}`}
          />

          <div className="w-full mt-5 pt-4 border-t border-[#E5E8F0] dark:border-[#29344B] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#747D91] dark:text-[#A4ADC1]">
                Encoded Output
              </span>
              <button
                type="button"
                onClick={handleCopyPayload}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#6655EE] dark:text-[#8978FF] hover:underline"
              >
                {copiedPayload ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedPayload ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F5F6FA] dark:bg-[#0C1120] border border-[#E5E8F0] dark:border-[#29344B] text-xs font-mono text-[#747D91] dark:text-[#A4ADC1] break-all max-h-24 overflow-y-auto">
              {validation.valid ? previewValue : 'Waiting for valid required fields...'}
            </div>
          </div>
        </section>

        {/* Right: Advanced Customization Studio */}
        <section className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#11192C] border border-[#E2E7F2] dark:border-[#232F4A] studio-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-sm text-[#171B2B] dark:text-[#F5F6FC]">
              Customization Studio
            </h3>
            <span className="text-xs text-[#747D91] dark:text-[#A4ADC1]">Real-time</span>
          </div>
          <CustomizationPanel style={style} onChange={setStyle} />
        </section>
      </div>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        qrId={editId}
        qrName={name}
        qrType={contentType}
        encodedValue={previewValue}
        style={style}
      />
    </div>
  );
};
