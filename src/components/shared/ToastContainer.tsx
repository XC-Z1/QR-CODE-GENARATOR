import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { useStudio } from '../../hooks/useStudioState';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useStudio();

  return (
    <div
      aria-live="polite"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2.5 max-w-sm w-[calc(100vw-2rem)] sm:w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon =
            toast.variant === 'success'
              ? CheckCircle2
              : toast.variant === 'error'
              ? AlertCircle
              : toast.variant === 'warning'
              ? AlertTriangle
              : Info;
          const iconBg =
            toast.variant === 'success'
              ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
              : toast.variant === 'error'
              ? 'bg-red-500/12 text-red-600 dark:text-red-400'
              : toast.variant === 'warning'
              ? 'bg-amber-500/12 text-amber-600 dark:text-amber-400'
              : 'bg-[#6655EE]/12 text-[#6655EE] dark:text-[#8B7BFF]';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl bg-white/95 dark:bg-[#131C31]/95 backdrop-blur-md border border-[#E2E7F2] dark:border-[#253352] shadow-[0_12px_32px_-8px_rgba(16,21,37,0.16),0_2px_6px_rgba(16,21,37,0.06)] dark:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.65)]"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="text-sm font-semibold text-[#0F172A] dark:text-[#F4F7FF]">
                  {toast.title}
                </div>
                {toast.description && (
                  <div className="text-xs text-[#647087] dark:text-[#9AA6C0] mt-0.5 leading-relaxed">
                    {toast.description}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="p-1 rounded-md text-[#647087] hover:text-[#0F172A] dark:hover:text-[#F4F7FF] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
