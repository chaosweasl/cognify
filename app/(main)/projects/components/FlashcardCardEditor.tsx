import React from "react";

interface FlashcardCardEditorProps {
  card: { question: string; answer: string };
  handleChange: (field: "question" | "answer", value: string) => void;
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
            Question
          </span>
          <span className="label-text-alt text-base-content/50">
            {typeof card.question === "string" ? card.question.length : 0}/300
          </span>
        </label>
        <textarea
          className={`textarea textarea-bordered w-full h-32 resize-none text-base transition-all duration-200 ${
            !(typeof card.question === "string" && card.question.trim())
              ? "textarea-error"
              : "focus:textarea-primary"
          }`}
          value={typeof card.question === "string" ? card.question : ""}
          onChange={(e) => handleChange("question", e.target.value)}
          placeholder="What would you like to ask? Be clear and specific..."
          disabled={saving}
          maxLength={300}
        />
      </div>
      <div className="form-control">
        <label className="label">
          <span className="label-text font-medium text-lg text-base-content/90">
            Answer
          </span>
          <span className="label-text-alt text-base-content/50">
            {typeof card.answer === "string" ? card.answer.length : 0}/300
          </span>
        </label>
        <textarea
          className={`textarea textarea-bordered w-full h-32 resize-none text-base transition-all duration-200 ${
            !(typeof card.answer === "string" && card.answer.trim())
              ? "textarea-error"
              : "focus:textarea-primary"
          }`}
          value={typeof card.answer === "string" ? card.answer : ""}
          onChange={(e) => handleChange("answer", e.target.value)}
          placeholder="Provide a clear, concise answer..."
          disabled={saving}
          maxLength={300}
        />
      </div>
    </div>
  );
}
