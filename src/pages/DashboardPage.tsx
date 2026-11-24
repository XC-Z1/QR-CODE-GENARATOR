import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  ChartNoAxesCombined,
  Download,
  Edit3,
  Globe,
  History,
  Layers,
  Mail,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Phone,
  Plus,
  QrCode,
  Radio,
  Type,
  UserSquare2,
  Wifi,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStudio } from '../hooks/useStudioState';
import { QR_TEMPLATES } from '../data/templates';
import { getContentTypeSpec } from '../data/qrContentTypes';
import type { QRContentType, QRRecord } from '../types/qr';
import { QRPreviewCard } from '../components/shared/QRPreviewCard';
import { ExportModal } from '../components/shared/ExportModal';
import { EmptyState } from '../components/shared/EmptyState';

const QUICK_CREATE_ITEMS: Array<{
  type: QRContentType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { type: 'url', label: 'Website', icon: Globe },
  { type: 'text', label: 'Text', icon: Type },
  { type: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { type: 'vcard', label: 'Contact', icon: UserSquare2 },
  { type: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { type: 'gps', label: 'Location', icon: MapPin },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'phone', label: 'Phone', icon: Phone },
];

export const DashboardPage: React.FC = () => {
  const {
    qrs,
    activity,
    analyticsSummary,
    navigate,
    openInGenerator,
    duplicateQR,
    pushToast,
  } = useStudio();

  const [exportTarget, setExportTarget] = useState<QRRecord | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const total = qrs.length;
    const dynamicCount = qrs.filter((q) => q.mode === 'dynamic').length;
    const staticCount = total - dynamicCount;
    const totalScans = analyticsSummary?.totalDynamicScans ?? 0;
    return { total, staticCount, dynamicCount, totalScans };
  }, [qrs, analyticsSummary]);

  const recentQRs = qrs.slice(0, 4);
  const recentActivity = activity.slice(0, 6);
  const featuredTemplates = QR_TEMPLATES.slice(0, 4);
  const chartData = analyticsSummary?.dailyScans ?? [];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="rounded-3xl studio-glass-hero p-6 sm:p-8 lg:p-10 relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden"
        >
          <div className="absolute -right-10 -top-12 w-72 h-72 rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.22)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_70%)]" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative">
          <div className="lg:col-span-7 space-y-5">
            <div className="text-xs sm:text-sm font-semibold tracking-wide text-[#5538EE] dark:text-[#8B7BFF]">
              Create. Customize. Connect.
            </div>
            <h2
              className="font-display font-extrabold text-3xl sm:text-4xl lg:text-[44px] leading-[1.14] tracking-tight text-[#0D1224] dark:text-[#F4F7FF]"
              style={{ textWrap: 'balance' }}
            >
              Everything starts with a{' '}
              <span className="text-[#5538EE] dark:text-[#8B7BFF]">QR.</span>
            </h2>
            <p className="text-[15px] sm:text-base text-[#262E45] dark:text-[#D0D7E8] max-w-xl leading-[1.72] tracking-[0.015em]">
              Create, customize and manage professional QR codes in one powerful workspace. Design vector-sharp static and dynamic codes, scan payloads safely, and export in print-ready formats.
            </p>
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1">
              <button
                type="button"
                onClick={() => openInGenerator({ type: 'url' })}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-[13px] sm:text-sm font-semibold rounded-full studio-btn-primary text-white transition-all whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Create QR Code
              </button>
              <button
                type="button"
                onClick={() => navigate('templates')}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-[13px] sm:text-sm font-semibold rounded-full border border-white/85 dark:border-white/25 bg-white/45 dark:bg-white/10 text-[#0F172A] dark:text-[#F4F7FF] hover:border-[#5D4CEB] dark:hover:border-[#8B7BFF] shadow-xs transition-colors whitespace-nowrap"
              >
                <Layers className="w-4 h-4" />
                Explore Templates
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col items-center lg:items-end justify-center">
            <div className="relative flex flex-col items-center">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-2 rounded-full bg-[radial-gradient(circle,rgba(124,101,255,0.24)_0%,transparent_70%)] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.09)_0%,transparent_70%)]"
              />
              <button
                type="button"
                onClick={() => openInGenerator({ type: 'url' })}
                aria-label="Open 3D studio QR generator"
                className="relative bg-transparent border-0 p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5538EE] rounded-3xl"
              >
                <img
                  src="/assets/aistudio/file_00000000dc688211b368d8e89d14d5bb_3368063a.png"
                  alt="3D Violet Crystal QR Code Studio Showcase"
                  decoding="async"
                  className="qr-light-crystal-wrap block dark:hidden w-52 sm:w-60 h-auto select-none"
                />
                <img
                  src="/assets/aistudio/file_000000002f7c8208bf47cf04e18b5821_839af33a.png"
                  alt="3D Dark Crystal QR Code Studio Showcase"
                  decoding="async"
                  className="qr-dark-crystal-wrap hidden dark:block w-52 sm:w-60 h-auto select-none"
                />
              </button>
              <div className="mt-2 text-xs font-medium text-[#2D364D] dark:text-[#B8C2DA] text-center">
                Vector SVG · High-Res PNG · PDF Ready
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* A. Overview Metrics */}
      <section aria-label="Overview metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total QR Codes',
            value: metrics.total,
            sub: 'Saved in local studio',
            icon: QrCode,
          },
          {
            label: 'Static QR Codes',
            value: metrics.staticCount,
            sub: 'Offline direct encoding',
            icon: Layers,
          },
          {
            label: 'Dynamic QR Codes',
            value: metrics.dynamicCount,
            sub: 'Editable redirect links',
            icon: Radio,
          },
          {
            label: 'Total Scans',
            value: metrics.totalScans,
            sub: 'Tracked dynamic redirects',
            icon: ChartNoAxesCombined,
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-white/85 dark:border-[#232F4A] studio-card hover:-translate-y-0.5 transition-[transform,border-color] duration-150 p-5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-semibold text-[#5C667E] dark:text-[#A4ADC1]">
                  {card.label}
                </span>
                <Icon className="w-4 h-4 text-[#5538EE] dark:text-[#8978FF] shrink-0" />
              </div>
              <div className="font-display font-bold text-2xl sm:text-3xl text-[#171B2B] dark:text-[#F5F6FC] tabular-nums">
                {card.value}
              </div>
              <div className="mt-1 text-xs text-[#647087] dark:text-[#A4ADC1]">{card.sub}</div>
            </div>
          );
        })}
      </section>

      {/* B. Quick Create */}
      <section aria-labelledby="quick-create-heading">
        <div className="flex items-center justify-between mb-4">
          <h3
            id="quick-create-heading"
            className="font-display font-bold text-lg text-[#171B2B] dark:text-[#F5F6FC]"
          >
            Quick Create
          </h3>
          <button
            type="button"
            onClick={() => openInGenerator({ type: 'url' })}
            className="px-3 py-1 rounded-full bg-white/65 dark:bg-white/10 border border-white/85 dark:border-white/20 text-xs font-semibold text-[#5538EE] dark:text-[#8B7BFF] hover:border-[#5D4CEB] shadow-xs inline-flex items-center gap-1 transition-colors"
          >
            All 31 Content Types <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
          {QUICK_CREATE_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => openInGenerator({ type: item.type })}
                className="group rounded-xl border border-white/85 dark:border-[#232F4A] studio-card hover:border-[#5D4CEB] dark:hover:border-[#8B7BFF] hover:-translate-y-0.5 p-3.5 flex flex-col items-center justify-center gap-2 text-center transition-[transform,border-color] duration-150"
              >
                <div className="w-9 h-9 rounded-lg bg-[#F0F2F8] dark:bg-[#19243A] text-[#5538EE] dark:text-[#8978FF] flex items-center justify-center group-hover:bg-[#5538EE] group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-[#171B2B] dark:text-[#F5F6FC]">
                  {item.label}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => openInGenerator({ type: 'calendar-event' })}
            className="group rounded-xl border border-white/85 dark:border-[#232F4A] studio-card hover:border-[#5D4CEB] dark:hover:border-[#8B7BFF] hover:-translate-y-0.5 p-3.5 flex flex-col items-center justify-center gap-2 text-center transition-[transform,border-color] duration-150"
          >
            <div className="w-9 h-9 rounded-lg bg-[#F0F2F8] dark:bg-[#19243A] text-[#747D91] dark:text-[#A4ADC1] flex items-center justify-center group-hover:bg-[#5538EE] group-hover:text-white transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-[#171B2B] dark:text-[#F5F6FC]">
              More Types
            </span>
          </button>
        </div>
      </section>

      {/* C. Recent QR Codes + D. Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-[#171B2B] dark:text-[#F5F6FC]">
              Recent QR Codes
            </h3>
            {qrs.length > 0 && (
              <button
                type="button"
                onClick={() => navigate('library')}
                className="px-3 py-1 rounded-full bg-white/65 dark:bg-white/10 border border-white/85 dark:border-white/20 text-xs font-semibold text-[#5538EE] dark:text-[#8B7BFF] hover:border-[#5D4CEB] shadow-xs transition-colors"
              >
                View Library ({qrs.length})
              </button>
            )}
          </div>

          {recentQRs.length === 0 ? (
            <EmptyState
              icon={QrCode}
              title="No QR codes saved yet"
              description="Generate your first static or dynamic QR code in the studio. Saved codes appear here for instant editing and export."
              actionLabel="Create First QR Code"
              onAction={() => openInGenerator({ type: 'url' })}
              secondaryLabel="Browse Templates"
              onSecondaryAction={() => navigate('templates')}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentQRs.map((qr) => {
                const spec = getContentTypeSpec(qr.type);
                return (
                  <div
                    key={qr.id}
                    className="rounded-xl border border-white/85 dark:border-[#29344B] studio-card p-4 flex items-center gap-4 relative"
                  >
                    <QRPreviewCard data={qr.encodedValue} style={qr.style} size={72} bordered={false} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-[#171B2B] dark:text-[#F5F6FC] truncate">
                        {qr.name}
                      </div>
                      <div className="text-xs text-[#747D91] dark:text-[#A4ADC1] mt-0.5 truncate">
                        {spec.shortLabel} · {qr.mode === 'dynamic' ? 'Dynamic' : 'Static'} ·{' '}
                        {new Date(qr.createdAt).toLocaleDateString()}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setExportTarget(qr)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-[#E5E8F0] dark:border-[#29344B] hover:border-[#6655EE] transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            openInGenerator({
                              editRecordId: qr.id,
                              type: qr.type,
                              fields: qr.fields,
                              style: qr.style,
                              name: qr.name,
                            })
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-[#E5E8F0] dark:border-[#29344B] hover:border-[#6655EE] transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit
                        </button>
                        <div className="relative">
                          <button
                            type="button"
                            aria-label={`More actions for ${qr.name}`}
                            onClick={() => setOpenMenuId(openMenuId === qr.id ? null : qr.id)}
                            className="p-1.5 rounded-lg text-[#747D91] hover:bg-[#F0F2F8] dark:hover:bg-[#19243A]"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openMenuId === qr.id && (
                            <div className="absolute right-0 bottom-full mb-1 w-36 rounded-xl bg-white dark:bg-[#19243A] border border-[#E5E8F0] dark:border-[#29344B] shadow-lg p-1 z-20">
                              <button
                                type="button"
                                onClick={() => {
                                  duplicateQR(qr);
                                  setOpenMenuId(null);
                                  pushToast({ title: 'QR duplicated', variant: 'success' });
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-[#F0F2F8] dark:hover:bg-[#121A2D]"
                              >
                                Duplicate
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  navigate('library');
                                }}
                                className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-[#F0F2F8] dark:hover:bg-[#121A2D]"
                              >
                                Manage in Library
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* D. Recent Activity */}
        <section className="xl:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-lg text-[#171B2B] dark:text-[#F5F6FC]">
              Recent Activity
            </h3>
            {activity.length > 0 && (
              <button
                type="button"
                onClick={() => navigate('activity')}
                className="px-3 py-1 rounded-full bg-white/65 dark:bg-white/10 border border-white/85 dark:border-white/20 text-xs font-semibold text-[#5538EE] dark:text-[#8B7BFF] hover:border-[#5D4CEB] shadow-xs transition-colors"
              >
                View All
              </button>
            )}
          </div>

          <div className="rounded-xl border border-white/85 dark:border-[#29344B] studio-card p-4">
            {recentActivity.length === 0 ? (
              <div className="py-8 text-center">
                <History className="w-6 h-6 text-[#747D91] mx-auto mb-2" />
                <div className="text-sm font-semibold text-[#171B2B] dark:text-[#F5F6FC]">
                  No activity recorded yet
                </div>
                <div className="text-xs text-[#747D91] dark:text-[#A4ADC1] mt-1">
                  Creations, exports, and QR scans will appear here automatically.
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-[#E5E8F0] dark:divide-[#29344B]">
                {recentActivity.map((ev) => (
                  <li key={ev.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start gap-3">
                    <Activity className="w-4 h-4 text-[#6655EE] dark:text-[#8978FF] mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-[#171B2B] dark:text-[#F5F6FC] truncate">
                        {ev.detail}
                      </div>
                      <div className="text-[11px] text-[#747D91] dark:text-[#A4ADC1] tabular-nums">
                        {new Date(ev.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* E. QR Analytics Overview */}
      <section className="rounded-2xl border border-white/85 dark:border-[#29344B] studio-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-display font-bold text-lg text-[#171B2B] dark:text-[#F5F6FC]">
              QR Analytics Overview
            </h3>
            <p className="text-xs text-[#747D91] dark:text-[#A4ADC1]">
              Real tracked scan volume across your active dynamic QR links.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('analytics')}
            className="text-xs font-semibold text-[#6655EE] dark:text-[#8978FF] hover:underline"
          >
            Open Analytics Workspace
          </button>
        </div>

        {chartData.length === 0 ? (
          <div className="py-10 text-center rounded-xl bg-[#F5F6FA] dark:bg-[#0C1120] border border-dashed border-[#E5E8F0] dark:border-[#29344B]">
            <ChartNoAxesCombined className="w-7 h-7 text-[#747D91] mx-auto mb-2" />
            <div className="text-sm font-semibold text-[#171B2B] dark:text-[#F5F6FC]">
              No scan telemetry recorded yet
            </div>
            <p className="text-xs text-[#747D91] dark:text-[#A4ADC1] mt-1 max-w-md mx-auto">
              Create a Dynamic QR code in the studio and visit its redirect link to see verified scan charts here.
            </p>
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <XAxis dataKey="date" stroke="#747D91" fontSize={11} />
                <YAxis stroke="#747D91" fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="scans"
                  stroke="#6655EE"
                  fill="#6655EE"
                  fillOpacity={0.14}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* F. Template Showcase */}
      <section aria-labelledby="template-showcase-heading">
        <div className="flex items-center justify-between mb-4">
          <h3
            id="template-showcase-heading"
            className="font-display font-bold text-lg text-[#171B2B] dark:text-[#F5F6FC]"
          >
            Template Showcase
          </h3>
          <button
            type="button"
            onClick={() => navigate('templates')}
            className="px-3 py-1 rounded-full bg-white/65 dark:bg-white/10 border border-white/85 dark:border-white/20 text-xs font-semibold text-[#5538EE] dark:text-[#8B7BFF] hover:border-[#5D4CEB] shadow-xs inline-flex items-center gap-1 transition-colors"
          >
            View All Templates <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-xl border border-white/85 dark:border-[#29344B] studio-card p-4 flex flex-col items-center text-center"
            >
              <QRPreviewCard data={tpl.sampleValue} style={tpl.style} size={136} bordered={false} />
              <div className="mt-3 font-semibold text-sm text-[#171B2B] dark:text-[#F5F6FC]">
                {tpl.name}
              </div>
              <div className="text-xs text-[#747D91] dark:text-[#A4ADC1] mt-0.5">
                {tpl.category}
              </div>
              <button
                type="button"
                onClick={() => openInGenerator({ style: tpl.style, type: tpl.sampleType })}
                className="mt-3 w-full py-2 text-xs font-semibold rounded-lg border border-[#E5E8F0] dark:border-[#29344B] hover:border-[#6655EE] hover:text-[#6655EE] dark:hover:text-[#8978FF] transition-colors"
              >
                Use Template
              </button>
            </div>
          ))}
        </div>
      </section>

      {exportTarget && (
        <ExportModal
          open={Boolean(exportTarget)}
          onClose={() => setExportTarget(null)}
          qrId={exportTarget.id}
          qrName={exportTarget.name}
          qrType={exportTarget.type}
          encodedValue={exportTarget.encodedValue}
          style={exportTarget.style}
        />
      )}
    </div>
  );
};
