import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-2xl border border-dashed border-[#E5E8F0] dark:border-[#29344B] bg-[#F5F6FA]/60 dark:bg-[#121A2D]/60">
      <div className="w-12 h-12 rounded-xl bg-[#F0F2F8] dark:bg-[#19243A] border border-[#E5E8F0] dark:border-[#29344B] flex items-center justify-center text-[#6655EE] dark:text-[#8978FF] mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-[#171B2B] dark:text-[#F5F6FC] mb-1.5">{title}</h3>
      <p className="text-sm text-[#747D91] dark:text-[#A4ADC1] max-w-md mb-5 leading-relaxed">
        {description}
      </p>
      {(actionLabel || secondaryLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#6655EE] hover:bg-[#5645DD] text-white transition-colors whitespace-nowrap"
            >
              {actionLabel}
            </button>
          )}
          {secondaryLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-[#E5E8F0] dark:border-[#29344B] bg-white dark:bg-[#19243A] text-[#171B2B] dark:text-[#F5F6FC] hover:border-[#6655EE] transition-colors whitespace-nowrap"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
