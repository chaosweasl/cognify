import React from "react";
import {
  Type,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

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
  const bothValid = frontValid && backValid;

  const getFrontStatus = () => {
    if (frontLength === 0) return { color: "text-muted", message: "Empty" };
    if (!frontValid)
      return { color: "text-yellow-500", message: "Needs content" };
    if (frontLength > maxLength)
      return { color: "text-red-400", message: "Too long" };
    if (frontLength > maxLength * 0.8)
      return { color: "text-yellow-500", message: "Almost full" };
    return { color: "text-green-500", message: "Valid" };
  };

  const getBackStatus = () => {
    if (backLength === 0) return { color: "text-muted", message: "Empty" };
    if (!backValid)
      return { color: "text-yellow-500", message: "Needs content" };
    if (backLength > maxLength)
      return { color: "text-red-400", message: "Too long" };
    if (backLength > maxLength * 0.8)
      return { color: "text-yellow-500", message: "Almost full" };
    return { color: "text-green-500", message: "Valid" };
  };

  const frontStatus = getFrontStatus();
  const backStatus = getBackStatus();

  return (
    <div className="space-y-8">
      {/* Front Side */}
      <div className="form-control group">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 bg-gradient-glass rounded-lg group-focus-within:bg-gradient-brand transition-all transition-normal">
                <Type className="w-5 h-5 brand-primary group-focus-within:text-white transition-colors transition-normal" />
              </div>
              {frontValid && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
            <div>
              <span className="text-lg font-semibold text-primary group-focus-within:brand-primary transition-colors transition-normal">
                Front Side
              </span>
              <div className="text-sm text-muted">Question or prompt</div>
            </div>
          </label>
          <div className="flex items-center gap-3">
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
              <div
                className={`text-xs px-2 py-1 rounded-full ${frontStatus.color} bg-current bg-opacity-10`}
              >
                {frontStatus.message}
              </div>
            </div>
          </div>
        </div>

        <div className="relative group">
          <textarea
            className={`textarea w-full h-32 resize-none text-base transition-all transition-normal backdrop-blur rounded-xl
              surface-secondary border-subtle text-primary placeholder:text-muted
              focus:surface-elevated focus:border-brand focus:shadow-brand interactive-focus
              hover:surface-elevated interactive-hover group-focus-within:shadow-brand
              ${
                !frontValid && frontLength > 0
                  ? "border-yellow-500/50 focus:border-yellow-500"
                  : ""
              }
              ${
                frontLength > maxLength
                  ? "border-red-500 focus:border-red-500"
                  : ""
              }
              ${frontValid ? "border-green-500/30" : ""}
            `}
            value={typeof card.front === "string" ? card.front : ""}
            onChange={(e) => handleChange("front", e.target.value)}
            placeholder="What would you like to ask? Be clear and specific..."
            disabled={saving}
            maxLength={maxLength}
          />

          {/* Character limit progress bar */}
          <div className="absolute bottom-2 right-2 w-16 h-1 bg-border-subtle rounded-full overflow-hidden">
            <div
              className={`h-full transition-all transition-normal ${
                frontLength > maxLength * 0.8
                  ? "bg-red-400"
                  : frontLength > maxLength * 0.6
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{
                width: `${Math.min((frontLength / maxLength) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {(frontLength > maxLength * 0.8 ||
          (!frontValid && frontLength > 0)) && (
          <div className="text-sm mt-2 flex items-center gap-2">
            {frontLength > maxLength ? (
              <>
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400">
                  Content exceeds maximum length
                </span>
              </>
            ) : !frontValid && frontLength > 0 ? (
              <>
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-500">Add meaningful content</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-500">
                  Approaching character limit
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Visual Separator */}
      <div className="flex items-center justify-center py-6">
        <div className="flex items-center gap-6">
          <div className="h-px bg-gradient-to-r from-transparent via-border-primary to-transparent w-24" />
          <div className="relative">
            <div className="p-3 surface-elevated rounded-2xl border border-subtle shadow-brand">
              <div className="w-3 h-3 bg-gradient-brand rounded-full animate-pulse" />
            </div>
            {bothValid && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
          <div className="h-px bg-gradient-to-r from-border-primary via-transparent to-transparent w-24" />
        </div>
      </div>

      {/* Back Side */}
      <div className="form-control group">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-3">
            <div className="relative">
              <div className="p-2 bg-gradient-glass rounded-lg group-focus-within:bg-gradient-brand transition-all transition-normal">
                <MessageSquare className="w-5 h-5 brand-secondary group-focus-within:text-white transition-colors transition-normal" />
              </div>
              {backValid && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
            <div>
              <span className="text-lg font-semibold text-primary group-focus-within:brand-primary transition-colors transition-normal">
                Back Side
              </span>
              <div className="text-sm text-muted">Answer or explanation</div>
            </div>
          </label>
          <div className="flex items-center gap-3">
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
              <div
                className={`text-xs px-2 py-1 rounded-full ${backStatus.color} bg-current bg-opacity-10`}
              >
                {backStatus.message}
              </div>
            </div>
          </div>
        </div>

        <div className="relative group">
          <textarea
            className={`textarea w-full h-32 resize-none text-base transition-all transition-normal backdrop-blur rounded-xl
              surface-secondary border-subtle text-primary placeholder:text-muted
              focus:surface-elevated focus:border-brand focus:shadow-brand interactive-focus
              hover:surface-elevated interactive-hover group-focus-within:shadow-brand
              ${
                !backValid && backLength > 0
                  ? "border-yellow-500/50 focus:border-yellow-500"
                  : ""
              }
              ${
                backLength > maxLength
                  ? "border-red-500 focus:border-red-500"
                  : ""
              }
              ${backValid ? "border-green-500/30" : ""}
            `}
            value={typeof card.back === "string" ? card.back : ""}
            onChange={(e) => handleChange("back", e.target.value)}
            placeholder="Provide a clear, concise answer..."
            disabled={saving}
            maxLength={maxLength}
          />

          {/* Character limit progress bar */}
          <div className="absolute bottom-2 right-2 w-16 h-1 bg-border-subtle rounded-full overflow-hidden">
            <div
              className={`h-full transition-all transition-normal ${
                backLength > maxLength * 0.8
                  ? "bg-red-400"
                  : backLength > maxLength * 0.6
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{
                width: `${Math.min((backLength / maxLength) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {(backLength > maxLength * 0.8 || (!backValid && backLength > 0)) && (
          <div className="text-sm mt-2 flex items-center gap-2">
            {backLength > maxLength ? (
              <>
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span className="text-red-400">
                  Content exceeds maximum length
                </span>
              </>
            ) : !backValid && backLength > 0 ? (
              <>
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-500">Add meaningful content</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-500">
                  Approaching character limit
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Card Preview */}
      {(frontValid || backValid) && (
        <div className="relative mt-8 overflow-hidden rounded-2xl border border-subtle backdrop-blur group hover:shadow-brand transition-all transition-normal">
          <div className="absolute inset-0 bg-gradient-glass opacity-30" />
          <div className="relative p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-gradient-brand rounded-full animate-pulse" />
              <span className="text-sm text-muted uppercase tracking-wider font-semibold">
                Card Preview
              </span>
              {bothValid && (
                <div className="ml-auto flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Complete
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {frontValid && (
                <div className="space-y-2 group/front">
                  <div className="text-xs text-muted uppercase tracking-wider font-medium flex items-center gap-2">
                    <Type className="w-3 h-3" />
                    Front
                  </div>
                  <div className="text-sm text-primary p-4 surface-secondary rounded-xl border border-subtle group-hover/front:shadow-brand transition-all transition-normal">
                    {card.front}
                  </div>
                </div>
              )}
              {backValid && (
                <div className="space-y-2 group/back">
                  <div className="text-xs text-muted uppercase tracking-wider font-medium flex items-center gap-2">
                    <MessageSquare className="w-3 h-3" />
                    Back
                  </div>
                  <div className="text-sm text-primary p-4 surface-secondary rounded-xl border border-subtle group-hover/back:shadow-brand transition-all transition-normal">
                    {card.back}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
