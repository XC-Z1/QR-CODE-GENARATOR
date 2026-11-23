import React, { useMemo, useState } from 'react';
import {
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Folder,
  Heart,
  LayoutGrid,
  List,
  Plus,
  Radio,
  Search,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import { useStudio } from '../hooks/useStudioState';
import { getContentTypeSpec } from '../data/qrContentTypes';
import type { DynamicQRServerRecord, QRRecord } from '../types/qr';
import { apiService } from '../services/apiService';
import { isSafeHttpUrl } from '../utils/qrValidation';
import { QRPreviewCard } from '../components/shared/QRPreviewCard';
import { ExportModal } from '../components/shared/ExportModal';
import { EmptyState } from '../components/shared/EmptyState';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';

export const LibraryPage: React.FC = () => {
  const {
    qrs,
    dynamicRecords,
    backendHealth,
    openInGenerator,
    deleteQR,
    duplicateQR,
    renameQR,
    toggleFavoriteQR,
    refreshBackendData,
    pushToast,
  } = useStudio();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'static' | 'dynamic'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  const [exportTarget, setExportTarget] = useState<QRRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<QRRecord | null>(null);
  const [renameTarget, setRenameTarget] = useState<QRRecord | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [dynamicModalQr, setDynamicModalQr] = useState<QRRecord | null>(null);
  const [dynDestInput, setDynDestInput] = useState('');
  const [dynExpiryInput, setDynExpiryInput] = useState('');
  const [dynSaving, setDynSaving] = useState(false);

  const filteredQRs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = qrs.filter((item) => {
      const matchesMode = modeFilter === 'all' || item.mode === modeFilter;
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.encodedValue.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q);
      return matchesMode && matchesSearch;
    });

    return list.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [qrs, search, modeFilter, sortBy]);

  const activeDynamicDetails: DynamicQRServerRecord | undefined = dynamicModalQr?.dynamicId
    ? dynamicRecords.find((d) => d.id === dynamicModalQr.dynamicId)
    : undefined;

  const openDynamicManager = (qr: QRRecord) => {
    const serverRec = dynamicRecords.find((d) => d.id === qr.dynamicId);
    setDynamicModalQr(qr);
    setDynDestInput(serverRec?.destinationUrl ?? qr.destinationUrl ?? '');
    setDynExpiryInput(
      (serverRec?.expiresAt ?? qr.expiresAt)
        ? String(serverRec?.expiresAt ?? qr.expiresAt).slice(0, 16)
        : ''
    );
  };

  const handleSaveDynamicSettings = async (toggleActive?: boolean) => {
    if (!dynamicModalQr?.dynamicId) return;
    if (!isSafeHttpUrl(dynDestInput)) {
      pushToast({
        title: 'Invalid destination URL',
        description: 'Destination must start with https:// or http://.',
        variant: 'error',
      });
      return;
    }
    setDynSaving(true);
    try {
      await apiService.updateDynamicQR(dynamicModalQr.dynamicId, {
        destinationUrl: dynDestInput.trim(),
        active:
          toggleActive !== undefined
            ? toggleActive
            : activeDynamicDetails?.active ?? dynamicModalQr.active ?? true,
        expiresAt: dynExpiryInput ? new Date(dynExpiryInput).toISOString() : null,
      });
      await refreshBackendData();
      pushToast({ title: 'Dynamic redirect settings updated', variant: 'success' });
    } catch (err) {
      pushToast({
        title: 'Failed to update dynamic QR',
        description: err instanceof Error ? err.message : 'Backend unavailable.',
        variant: 'error',
      });
    } finally {
      setDynSaving(false);
    }
  };

  const handleShareQR = async (qr: QRRecord) => {
    try {
      if (navigator.share) {
        await navigator.share({ title: qr.name, text: qr.encodedValue });
      } else {
        await navigator.clipboard.writeText(qr.encodedValue);
        pushToast({ title: 'QR payload copied to clipboard', variant: 'success' });
      }
    } catch {
      // user canceled share
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-[#171B2B] dark:text-[#F5F6FC]">
            My QR Codes
          </h2>
          <p className="text-sm text-[#747D91] dark:text-[#A4ADC1] mt-1">
            Manage, rename, duplicate, export, and configure your locally saved static and dynamic QR codes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openInGenerator({ type: 'url' })}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-[#6655EE] hover:bg-[#5645DD] text-white transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          New QR Code
        </button>
      </div>

      {/* Filter & View Bar */}
      <div className="rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[220px]">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-4 h-4 text-[#747D91] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, URL, or type..."
              aria-label="Search QR library"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120] focus:outline-none focus:ring-2 focus:ring-[#6655EE]"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F0F2F8] dark:bg-[#0C1120] border border-[#E5E8F0] dark:border-[#29344B]">
            {(['all', 'static', 'dynamic'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModeFilter(m)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  modeFilter === m
                    ? 'bg-white dark:bg-[#19243A] text-[#6655EE] dark:text-[#8978FF] shadow-xs'
                    : 'text-[#747D91] dark:text-[#A4ADC1]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            aria-label="Sort QR codes"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A–Z)</option>
          </select>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F0F2F8] dark:bg-[#0C1120] border border-[#E5E8F0] dark:border-[#29344B]">
            <button
              type="button"
              aria-label="Grid view"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#19243A] text-[#6655EE]'
                  : 'text-[#747D91]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="List view"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-[#19243A] text-[#6655EE]'
                  : 'text-[#747D91]'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {filteredQRs.length === 0 ? (
        <EmptyState
          icon={Folder}
          title={qrs.length === 0 ? 'Your QR library is empty' : 'No matching QR codes'}
          description={
            qrs.length === 0
              ? 'Create and save a QR code in the studio to organize, duplicate, and export it anytime.'
              : 'Try adjusting your search terms or clearing the mode filter.'
          }
          actionLabel={qrs.length === 0 ? 'Create QR Code' : 'Clear Filters'}
          onAction={() => {
            if (qrs.length === 0) {
              openInGenerator({ type: 'url' });
            } else {
              setSearch('');
              setModeFilter('all');
            }
          }}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredQRs.map((qr) => {
            const spec = getContentTypeSpec(qr.type);
            const dynInfo = qr.dynamicId
              ? dynamicRecords.find((d) => d.id === qr.dynamicId)
              : undefined;
            const scanCount = dynInfo?.scanCount ?? qr.scanCount ?? 0;

            return (
              <div
                key={qr.id}
                className="rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-5 flex flex-col"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm text-[#171B2B] dark:text-[#F5F6FC] truncate">
                      {qr.name}
                    </h3>
                    <div className="text-xs text-[#747D91] dark:text-[#A4ADC1] mt-0.5 truncate">
                      {spec.shortLabel} · {qr.mode === 'dynamic' ? `Dynamic (${scanCount} scans)` : 'Static'}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={qr.favorite ? `Unfavorite ${qr.name}` : `Favorite ${qr.name}`}
                    onClick={() => void toggleFavoriteQR(qr.id)}
                    className={`p-1.5 rounded-lg shrink-0 ${
                      qr.favorite
                        ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/30'
                        : 'text-[#747D91] hover:text-rose-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${qr.favorite ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="flex justify-center py-2">
                  <QRPreviewCard data={qr.encodedValue} style={qr.style} size={156} bordered={false} />
                </div>

                <div className="mt-2 text-[11px] font-mono text-[#747D91] dark:text-[#A4ADC1] truncate">
                  {qr.encodedValue}
                </div>

                <div className="mt-4 pt-3 border-t border-[#E5E8F0] dark:border-[#29344B] flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setExportTarget(qr)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#6655EE] hover:bg-[#5645DD] text-white transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
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
                    className="p-1.5 rounded-lg border border-[#E5E8F0] dark:border-[#29344B] hover:border-[#6655EE]"
                    aria-label={`Edit ${qr.name}`}
                    title="Edit in studio"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRenameTarget(qr);
                      setRenameValue(qr.name);
                    }}
                    className="px-2 py-1.5 text-xs font-medium rounded-lg border border-[#E5E8F0] dark:border-[#29344B] hover:border-[#6655EE]"
                    title="Rename"
                  >
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void duplicateQR(qr);
                      pushToast({ title: 'QR duplicated', variant: 'success' });
                    }}
                    className="p-1.5 rounded-lg border border-[#E5E8F0] dark:border-[#29344B] hover:border-[#6655EE]"
                    aria-label={`Duplicate ${qr.name}`}
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {qr.mode === 'dynamic' && (
                    <button
                      type="button"
                      onClick={() => openDynamicManager(qr)}
                      className="p-1.5 rounded-lg border border-[#6655EE]/40 text-[#6655EE] dark:text-[#8978FF] hover:bg-[#6655EE]/10"
                      aria-label={`Manage dynamic redirect for ${qr.name}`}
                      title="Dynamic Redirect Controls"
                    >
                      <Radio className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void handleShareQR(qr)}
                    className="p-1.5 rounded-lg border border-[#E5E8F0] dark:border-[#29344B] hover:border-[#6655EE]"
                    aria-label={`Share ${qr.name}`}
                    title="Share"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(qr)}
                    className="p-1.5 rounded-lg border border-[#E5E8F0] dark:border-[#29344B] text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 ml-auto"
                    aria-label={`Delete ${qr.name}`}
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E8F0] dark:border-[#29344B] text-[11px] font-semibold uppercase tracking-wider text-[#747D91] dark:text-[#A4ADC1]">
                <th className="py-3 px-4">QR Code</th>
                <th className="py-3 px-4">Type & Mode</th>
                <th className="py-3 px-4">Payload</th>
                <th className="py-3 px-4 text-right">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E8F0] dark:divide-[#29344B] text-sm">
              {filteredQRs.map((qr) => {
                const spec = getContentTypeSpec(qr.type);
                return (
                  <tr key={qr.id} className="hover:bg-[#F5F6FA]/70 dark:hover:bg-[#19243A]/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <QRPreviewCard data={qr.encodedValue} style={qr.style} size={48} />
                        <span className="font-semibold text-[#171B2B] dark:text-[#F5F6FC]">
                          {qr.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#747D91] dark:text-[#A4ADC1]">
                      {spec.label} · {qr.mode === 'dynamic' ? 'Dynamic' : 'Static'}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate font-mono text-xs text-[#747D91] dark:text-[#A4ADC1]">
                      {qr.encodedValue}
                    </td>
                    <td className="py-3 px-4 text-right text-xs text-[#747D91] dark:text-[#A4ADC1] tabular-nums">
                      {new Date(qr.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setExportTarget(qr)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#6655EE] text-white"
                        >
                          Export
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
                          className="px-2.5 py-1 text-xs font-medium rounded-lg border border-[#E5E8F0] dark:border-[#29344B]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(qr)}
                          aria-label={`Delete ${qr.name}`}
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Rename Dialog */}
      {renameTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-6 space-y-4">
            <h3 className="font-display font-bold text-base">Rename QR Code</h3>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              aria-label="New QR Code Name"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120]"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-[#E5E8F0] dark:border-[#29344B]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (renameValue.trim()) {
                    void renameQR(renameTarget.id, renameValue);
                    pushToast({ title: 'QR code renamed', variant: 'success' });
                  }
                  setRenameTarget(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#6655EE] text-white"
              >
                Save Name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Redirect Management Modal */}
      {dynamicModalQr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base">Dynamic Redirect Controls</h3>
                <p className="text-xs text-[#747D91] dark:text-[#A4ADC1]">{dynamicModalQr.name}</p>
              </div>
              <button
                type="button"
                aria-label="Close dynamic controls"
                onClick={() => setDynamicModalQr(null)}
                className="p-1.5 rounded-lg text-[#747D91]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!backendHealth.ok ? (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
                Backend connection is currently unavailable. Reconnect to edit dynamic redirect settings.
              </div>
            ) : (
              <>
                <div className="p-3 rounded-xl bg-[#F5F6FA] dark:bg-[#0C1120] border border-[#E5E8F0] dark:border-[#29344B] flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold text-[#747D91]">Permanent Short URL</div>
                    <div className="text-xs font-mono truncate">{dynamicModalQr.shortUrl}</div>
                  </div>
                  {dynamicModalQr.shortUrl && (
                    <a
                      href={dynamicModalQr.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#6655EE] text-white shrink-0"
                    >
                      Test <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Destination URL</label>
                  <input
                    type="url"
                    value={dynDestInput}
                    onChange={(e) => setDynDestInput(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5">Expiration Date (optional)</label>
                  <input
                    type="datetime-local"
                    value={dynExpiryInput}
                    onChange={(e) => setDynExpiryInput(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120]"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E5E8F0] dark:border-[#29344B]">
                  <button
                    type="button"
                    disabled={dynSaving}
                    onClick={() =>
                      void handleSaveDynamicSettings(
                        !(activeDynamicDetails?.active ?? dynamicModalQr.active ?? true)
                      )
                    }
                    className={`px-3.5 py-2 text-xs font-semibold rounded-lg border ${
                      activeDynamicDetails?.active ?? true
                        ? 'border-amber-400 text-amber-700 dark:text-amber-300'
                        : 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {(activeDynamicDetails?.active ?? true) ? 'Pause Redirect' : 'Activate Redirect'}
                  </button>

                  <button
                    type="button"
                    disabled={dynSaving}
                    onClick={() => void handleSaveDynamicSettings()}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#6655EE] text-white"
                  >
                    {dynSaving ? 'Saving...' : 'Update Destination'}
                  </button>
                </div>

                {activeDynamicDetails && activeDynamicDetails.redirectHistory.length > 0 && (
                  <div className="pt-2 border-t border-[#E5E8F0] dark:border-[#29344B]">
                    <div className="text-xs font-semibold mb-2">
                      Redirect History ({activeDynamicDetails.scanCount} total scans)
                    </div>
                    <ul className="space-y-1.5 max-h-36 overflow-y-auto text-xs">
                      {activeDynamicDetails.redirectHistory.map((h, i) => (
                        <li
                          key={i}
                          className="p-2 rounded-lg bg-[#F5F6FA] dark:bg-[#0C1120] font-mono text-[11px] truncate"
                        >
                          {new Date(h.timestamp).toLocaleString()} → {h.newUrl}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

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

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete QR Code"
        description={`Are you sure you want to delete "${deleteTarget?.name ?? ''}"? This cannot be undone.`}
        confirmLabel="Delete QR"
        onConfirm={() => {
          if (deleteTarget) {
            void deleteQR(deleteTarget.id);
            pushToast({ title: 'QR code deleted', variant: 'info' });
          }
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};
