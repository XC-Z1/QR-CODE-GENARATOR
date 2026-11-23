import React, { useState } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import { useStudio } from '../../hooks/useStudioState';

export const OfflineBanner: React.FC = () => {
  const { isOnline, refreshBackendData } = useStudio();
  const [retrying, setRetrying] = useState(false);

  if (isOnline) return null;

  const handleRetry = async () => {
    setRetrying(true);
    await refreshBackendData();
    setRetrying(false);
  };

  return (
    <div
      role="status"
      className="mb-5 flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border border-amber-300/70 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
          <WifiOff className={`w-4 h-4 ${retrying ? 'animate-pulse' : ''}`} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold">
            {!isOnline ? 'Network Disconnected — Offline Studio Mode' : 'Server Backend Unavailable'}
          </div>
          <div className="text-xs opacity-85">
            Static QR generation, customization, local library, and PNG/SVG/JPG/PDF exports continue working offline. Dynamic QR redirects and server image hosting require an active backend connection.
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleRetry}
        disabled={retrying}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-400/60 dark:border-amber-500/40 bg-white dark:bg-[#19243A] text-amber-900 dark:text-amber-200 hover:bg-amber-100/60 transition-colors shrink-0"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
        {retrying ? 'Checking...' : 'Retry Connection'}
      </button>
    </div>
  );
};
