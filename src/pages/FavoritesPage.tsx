import React, { useState } from 'react';
import { Download, Edit3, Heart, Layers } from 'lucide-react';
import { useStudio } from '../hooks/useStudioState';
import { QR_TEMPLATES } from '../data/templates';
import type { QRRecord } from '../types/qr';
import { QRPreviewCard } from '../components/shared/QRPreviewCard';
import { ExportModal } from '../components/shared/ExportModal';
import { EmptyState } from '../components/shared/EmptyState';

export const FavoritesPage: React.FC = () => {
  const {
    qrs,
    favoriteTemplateIds,
    toggleFavoriteQR,
    toggleFavoriteTemplate,
    openInGenerator,
    navigate,
  } = useStudio();

  const [exportTarget, setExportTarget] = useState<QRRecord | null>(null);

  const favQRs = qrs.filter((q) => q.favorite);
  const favTemplates = QR_TEMPLATES.filter((t) => favoriteTemplateIds.includes(t.id));

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display font-bold text-2xl text-[#171B2B] dark:text-[#F5F6FC]">
          Favorites
        </h2>
        <p className="text-sm text-[#747D91] dark:text-[#A4ADC1] mt-1">
          Quick access to your starred QR codes and go-to design templates.
        </p>
      </div>

      {/* Favorited QR Codes */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-lg">Favorite QR Codes ({favQRs.length})</h3>
        {favQRs.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No favorite QR codes yet"
            description="Mark any saved QR code with a heart icon in My QR Codes to keep it pinned here."
            actionLabel="Browse My QR Codes"
            onAction={() => navigate('library')}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {favQRs.map((qr) => (
              <div
                key={qr.id}
                className="rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-5 flex flex-col"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm truncate">{qr.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${qr.name} from favorites`}
                    onClick={() => void toggleFavoriteQR(qr.id)}
                    className="p-1.5 rounded-lg text-rose-500 bg-rose-50 dark:bg-rose-950/30"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                </div>
                <div className="flex justify-center py-2">
                  <QRPreviewCard data={qr.encodedValue} style={qr.style} size={148} />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExportTarget(qr)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg bg-[#6655EE] text-white"
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
                    className="px-3 py-2 text-xs font-medium rounded-lg border border-[#E5E8F0] dark:border-[#29344B]"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Favorited Templates */}
      <section className="space-y-4">
        <h3 className="font-display font-bold text-lg">
          Favorite Templates ({favTemplates.length})
        </h3>
        {favTemplates.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No favorite templates yet"
            description="Favorite templates in the gallery to apply your brand styles in one click."
            actionLabel="Explore Templates"
            onAction={() => navigate('templates')}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {favTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="rounded-2xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] p-5 flex flex-col"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-sm truncate">{tpl.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${tpl.name} from favorites`}
                    onClick={() => toggleFavoriteTemplate(tpl.id)}
                    className="p-1.5 rounded-lg text-rose-500 bg-rose-50 dark:bg-rose-950/30"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                  </button>
                </div>
                <div className="flex justify-center py-2">
                  <QRPreviewCard data={tpl.sampleValue} style={tpl.style} size={148} />
                </div>
                <button
                  type="button"
                  onClick={() => openInGenerator({ style: tpl.style, type: tpl.sampleType })}
                  className="mt-4 w-full py-2 text-xs font-semibold rounded-lg bg-[#6655EE] text-white"
                >
                  Apply Template
                </button>
              </div>
            ))}
          </div>
        )}
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
