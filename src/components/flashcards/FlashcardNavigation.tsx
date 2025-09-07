import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Navigation,
  Zap,
} from "lucide-react";

interface FlashcardNavigationProps {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onDelete: () => void;
  canDelete: boolean;
  saving: boolean;
}

export function FlashcardNavigation({
  current,
  total,
  onPrev,
  onNext,
  onDelete,
  canDelete,
  saving,
}: FlashcardNavigationProps) {
  const isFirstCard = current === 0;
  const isLastCard = current === total - 1;
  const canNavigatePrev = !isFirstCard && !saving;
  const canNavigateNext = !isLastCard && !saving;
  const canDeleteCard = canDelete && !saving;

  // Calculate progress percentage
  const progressPercent = total > 0 ? ((current + 1) / total) * 100 : 0;

  return (
    <div className="space-y-6 mt-8 pt-8 border-t border-subtle">
      {/* Enhanced Progress Indicator */}
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-glass rounded-xl">
              <Navigation className="w-4 h-4 brand-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold text-secondary">
                Card Navigation
              </div>
              <div className="text-xs text-muted">
                {current + 1} of {total} cards
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold brand-primary">
              {Math.round(progressPercent)}%
            </div>
            <div className="text-xs text-muted">Progress</div>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="relative w-full h-2 surface-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-brand rounded-full transition-all transition-normal relative overflow-hidden"
            style={{ width: `${progressPercent}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>

          {/* Progress dots */}
          <div className="absolute inset-0 flex items-center justify-between px-1">
            {Array.from({ length: Math.min(total, 10) }).map((_, i) => {
              const cardIndex =
                total <= 10 ? i : Math.floor((i / 9) * (total - 1));
              const isActive = cardIndex === current;
              const isPassed = cardIndex < current;

              return (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all transition-normal z-10 ${
                    isActive
                      ? "bg-white scale-150 shadow-brand"
                      : isPassed
                      ? "bg-status-success"
                      : "bg-white/30"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-4">
          {/* Previous Button */}
          <button
            className={`btn btn-lg gap-3 transition-all transition-normal group relative overflow-hidden rounded-xl ${
              canNavigatePrev
                ? "border-brand-primary text-brand-primary hover:bg-gradient-brand hover:border-brand hover:text-white interactive-hover shadow-brand hover:shadow-brand-lg"
                : "btn-disabled opacity-40"
            }`}
            onClick={onPrev}
            disabled={!canNavigatePrev}
            title={
              isFirstCard ? "This is the first card" : "Go to previous card"
            }
          >
            {canNavigatePrev && (
              <div className="absolute inset-0 bg-gradient-glass translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />
            )}
            <div className="relative z-10 flex items-center gap-2">
              <ChevronLeft className="w-5 h-5" />
              Previous
            </div>
          </button>

          {/* Card Position Indicator with Enhanced Styling */}
          <div className="flex items-center gap-3 px-6 py-3 surface-elevated border border-subtle rounded-2xl backdrop-blur shadow-brand group hover:shadow-brand-lg transition-all transition-normal">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-gradient-brand rounded-full animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 bg-gradient-brand rounded-full animate-ping opacity-25" />
              </div>
              <span className="text-sm text-secondary font-semibold">
                Card {current + 1} of {total}
              </span>
            </div>

            {/* Mini progress indicator */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(total, 5) }).map((_, i) => {
                const cardIndex =
                  total <= 5 ? i : Math.floor((i / 4) * (total - 1));
                const isActive = cardIndex === current;
                const isPassed = cardIndex < current;

                return (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all transition-normal ${
                      isActive
                        ? "bg-brand-primary scale-125 shadow-brand"
                        : isPassed
                        ? "bg-status-success"
                        : "bg-text-subtle"
                    }`}
                  />
                );
              })}
              {total > 5 && (
                <span className="text-xs text-muted ml-1">+{total - 5}</span>
              )}
            </div>
          </div>

          {/* Next Button */}
          <button
            className={`btn btn-lg gap-3 transition-all transition-normal group relative overflow-hidden rounded-xl ${
              canNavigateNext
                ? "border-brand-primary text-brand-primary hover:bg-gradient-brand hover:border-brand hover:text-white interactive-hover shadow-brand hover:shadow-brand-lg"
                : "btn-disabled opacity-40"
            }`}
            onClick={onNext}
            disabled={!canNavigateNext}
            title={isLastCard ? "This is the last card" : "Go to next card"}
          >
            {canNavigateNext && (
              <div className="absolute inset-0 bg-gradient-glass translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />
            )}
            <div className="relative z-10 flex items-center gap-2">
              Next
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        </div>

        {/* Delete Controls */}
        <div className="flex items-center gap-4">
          {!canDelete && total === 1 && (
            <div className="flex items-center gap-2 text-muted text-sm surface-elevated border border-status-warning px-3 py-2 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-status-warning" />
              <span>At least one card required</span>
            </div>
          )}

          <button
            className={`btn btn-lg gap-3 transition-all transition-normal group relative overflow-hidden rounded-xl ${
              canDeleteCard
                ? "surface-elevated border-status-error text-status-error hover:surface-elevated hover:border-status-error hover:text-status-error interactive-hover shadow-status-error/20 hover:shadow-status-error/20"
                : "btn-disabled opacity-40"
            }`}
            onClick={onDelete}
            disabled={!canDeleteCard}
            title={
              !canDelete
                ? "Cannot delete the last remaining card"
                : saving
                ? "Cannot delete while saving"
                : "Delete this card"
            }
          >
            {canDeleteCard && (
              <div className="absolute inset-0 surface-elevated translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />
            )}
            <div className="relative z-10 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Card
            </div>
          </button>
        </div>
      </div>

      {/* Enhanced Keyboard Shortcuts Hint */}
      <div className="flex items-center justify-center pt-4">
        <div className="flex items-center gap-6 text-xs text-muted surface-elevated border border-subtle px-4 py-2 rounded-xl backdrop-blur">
          <div className="flex items-center gap-2">
            <kbd className="kbd kbd-xs surface-secondary">←</kbd>
            <span>Previous</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="kbd kbd-xs surface-secondary">→</kbd>
            <span>Next</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3" />
            <span>Quick navigation</span>
          </div>
        </div>
      </div>
    </div>
  );
}
