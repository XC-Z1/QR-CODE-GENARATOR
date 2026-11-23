import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  AlertTriangle,
  Camera,
  CameraOff,
  Check,
  Copy,
  ExternalLink,
  History,
  Image as ImageIcon,
  Scan,
  ShieldCheck,
  SwitchCamera,
  Trash2,
  Upload,
} from 'lucide-react';
import { useStudio } from '../hooks/useStudioState';
import { inspectScannedPayload } from '../utils/qrEncoder';
import { validateImageFileMeta } from '../utils/qrValidation';
import type { ScanHistoryItem } from '../types/qr';
import { EmptyState } from '../components/shared/EmptyState';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';

const CAMERA_REGION_ID = 'qr-camera-scanner-region';

export const ScannerPage: React.FC = () => {
  const { scans, addScanResult, clearScanHistory, pushToast } = useStudio();

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileScannerRef = useRef<Html5Qrcode | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [latestResult, setLatestResult] = useState<Omit<ScanHistoryItem, 'id' | 'timestamp'> | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // ignore cleanup error
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      void stopCamera();
      if (fileScannerRef.current) {
        try {
          fileScannerRef.current.clear();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const handleDecoded = async (decodedText: string, source: 'camera' | 'image') => {
    const info = inspectScannedPayload(decodedText);
    const result: Omit<ScanHistoryItem, 'id' | 'timestamp'> = {
      decodedText,
      format: 'QR_CODE',
      detectedType: info.detectedType,
      safetyNote: info.safetyNote,
      isSafeUrl: info.isSafeUrl,
      source,
    };
    setLatestResult(result);
    await addScanResult(result);
    pushToast({
      title: 'QR Code Decoded',
      description: `Detected ${info.detectedType.toUpperCase()} payload.`,
      variant: info.detectedType === 'unsafe' ? 'warning' : 'success',
    });
  };

  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      setCameraError('Live camera access requires a secure HTTPS context or localhost.');
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('This browser does not support camera media capture.');
      return;
    }

    await stopCamera();

    try {
      const instance = new Html5Qrcode(CAMERA_REGION_ID);
      scannerRef.current = instance;
      await instance.start(
        { facingMode: mode },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          void handleDecoded(decodedText, 'camera');
          void stopCamera();
        },
        () => {
          // ignore per-frame miss
        }
      );
      setCameraActive(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/permission|denied|notallowed/i.test(msg)) {
        setCameraError(
          'Camera permission was denied. Allow camera access in your browser site settings or scan a QR image file below.'
        );
      } else if (/notfound|device/i.test(msg)) {
        setCameraError('No camera device was detected on this machine. Use Image Upload Scanning instead.');
      } else {
        setCameraError(`Unable to start camera: ${msg}`);
      }
      await stopCamera();
    }
  };

  const switchCamera = async () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    if (cameraActive) {
      await startCamera(next);
    }
  };

  const scanImageFile = async (file: File | undefined) => {
    if (!file) return;
    setImageError(null);
    const check = validateImageFileMeta(file.type, file.size, 10 * 1024 * 1024);
    if (!check.valid) {
      setImageError(check.error || 'Invalid image file.');
      return;
    }
    try {
      if (!fileScannerRef.current) {
        fileScannerRef.current = new Html5Qrcode('qr-file-scanner-hidden');
      }
      const decoded = await fileScannerRef.current.scanFile(file, false);
      await handleDecoded(decoded, 'image');
    } catch {
      setImageError('No readable QR code was detected in this image. Ensure clear contrast and quiet zone.');
    }
  };

  const copyResult = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      pushToast({ title: 'Scan result copied', variant: 'success' });
    } catch {
      pushToast({ title: 'Clipboard copy denied', variant: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl text-[#171B2B] dark:text-[#F5F6FC]">
          QR Code Scanner
        </h2>
        <p className="text-sm text-[#747D91] dark:text-[#A4ADC1] mt-1">
          Scan QR codes via live camera or image upload. All scanned payloads are inspected before you choose whether to open them.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Live Camera & File Scanner */}
        <section className="lg:col-span-7 space-y-5">
          <div className="rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Camera className="w-5 h-5 text-[#6655EE] dark:text-[#8978FF]" />
                <h3 className="font-display font-bold text-base">Live Camera Scanner</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={switchCamera}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E5E8F0] dark:border-[#29344B] hover:border-[#6655EE] transition-colors"
                >
                  <SwitchCamera className="w-3.5 h-3.5" />
                  {facingMode === 'environment' ? 'Rear Camera' : 'Front Camera'}
                </button>

                {!cameraActive ? (
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#6655EE] hover:bg-[#5645DD] text-white transition-colors"
                  >
                    <Scan className="w-3.5 h-3.5" />
                    Start Camera
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => stopCamera()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                  >
                    <CameraOff className="w-3.5 h-3.5" />
                    Stop Camera
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-xl overflow-hidden bg-[#0C1120] border border-[#E5E8F0] dark:border-[#29344B] min-h-[260px] flex items-center justify-center relative">
              <div id={CAMERA_REGION_ID} className="w-full" />
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-[#A4ADC1]">
                  <Camera className="w-8 h-8 mb-2 opacity-75" />
                  <p className="text-xs max-w-xs">
                    Click &ldquo;Start Camera&rdquo; to scan a printed or on-screen QR code in real time.
                  </p>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            )}
          </div>

          {/* Image File Scanner */}
          <div className="rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <ImageIcon className="w-5 h-5 text-[#6655EE] dark:text-[#8978FF]" />
              <h3 className="font-display font-bold text-base">Scan from Image File</h3>
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => scanImageFile(e.target.files?.[0])}
              className="hidden"
            />
            <div id="qr-file-scanner-hidden" className="hidden" />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                scanImageFile(e.dataTransfer.files?.[0]);
              }}
              className={`rounded-xl border-2 border-dashed p-7 text-center transition-colors ${
                dragging
                  ? 'border-[#6655EE] bg-[#6655EE]/8'
                  : 'border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120]'
              }`}
            >
              <Upload className="w-6 h-6 text-[#6655EE] dark:text-[#8978FF] mx-auto mb-2" />
              <div className="text-xs font-semibold text-[#171B2B] dark:text-[#F5F6FC]">
                Drop a QR image here or select from device
              </div>
              <p className="text-[11px] text-[#747D91] dark:text-[#A4ADC1] mt-1 mb-4">
                PNG, JPG, JPEG, or WEBP screenshots and exported QR graphics
              </p>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#E5E8F0] dark:border-[#29344B] bg-white dark:bg-[#19243A] hover:border-[#6655EE] transition-colors"
              >
                Upload QR Image
              </button>
            </div>

            {imageError && (
              <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{imageError}</span>
              </div>
            )}
          </div>
        </section>

        {/* Right: Result Inspector & Scan History */}
        <section className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-6 space-y-4">
            <h3 className="font-display font-bold text-base">Scan Result Inspector</h3>

            {!latestResult ? (
              <div className="py-8 text-center rounded-xl bg-[#F5F6FA] dark:bg-[#0C1120] border border-dashed border-[#E5E8F0] dark:border-[#29344B]">
                <Scan className="w-6 h-6 text-[#747D91] mx-auto mb-2" />
                <div className="text-xs font-medium text-[#747D91] dark:text-[#A4ADC1]">
                  No active scan result. Use the camera or upload a QR image.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  className={`flex items-start gap-2.5 p-3 rounded-xl text-xs ${
                    latestResult.detectedType === 'unsafe'
                      ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40'
                      : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40'
                  }`}
                >
                  {latestResult.detectedType === 'unsafe' ? (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold uppercase tracking-wide text-[11px]">
                      {latestResult.detectedType} Payload
                    </div>
                    <div className="mt-0.5">{latestResult.safetyNote}</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F5F6FA] dark:bg-[#0C1120] border border-[#E5E8F0] dark:border-[#29344B] font-mono text-xs break-all max-h-40 overflow-y-auto">
                  {latestResult.decodedText}
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => copyResult(latestResult.decodedText)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-[#E5E8F0] dark:border-[#29344B] hover:border-[#6655EE] transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy Result'}
                  </button>

                  {latestResult.isSafeUrl && (
                    <a
                      href={latestResult.decodedText}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-[#6655EE] hover:bg-[#5645DD] text-white transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open URL
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#6655EE] dark:text-[#8978FF]" />
                <h3 className="font-display font-bold text-base">Scan History</h3>
              </div>
              {scans.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>

            {scans.length === 0 ? (
              <EmptyState
                icon={History}
                title="No scan history"
                description="Scanned QR payloads from camera or image files are stored locally here."
              />
            ) : (
              <ul className="divide-y divide-[#E5E8F0] dark:divide-[#29344B] max-h-80 overflow-y-auto">
                {scans.map((item) => (
                  <li key={item.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-[#747D91] dark:text-[#A4ADC1]">
                      <span>
                        {item.detectedType.toUpperCase()} · {item.source}
                      </span>
                      <span className="tabular-nums">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs font-mono truncate text-[#171B2B] dark:text-[#F5F6FC]">
                      {item.decodedText}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => copyResult(item.decodedText)}
                        className="text-[11px] font-semibold text-[#6655EE] dark:text-[#8978FF] hover:underline"
                      >
                        Copy
                      </button>
                      {item.isSafeUrl && (
                        <a
                          href={item.decodedText}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-semibold text-[#6655EE] dark:text-[#8978FF] hover:underline"
                        >
                          Open URL
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={confirmClearOpen}
        title="Clear Scan History"
        description="This permanently removes all locally stored QR scan results. This action cannot be undone."
        confirmLabel="Clear History"
        onConfirm={() => {
          void clearScanHistory();
          setConfirmClearOpen(false);
          pushToast({ title: 'Scan history cleared', variant: 'info' });
        }}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </div>
  );
};
