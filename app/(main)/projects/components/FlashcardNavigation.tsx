import React from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

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
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8 pt-6 border-t border-base-300/60">
      <div className="flex gap-2">
        <button
          className="btn btn-outline hover:btn-primary transition-all duration-200"
          onClick={onPrev}
          disabled={current === 0 || saving}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <button
          className="btn btn-outline hover:btn-primary transition-all duration-200"
          onClick={onNext}
          disabled={current === total - 1 || saving}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <button
        className="btn btn-error btn-outline hover:shadow-md transition-all duration-200"
        onClick={onDelete}
        disabled={!canDelete || saving}
      >
        <Trash2 className="w-4 h-4" />
        Delete Card
      </button>
    </div>
  );
}
