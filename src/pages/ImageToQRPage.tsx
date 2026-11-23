import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Link2,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { useStudio } from '../hooks/useStudioState';
import { apiService } from '../services/apiService';
import { isSafeHttpUrl, validateImageFileMeta } from '../utils/qrValidation';
import { QRPreviewCard } from '../components/shared/QRPreviewCard';
import { ExportModal } from '../components/shared/ExportModal';

interface ImageMetadata {
  name: string;
  size: number;
  width: number;
  height: number;
  previewUrl: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const ImageToQRPage: React.FC = () => {
  const { backendHealth, isOnline, settings, saveQR, pushToast } = useStudio();
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [dragging, setDragging] = useState(false);
  const [imageMeta, setImageMeta] = useState<ImageMetadata | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [hostedUrl, setHostedUrl] = useState<string>('');
  const [publicUrlInput, setPublicUrlInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState<boolean>(false);
  const [qrStyle] = useState(() => ({ ...settings.defaultStyle }));

  const activeQrUrl =
    mode === 'upload'
      ? hostedUrl
      : isSafeHttpUrl(publicUrlInput)
      ? publicUrlInput.trim()
      : '';

  const processSelectedFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setHostedUrl('');
    setUploadProgress(0);

    const check = validateImageFileMeta(file.type, file.size);
    if (!check.valid) {
      setError(check.error || 'Unsupported file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) {
        setError('Unable to read image file.');
        return;
      }

      // Measure actual image dimensions
      const dims = await new Promise<{ width: number; height: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => resolve({ width: 0, height: 0 });
        img.src = dataUrl;
      });

      setImageMeta({
        name: file.name,
        size: file.size,
        width: dims.width,
        height: dims.height,
        previewUrl: dataUrl,
      });

      if (!isOnline || !backendHealth.ok || !backendHealth.imageHostingEnabled) {
        setError(
          'Server image hosting is currently unavailable. A local file preview is shown, but it has NOT been publicly uploaded. Reconnect to the server or switch to "Public Image URL" mode.'
        );
        return;
      }

      setUploading(true);
      setUploadProgress(28);
      try {
        const progressTimer = setInterval(() => {
          setUploadProgress((p) => (p < 85 ? p + 14 : p));
        }, 120);

        const res = await apiService.uploadImage({
          fileName: file.name,
          mimeType: file.type,
          dataBase64: dataUrl,
        });

        clearInterval(progressTimer);
        setUploadProgress(100);
        const absoluteUrl = `${window.location.origin}${res.url}`;
        setHostedUrl(absoluteUrl);
        pushToast({
          title: 'Image uploaded & QR generated',
          description: 'Hosted on the active studio server.',
          variant: 'success',
        });
      } catch (err) {
        setUploadProgress(0);
        setError(
          err instanceof Error
            ? err.message
            : 'Image upload failed. Never claiming local file as publicly hosted.'
        );
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImageMeta(null);
    setHostedUrl('');
    setUploadProgress(0);
    setError(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSaveToLibrary = async () => {
    if (!activeQrUrl) return;
    const now = new Date().toISOString();
    await saveQR({
      id: crypto.randomUUID(),
      name: imageMeta?.name ? `Image: ${imageMeta.name}` : 'Image QR Link',
      type: 'url',
      mode: 'static',
      fields: { url: activeQrUrl },
      encodedValue: activeQrUrl,
      style: qrStyle,
      createdAt: now,
      updatedAt: now,
      favorite: false,
      downloadCount: 0,
    });
    pushToast({ title: 'Image QR saved to library', variant: 'success' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-[#171B2B] dark:text-[#F5F6FC]">
            Image to QR Workspace
          </h2>
          <p className="text-sm text-[#747D91] dark:text-[#A4ADC1] mt-1">
            Host an image on the studio server or link an existing public image URL into a scannable QR code.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F0F2F8] dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B]">
          <button
            type="button"
            onClick={() => {
              setMode('upload');
              setError(null);
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              mode === 'upload'
                ? 'bg-white dark:bg-[#19243A] text-[#6655EE] dark:text-[#8978FF] shadow-xs'
                : 'text-[#747D91] dark:text-[#A4ADC1]'
            }`}
          >
            Upload & Host Image
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('url');
              setError(null);
            }}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              mode === 'url'
                ? 'bg-white dark:bg-[#19243A] text-[#6655EE] dark:text-[#8978FF] shadow-xs'
                : 'text-[#747D91] dark:text-[#A4ADC1]'
            }`}
          >
            Public Image URL
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Upload / Public URL Input */}
        <section className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-6 space-y-5">
          {mode === 'upload' ? (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => processSelectedFile(e.target.files?.[0])}
                className="hidden"
              />

              {!imageMeta ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    processSelectedFile(e.dataTransfer.files?.[0]);
                  }}
                  className={`rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
                    dragging
                      ? 'border-[#6655EE] bg-[#6655EE]/8'
                      : 'border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#19243A] border border-[#E5E8F0] dark:border-[#29344B] mx-auto flex items-center justify-center text-[#6655EE] dark:text-[#8978FF] mb-4">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[#171B2B] dark:text-[#F5F6FC]">
                    Drag and drop your image here
                  </h3>
                  <p className="text-xs text-[#747D91] dark:text-[#A4ADC1] mt-1 mb-5">
                    Supports PNG, JPG, JPEG, and WEBP up to 5 MB.
                  </p>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#6655EE] hover:bg-[#5645DD] text-white transition-colors"
                  >
                    Choose Image File
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120] p-4 flex flex-col sm:flex-row items-center gap-4">
                    <img
                      src={imageMeta.previewUrl}
                      alt={imageMeta.name}
                      className="w-28 h-28 rounded-xl object-cover border border-[#E5E8F0] dark:border-[#29344B] bg-white shrink-0"
                    />
                    <div className="flex-1 min-w-0 w-full space-y-2">
                      <div className="text-sm font-bold text-[#171B2B] dark:text-[#F5F6FC] truncate">
                        {imageMeta.name}
                      </div>
                      <div className="text-xs text-[#747D91] dark:text-[#A4ADC1] tabular-nums">
                        {imageMeta.width} x {imageMeta.height} px · {formatBytes(imageMeta.size)}
                      </div>

                      {uploading && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-medium">
                            <span>Uploading to studio image host...</span>
                            <span className="tabular-nums">{uploadProgress}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-[#E5E8F0] dark:bg-[#29344B] overflow-hidden">
                            <div
                              className="h-full bg-[#6655EE] transition-all duration-150"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {hostedUrl && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span className="truncate font-mono">{hostedUrl}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E8F0] dark:border-[#29344B] bg-white dark:bg-[#19243A] hover:border-[#6655EE]"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Replace Image
                        </button>
                        <button
                          type="button"
                          onClick={handleClearImage}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="public-image-url-input"
                  className="block text-xs font-semibold text-[#171B2B] dark:text-[#F5F6FC] mb-1.5"
                >
                  Public Image URL
                </label>
                <div className="relative">
                  <Link2 className="w-4 h-4 text-[#747D91] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="public-image-url-input"
                    type="url"
                    value={publicUrlInput}
                    onChange={(e) => {
                      setPublicUrlInput(e.target.value);
                      setError(null);
                    }}
                    placeholder="https://cdn.yourdomain.com/menu-poster.png"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120] focus:outline-none focus:ring-2 focus:ring-[#6655EE]"
                  />
                </div>
                <p className="mt-1.5 text-xs text-[#747D91] dark:text-[#A4ADC1]">
                  Provide a publicly reachable https:// URL to encode directly into a static QR code.
                </p>
              </div>

              {publicUrlInput && !isSafeHttpUrl(publicUrlInput) && (
                <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Please enter a valid http:// or https:// image URL.</span>
                </div>
              )}

              {isSafeHttpUrl(publicUrlInput) && (
                <div className="rounded-xl border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120] p-4 flex items-center gap-4">
                  <img
                    src={publicUrlInput}
                    alt="Linked public image"
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setError('Preview could not load in browser, though the URL can still be encoded if valid.')
                    }
                    className="w-20 h-20 rounded-lg object-cover border border-[#E5E8F0] dark:border-[#29344B] bg-white"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[#171B2B] dark:text-[#F5F6FC]">
                      Public Image Link Ready
                    </div>
                    <div className="text-xs font-mono text-[#747D91] truncate mt-0.5">
                      {publicUrlInput}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </section>

        {/* Right: Generated Image QR */}
        <section className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-6 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-sm text-[#171B2B] dark:text-[#F5F6FC]">
              Generated Image QR
            </h3>
            {activeQrUrl && (
              <a
                href={activeQrUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#6655EE] dark:text-[#8978FF] hover:underline"
              >
                Open Image <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {activeQrUrl ? (
            <>
              <QRPreviewCard
                data={activeQrUrl}
                style={qrStyle}
                size={240}
                showReliabilityCheck
                alt="QR code linking to uploaded image"
              />
              <div className="w-full mt-5 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleSaveToLibrary}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-[#6655EE] text-[#6655EE] dark:text-[#8978FF] hover:bg-[#6655EE]/10 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  Save to Library
                </button>
                <button
                  type="button"
                  onClick={() => setExportOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#6655EE] hover:bg-[#5645DD] text-white transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export QR
                </button>
              </div>
            </>
          ) : (
            <div className="py-16 text-center px-4">
              <ImageIcon className="w-8 h-8 text-[#747D91] mx-auto mb-3" />
              <div className="text-sm font-semibold text-[#171B2B] dark:text-[#F5F6FC]">
                Waiting for hosted or public image URL
              </div>
              <p className="text-xs text-[#747D91] dark:text-[#A4ADC1] mt-1 max-w-xs mx-auto">
                Upload an image to the active server or paste a valid public URL to generate a scannable QR code.
              </p>
            </div>
          )}
        </section>
      </div>

      {activeQrUrl && (
        <ExportModal
          open={exportOpen}
          onClose={() => setExportOpen(false)}
          qrName={imageMeta?.name || 'image-qr'}
          qrType="url"
          encodedValue={activeQrUrl}
          style={qrStyle}
        />
      )}
    </div>
  );
};
