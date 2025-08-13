import React from "react";

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
          className={`textarea textarea-bordered w-full h-32 resize-none text-base transition-all duration-200 ${
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
