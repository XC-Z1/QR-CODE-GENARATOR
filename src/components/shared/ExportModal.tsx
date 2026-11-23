import React, { useEffect, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileText,
  Printer,
  Share2,
  X,
} from 'lucide-react';
import type { ExportFormat, QRContentType, QRStyleConfig } from '../../types/qr';
import { exportQRCode, copyQRImageToClipboard, renderCompositeQRCanvas } from '../../utils/qrRenderer';
import { QRPreviewCard } from './QRPreviewCard';
import { useStudio } from '../../hooks/useStudioState';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  qrId?: string;
  qrName: string;
  qrType?: QRContentType;
  encodedValue: string;
  style: QRStyleConfig;
}

const FORMAT_OPTIONS: Array<{ id: ExportFormat; label: string; desc: string }> = [
  { id: 'png', label: 'PNG', desc: 'Standard crisp raster' },
  { id: 'png-hd', label: 'High-Res PNG', desc: '2048px+ print ready' },
  { id: 'png-transparent', label: 'Transparent PNG', desc: 'No background fill' },
  { id: 'jpg', label: 'JPG', desc: 'Compact solid image' },
  { id: 'svg', label: 'SVG', desc: 'Infinite vector path' },
  { id: 'pdf', label: 'PDF', desc: 'Printable A4 sheet' },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  open,
  onClose,
  qrId,
  qrName,
  qrType,
  encodedValue,
  style,
}) => {
  const { settings, recordDownload, recordActivity, pushToast } = useStudio();

  const [format, setFormat] = useState<ExportFormat>(settings.defaultExport.format);
  const [width, setWidth] = useState<number>(settings.defaultExport.width);
  const [quality, setQuality] = useState<number>(settings.defaultExport.quality);
  const [transparent, setTransparent] = useState<boolean>(
    style.transparentBackground || settings.defaultExport.transparent
  );
  const [filename, setFilename] = useState<string>(qrName || 'qr-code');
  const [busy, setBusy] = useState<boolean>(false);
  const [copiedContent, setCopiedContent] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [printImgUrl, setPrintImgUrl] = useState<string>('');

  useEffect(() => {
    if (open) {
      setFilename((qrName || 'qr-code').trim());
      setFormat(settings.defaultExport.format);
      setWidth(settings.defaultExport.width);
      setQuality(settings.defaultExport.quality);
      setTransparent(style.transparentBackground || settings.defaultExport.transparent);
      setCopiedContent(false);
      setCopiedImage(false);
    }
  }, [open, qrName, settings.defaultExport, style.transparentBackground]);

  if (!open) return null;

  const handleDownload = async () => {
    setBusy(true);
    try {
      await exportQRCode({
        data: encodedValue,
        style,
        format,
        filename,
        width,
        quality,
        transparent: format === 'png-transparent' ? true : format === 'jpg' ? false : transparent,
      });
      await recordDownload(qrId, filename || qrName, qrType, format);
      pushToast({
        title: 'Export downloaded',
        description: `${filename || 'qr-code'} saved as ${format.toUpperCase()}.`,
        variant: 'success',
      });
    } catch (err) {
      pushToast({
        title: 'Export failed',
        description: err instanceof Error ? err.message : 'Unable to export QR file.',
        variant: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleCopyImage = async () => {
    try {
      await copyQRImageToClipboard(encodedValue, {
        ...style,
        transparentBackground: transparent,
      });
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2000);
      await recordActivity({
        type: 'copied',
        qrId,
        qrName: filename || qrName,
        qrType,
        detail: `Copied QR image for "${filename || qrName}" to clipboard`,
      });
      pushToast({ title: 'QR image copied to clipboard', variant: 'success' });
    } catch (err) {
      pushToast({
        title: 'Copy image unavailable',
        description: err instanceof Error ? err.message : 'Use PNG download in this browser.',
        variant: 'warning',
      });
    }
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(encodedValue);
      setCopiedContent(true);
      setTimeout(() => setCopiedContent(false), 2000);
      pushToast({ title: 'QR payload copied to clipboard', variant: 'success' });
    } catch {
      pushToast({ title: 'Clipboard access denied', variant: 'error' });
    }
  };

  const handlePrint = async () => {
    try {
      const canvas = await renderCompositeQRCanvas(encodedValue, style, {
        targetWidth: 1024,
        transparent: false,
      });
      setPrintImgUrl(canvas.toDataURL('image/png'));
      setTimeout(() => {
        window.print();
      }, 150);
    } catch {
      pushToast({ title: 'Unable to prepare print layout', variant: 'error' });
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        const canvas = await renderCompositeQRCanvas(encodedValue, style, {
          targetWidth: 1024,
          transparent: false,
        });
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (blob) {
          const file = new File([blob], `${filename || 'qr-code'}.png`, { type: 'image/png' });
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: filename || 'QR Code',
              text: encodedValue,
              files: [file],
            });
            return;
          }
        }
        await navigator.share({ title: filename || 'QR Code', text: encodedValue });
      } else {
        await navigator.clipboard.writeText(encodedValue);
        pushToast({
          title: 'Content copied for sharing',
          description: 'Web Share is unavailable in this browser; QR payload copied instead.',
          variant: 'info',
        });
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        pushToast({ title: 'Share canceled or unavailable', variant: 'info' });
      }
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
      >
        <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E8F0] dark:border-[#29344B]">
            <div>
              <h2 id="export-modal-title" className="text-lg font-bold text-[#171B2B] dark:text-[#F5F6FC]">
                Export Center
              </h2>
              <p className="text-xs text-[#747D91] dark:text-[#A4ADC1]">
                Download production-ready raster, vector, or printable PDF formats.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close export center"
              className="p-2 rounded-lg text-[#747D91] hover:text-[#171B2B] dark:hover:text-[#F5F6FC] hover:bg-[#F0F2F8] dark:hover:bg-[#19243A] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 flex flex-col items-center justify-center bg-[#F5F6FA] dark:bg-[#0C1120] rounded-xl p-5 border border-[#E5E8F0] dark:border-[#29344B]">
              <QRPreviewCard
                data={encodedValue}
                style={{
                  ...style,
                  transparentBackground:
                    format === 'png-transparent' ? true : format === 'jpg' ? false : transparent,
                }}
                size={210}
                bordered={false}
              />
              <div className="mt-4 w-full grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyImage}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#E5E8F0] dark:border-[#29344B] bg-white dark:bg-[#19243A] text-[#171B2B] dark:text-[#F5F6FC] hover:border-[#6655EE] transition-colors whitespace-nowrap"
                >
                  {copiedImage ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedImage ? 'Copied' : 'Copy Image'}
                </button>
                <button
                  type="button"
                  onClick={handleCopyContent}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#E5E8F0] dark:border-[#29344B] bg-white dark:bg-[#19243A] text-[#171B2B] dark:text-[#F5F6FC] hover:border-[#6655EE] transition-colors whitespace-nowrap"
                >
                  {copiedContent ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <FileText className="w-3.5 h-3.5" />}
                  {copiedContent ? 'Copied' : 'Copy Content'}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#E5E8F0] dark:border-[#29344B] bg-white dark:bg-[#19243A] text-[#171B2B] dark:text-[#F5F6FC] hover:border-[#6655EE] transition-colors whitespace-nowrap"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-[#E5E8F0] dark:border-[#29344B] bg-white dark:bg-[#19243A] text-[#171B2B] dark:text-[#F5F6FC] hover:border-[#6655EE] transition-colors whitespace-nowrap"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </button>
              </div>
            </div>

            <div className="md:col-span-7 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#171B2B] dark:text-[#F5F6FC] mb-2">
                  Export Format
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FORMAT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFormat(opt.id)}
                      className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                        format === opt.id
                          ? 'border-[#6655EE] dark:border-[#8978FF] bg-[#6655EE]/8 dark:bg-[#8978FF]/12'
                          : 'border-[#E5E8F0] dark:border-[#29344B] hover:border-[#747D91]'
                      }`}
                    >
                      <div className="text-xs font-bold text-[#171B2B] dark:text-[#F5F6FC]">
                        {opt.label}
                      </div>
                      <div className="text-[11px] text-[#747D91] dark:text-[#A4ADC1] truncate">
                        {opt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="export-filename-input"
                  className="block text-xs font-semibold text-[#171B2B] dark:text-[#F5F6FC] mb-1.5"
                >
                  File Name
                </label>
                <input
                  id="export-filename-input"
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="my-qr-code"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120] text-[#171B2B] dark:text-[#F5F6FC] focus:outline-none focus:ring-2 focus:ring-[#6655EE]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="export-width-select"
                    className="block text-xs font-semibold text-[#171B2B] dark:text-[#F5F6FC] mb-1.5"
                  >
                    Resolution / Width (px)
                  </label>
                  <select
                    id="export-width-select"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    disabled={format === 'svg' || format === 'pdf'}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120] text-[#171B2B] dark:text-[#F5F6FC] disabled:opacity-50"
                  >
                    <option value={512}>512 x 512 px</option>
                    <option value={1024}>1024 x 1024 px</option>
                    <option value={2048}>2048 x 2048 px</option>
                    <option value={4096}>4096 x 4096 px</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="export-quality-range"
                    className="block text-xs font-semibold text-[#171B2B] dark:text-[#F5F6FC] mb-1.5"
                  >
                    JPG Quality ({Math.round(quality * 100)}%)
                  </label>
                  <input
                    id="export-quality-range"
                    type="range"
                    min={0.5}
                    max={1}
                    step={0.05}
                    value={quality}
                    disabled={format !== 'jpg'}
                    onChange={(e) => setQuality(Number(e.target.value))}
                    className="w-full accent-[#6655EE] mt-2 disabled:opacity-40"
                  />
                </div>
              </div>

              {format !== 'jpg' && format !== 'png-transparent' && (
                <label className="flex items-center gap-2.5 text-sm text-[#171B2B] dark:text-[#F5F6FC] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transparent}
                    onChange={(e) => setTransparent(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#6655EE]"
                  />
                  <span>Use transparent background</span>
                </label>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-[#E5E8F0] dark:border-[#29344B] text-[#747D91] dark:text-[#A4ADC1] hover:text-[#171B2B] dark:hover:text-[#F5F6FC] transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={busy}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-[#6655EE] hover:bg-[#5645DD] text-white transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              {busy ? 'Generating...' : `Download ${format.toUpperCase()}`}
            </button>
          </div>
        </div>
      </div>

      {printImgUrl && (
        <div id="qr-print-surface" className="hidden print:flex">
          <h1 className="text-xl font-bold mb-4">{filename || 'QR Code'}</h1>
          <img src={printImgUrl} alt="Printable QR Code" className="w-72 h-auto" />
          <p className="text-xs mt-4 font-mono">{encodedValue}</p>
        </div>
      )}
    </>
  );
};
