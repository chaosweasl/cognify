import React from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

// Flashcard Navigation Component
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

// Flashcard Card Editor Component
interface FlashcardCardEditorProps {
  card: { front: string; back: string };
  handleChange: (field: "front" | "back", value: string) => void;
  saving: boolean;
}

export function FlashcardCardEditor({
  card,
  handleChange,
  saving,
}: FlashcardCardEditorProps) {
  return (
    <div className="space-y-6">
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium text-lg text-base-content/90">
            Front
          </span>
          <span className="label-text-alt text-base-content/50">
            {typeof card.front === "string" ? card.front.length : 0}/300
          </span>
        </label>
        <textarea
          className={`textarea textarea-bordered w-full h-32 resize-none text-base transition-all duration-200 ${
            !(typeof card.front === "string" && card.front.trim())
              ? "textarea-error"
              : "focus:textarea-primary"
          }`}
          value={typeof card.front === "string" ? card.front : ""}
          onChange={(e) => handleChange("front", e.target.value)}
          placeholder="What would you like to ask? Be clear and specific..."
          disabled={saving}
          maxLength={300}
        />
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium text-lg text-base-content/90">
            Back
          </span>
          <span className="label-text-alt text-base-content/50">
            {typeof card.back === "string" ? card.back.length : 0}/300
          </span>
        </label>
        <textarea
          className={`textarea textarea-bordered w-full h-32 resize-none text-base transition-200 ${
            !(typeof card.back === "string" && card.back.trim())
              ? "textarea-error"
              : "focus:textarea-primary"
          }`}
          value={typeof card.back === "string" ? card.back : ""}
          onChange={(e) => handleChange("back", e.target.value)}
          placeholder="Provide a clear, concise answer..."
          disabled={saving}
          maxLength={300}
        />
      </div>
    </div>
  );
}