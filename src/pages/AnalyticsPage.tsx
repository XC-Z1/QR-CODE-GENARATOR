import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartNoAxesCombined, ExternalLink, QrCode, Radio, RefreshCw } from 'lucide-react';
import { useStudio } from '../hooks/useStudioState';
import { getContentTypeSpec } from '../data/qrContentTypes';
import { EmptyState } from '../components/shared/EmptyState';

const CHART_COLORS = ['#6655EE', '#3984F6', '#8874FF', '#10B981', '#F59E0B', '#64748B'];

export const AnalyticsPage: React.FC = () => {
  const {
    qrs,
    analyticsSummary,
    backendHealth,
    refreshBackendData,
    openInGenerator,
  } = useStudio();

  const typeDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const qr of qrs) {
      const label = getContentTypeSpec(qr.type).shortLabel;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [qrs]);

  const scanStats = useMemo(() => {
    const scans = analyticsSummary?.recentScans ?? [];
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const todayStr = new Date().toISOString().slice(0, 10);

    const daily = scans.filter((s) => s.timestamp.slice(0, 10) === todayStr).length;
    const weekly = scans.filter((s) => now - new Date(s.timestamp).getTime() <= 7 * dayMs).length;
    const monthly = scans.filter((s) => now - new Date(s.timestamp).getTime() <= 30 * dayMs).length;

    return {
      total: analyticsSummary?.totalDynamicScans ?? 0,
      daily,
      weekly,
      monthly,
      topQr: analyticsSummary?.topDynamicQRs?.[0] ?? null,
    };
  }, [analyticsSummary]);

  const dailySeries = analyticsSummary?.dailyScans ?? [];
  const topQRs = analyticsSummary?.topDynamicQRs ?? [];
  const recentScans = analyticsSummary?.recentScans ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-[#171B2B] dark:text-[#F5F6FC]">
            Analytics
          </h2>
          <p className="text-sm text-[#747D91] dark:text-[#A4ADC1] mt-1">
            Verified scan performance from active dynamic QR redirect links and local library composition.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refreshBackendData()}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border border-[#E5E8F0] dark:border-[#29344B] bg-white dark:bg-[#121A2D] hover:border-[#6655EE] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Telemetry
        </button>
      </div>

      {!backendHealth.ok && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
          Dynamic QR backend tracking is unavailable while offline. Only locally saved QR library breakdowns are displayed until reconnected.
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Scans', value: scanStats.total },
          { label: 'Daily Scans', value: scanStats.daily },
          { label: 'Weekly Scans', value: scanStats.weekly },
          { label: 'Monthly Scans', value: scanStats.monthly },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-5"
          >
            <div className="text-xs font-semibold text-[#747D91] dark:text-[#A4ADC1]">{m.label}</div>
            <div className="mt-2 font-display font-bold text-2xl text-[#171B2B] dark:text-[#F5F6FC] tabular-nums">
              {m.value}
            </div>
          </div>
        ))}

        <div className="col-span-2 lg:col-span-1 rounded-xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-5">
          <div className="text-xs font-semibold text-[#747D91] dark:text-[#A4ADC1]">
            Top Performing QR
          </div>
          <div className="mt-2 font-semibold text-sm text-[#171B2B] dark:text-[#F5F6FC] truncate">
            {scanStats.topQr ? scanStats.topQr.name : 'No scans yet'}
          </div>
          <div className="text-xs text-[#6655EE] dark:text-[#8978FF] tabular-nums mt-0.5">
            {scanStats.topQr ? `${scanStats.topQr.scanCount} scans` : '—'}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Performance Timeline (Line Chart) */}
        <section className="lg:col-span-8 rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-6">
          <h3 className="font-display font-bold text-base mb-1">Performance Timeline</h3>
          <p className="text-xs text-[#747D91] dark:text-[#A4ADC1] mb-4">
            Daily scan count recorded across dynamic redirect endpoints.
          </p>

          {dailySeries.length === 0 ? (
            <EmptyState
              icon={ChartNoAxesCombined}
              title="No scan timeline data yet"
              description="Create a Dynamic QR code in the studio and test or share its redirect link to record real scan events."
              actionLabel="Create Dynamic QR"
              onAction={() => openInGenerator({ type: 'url' })}
            />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailySeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E8F0" opacity={0.4} />
                  <XAxis dataKey="date" stroke="#747D91" fontSize={11} />
                  <YAxis stroke="#747D91" fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="scans"
                    stroke="#6655EE"
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* QR Type Distribution (Pie Chart) */}
        <section className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-6">
          <h3 className="font-display font-bold text-base mb-1">QR Type Distribution</h3>
          <p className="text-xs text-[#747D91] dark:text-[#A4ADC1] mb-4">
            Breakdown of saved QR codes by content format.
          </p>

          {typeDistribution.length === 0 ? (
            <EmptyState
              icon={QrCode}
              title="No saved QR codes"
              description="Save QR codes in your library to inspect format distribution."
            />
          ) : (
            <div className="space-y-4">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={42}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {typeDistribution.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-1.5 text-xs">
                {typeDistribution.map((entry, idx) => (
                  <li key={entry.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-sm shrink-0"
                        style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                      />
                      <span>{entry.name}</span>
                    </div>
                    <span className="font-mono tabular-nums font-semibold">{entry.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      {/* Bar Chart: QR Performance & Recent Scan Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-6">
          <h3 className="font-display font-bold text-base mb-1">QR Performance Comparison</h3>
          <p className="text-xs text-[#747D91] dark:text-[#A4ADC1] mb-4">
            Total scans per dynamic QR code.
          </p>

          {topQRs.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#747D91] dark:text-[#A4ADC1]">
              No dynamic QR codes have been created yet.
            </div>
          ) : (
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topQRs}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E8F0" opacity={0.4} />
                  <XAxis dataKey="name" stroke="#747D91" fontSize={11} />
                  <YAxis stroke="#747D91" fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="scanCount" name="Scans" fill="#3984F6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        <section className="lg:col-span-6 rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-6">
          <h3 className="font-display font-bold text-base mb-1">Tracked Redirect Scan History</h3>
          <p className="text-xs text-[#747D91] dark:text-[#A4ADC1] mb-4">
            Verified redirect hits with timestamp and device category.
          </p>

          {recentScans.length === 0 ? (
            <div className="py-10 text-center text-xs text-[#747D91] dark:text-[#A4ADC1]">
              No dynamic QR scans have occurred yet.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E5E8F0] dark:border-[#29344B] text-[#747D91]">
                    <th className="py-2 pr-3">QR Name</th>
                    <th className="py-2 pr-3">Code</th>
                    <th className="py-2 pr-3">Device</th>
                    <th className="py-2 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E8F0] dark:divide-[#29344B]">
                  {recentScans.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2 pr-3 font-medium truncate max-w-[140px]">{s.qrName}</td>
                      <td className="py-2 pr-3 font-mono text-[#6655EE]">
                        <a
                          href={`/r/${s.shortCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          /{s.shortCode} <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-2 pr-3 capitalize">{s.deviceType}</td>
                      <td className="py-2 text-right tabular-nums text-[#747D91]">
                        {new Date(s.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
