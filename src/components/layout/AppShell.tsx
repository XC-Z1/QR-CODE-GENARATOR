import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Activity,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  Folder,
  HelpCircle,
  Heart,
  Home,
  Image as ImageIcon,
  Layers,
  Menu,
  Moon,
  Plus,
  QrCode,
  Scan,
  Search,
  Settings2,
  Sun,
  X,
} from 'lucide-react';
import type { NavRoute } from '../../types/qr';
import { useStudio } from '../../hooks/useStudioState';
import { QR_CONTENT_TYPES } from '../../data/qrContentTypes';
import { QR_TEMPLATES } from '../../data/templates';
import { OfflineBanner } from '../shared/OfflineBanner';

interface NavGroup {
  label: string;
  items: Array<{
    id: NavRoute;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'OVERVIEW',
    items: [{ id: 'dashboard', label: 'Home', icon: Home }],
  },
  {
    label: 'CREATE',
    items: [
      { id: 'generator', label: 'QR Generator', icon: QrCode },
      { id: 'image-to-qr', label: 'Image to QR', icon: ImageIcon },
      { id: 'templates', label: 'QR Templates', icon: Layers },
      { id: 'scanner', label: 'QR Scanner', icon: Scan },
    ],
  },
  {
    label: 'LIBRARY',
    items: [
      { id: 'library', label: 'My QR Codes', icon: Folder },
      { id: 'favorites', label: 'Favorites', icon: Heart },
      { id: 'activity', label: 'Recent Activity', icon: Activity },
    ],
  },
  {
    label: 'INSIGHTS',
    items: [{ id: 'analytics', label: 'Analytics', icon: ChartNoAxesCombined }],
  },
  {
    label: 'PREFERENCES',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings2 },
      { id: 'help', label: 'Help Center', icon: HelpCircle },
    ],
  },
];

const ROUTE_TITLES: Record<NavRoute, string> = {
  dashboard: 'Dashboard',
  generator: 'QR Generator',
  'image-to-qr': 'Image to QR',
  templates: 'QR Templates',
  scanner: 'QR Scanner',
  library: 'My QR Codes',
  favorites: 'Favorites',
  activity: 'Recent Activity',
  analytics: 'Analytics',
  settings: 'Settings',
  help: 'Help Center',
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    route,
    navigate,
    qrs,
    settings,
    setTheme,
    openInGenerator,
  } = useStudio();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  const isDark =
    settings.theme === 'dark' ||
    (settings.theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    const matchedQrs = qrs
      .filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.encodedValue.toLowerCase().includes(q) ||
          item.type.toLowerCase().includes(q)
      )
      .slice(0, 4);
    const matchedTypes = QR_CONTENT_TYPES.filter(
      (t) => t.label.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    ).slice(0, 4);
    const matchedTemplates = QR_TEMPLATES.filter(
      (t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    ).slice(0, 3);
    return { matchedQrs, matchedTypes, matchedTemplates };
  }, [searchQuery, qrs]);

  const handleNav = (id: NavRoute) => {
    navigate(id);
    setMobileMenuOpen(false);
    setSearchFocused(false);
  };

  return (
    <div className="min-h-screen flex light-app-bg dark:bg-[#090E1A] text-[#0F172A] dark:text-[#F4F7FF] transition-colors">
      {/* Desktop Collapsible Sidebar */}
      <aside
        aria-label="Primary navigation"
        className={`hidden lg:flex flex-col shrink-0 border-r border-white/80 dark:border-[#232F4A] studio-chrome bg-white/60 dark:bg-[#11192C] backdrop-blur-xl sticky top-0 h-screen transition-[width] duration-200 ${
          collapsed ? 'w-[74px]' : 'w-[248px]'
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-[#E2E7F2] dark:border-[#232F4A]">
          <button
            type="button"
            onClick={() => handleNav('dashboard')}
            className="flex items-center gap-2.5 min-w-0 text-left"
          >
            <div className="w-8 h-8 rounded-lg studio-btn-primary text-white flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            {!collapsed && (
              <span className="font-display font-bold text-sm tracking-tight text-[#171B2B] dark:text-[#F5F6FC] whitespace-nowrap truncate">
                QR Code Generator
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg text-[#747D91] hover:text-[#171B2B] dark:hover:text-[#F5F6FC] hover:bg-[#F0F2F8] dark:hover:bg-[#19243A] transition-colors shrink-0"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <div className="px-2.5 mb-1.5 text-[11px] font-semibold tracking-wider text-[#747D91] dark:text-[#A4ADC1]">
                  {group.label}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = route === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNav(item.id)}
                      title={collapsed ? item.label : undefined}
                      aria-current={active ? 'page' : undefined}
                      className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-[#6655EE]/10 dark:bg-[#8978FF]/15 text-[#6655EE] dark:text-[#8978FF] font-semibold'
                          : 'text-[#747D91] dark:text-[#A4ADC1] hover:text-[#171B2B] dark:hover:text-[#F5F6FC] hover:bg-[#F0F2F8] dark:hover:bg-[#19243A]'
                      } ${collapsed ? 'justify-center px-0' : ''}`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-14 lg:h-16 px-4 lg:px-8 border-b border-white/80 dark:border-[#232F4A] studio-chrome bg-white/60 dark:bg-[#11192C]/90 backdrop-blur-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden w-9 h-9 rounded-xl border border-[#5D4CEB]/18 dark:border-[#232F4A] bg-white/85 dark:bg-[#17223B] hover:border-[#5D4CEB] dark:hover:border-[#8B7BFF] shadow-[0_2px_10px_-3px_rgba(85,56,238,0.16)] text-[#171B2B] dark:text-[#F4F7FF] transition-colors flex items-center justify-center shrink-0"
            >
              <Menu className="w-[18px] h-[18px]" />
            </button>
            <div className="flex items-center gap-2 min-w-0 text-sm">
              <span className="hidden sm:inline text-[#747D91] dark:text-[#A4ADC1]">Studio</span>
              <span className="hidden sm:inline text-[#747D91] dark:text-[#A4ADC1]">/</span>
              <h1 className="font-display font-bold text-base text-[#171B2B] dark:text-[#F5F6FC] truncate">
                {ROUTE_TITLES[route]}
              </h1>
            </div>
          </div>

          {/* Global Search */}
          <div className="relative hidden md:block flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#747D91] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search QR codes, templates, or formats..."
              aria-label="Global workspace search"
              className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA] dark:bg-[#0C1120] text-[#171B2B] dark:text-[#F5F6FC] placeholder:text-[#747D91] focus:outline-none focus:ring-2 focus:ring-[#6655EE]"
            />

            {searchFocused && searchResults && (
              <div className="absolute left-0 right-0 top-full mt-2 rounded-xl bg-white dark:bg-[#121A2D] border border-[#E5E8F0] dark:border-[#29344B] shadow-xl p-2 z-50 max-h-80 overflow-y-auto">
                {searchResults.matchedQrs.length === 0 &&
                searchResults.matchedTypes.length === 0 &&
                searchResults.matchedTemplates.length === 0 ? (
                  <div className="px-3 py-4 text-xs text-center text-[#747D91] dark:text-[#A4ADC1]">
                    No matching QR codes, types, or templates found.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchResults.matchedQrs.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-[11px] font-semibold text-[#747D91]">
                          Saved QR Codes
                        </div>
                        {searchResults.matchedQrs.map((qr) => (
                          <button
                            key={qr.id}
                            type="button"
                            onMouseDown={() => {
                              openInGenerator({
                                editRecordId: qr.id,
                                type: qr.type,
                                fields: qr.fields,
                                style: qr.style,
                                name: qr.name,
                              });
                              setSearchQuery('');
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-[#F0F2F8] dark:hover:bg-[#19243A] flex items-center justify-between"
                          >
                            <span className="font-medium truncate">{qr.name}</span>
                            <span className="text-[#747D91] ml-2 shrink-0">{qr.type}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.matchedTypes.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-[11px] font-semibold text-[#747D91]">
                          Content Types
                        </div>
                        {searchResults.matchedTypes.map((spec) => (
                          <button
                            key={spec.type}
                            type="button"
                            onMouseDown={() => {
                              openInGenerator({ type: spec.type });
                              setSearchQuery('');
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-[#F0F2F8] dark:hover:bg-[#19243A] flex items-center justify-between"
                          >
                            <span className="font-medium">{spec.label}</span>
                            <span className="text-[#747D91]">{spec.category}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.matchedTemplates.length > 0 && (
                      <div>
                        <div className="px-2 py-1 text-[11px] font-semibold text-[#747D91]">
                          Templates
                        </div>
                        {searchResults.matchedTemplates.map((tpl) => (
                          <button
                            key={tpl.id}
                            type="button"
                            onMouseDown={() => {
                              openInGenerator({ style: tpl.style, type: tpl.sampleType });
                              setSearchQuery('');
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-[#F0F2F8] dark:hover:bg-[#19243A] flex items-center justify-between"
                          >
                            <span className="font-medium">{tpl.name}</span>
                            <span className="text-[#747D91]">{tpl.category}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Header Controls (No Login/Account Controls) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Dark mode active, switch to light theme' : 'Light mode active, switch to dark theme'}
              title={isDark ? 'Dark Mode (Click for Light)' : 'Light Mode (Click for Dark)'}
              className="relative w-9 h-9 rounded-xl border border-[#5D4CEB]/18 dark:border-[#232F4A] bg-white/85 dark:bg-[#17223B] hover:border-[#5D4CEB] dark:hover:border-[#8B7BFF] shadow-[0_2px_10px_-3px_rgba(85,56,238,0.18)] transition-colors flex items-center justify-center overflow-hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.span
                    key="moon"
                    initial={{ rotate: -90, scale: 0.6, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: 90, scale: 0.6, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-center text-[#8B7BFF]"
                  >
                    <Moon className="w-4 h-4" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="sun"
                    initial={{ rotate: 90, scale: 0.6, opacity: 0 }}
                    animate={{ rotate: 0, scale: 1, opacity: 1 }}
                    exit={{ rotate: -90, scale: 0.6, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-center text-amber-500"
                  >
                    <Sun className="w-4 h-4" />
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <button
              type="button"
              onClick={() => openInGenerator({ type: 'url' })}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-full studio-btn-primary text-white transition-all whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create QR</span>
            </button>
          </div>
        </header>

        {/* Main Workspace Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-10 max-w-[1600px] w-full mx-auto">
          <OfflineBanner />
          {children}
        </main>
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-[#0D1224]/38 dark:bg-black/60 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-[280px] max-w-[84vw] studio-chrome bg-white/80 dark:bg-[#0D1426]/94 backdrop-blur-2xl h-full border-r border-white/85 dark:border-[#232F4A] shadow-[20px_0_48px_-14px_rgba(58,45,160,0.28)] flex flex-col overflow-hidden"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-12 w-44 h-44 rounded-full bg-[#6655EE]/14 dark:bg-[#8B7BFF]/14 blur-2xl"
              />
              <div className="relative h-16 px-4 flex items-center justify-between border-b border-white/80 dark:border-[#232F4A]">
                <button
                  type="button"
                  onClick={() => handleNav('dashboard')}
                  className="flex items-center gap-2.5 min-w-0 text-left"
                >
                  <div className="w-8 h-8 rounded-xl studio-btn-primary text-white flex items-center justify-center shrink-0">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <span className="font-display font-bold text-sm tracking-tight text-[#171B2B] dark:text-[#F5F6FC] truncate">
                    QR Code Generator
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="w-8 h-8 rounded-xl border border-[#5D4CEB]/15 dark:border-[#232F4A] bg-white/75 dark:bg-[#17223B] text-[#5C667E] dark:text-[#A4ADC1] hover:text-[#171B2B] dark:hover:text-[#F4F7FF] hover:border-[#5D4CEB] flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="relative flex-1 overflow-y-auto px-3 py-4 space-y-5">
                {NAV_GROUPS.map((group) => (
                  <div key={group.label}>
                    <div className="px-2.5 mb-1.5 text-[11px] font-semibold tracking-wider text-[#647087] dark:text-[#A4ADC1]">
                      {group.label}
                    </div>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const active = route === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleNav(item.id)}
                            aria-current={active ? 'page' : undefined}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                              active
                                ? 'bg-gradient-to-r from-[#5D4CEB]/14 to-[#8874FF]/8 dark:from-[#8B7BFF]/20 dark:to-[#8B7BFF]/8 border border-[#5D4CEB]/20 dark:border-[#8B7BFF]/25 text-[#5538EE] dark:text-[#8B7BFF] font-semibold shadow-xs'
                                : 'text-[#4B556E] dark:text-[#A4ADC1] font-medium hover:bg-white/60 dark:hover:bg-[#19243A]'
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Mobile bottom navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 studio-chrome bg-white/68 dark:bg-[#11192C]/92 backdrop-blur-xl border-t border-white/85 dark:border-[#232F4A] shadow-[0_-8px_28px_-10px_rgba(85,56,238,0.14)] grid grid-cols-5 items-center px-1.5"
      >
        {[
          { id: 'dashboard' as NavRoute, label: 'Home', icon: Home, isHome: true },
          { id: 'generator' as NavRoute, label: 'Create', icon: QrCode, isHome: false },
          { id: 'scanner' as NavRoute, label: 'Scan', icon: Scan, isHome: false },
          { id: 'library' as NavRoute, label: 'Library', icon: Folder, isHome: false },
        ].map((item) => {
          const Icon = item.icon;
          const active = route === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[46px] rounded-xl text-[11px] transition-colors ${
                active
                  ? 'text-[#5538EE] dark:text-[#8B7BFF] font-bold'
                  : 'text-[#647087] dark:text-[#9AA6C0] font-medium hover:text-[#171B2B] dark:hover:text-[#F4F7FF]'
              }`}
            >
              <Icon
                className={`w-[19px] h-[19px] transition-transform ${
                  active && item.isHome
                    ? 'fill-[#5538EE]/20 dark:fill-[#8B7BFF]/25 stroke-[2.25]'
                    : active
                    ? 'stroke-[2.2]'
                    : 'stroke-[1.9]'
                }`}
              />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[46px] rounded-xl text-[11px] font-medium text-[#647087] dark:text-[#9AA6C0] hover:text-[#171B2B] dark:hover:text-[#F4F7FF]"
        >
          <Menu className="w-[19px] h-[19px] stroke-[1.9]" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
};
