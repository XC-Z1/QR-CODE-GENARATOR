import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { useStudio } from '../../hooks/useStudioState';

const OFFLINE_IMAGE_SRC = '/assets/aistudio/IMG-20261123-WA0005_795e6be6.jpg';
const ONLINE_IMAGE_SRC = '/assets/aistudio/IMG-20261123-WA0006_1bb2306f.jpg';

export const NetworkStatusOverlay: React.FC = () => {
  const { isOnline, refreshBackendData } = useStudio();
  const [offlineUrl, setOfflineUrl] = useState<string>(OFFLINE_IMAGE_SRC);
  const [onlineUrl, setOnlineUrl] = useState<string>(ONLINE_IMAGE_SRC);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);
  const [retrying, setRetrying] = useState<boolean>(false);
  const wasOfflineRef = useRef<boolean>(!isOnline);

  // Preload and cache both status images in memory so the offline view
  // always renders instantaneously even when internet is completely turned off.
  useEffect(() => {
    let active = true;
    const createdUrls: string[] = [];

    const preloadAsset = async (src: string, setter: (url: string) => void) => {
      try {
        const res = await fetch(src, { cache: 'force-cache' });
        if (!res.ok) return;
        const blob = await res.blob();
        if (!active) return;
        const objectUrl = URL.createObjectURL(blob);
        createdUrls.push(objectUrl);
        setter(objectUrl);
      } catch {
        // Fallback silently to direct local asset path
      }
    };

    const timer = window.setTimeout(() => {
      void preloadAsset(OFFLINE_IMAGE_SRC, setOfflineUrl);
      void preloadAsset(ONLINE_IMAGE_SRC, setOnlineUrl);
    }, 1200);

    return () => {
      active = false;
      window.clearTimeout(timer);
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Show full-screen "Internet Connected" screen briefly on offline -> online recovery,
  // then transition smoothly back to the active webapp.
  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      setShowReconnected(false);
      return;
    }

    if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      setShowReconnected(true);
      const timer = window.setTimeout(() => {
        setShowReconnected(false);
      }, 2800);
      return () => window.clearTimeout(timer);
    }
  }, [isOnline]);

  const handleRetry = async () => {
    setRetrying(true);
    await refreshBackendData();
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      window.dispatchEvent(new Event('online'));
    }
    setRetrying(false);
  };

  const visibleMode: 'offline' | 'online' | null = !isOnline
    ? 'offline'
    : showReconnected
    ? 'online'
    : null;

  return (
    <AnimatePresence>
      {visibleMode && (
        <motion.div
          key="network-fullscreen-shell"
          role="status"
          aria-live="polite"
          aria-label={visibleMode === 'offline' ? 'No Internet Connection' : 'Internet Connected'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => {
            if (visibleMode === 'online') setShowReconnected(false);
          }}
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center py-8 bg-[radial-gradient(ellipse_at_center,#0B1136_0%,#030514_58%,#010209_100%)] select-none"
        >
          <AnimatePresence mode="wait">
            {visibleMode === 'offline' ? (
              <motion.div
                key="offline-screen"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="w-full max-w-2xl flex flex-col items-center"
              >
                <img
                  src={offlineUrl}
                  alt="No Internet Connection - Check your network and try again"
                  className="network-screen-blend w-full h-auto max-h-[68vh] object-contain"
                />

                <div className="mt-6 flex items-center justify-center w-full max-w-xs gap-4">
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#6C5CE7]/60" />
                  <button
                    type="button"
                    onClick={handleRetry}
                    disabled={retrying}
                    className="inline-flex items-center gap-2 px-7 py-2.5 text-sm font-semibold rounded-full studio-btn-primary text-white transition-all hover:scale-[1.03] disabled:opacity-65 shrink-0"
                  >
                    <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
                    <span>{retrying ? 'Checking...' : 'Retry'}</span>
                  </button>
                  <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#6C5CE7]/60" />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="online-screen"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.28 }}
                className="w-full max-w-2xl flex flex-col items-center cursor-pointer"
              >
                <img
                  src={onlineUrl}
                  alt="Internet Connected - Enjoy your browsing"
                  className="network-screen-blend w-full h-auto max-h-[72vh] object-contain"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
