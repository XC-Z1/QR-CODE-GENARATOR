import React, { useMemo, useState } from 'react';
import { Activity, History, Search, Trash2 } from 'lucide-react';
import { useStudio } from '../hooks/useStudioState';
import type { ActivityType } from '../types/qr';
import { EmptyState } from '../components/shared/EmptyState';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';

export const ActivityPage: React.FC = () => {
  const { activity, clearActivityHistory, navigate, pushToast } = useStudio();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ActivityType>('all');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return activity.filter((ev) => {
      const typeOk = typeFilter === 'all' || ev.type === typeFilter;
      const textOk =
        !q || ev.detail.toLowerCase().includes(q) || ev.qrName.toLowerCase().includes(q);
      return typeOk && textOk;
    });
  }, [activity, search, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-[#171B2B] dark:text-[#F5F6FC]">
            Recent Activity
          </h2>
          <p className="text-sm text-[#747D91] dark:text-[#A4ADC1] mt-1">
            Chronological log of locally generated, exported, scanned, and modified QR codes.
          </p>
        </div>

        {activity.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Activity
          </button>
        )}
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-[#747D91] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter activity log..."
            aria-label="Search activity history"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120]"
          />
        </div>

        <select
          aria-label="Filter activity by event type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as 'all' | ActivityType)}
          className="px-3 py-2 text-xs font-medium rounded-xl border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120]"
        >
          <option value="all">All Events</option>
          <option value="created">Created</option>
          <option value="updated">Updated</option>
          <option value="downloaded">Downloaded</option>
          <option value="scanned">Scanned</option>
          <option value="duplicated">Duplicated</option>
          <option value="deleted">Deleted</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title="No activity recorded"
          description="Your workspace actions—creating, editing, exporting, and scanning QR codes—will be logged here."
          actionLabel="Open QR Generator"
          onAction={() => navigate('generator')}
        />
      ) : (
        <div className="rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] divide-y divide-[#E5E8F0] dark:divide-[#29344B]">
          {filtered.map((ev) => (
            <div key={ev.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#F0F2F8] dark:bg-[#19243A] text-[#6655EE] dark:text-[#8978FF] flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#171B2B] dark:text-[#F5F6FC] truncate">
                    {ev.detail}
                  </div>
                  <div className="text-xs text-[#747D91] dark:text-[#A4ADC1]">
                    {ev.qrName} · {ev.type.replace('_', ' ')}
                  </div>
                </div>
              </div>
              <div className="text-xs text-[#747D91] dark:text-[#A4ADC1] tabular-nums shrink-0">
                {new Date(ev.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Clear Activity History"
        description="This permanently removes your local workspace activity log. Saved QR codes are not affected."
        confirmLabel="Clear Activity"
        onConfirm={() => {
          void clearActivityHistory();
          setConfirmOpen(false);
          pushToast({ title: 'Activity history cleared', variant: 'info' });
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};
