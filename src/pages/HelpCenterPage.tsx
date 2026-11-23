import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileCheck2, HelpCircle, QrCode, ShieldAlert } from 'lucide-react';
import { QR_CONTENT_TYPES } from '../data/qrContentTypes';
import { useStudio } from '../hooks/useStudioState';

const FAQS = [
  {
    q: 'What is the difference between Static and Dynamic QR codes?',
    a: 'Static QR codes encode the full payload (URL, Wi-Fi, vCard, plain text) directly inside the matrix pattern, so they work forever offline without a server. Dynamic QR codes point to a short redirect endpoint (/r/code) so you can change the destination URL later, pause/expire the link, and measure scan counts.',
  },
  {
    q: 'How do I keep a customized QR code reliably scannable?',
    a: 'Maintain at least a 3:1 foreground-to-background contrast ratio (darker foreground on lighter background works best across camera sensors), keep a clean quiet zone around the perimeter, and use Error Correction Q or H whenever embedding a center brand logo.',
  },
  {
    q: 'Which export format should I pick for print vs. digital?',
    a: 'Use SVG or PDF for large-format print, signage, and packaging because vectors scale infinitely without pixelation. Use High-Res PNG (2048px+) or Transparent PNG for slides, social posts, and web overlays.',
  },
  {
    q: 'Why does the QR Scanner ask before opening links?',
    a: 'For your safety, the scanner never automatically opens decoded URLs. It inspects URI schemes to block dangerous payloads (such as javascript: or data:) and displays the full destination so you decide whether to open it.',
  },
];

export const HelpCenterPage: React.FC = () => {
  const { openInGenerator } = useStudio();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h2 className="font-display font-bold text-2xl text-[#171B2B] dark:text-[#F5F6FC]">
          Help Center
        </h2>
        <p className="text-sm text-[#747D91] dark:text-[#A4ADC1] mt-1">
          Guides for QR creation, scannability standards, export formats, safety, and troubleshooting.
        </p>
      </div>

      {/* Quick Guides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-5 space-y-2">
          <QrCode className="w-5 h-5 text-[#6655EE] dark:text-[#8978FF]" />
          <h3 className="font-display font-bold text-base">QR Code Guide</h3>
          <p className="text-xs text-[#747D91] dark:text-[#A4ADC1] leading-relaxed">
            Choose from 31 content encoders, configure patterns and logos, and verify the live contrast indicator before downloading.
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-5 space-y-2">
          <ShieldAlert className="w-5 h-5 text-[#6655EE] dark:text-[#8978FF]" />
          <h3 className="font-display font-bold text-base">QR Safety Tips</h3>
          <p className="text-xs text-[#747D91] dark:text-[#A4ADC1] leading-relaxed">
            Always preview decoded URLs in the scanner before visiting, prefer HTTPS destinations, and inspect payment addresses carefully.
          </p>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-5 space-y-2">
          <FileCheck2 className="w-5 h-5 text-[#6655EE] dark:text-[#8978FF]" />
          <h3 className="font-display font-bold text-base">Export & Print Guide</h3>
          <p className="text-xs text-[#747D91] dark:text-[#A4ADC1] leading-relaxed">
            Print at least 2 cm x 2 cm physical size with a minimum 4-module quiet zone. Use SVG or 4096px PNG for sharp edges.
          </p>
        </div>
      </div>

      {/* FAQ Accordion */}
      <section className="rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#6655EE] dark:text-[#8978FF]" />
          <h3 className="font-display font-bold text-lg">Frequently Asked Questions</h3>
        </div>
        <div className="divide-y divide-[#E5E8F0] dark:divide-[#29344B]">
          {FAQS.map((item, idx) => {
            const expanded = openFaq === idx;
            return (
              <div key={item.q} className="py-3.5 first:pt-0 last:pb-0">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpenFaq(expanded ? null : idx)}
                  className="w-full flex items-center justify-between gap-4 text-left font-semibold text-sm text-[#171B2B] dark:text-[#F5F6FC]"
                >
                  <span>{item.q}</span>
                  {expanded ? (
                    <ChevronUp className="w-4 h-4 shrink-0 text-[#747D91]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 shrink-0 text-[#747D91]" />
                  )}
                </button>
                {expanded && (
                  <p className="mt-2 text-xs text-[#747D91] dark:text-[#A4ADC1] leading-relaxed">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-6 space-y-3">
        <h3 className="font-display font-bold text-lg">Troubleshooting</h3>
        <ul className="list-disc pl-5 space-y-2 text-xs text-[#747D91] dark:text-[#A4ADC1] leading-relaxed">
          <li>
            <strong>Camera fails to open:</strong> Verify browser site permissions allow camera access and confirm you are running on HTTPS or localhost. You can always scan QR PNG/JPG/WEBP screenshots directly in the Image Upload Scanner.
          </li>
          <li>
            <strong>Scanner struggles to read a stylized QR:</strong> Increase foreground/background contrast, reduce logo size below 30%, or set Error Correction to Q or H.
          </li>
          <li>
            <strong>Dynamic QR shows offline notice:</strong> Dynamic redirects require an active server connection. Static QR codes continue generating and exporting fully offline.
          </li>
        </ul>
      </section>

      {/* Supported QR Formats */}
      <section className="rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-6 space-y-4">
        <h3 className="font-display font-bold text-lg">
          Supported QR Formats ({QR_CONTENT_TYPES.length})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QR_CONTENT_TYPES.map((spec) => (
            <button
              key={spec.type}
              type="button"
              onClick={() => openInGenerator({ type: spec.type })}
              className="text-left p-3 rounded-xl border border-[#E5E8F0] dark:border-[#29344B] hover:border-[#6655EE] transition-colors"
            >
              <div className="text-xs font-bold text-[#171B2B] dark:text-[#F5F6FC]">
                {spec.label}
              </div>
              <div className="text-[11px] text-[#747D91] dark:text-[#A4ADC1] mt-0.5 line-clamp-1">
                {spec.description}
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
