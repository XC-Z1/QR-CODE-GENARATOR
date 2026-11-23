import React, { useRef, useState } from 'react';
import {
  Download,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { useStudio } from '../hooks/useStudioState';
import type {
  ExportFormat,
  QRErrorCorrection,
  QRPatternType,
  ThemePreference,
} from '../types/qr';
import { validateImportedWorkspace } from '../utils/qrValidation';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    qrs,
    favoriteTemplateIds,
    importWorkspaceData,
    clearAllWorkspaceData,
    pushToast,
  } = useStudio();

  const importInputRef = useRef<HTMLInputElement>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const handleThemeSelect = (theme: ThemePreference) => {
    updateSettings({ ...settings, theme });
    pushToast({ title: `Theme set to ${theme}`, variant: 'success' });
  };

  const handleExportBackup = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: 1,
      qrs,
      favoriteTemplateIds,
      settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    pushToast({ title: 'Workspace backup downloaded', variant: 'success' });
  };

  const handleImportBackup = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const check = validateImportedWorkspace(parsed);
        if (!check.valid || !check.qrs) {
          pushToast({
            title: 'Invalid backup file',
            description: check.error || 'Malformed JSON schema.',
            variant: 'error',
          });
          return;
        }
        await importWorkspaceData(check.qrs, check.favoriteTemplateIds, check.settings);
        pushToast({
          title: 'Workspace imported',
          description: `Restored ${check.qrs.length} QR codes.`,
          variant: 'success',
        });
      } catch {
        pushToast({
          title: 'Import failed',
          description: 'Selected file is not valid JSON.',
          variant: 'error',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl text-[#171B2B] dark:text-[#F5F6FC]">
          Settings
        </h2>
        <p className="text-sm text-[#747D91] dark:text-[#A4ADC1] mt-1">
          Configure appearance, studio generation defaults, export presets, and local storage backups.
        </p>
      </div>

      {/* Appearance */}
      <section className="rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-6 space-y-4">
        <h3 className="font-display font-bold text-base">Appearance</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'light' as ThemePreference, label: 'Light Mode', icon: Sun },
            { id: 'dark' as ThemePreference, label: 'Dark Mode', icon: Moon },
            { id: 'system' as ThemePreference, label: 'System Theme', icon: Monitor },
          ].map((opt) => {
            const Icon = opt.icon;
            const active = settings.theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleThemeSelect(opt.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-colors ${
                  active
                    ? 'border-[#6655EE] dark:border-[#8978FF] bg-[#6655EE]/10 dark:bg-[#8978FF]/15 text-[#6655EE] dark:text-[#8978FF]'
                    : 'border-[#E5E8F0] dark:border-[#29344B] hover:border-[#747D91]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Default QR Settings */}
      <section className="rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-6 space-y-4">
        <h3 className="font-display font-bold text-base">Default QR Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Default Pattern</label>
            <select
              value={settings.defaultStyle.pattern}
              onChange={(e) =>
                updateSettings({
                  ...settings,
                  defaultStyle: {
                    ...settings.defaultStyle,
                    pattern: e.target.value as QRPatternType,
                  },
                })
              }
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120]"
            >
              <option value="square">Square</option>
              <option value="dots">Dots</option>
              <option value="rounded">Rounded</option>
              <option value="classy">Classy</option>
              <option value="classy-rounded">Classy Rounded</option>
              <option value="extra-rounded">Extra Rounded</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">Error Correction</label>
            <select
              value={settings.defaultStyle.errorCorrection}
              onChange={(e) =>
                updateSettings({
                  ...settings,
                  defaultStyle: {
                    ...settings.defaultStyle,
                    errorCorrection: e.target.value as QRErrorCorrection,
                  },
                })
              }
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120]"
            >
              <option value="L">L (7%)</option>
              <option value="M">M (15%)</option>
              <option value="Q">Q (25% Recommended)</option>
              <option value="H">H (30% High Resilience)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">Default Size (px)</label>
            <select
              value={settings.defaultStyle.size}
              onChange={(e) =>
                updateSettings({
                  ...settings,
                  defaultStyle: {
                    ...settings.defaultStyle,
                    size: Number(e.target.value),
                  },
                })
              }
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120]"
            >
              <option value={280}>280 px</option>
              <option value={360}>360 px</option>
              <option value={480}>480 px</option>
              <option value={640}>640 px</option>
            </select>
          </div>
        </div>
      </section>

      {/* Default Export Settings */}
      <section className="rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-6 space-y-4">
        <h3 className="font-display font-bold text-base">Default Export Settings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5">Default Format</label>
            <select
              value={settings.defaultExport.format}
              onChange={(e) =>
                updateSettings({
                  ...settings,
                  defaultExport: {
                    ...settings.defaultExport,
                    format: e.target.value as ExportFormat,
                  },
                })
              }
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120]"
            >
              <option value="png">PNG</option>
              <option value="png-hd">High-Res PNG</option>
              <option value="png-transparent">Transparent PNG</option>
              <option value="jpg">JPG</option>
              <option value="svg">SVG</option>
              <option value="pdf">PDF</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5">Export Width</label>
            <select
              value={settings.defaultExport.width}
              onChange={(e) =>
                updateSettings({
                  ...settings,
                  defaultExport: {
                    ...settings.defaultExport,
                    width: Number(e.target.value),
                    height: Number(e.target.value),
                  },
                })
              }
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120]"
            >
              <option value={512}>512 px</option>
              <option value={1024}>1024 px</option>
              <option value={2048}>2048 px</option>
              <option value={4096}>4096 px</option>
            </select>
          </div>

          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={settings.defaultExport.transparent}
                onChange={(e) =>
                  updateSettings({
                    ...settings,
                    defaultExport: {
                      ...settings.defaultExport,
                      transparent: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 rounded accent-[#6655EE]"
              />
              <span>Transparent by default</span>
            </label>
          </div>
        </div>
      </section>

      {/* Data Management */}
      <section className="rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-6 space-y-4">
        <h3 className="font-display font-bold text-base">Data Management</h3>
        <p className="text-xs text-[#747D91] dark:text-[#A4ADC1]">
          Back up your local IndexedDB library as a portable JSON file or restore an existing backup.
        </p>

        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          onChange={(e) => handleImportBackup(e.target.files?.[0])}
          className="hidden"
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportBackup}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-[#E5E8F0] dark:border-[#29344B] hover:border-[#6655EE]"
          >
            <Download className="w-4 h-4" />
            Export Local Data (JSON)
          </button>

          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-[#E5E8F0] dark:border-[#29344B] hover:border-[#6655EE]"
          >
            <Upload className="w-4 h-4" />
            Import Local Data
          </button>

          <button
            type="button"
            onClick={() => setConfirmClearOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 className="w-4 h-4" />
            Clear Local Data
          </button>
        </div>
      </section>

      {/* Privacy & About */}
      <section className="rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-6 space-y-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-[#6655EE] dark:text-[#8978FF]" />
          <h3 className="font-display font-bold text-base">Privacy & About</h3>
        </div>
        <p className="text-xs text-[#747D91] dark:text-[#A4ADC1] leading-relaxed">
          QR Code Generator operates without accounts, passwords, or personal user tracking. Static QR codes, customization styles, scan history, and your saved library remain stored locally in your browser&apos;s IndexedDB and localStorage. Dynamic QR redirect links and uploaded Image-to-QR assets are stored on the active server solely to serve redirects and image links.
        </p>
      </section>

      <ConfirmDialog
        open={confirmClearOpen}
        title="Clear All Local Workspace Data"
        description="This permanently removes all locally saved QR codes, scan history, favorite templates, and activity logs from this browser."
        confirmLabel="Clear Everything"
        onConfirm={() => {
          void clearAllWorkspaceData();
          setConfirmClearOpen(false);
          pushToast({ title: 'All local workspace data cleared', variant: 'info' });
        }}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </div>
  );
};
