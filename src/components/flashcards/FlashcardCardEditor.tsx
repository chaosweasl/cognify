import React from "react";
import { Type, MessageSquare } from "lucide-react";

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
  const frontLength = typeof card.front === "string" ? card.front.length : 0;
  const backLength = typeof card.back === "string" ? card.back.length : 0;
  const maxLength = 500;

  const frontValid = typeof card.front === "string" && card.front.trim();
  const backValid = typeof card.back === "string" && card.back.trim();

  return (
    <div className="space-y-8">
      {/* Front Side */}
      <div className="form-control group">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-3">
            <div className="p-2 bg-gradient-glass rounded-lg group-focus-within:bg-gradient-brand transition-all transition-normal">
              <Type className="w-5 h-5 brand-primary group-focus-within:text-white transition-colors transition-normal" />
            </div>
            <div>
              <span className="text-lg font-semibold text-primary group-focus-within:brand-primary transition-colors transition-normal">
                Front Side
              </span>
              <div className="text-sm text-muted">Question or prompt</div>
            </div>
          </label>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm transition-colors transition-normal ${
                frontLength > maxLength * 0.8
                  ? "text-red-400"
                  : frontLength > maxLength * 0.6
                  ? "text-yellow-500"
                  : "text-muted"
              }`}
            >
              {frontLength}/{maxLength}
            </span>
            {frontValid && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
        </div>

        <textarea
          className={`textarea w-full h-32 resize-none text-base transition-all transition-normal backdrop-blur
            surface-secondary border-subtle text-primary placeholder:text-muted
            focus:surface-elevated focus:border-brand focus:shadow-brand interactive-focus
            hover:surface-elevated interactive-hover
            ${
              !frontValid && frontLength > 0
                ? "border-red-500/50 focus:border-red-500"
                : ""
            }
            ${
              frontLength > maxLength
                ? "border-red-500 focus:border-red-500"
                : ""
            }
          `}
          value={typeof card.front === "string" ? card.front : ""}
          onChange={(e) => handleChange("front", e.target.value)}
          placeholder="What would you like to ask? Be clear and specific..."
          disabled={saving}
          maxLength={maxLength}
        />

        {frontLength > maxLength * 0.8 && (
          <div className="text-sm mt-2 flex items-center gap-2">
            {frontLength > maxLength ? (
              <span className="text-red-400">
                ⚠️ Content exceeds maximum length
              </span>
            ) : (
              <span className="text-yellow-500">
                ⚠️ Approaching character limit
              </span>
            )}
          </div>
        )}
      </div>

      {/* Visual Separator */}
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-4">
          <div className="h-px bg-gradient-to-r from-transparent via-border-primary to-transparent w-16" />
          <div className="p-2 surface-elevated rounded-full border border-subtle">
            <div className="w-2 h-2 bg-gradient-brand rounded-full animate-pulse" />
          </div>
          <div className="h-px bg-gradient-to-r from-border-primary via-transparent to-transparent w-16" />
        </div>
      </div>

      {/* Back Side */}
      <div className="form-control group">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-3">
            <div className="p-2 bg-gradient-glass rounded-lg group-focus-within:bg-gradient-brand transition-all transition-normal">
              <MessageSquare className="w-5 h-5 brand-secondary group-focus-within:text-white transition-colors transition-normal" />
            </div>
            <div>
              <span className="text-lg font-semibold text-primary group-focus-within:brand-primary transition-colors transition-normal">
                Back Side
              </span>
              <div className="text-sm text-muted">Answer or explanation</div>
            </div>
          </label>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm transition-colors transition-normal ${
                backLength > maxLength * 0.8
                  ? "text-red-400"
                  : backLength > maxLength * 0.6
                  ? "text-yellow-500"
                  : "text-muted"
              }`}
            >
              {backLength}/{maxLength}
            </span>
            {backValid && (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
        </div>

        <textarea
          className={`textarea w-full h-32 resize-none text-base transition-all transition-normal backdrop-blur
            surface-secondary border-subtle text-primary placeholder:text-muted
            focus:surface-elevated focus:border-brand focus:shadow-brand interactive-focus
            hover:surface-elevated interactive-hover
            ${
              !backValid && backLength > 0
                ? "border-red-500/50 focus:border-red-500"
                : ""
            }
            ${
              backLength > maxLength
                ? "border-red-500 focus:border-red-500"
                : ""
            }
          `}
          value={typeof card.back === "string" ? card.back : ""}
          onChange={(e) => handleChange("back", e.target.value)}
          placeholder="Provide a clear, concise answer..."
          disabled={saving}
          maxLength={maxLength}
        />

        {backLength > maxLength * 0.8 && (
          <div className="text-sm mt-2 flex items-center gap-2">
            {backLength > maxLength ? (
              <span className="text-red-400">
                ⚠️ Content exceeds maximum length
              </span>
            ) : (
              <span className="text-yellow-500">
                ⚠️ Approaching character limit
              </span>
            )}
          </div>
        )}
      </div>

      {/* Card Preview */}
      {(frontValid || backValid) && (
        <div className="mt-8 p-6 surface-elevated border border-subtle rounded-xl backdrop-blur">
          <div className="text-sm text-muted mb-4 flex items-center gap-2">
            <div className="w-1 h-1 bg-brand-primary rounded-full" />
            Card Preview
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {frontValid && (
              <div className="space-y-2">
                <div className="text-xs text-muted uppercase tracking-wider">
                  Front
                </div>
                <div className="text-sm text-secondary p-3 surface-secondary rounded-lg border border-subtle">
                  {card.front}
                </div>
              </div>
            )}
            {backValid && (
              <div className="space-y-2">
                <div className="text-xs text-muted uppercase tracking-wider">
                  Back
                </div>
                <div className="text-sm text-secondary p-3 surface-secondary rounded-lg border border-subtle">
                  {card.back}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
