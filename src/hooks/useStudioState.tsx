import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  ActivityEvent,
  AnalyticsSummary,
  AppSettings,
  DynamicQRServerRecord,
  NavRoute,
  QRContentType,
  QRRecord,
  QRStyleConfig,
  ScanHistoryItem,
  ThemePreference,
  ToastMessage,
} from '../types/qr';
import { DEFAULT_APP_SETTINGS } from '../data/qrContentTypes';
import { storageService } from '../services/storageService';
import { apiService, type BackendHealth } from '../services/apiService';

export interface GeneratorDraftIntent {
  type?: QRContentType;
  fields?: Record<string, string>;
  style?: QRStyleConfig;
  name?: string;
  editRecordId?: string;
}

interface StudioContextValue {
  route: NavRoute;
  navigate: (route: NavRoute) => void;
  qrs: QRRecord[];
  activity: ActivityEvent[];
  scans: ScanHistoryItem[];
  favoriteTemplateIds: string[];
  settings: AppSettings;
  backendHealth: BackendHealth;
  backendChecked: boolean;
  isOnline: boolean;
  dynamicRecords: DynamicQRServerRecord[];
  analyticsSummary: AnalyticsSummary | null;
  draftIntent: GeneratorDraftIntent | null;
  clearDraftIntent: () => void;
  openInGenerator: (intent: GeneratorDraftIntent) => void;
  saveQR: (qr: QRRecord, isUpdate?: boolean) => Promise<void>;
  deleteQR: (id: string) => Promise<void>;
  duplicateQR: (qr: QRRecord) => Promise<void>;
  renameQR: (id: string, newName: string) => Promise<void>;
  toggleFavoriteQR: (id: string) => Promise<void>;
  recordDownload: (qrId: string | undefined, qrName: string, qrType: QRContentType | undefined, format: string) => Promise<void>;
  recordActivity: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => Promise<void>;
  clearActivityHistory: () => Promise<void>;
  addScanResult: (item: Omit<ScanHistoryItem, 'id' | 'timestamp'>) => Promise<void>;
  clearScanHistory: () => Promise<void>;
  toggleFavoriteTemplate: (templateId: string) => void;
  updateSettings: (next: AppSettings) => void;
  setTheme: (theme: ThemePreference) => void;
  importWorkspaceData: (qrs: QRRecord[], favTemplates?: string[], nextSettings?: Partial<AppSettings>) => Promise<void>;
  clearAllWorkspaceData: () => Promise<void>;
  refreshBackendData: () => Promise<void>;
  toasts: ToastMessage[];
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const StudioContext = createContext<StudioContextValue | null>(null);

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const StudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [route, setRoute] = useState<NavRoute>('dashboard');
  const [qrs, setQrs] = useState<QRRecord[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [scans, setScans] = useState<ScanHistoryItem[]>([]);
  const [favoriteTemplateIds, setFavoriteTemplateIds] = useState<string[]>(() =>
    storageService.loadFavoriteTemplateIds()
  );
  const [settings, setSettings] = useState<AppSettings>(() => storageService.loadSettings());
  const [backendHealth, setBackendHealth] = useState<BackendHealth>({
    ok: false,
    dynamicEnabled: false,
    imageHostingEnabled: false,
  });
  const [backendChecked, setBackendChecked] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [dynamicRecords, setDynamicRecords] = useState<DynamicQRServerRecord[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [draftIntent, setDraftIntent] = useState<GeneratorDraftIntent | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = makeId();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Apply theme class cleanly to <html>
  useEffect(() => {
    const root = document.documentElement;
    const apply = (mode: 'light' | 'dark') => {
      if (mode === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    if (settings.theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mq.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => apply(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      apply(settings.theme);
    }
  }, [settings.theme]);

  const refreshBackendData = useCallback(async () => {
    const health = await apiService.checkHealth();
    setBackendHealth(health);
    setBackendChecked(true);
    if (health.ok) {
      try {
        const [dyn, analytics] = await Promise.all([
          apiService.listDynamicQRs(),
          apiService.getAnalytics(),
        ]);
        setDynamicRecords(dyn);
        setAnalyticsSummary(analytics);
      } catch {
        // ignore transient error
      }
    }
  }, []);

  // Initial local + backend load
  useEffect(() => {
    let active = true;
    (async () => {
      const [loadedQRs, loadedActivity, loadedScans] = await Promise.all([
        storageService.loadQRs(),
        storageService.loadActivity(),
        storageService.loadScans(),
      ]);
      if (!active) return;
      setQrs(loadedQRs);
      setActivity(loadedActivity);
      setScans(loadedScans);
    })();
    refreshBackendData();

    const handleOnline = () => {
      setIsOnline(true);
      refreshBackendData();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setBackendHealth({ ok: false, dynamicEnabled: false, imageHostingEnabled: false });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      active = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshBackendData]);

  const navigate = useCallback((nextRoute: NavRoute) => {
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const recordActivity = useCallback(
    async (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
      const fullEvent: ActivityEvent = {
        ...event,
        id: makeId(),
        timestamp: new Date().toISOString(),
      };
      setActivity((prev) => {
        const next = [fullEvent, ...prev].slice(0, 300);
        void storageService.addActivity(fullEvent, next);
        return next;
      });
    },
    []
  );

  const saveQR = useCallback(
    async (qr: QRRecord, isUpdate = false) => {
      setQrs((prev) => {
        const exists = prev.some((item) => item.id === qr.id);
        const next = exists
          ? prev.map((item) => (item.id === qr.id ? qr : item))
          : [qr, ...prev];
        void storageService.saveQR(qr, next);
        return next;
      });

      await recordActivity({
        type: isUpdate ? 'updated' : qr.mode === 'dynamic' ? 'dynamic_created' : 'created',
        qrId: qr.id,
        qrName: qr.name,
        qrType: qr.type,
        detail: isUpdate
          ? `Updated configuration for "${qr.name}"`
          : `Created ${qr.mode === 'dynamic' ? 'dynamic' : 'static'} QR "${qr.name}"`,
      });
      if (qr.mode === 'dynamic') {
        void refreshBackendData();
      }
    },
    [recordActivity, refreshBackendData]
  );

  const deleteQR = useCallback(
    async (id: string) => {
      const target = qrs.find((q) => q.id === id);
      const remaining = qrs.filter((q) => q.id !== id);
      setQrs(remaining);
      await storageService.deleteQR(id, remaining);
      if (target?.mode === 'dynamic' && target.dynamicId && backendHealth.ok) {
        try {
          await apiService.deleteDynamicQR(target.dynamicId);
          void refreshBackendData();
        } catch {
          // ignore if already removed on server
        }
      }
      if (target) {
        await recordActivity({
          type: 'deleted',
          qrId: id,
          qrName: target.name,
          qrType: target.type,
          detail: `Deleted "${target.name}" from library`,
        });
      }
    },
    [qrs, backendHealth.ok, recordActivity, refreshBackendData]
  );

  const duplicateQR = useCallback(
    async (qr: QRRecord) => {
      const now = new Date().toISOString();
      const copy: QRRecord = {
        ...qr,
        id: makeId(),
        name: `${qr.name} (Copy)`,
        mode: 'static',
        dynamicId: undefined,
        shortCode: undefined,
        shortUrl: undefined,
        createdAt: now,
        updatedAt: now,
        downloadCount: 0,
      };
      setQrs((prev) => {
        const next = [copy, ...prev];
        void storageService.saveQR(copy, next);
        return next;
      });
      await recordActivity({
        type: 'duplicated',
        qrId: copy.id,
        qrName: copy.name,
        qrType: copy.type,
        detail: `Duplicated "${qr.name}" as static QR`,
      });
    },
    [recordActivity]
  );

  const renameQR = useCallback(
    async (id: string, newName: string) => {
      const trimmed = newName.trim();
      if (!trimmed) return;
      let target: QRRecord | undefined;
      setQrs((prev) => {
        const next = prev.map((item) => {
          if (item.id !== id) return item;
          target = { ...item, name: trimmed, updatedAt: new Date().toISOString() };
          return target;
        });
        if (target) {
          void storageService.saveQR(target, next);
        }
        return next;
      });
      if (target) {
        await recordActivity({
          type: 'updated',
          qrId: id,
          qrName: trimmed,
          qrType: (target as QRRecord).type,
          detail: `Renamed QR code to "${trimmed}"`,
        });
      }
    },
    [recordActivity]
  );

  const toggleFavoriteQR = useCallback(
    async (id: string) => {
      let updated: QRRecord | undefined;
      setQrs((prev) => {
        const next = prev.map((item) => {
          if (item.id !== id) return item;
          updated = { ...item, favorite: !item.favorite };
          return updated;
        });
        if (updated) {
          void storageService.saveQR(updated, next);
        }
        return next;
      });
      if (updated) {
        await recordActivity({
          type: 'favorited',
          qrId: id,
          qrName: (updated as QRRecord).name,
          qrType: (updated as QRRecord).type,
          detail: (updated as QRRecord).favorite
            ? `Added "${(updated as QRRecord).name}" to favorites`
            : `Removed "${(updated as QRRecord).name}" from favorites`,
        });
      }
    },
    [recordActivity]
  );

  const recordDownload = useCallback(
    async (
      qrId: string | undefined,
      qrName: string,
      qrType: QRContentType | undefined,
      format: string
    ) => {
      if (qrId) {
        setQrs((prev) => {
          let changed: QRRecord | undefined;
          const next = prev.map((item) => {
            if (item.id !== qrId) return item;
            changed = { ...item, downloadCount: item.downloadCount + 1 };
            return changed;
          });
          if (changed) {
            void storageService.saveQR(changed, next);
          }
          return next;
        });
      }
      await recordActivity({
        type: 'downloaded',
        qrId,
        qrName,
        qrType,
        detail: `Exported "${qrName}" as ${format.toUpperCase()}`,
      });
    },
    [recordActivity]
  );

  const clearActivityHistory = useCallback(async () => {
    setActivity([]);
    await storageService.clearActivity();
  }, []);

  const addScanResult = useCallback(
    async (item: Omit<ScanHistoryItem, 'id' | 'timestamp'>) => {
      const full: ScanHistoryItem = {
        ...item,
        id: makeId(),
        timestamp: new Date().toISOString(),
      };
      setScans((prev) => {
        const next = [full, ...prev].slice(0, 200);
        void storageService.addScan(full, next);
        return next;
      });
      await recordActivity({
        type: 'scanned',
        qrName: item.detectedType.toUpperCase() + ' Payload',
        detail: `Scanned ${item.source} QR (${item.detectedType})`,
      });
    },
    [recordActivity]
  );

  const clearScanHistory = useCallback(async () => {
    setScans([]);
    await storageService.clearScans();
  }, []);

  const toggleFavoriteTemplate = useCallback((templateId: string) => {
    setFavoriteTemplateIds((prev) => {
      const next = prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId];
      storageService.saveFavoriteTemplateIds(next);
      return next;
    });
  }, []);

  const updateSettings = useCallback((next: AppSettings) => {
    setSettings(next);
    storageService.saveSettings(next);
  }, []);

  const setTheme = useCallback((theme: ThemePreference) => {
    setSettings((prev) => {
      const next = { ...prev, theme };
      storageService.saveSettings(next);
      return next;
    });
  }, []);

  const importWorkspaceData = useCallback(
    async (
      importedQRs: QRRecord[],
      favTemplates?: string[],
      nextSettings?: Partial<AppSettings>
    ) => {
      setQrs(importedQRs);
      await storageService.replaceAllQRs(importedQRs);
      if (favTemplates) {
        setFavoriteTemplateIds(favTemplates);
        storageService.saveFavoriteTemplateIds(favTemplates);
      }
      if (nextSettings) {
        const merged: AppSettings = {
          theme: nextSettings.theme ?? settings.theme,
          defaultStyle: {
            ...DEFAULT_APP_SETTINGS.defaultStyle,
            ...(nextSettings.defaultStyle ?? {}),
          },
          defaultExport: {
            ...DEFAULT_APP_SETTINGS.defaultExport,
            ...(nextSettings.defaultExport ?? {}),
          },
        };
        updateSettings(merged);
      }
      await recordActivity({
        type: 'updated',
        qrName: 'Workspace Backup',
        detail: `Imported ${importedQRs.length} QR codes from JSON backup`,
      });
    },
    [recordActivity, settings.theme, updateSettings]
  );

  const clearAllWorkspaceData = useCallback(async () => {
    await storageService.clearAllLocalData();
    setQrs([]);
    setActivity([]);
    setScans([]);
    setFavoriteTemplateIds([]);
  }, []);

  const openInGenerator = useCallback(
    (intent: GeneratorDraftIntent) => {
      setDraftIntent(intent);
      navigate('generator');
    },
    [navigate]
  );

  const clearDraftIntent = useCallback(() => {
    setDraftIntent(null);
  }, []);

  return (
    <StudioContext.Provider
      value={{
        route,
        navigate,
        qrs,
        activity,
        scans,
        favoriteTemplateIds,
        settings,
        backendHealth,
        backendChecked,
        isOnline,
        dynamicRecords,
        analyticsSummary,
        draftIntent,
        clearDraftIntent,
        openInGenerator,
        saveQR,
        deleteQR,
        duplicateQR,
        renameQR,
        toggleFavoriteQR,
        recordDownload,
        recordActivity,
        clearActivityHistory,
        addScanResult,
        clearScanHistory,
        toggleFavoriteTemplate,
        updateSettings,
        setTheme,
        importWorkspaceData,
        clearAllWorkspaceData,
        refreshBackendData,
        toasts,
        pushToast,
        dismissToast,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
};

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be used inside StudioProvider');
  return ctx;
}
