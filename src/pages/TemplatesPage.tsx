import React, { useMemo, useState } from 'react';
import { Heart, Layers, Search } from 'lucide-react';
import { QR_TEMPLATES, TEMPLATE_CATEGORIES } from '../data/templates';
import type { TemplateCategory } from '../types/qr';
import { useStudio } from '../hooks/useStudioState';
import { QRPreviewCard } from '../components/shared/QRPreviewCard';
import { EmptyState } from '../components/shared/EmptyState';

export const TemplatesPage: React.FC = () => {
  const { favoriteTemplateIds, toggleFavoriteTemplate, openInGenerator, pushToast } = useStudio();
  const [selectedCategory, setSelectedCategory] = useState<'All' | TemplateCategory>('All');
  const [search, setSearch] = useState('');

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return QR_TEMPLATES.filter((tpl) => {
      const catMatch = selectedCategory === 'All' || tpl.category === selectedCategory;
      const textMatch =
        !q ||
        tpl.name.toLowerCase().includes(q) ||
        tpl.category.toLowerCase().includes(q) ||
        tpl.description.toLowerCase().includes(q);
      return catMatch && textMatch;
    });
  }, [selectedCategory, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-[#171B2B] dark:text-[#F5F6FC]">
            QR Template Gallery
          </h2>
          <p className="text-sm text-[#747D91] dark:text-[#A4ADC1] mt-1">
            Apply production-tested visual presets across patterns, palettes, corners, and frames.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#747D91] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            aria-label="Search templates"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#E5E8F0] dark:border-[#29344B] bg-white dark:bg-[#121A2D] focus:outline-none focus:ring-2 focus:ring-[#6655EE]"
          />
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSelectedCategory('All')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
            selectedCategory === 'All'
              ? 'border-[#6655EE] bg-[#6655EE] text-white'
              : 'border-[#E5E8F0] dark:border-[#29344B] bg-white dark:bg-[#121A2D] text-[#747D91] dark:text-[#A4ADC1] hover:text-[#171B2B] dark:hover:text-[#F5F6FC]'
          }`}
        >
          All Categories
        </button>
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              selectedCategory === cat
                ? 'border-[#6655EE] bg-[#6655EE] text-white'
                : 'border-[#E5E8F0] dark:border-[#29344B] bg-white dark:bg-[#121A2D] text-[#747D91] dark:text-[#A4ADC1] hover:text-[#171B2B] dark:hover:text-[#F5F6FC]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredTemplates.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No templates found"
          description="Try clearing your search query or switching to All Categories."
          actionLabel="Reset Filters"
          onAction={() => {
            setSelectedCategory('All');
            setSearch('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredTemplates.map((tpl) => {
            const isFav = favoriteTemplateIds.includes(tpl.id);
            return (
              <div
                key={tpl.id}
                className="group rounded-2xl bg-white dark:bg-[#11192C] border border-[#E2E7F2] dark:border-[#232F4A] studio-card hover:border-[#5D4CEB] dark:hover:border-[#8B7BFF] hover:-translate-y-0.5 p-5 flex flex-col transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[#747D91] dark:text-[#A4ADC1]">
                    {tpl.category}
                  </span>
                  <button
                    type="button"
                    aria-label={isFav ? `Unfavorite ${tpl.name}` : `Favorite ${tpl.name}`}
                    onClick={() => toggleFavoriteTemplate(tpl.id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isFav
                        ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/30'
                        : 'text-[#747D91] hover:text-rose-500 hover:bg-[#F0F2F8] dark:hover:bg-[#19243A]'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="flex justify-center py-2">
                  <QRPreviewCard
                    data={tpl.sampleValue}
                    style={tpl.style}
                    size={168}
                    bordered={false}
                    alt={`${tpl.name} template preview`}
                  />
                </div>

                <div className="mt-4 flex-1">
                  <h3 className="font-display font-bold text-base text-[#171B2B] dark:text-[#F5F6FC]">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-[#747D91] dark:text-[#A4ADC1] mt-1 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    openInGenerator({
                      style: tpl.style,
                      type: tpl.sampleType,
                      name: `${tpl.name} QR`,
                    });
                    pushToast({
                      title: `Applied "${tpl.name}" template`,
                      variant: 'success',
                    });
                  }}
                  className="mt-4 w-full py-2.5 text-xs font-semibold rounded-xl studio-btn-primary text-white transition-all"
                >
                  Apply Template
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
