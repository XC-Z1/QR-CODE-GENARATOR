import React, { useRef, useState } from 'react';
import { Trash2, Upload } from 'lucide-react';
import type {
  QRCornerDotType,
  QRCornerSquareType,
  QRErrorCorrection,
  QRFrameFont,
  QRFrameType,
  QRLogoShape,
  QRPatternType,
  QRStyleConfig,
} from '../../types/qr';
import { CURATED_PALETTES } from '../../data/qrContentTypes';
import { validateImageFileMeta } from '../../utils/qrValidation';

type StudioTab = 'pattern' | 'colors' | 'corners' | 'logo' | 'frame' | 'settings';

interface CustomizationPanelProps {
  style: QRStyleConfig;
  onChange: (next: QRStyleConfig) => void;
}

const PATTERN_OPTIONS: Array<{ id: QRPatternType; label: string }> = [
  { id: 'square', label: 'Square' },
  { id: 'dots', label: 'Dots' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'classy', label: 'Classy' },
  { id: 'classy-rounded', label: 'Classy Rounded' },
  { id: 'extra-rounded', label: 'Extra Rounded' },
];

const CORNER_SQUARE_OPTIONS: Array<{ id: QRCornerSquareType; label: string }> = [
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'extra-rounded', label: 'Extra Rounded' },
  { id: 'dot', label: 'Dot' },
];

const CORNER_DOT_OPTIONS: Array<{ id: QRCornerDotType; label: string }> = [
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'dot', label: 'Dot' },
];

const FRAME_OPTIONS: Array<{ id: QRFrameType; label: string }> = [
  { id: 'none', label: 'No Frame' },
  { id: 'scan-me', label: 'Scan Me' },
  { id: 'scan-here', label: 'Scan Here' },
  { id: 'scan-to-open', label: 'Scan to Open' },
  { id: 'custom', label: 'Custom Caption' },
];

export const CustomizationPanel: React.FC<CustomizationPanelProps> = ({ style, onChange }) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('pattern');
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<QRStyleConfig>) => {
    onChange({ ...style, ...patch });
  };

  const handleLogoFile = (file: File | undefined) => {
    if (!file) return;
    setLogoError(null);
    const check = validateImageFileMeta(file.type, file.size, 2 * 1024 * 1024);
    if (!check.valid) {
      setLogoError(check.error || 'Invalid logo file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        update({
          logoDataUrl: reader.result,
          logoName: file.name,
          errorCorrection:
            style.errorCorrection === 'L' || style.errorCorrection === 'M'
              ? 'Q'
              : style.errorCorrection,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const tabs: Array<{ id: StudioTab; label: string }> = [
    { id: 'pattern', label: 'Pattern' },
    { id: 'colors', label: 'Colors' },
    { id: 'corners', label: 'Corners' },
    { id: 'logo', label: 'Logo' },
    { id: 'frame', label: 'Frame' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div className="space-y-4">
      {/* Tab Bar */}
      <div
        role="tablist"
        aria-label="QR customization tabs"
        className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#F0F2F8] dark:bg-[#0C1120] border border-[#E5E8F0] dark:border-[#29344B]"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                active
                  ? 'bg-white dark:bg-[#19243A] text-[#6655EE] dark:text-[#8978FF] shadow-xs'
                  : 'text-[#747D91] dark:text-[#A4ADC1] hover:text-[#171B2B] dark:hover:text-[#F5F6FC]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'pattern' && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-[#171B2B] dark:text-[#F5F6FC]">
            Module Pattern Style
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PATTERN_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => update({ pattern: opt.id })}
                className={`px-3 py-2.5 text-xs font-medium rounded-xl border text-left transition-colors ${
                  style.pattern === opt.id
                    ? 'border-[#6655EE] dark:border-[#8978FF] bg-[#6655EE]/10 dark:bg-[#8978FF]/15 text-[#6655EE] dark:text-[#8978FF] font-semibold'
                    : 'border-[#E5E8F0] dark:border-[#29344B] text-[#171B2B] dark:text-[#F5F6FC] hover:border-[#747D91]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'colors' && (
        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-[#171B2B] dark:text-[#F5F6FC] mb-2">
              Curated Palettes
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CURATED_PALETTES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    update({
                      foregroundColor: p.fg,
                      backgroundColor: p.bg,
                      transparentBackground: false,
                      useGradient: Boolean(p.useGradient),
                      gradientColor1: p.g1 ?? p.fg,
                      gradientColor2: p.g2 ?? '#3984F6',
                    })
                  }
                  className="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-[#E5E8F0] dark:border-[#29344B] hover:border-[#6655EE] text-left transition-colors"
                >
                  <span
                    className="w-5 h-5 rounded-md border border-black/10 shrink-0"
                    style={{
                      background: p.useGradient
                        ? `linear-gradient(135deg, ${p.g1}, ${p.g2})`
                        : p.fg,
                    }}
                  />
                  <span className="text-xs font-medium truncate text-[#171B2B] dark:text-[#F5F6FC]">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E5E8F0] dark:border-[#29344B]">
            <div>
              <label
                htmlFor="fg-color-picker"
                className="block text-xs font-semibold text-[#171B2B] dark:text-[#F5F6FC] mb-1.5"
              >
                Foreground
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="fg-color-picker"
                  type="color"
                  value={style.foregroundColor}
                  onChange={(e) => update({ foregroundColor: e.target.value })}
                  className="w-9 h-9 rounded-lg border border-[#E5E8F0] dark:border-[#29344B] cursor-pointer bg-transparent p-0.5"
                />
                <input
                  type="text"
                  aria-label="Foreground hex color"
                  value={style.foregroundColor}
                  onChange={(e) => update({ foregroundColor: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="bg-color-picker"
                className="block text-xs font-semibold text-[#171B2B] dark:text-[#F5F6FC] mb-1.5"
              >
                Background
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="bg-color-picker"
                  type="color"
                  value={style.backgroundColor}
                  disabled={style.transparentBackground}
                  onChange={(e) => update({ backgroundColor: e.target.value })}
                  className="w-9 h-9 rounded-lg border border-[#E5E8F0] dark:border-[#29344B] cursor-pointer bg-transparent p-0.5 disabled:opacity-40"
                />
                <input
                  type="text"
                  aria-label="Background hex color"
                  value={style.backgroundColor}
                  disabled={style.transparentBackground}
                  onChange={(e) => update({ backgroundColor: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120] disabled:opacity-40"
                />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-xs font-medium text-[#171B2B] dark:text-[#F5F6FC] cursor-pointer">
            <input
              type="checkbox"
              checked={style.useGradient}
              onChange={(e) => update({ useGradient: e.target.checked })}
              className="w-4 h-4 rounded accent-[#6655EE]"
            />
            <span>Enable Foreground Gradient</span>
          </label>

          {style.useGradient && (
            <div className="space-y-3 p-3 rounded-xl bg-[#F5F6FA] dark:bg-[#0C1120] border border-[#E5E8F0] dark:border-[#29344B]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#747D91] mb-1">
                    Gradient Start
                  </label>
                  <input
                    type="color"
                    aria-label="Gradient start color"
                    value={style.gradientColor1}
                    onChange={(e) => update({ gradientColor1: e.target.value })}
                    className="w-full h-8 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#747D91] mb-1">
                    Gradient End
                  </label>
                  <input
                    type="color"
                    aria-label="Gradient end color"
                    value={style.gradientColor2}
                    onChange={(e) => update({ gradientColor2: e.target.value })}
                    className="w-full h-8 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#747D91] mb-1">
                    Type
                  </label>
                  <select
                    value={style.gradientType}
                    onChange={(e) => update({ gradientType: e.target.value as 'linear' | 'radial' })}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E5E8F0] dark:border-[#29344B] bg-white dark:bg-[#19243A]"
                  >
                    <option value="linear">Linear</option>
                    <option value="radial">Radial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#747D91] mb-1">
                    Angle ({style.gradientRotation}°)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={15}
                    disabled={style.gradientType === 'radial'}
                    value={style.gradientRotation}
                    onChange={(e) => update({ gradientRotation: Number(e.target.value) })}
                    className="w-full accent-[#6655EE] mt-1.5"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'corners' && (
        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-[#171B2B] dark:text-[#F5F6FC] mb-2">
              Corner Eye Frame (Square)
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CORNER_SQUARE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => update({ cornerSquare: opt.id })}
                  className={`px-3 py-2 text-xs font-medium rounded-xl border text-left transition-colors ${
                    style.cornerSquare === opt.id
                      ? 'border-[#6655EE] dark:border-[#8978FF] bg-[#6655EE]/10 dark:bg-[#8978FF]/15 text-[#6655EE] dark:text-[#8978FF] font-semibold'
                      : 'border-[#E5E8F0] dark:border-[#29344B] hover:border-[#747D91]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-[#E5E8F0] dark:border-[#29344B]">
            <div className="text-xs font-semibold text-[#171B2B] dark:text-[#F5F6FC] mb-2">
              Corner Eye Center (Dot)
            </div>
            <div className="grid grid-cols-3 gap-2">
              {CORNER_DOT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => update({ cornerDot: opt.id })}
                  className={`px-3 py-2 text-xs font-medium rounded-xl border text-center transition-colors ${
                    style.cornerDot === opt.id
                      ? 'border-[#6655EE] dark:border-[#8978FF] bg-[#6655EE]/10 dark:bg-[#8978FF]/15 text-[#6655EE] dark:text-[#8978FF] font-semibold'
                      : 'border-[#E5E8F0] dark:border-[#29344B] hover:border-[#747D91]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'logo' && (
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => handleLogoFile(e.target.files?.[0])}
            className="hidden"
          />

          {!style.logoDataUrl ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 px-4 rounded-xl border border-dashed border-[#E5E8F0] dark:border-[#29344B] hover:border-[#6655EE] bg-[#F5F6FA] dark:bg-[#0C1120] flex flex-col items-center gap-2 text-center transition-colors"
            >
              <Upload className="w-5 h-5 text-[#6655EE] dark:text-[#8978FF]" />
              <div className="text-xs font-semibold text-[#171B2B] dark:text-[#F5F6FC]">
                Upload Brand Logo
              </div>
              <div className="text-[11px] text-[#747D91] dark:text-[#A4ADC1]">
                PNG, JPG, or WEBP up to 2 MB
              </div>
            </button>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-xl border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120]">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={style.logoDataUrl}
                  alt="Uploaded QR logo"
                  className="w-10 h-10 rounded-lg object-contain bg-white border border-[#E5E8F0]"
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{style.logoName || 'Brand Logo'}</div>
                  <div className="text-[11px] text-[#747D91]">Embedded center badge</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg border border-[#E5E8F0] dark:border-[#29344B] hover:border-[#6655EE]"
                >
                  Replace
                </button>
                <button
                  type="button"
                  aria-label="Remove logo"
                  onClick={() => update({ logoDataUrl: undefined, logoName: undefined })}
                  className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {logoError && <p className="text-xs text-red-600 dark:text-red-400">{logoError}</p>}

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">Logo Size</span>
                <span className="font-mono tabular-nums text-[#747D91]">
                  {Math.round(style.logoSize * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.15}
                max={0.42}
                step={0.01}
                value={style.logoSize}
                onChange={(e) => update({ logoSize: Number(e.target.value) })}
                className="w-full accent-[#6655EE]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">Logo Margin</span>
                <span className="font-mono tabular-nums text-[#747D91]">{style.logoMargin} px</span>
              </div>
              <input
                type="range"
                min={0}
                max={16}
                step={1}
                value={style.logoMargin}
                onChange={(e) => update({ logoMargin: Number(e.target.value) })}
                className="w-full accent-[#6655EE]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Logo Shape</label>
                <select
                  value={style.logoShape}
                  onChange={(e) => update({ logoShape: e.target.value as QRLogoShape })}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120]"
                >
                  <option value="square">Square</option>
                  <option value="rounded">Rounded</option>
                  <option value="circle">Circle</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Logo Backdrop</label>
                <input
                  type="color"
                  aria-label="Logo backdrop color"
                  value={style.logoBackgroundColor}
                  onChange={(e) => update({ logoBackgroundColor: e.target.value })}
                  className="w-full h-8 rounded-lg border border-[#E5E8F0] dark:border-[#29344B] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'frame' && (
        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-[#171B2B] dark:text-[#F5F6FC] mb-2">
              Frame Style
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FRAME_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => update({ frameType: opt.id })}
                  className={`px-3 py-2 text-xs font-medium rounded-xl border text-left transition-colors ${
                    style.frameType === opt.id
                      ? 'border-[#6655EE] dark:border-[#8978FF] bg-[#6655EE]/10 dark:bg-[#8978FF]/15 text-[#6655EE] dark:text-[#8978FF] font-semibold'
                      : 'border-[#E5E8F0] dark:border-[#29344B] hover:border-[#747D91]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {style.frameType !== 'none' && (
            <div className="space-y-3 pt-2 border-t border-[#E5E8F0] dark:border-[#29344B]">
              {style.frameType === 'custom' && (
                <div>
                  <label
                    htmlFor="frame-caption-input"
                    className="block text-xs font-semibold mb-1"
                  >
                    Custom Caption
                  </label>
                  <input
                    id="frame-caption-input"
                    type="text"
                    maxLength={24}
                    value={style.frameCaption}
                    onChange={(e) => update({ frameCaption: e.target.value })}
                    placeholder="SCAN ME"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120]"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Frame Color</label>
                  <input
                    type="color"
                    aria-label="Frame color"
                    value={style.frameColor}
                    onChange={(e) => update({ frameColor: e.target.value })}
                    className="w-full h-8 rounded-lg border border-[#E5E8F0] dark:border-[#29344B] cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Caption Color</label>
                  <input
                    type="color"
                    aria-label="Frame caption color"
                    value={style.frameCaptionColor}
                    onChange={(e) => update({ frameCaptionColor: e.target.value })}
                    className="w-full h-8 rounded-lg border border-[#E5E8F0] dark:border-[#29344B] cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Caption Typography</label>
                <select
                  value={style.frameFont}
                  onChange={(e) => update({ frameFont: e.target.value as QRFrameFont })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120]"
                >
                  <option value="manrope">Manrope Geometric</option>
                  <option value="jakarta">Plus Jakarta Sans</option>
                  <option value="mono">JetBrains Mono</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div>
            <div className="text-xs font-semibold text-[#171B2B] dark:text-[#F5F6FC] mb-2">
              Error Correction Level
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {(['L', 'M', 'Q', 'H'] as QRErrorCorrection[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => update({ errorCorrection: lvl })}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    style.errorCorrection === lvl
                      ? 'border-[#6655EE] dark:border-[#8978FF] bg-[#6655EE]/10 dark:bg-[#8978FF]/15 text-[#6655EE] dark:text-[#8978FF]'
                      : 'border-[#E5E8F0] dark:border-[#29344B]'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-[#747D91] dark:text-[#A4ADC1]">
              L (7%), M (15%), Q (25%), H (30%). Higher levels tolerate logos and print wear better.
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">Base Size</span>
              <span className="font-mono tabular-nums text-[#747D91]">{style.size} px</span>
            </div>
            <input
              type="range"
              min={200}
              max={800}
              step={20}
              value={style.size}
              onChange={(e) => update({ size: Number(e.target.value) })}
              className="w-full accent-[#6655EE]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">Margin</span>
              <span className="font-mono tabular-nums text-[#747D91]">{style.margin} px</span>
            </div>
            <input
              type="range"
              min={0}
              max={40}
              step={2}
              value={style.margin}
              onChange={(e) => update({ margin: Number(e.target.value) })}
              className="w-full accent-[#6655EE]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium">Quiet Zone</span>
              <span className="font-mono tabular-nums text-[#747D91]">{style.quietZone} px</span>
            </div>
            <input
              type="range"
              min={0}
              max={32}
              step={2}
              value={style.quietZone}
              onChange={(e) => update({ quietZone: Number(e.target.value) })}
              className="w-full accent-[#6655EE]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Export Resolution Multiplier</label>
            <select
              value={style.resolution}
              onChange={(e) => update({ resolution: Number(e.target.value) as 1 | 2 | 4 })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120]"
            >
              <option value={1}>1x Standard</option>
              <option value={2}>2x Retina Print</option>
              <option value={4}>4x Ultra High-Res</option>
            </select>
          </div>

          <label className="flex items-center gap-2.5 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={style.transparentBackground}
              onChange={(e) => update({ transparentBackground: e.target.checked })}
              className="w-4 h-4 rounded accent-[#6655EE]"
            />
            <span>Transparent Background</span>
          </label>
        </div>
      )}
    </div>
  );
};
