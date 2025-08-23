import React from "react";
import { ChevronLeft, ChevronRight, Trash2, AlertTriangle } from "lucide-react";

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

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mt-8 pt-8 border-t border-subtle">
      {/* Navigation Controls */}
      <div className="flex items-center gap-4">
        {/* Previous Button */}
        <button
          className={`btn btn-lg gap-3 transition-all transition-normal group relative overflow-hidden ${
            canNavigatePrev
              ? "border-brand-primary text-brand-primary hover:bg-gradient-brand hover:border-brand hover:text-white interactive-hover shadow-brand"
              : "btn-disabled opacity-40"
          }`}
          onClick={onPrev}
          disabled={!canNavigatePrev}
          title={isFirstCard ? "This is the first card" : "Go to previous card"}
        >
          {canNavigatePrev && (
            <div className="absolute inset-0 bg-gradient-glass translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />
          )}
          <div className="relative z-10 flex items-center gap-2">
            <ChevronLeft className="w-5 h-5" />
            Previous
          </div>
        </button>

        {/* Card Position Indicator */}
        <div className="flex items-center gap-3 px-4 py-2 surface-elevated border border-subtle rounded-xl backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gradient-brand rounded-full animate-pulse" />
            <span className="text-sm text-secondary font-medium">
              Card {current + 1} of {total}
            </span>
          </div>

          {/* Progress Dots */}
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
                      ? "bg-brand-primary scale-125"
                      : isPassed
                      ? "bg-green-500"
                      : "bg-text-subtle"
                  }`}
                />
              );
            })}
            {total > 5 && <span className="text-xs text-muted ml-1">...</span>}
          </div>
        </div>

        {/* Next Button */}
        <button
          className={`btn btn-lg gap-3 transition-all transition-normal group relative overflow-hidden ${
            canNavigateNext
              ? "border-brand-primary text-brand-primary hover:bg-gradient-brand hover:border-brand hover:text-white interactive-hover shadow-brand"
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
          <div className="flex items-center gap-2 text-muted text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>At least one card required</span>
          </div>
        )}

        <button
          className={`btn btn-lg gap-3 transition-all transition-normal group relative overflow-hidden ${
            canDeleteCard
              ? "border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 hover:text-red-300 interactive-hover"
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
            <div className="absolute inset-0 bg-red-500/10 translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />
          )}
          <div className="relative z-10 flex items-center gap-2">
            <Trash2 className="w-5 h-5" />
            Delete Card
          </div>
        </button>
      </div>
    </div>
  );
}
