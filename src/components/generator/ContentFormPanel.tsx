import React from 'react';
import type { QRContentType } from '../../types/qr';
import {
  QR_CONTENT_CATEGORIES,
  QR_CONTENT_TYPES,
  getContentTypeSpec,
} from '../../data/qrContentTypes';

interface ContentFormPanelProps {
  selectedType: QRContentType;
  fields: Record<string, string>;
  errors: Record<string, string>;
  onSelectType: (type: QRContentType) => void;
  onFieldChange: (key: string, value: string) => void;
}

export const ContentFormPanel: React.FC<ContentFormPanelProps> = ({
  selectedType,
  fields,
  errors,
  onSelectType,
  onFieldChange,
}) => {
  const spec = getContentTypeSpec(selectedType);

  return (
    <div className="space-y-5">
      <div>
        <label
          htmlFor="qr-content-type-select"
          className="block text-xs font-semibold text-[#171B2B] dark:text-[#F5F6FC] mb-1.5"
        >
          QR Content Type
        </label>
        <select
          id="qr-content-type-select"
          value={selectedType}
          onChange={(e) => onSelectType(e.target.value as QRContentType)}
          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120] text-[#171B2B] dark:text-[#F5F6FC] focus:outline-none focus:ring-2 focus:ring-[#6655EE]"
        >
          {QR_CONTENT_CATEGORIES.map((cat) => (
            <optgroup key={cat.id} label={cat.label}>
              {QR_CONTENT_TYPES.filter((t) => t.category === cat.id).map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-[#747D91] dark:text-[#A4ADC1] leading-relaxed">
          {spec.description}
        </p>
      </div>

      {/* Quick Category Type Grid */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[#747D91] dark:text-[#A4ADC1] mb-2">
          Popular Types
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {(['url', 'text', 'wifi', 'vcard', 'whatsapp', 'email', 'phone', 'gps', 'restaurant-menu'] as QRContentType[]).map(
            (quickType) => {
              const item = getContentTypeSpec(quickType);
              const active = selectedType === quickType;
              return (
                <button
                  key={quickType}
                  type="button"
                  onClick={() => onSelectType(quickType)}
                  className={`px-2 py-1.5 text-xs font-medium rounded-lg border transition-colors truncate ${
                    active
                      ? 'border-[#6655EE] dark:border-[#8978FF] bg-[#6655EE]/10 dark:bg-[#8978FF]/15 text-[#6655EE] dark:text-[#8978FF]'
                      : 'border-[#E5E8F0] dark:border-[#29344B] text-[#747D91] dark:text-[#A4ADC1] hover:text-[#171B2B] dark:hover:text-[#F5F6FC]'
                  }`}
                >
                  {item.shortLabel}
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Dynamic Input Fields */}
      <div className="space-y-4 pt-2 border-t border-[#E5E8F0] dark:border-[#29344B]">
        {spec.fields.map((field) => {
          const val = fields[field.key] ?? '';
          const err = errors[field.key];
          const inputId = `field-${selectedType}-${field.key}`;

          if (field.inputType === 'checkbox') {
            return (
              <label
                key={field.key}
                htmlFor={inputId}
                className="flex items-center gap-2.5 text-sm text-[#171B2B] dark:text-[#F5F6FC] cursor-pointer"
              >
                <input
                  id={inputId}
                  type="checkbox"
                  checked={val === 'true'}
                  onChange={(e) => onFieldChange(field.key, e.target.checked ? 'true' : 'false')}
                  className="w-4 h-4 rounded accent-[#6655EE]"
                />
                <span>{field.label}</span>
              </label>
            );
          }

          return (
            <div key={field.key}>
              <label
                htmlFor={inputId}
                className="block text-xs font-semibold text-[#171B2B] dark:text-[#F5F6FC] mb-1.5"
              >
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>

              {field.inputType === 'textarea' ? (
                <textarea
                  id={inputId}
                  rows={3}
                  value={val}
                  onChange={(e) => onFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-[#F5F6FA] dark:bg-[#0C1120] text-[#171B2B] dark:text-[#F5F6FC] placeholder:text-[#747D91]/70 focus:outline-none focus:ring-2 focus:ring-[#6655EE] ${
                    err
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-[#E5E8F0] dark:border-[#29344B]'
                  }`}
                />
              ) : field.inputType === 'select' ? (
                <select
                  id={inputId}
                  value={val || field.options?.[0]?.value || ''}
                  onChange={(e) => onFieldChange(field.key, e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120] text-[#171B2B] dark:text-[#F5F6FC] focus:outline-none focus:ring-2 focus:ring-[#6655EE]"
                >
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={inputId}
                  type={field.inputType ?? 'text'}
                  value={val}
                  onChange={(e) => onFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-[#F5F6FA] dark:bg-[#0C1120] text-[#171B2B] dark:text-[#F5F6FC] placeholder:text-[#747D91]/70 focus:outline-none focus:ring-2 focus:ring-[#6655EE] ${
                    err
                      ? 'border-red-500 dark:border-red-500'
                      : 'border-[#E5E8F0] dark:border-[#29344B]'
                  }`}
                />
              )}

              {err && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{err}</p>}
              {!err && field.hint && (
                <p className="mt-1 text-xs text-[#747D91] dark:text-[#A4ADC1]">{field.hint}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
