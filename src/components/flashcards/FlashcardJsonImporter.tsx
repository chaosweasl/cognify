"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  Code,
} from "lucide-react";

// Define Flashcard type that matches the new format
type ImportFlashcard = {
  front: string;
  back: string;
};

interface FlashcardJsonImporterProps {
  onImport: (flashcards: ImportFlashcard[]) => void;
  disabled?: boolean;
  existingFlashcards?: ImportFlashcard[];
}

export function FlashcardJsonImporter({
  onImport,
  disabled = false,
  existingFlashcards = [],
}: FlashcardJsonImporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportFlashcard[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setPreview([]);

    try {
      // Validate file type
      if (!file.name.toLowerCase().endsWith(".json")) {
        throw new Error("Please select a JSON file (.json)");
      }

      // Read file content
      const text = await file.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid JSON format. Please check your file.");
      }

      // Validate and normalize the data
      const flashcards = validateAndNormalizeFlashcards(data);

      if (flashcards.length === 0) {
        throw new Error("No valid flashcards found in the file.");
      }

      setPreview(flashcards);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import file");
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const validateAndNormalizeFlashcards = (data: unknown): ImportFlashcard[] => {
    const flashcards: ImportFlashcard[] = [];

    // Handle different JSON structures
    let items: unknown[] = [];

    if (Array.isArray(data)) {
      items = data;
    } else if (data && typeof data === "object") {
      const dataObj = data as Record<string, unknown>;
      if (dataObj.flashcards && Array.isArray(dataObj.flashcards)) {
        items = dataObj.flashcards;
      } else if (dataObj.cards && Array.isArray(dataObj.cards)) {
        items = dataObj.cards;
      } else {
        throw new Error(
          'Expected an array of flashcards or an object with "flashcards" or "cards" property'
        );
      }
    } else {
      throw new Error(
        'Expected an array of flashcards or an object with "flashcards" or "cards" property'
      );
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (!item || typeof item !== "object") {
        continue; // Skip invalid items
      }

      const itemObj = item as Record<string, unknown>;
      // Try different property names
      const front =
        itemObj.question || itemObj.front || itemObj.q || itemObj.prompt;
      const back =
        itemObj.answer || itemObj.back || itemObj.a || itemObj.response;

      // Convert to string and validate
      const frontStr = typeof front === "string" ? front : String(front || "");
      const backStr = typeof back === "string" ? back : String(back || "");

      // Only include cards with both front and back
      if (frontStr.trim() && backStr.trim()) {
        flashcards.push({
          front: frontStr.trim(),
          back: backStr.trim(),
        });
      }
    }

    return flashcards;
  };

  const handleImport = () => {
    if (preview.length > 0) {
      // Merge previous flashcards with imported ones
      const merged = [...existingFlashcards, ...preview];
      onImport(merged);
      handleClose();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
    setPreview([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getExampleJson = () => {
    return JSON.stringify(
      [
        {
          front: "What is the capital of France?",
          back: "Paris",
        },
        {
          front: "What is 2 + 2?",
          back: "4",
        },
      ],
      null,
      2
    );
  };

  return (
    <>
      {/* Enhanced Import Button */}
      <button
        className="btn btn-outline border-brand-primary text-brand-primary hover:bg-gradient-brand hover:border-brand hover:text-white interactive-hover transition-all transition-normal rounded-xl shadow-brand hover:shadow-brand-lg group relative overflow-hidden"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
      >
        <div className="absolute inset-0 bg-gradient-glass translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />
        <div className="relative z-10 flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Import JSON
        </div>
      </button>

      {/* Enhanced Modal */}
      {isOpen &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="modal modal-open z-[1000] bg-black/40 backdrop-blur-sm">
            <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto surface-elevated border border-subtle backdrop-blur rounded-2xl shadow-brand-lg">
              {/* Background overlay */}
              <div className="absolute inset-0 bg-gradient-glass opacity-20 pointer-events-none rounded-2xl" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="relative group">
                      <div className="p-3 bg-gradient-brand rounded-xl shadow-brand transform group-hover:scale-110 transition-all transition-normal">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div className="absolute -inset-1 bg-gradient-glass rounded-xl blur opacity-0 group-hover:opacity-100 transition-all transition-normal" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-primary">
                        Import Flashcards from JSON
                      </h3>
                      <p className="text-muted">
                        Upload a JSON file containing your flashcards
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn btn-sm btn-circle surface-secondary border-subtle interactive-hover rounded-xl"
                    onClick={handleClose}
                    disabled={importing}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Enhanced File Input */}
                <div className="mb-6">
                  <label className="label">
                    <span className="label-text font-medium text-secondary">
                      Select JSON File
                    </span>
                  </label>
                  <div className="relative group">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="file-input file-input-bordered w-full surface-secondary border-secondary text-primary interactive-focus focus:border-brand focus:shadow-brand transition-all transition-normal rounded-xl"
                      disabled={importing}
                    />
                  </div>
                </div>

                {/* Enhanced Error Display */}
                {error && (
                  <div className="alert bg-red-500/10 border-red-500/30 text-red-400 mb-6 rounded-xl">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <div className="font-bold">Import Error</div>
                        <div className="text-sm mt-1">{error}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Loading State */}
                {importing && (
                  <div className="flex items-center justify-center py-8">
                    <div className="relative">
                      <div className="w-12 h-12 border-3 border-secondary border-t-brand-primary rounded-full animate-spin" />
                      <div
                        className="absolute inset-0 w-12 h-12 border-3 border-transparent border-r-brand-secondary rounded-full animate-spin"
                        style={{
                          animationDirection: "reverse",
                          animationDuration: "1.5s",
                        }}
                      />
                    </div>
                    <span className="ml-4 text-lg text-primary">
                      Processing file...
                    </span>
                  </div>
                )}

                {/* Enhanced Preview */}
                {preview.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-green-400">
                        Found {preview.length} valid flashcard
                        {preview.length !== 1 ? "s" : ""}
                      </span>
                      <div className="flex items-center gap-1 ml-2">
                        <Sparkles className="w-4 h-4 text-green-500 animate-pulse" />
                        <span className="text-xs text-green-400">
                          Ready to import
                        </span>
                      </div>
                    </div>

                    <div className="surface-secondary border border-subtle rounded-xl p-4 max-h-64 overflow-y-auto custom-scrollbar backdrop-blur">
                      <div className="space-y-3">
                        {preview.slice(0, 5).map((card, index) => (
                          <div
                            key={index}
                            className="surface-elevated border border-subtle rounded-xl p-3 group hover:shadow-brand transition-all transition-normal"
                          >
                            <div className="text-sm font-medium text-muted mb-1 flex items-center gap-2">
                              <div className="w-2 h-2 bg-brand-primary rounded-full" />
                              Card {index + 1}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <div className="text-xs font-medium text-muted mb-1 uppercase tracking-wider">
                                  Front:
                                </div>
                                <div className="text-sm text-primary line-clamp-2">
                                  {card.front}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs font-medium text-muted mb-1 uppercase tracking-wider">
                                  Back:
                                </div>
                                <div className="text-sm text-primary line-clamp-2">
                                  {card.back}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {preview.length > 5 && (
                          <div className="text-center text-sm text-muted py-2 flex items-center justify-center gap-2">
                            <div className="flex gap-1">
                              {[1, 2, 3].map((i) => (
                                <div
                                  key={i}
                                  className="w-1 h-1 bg-muted rounded-full animate-pulse"
                                  style={{ animationDelay: `${i * 0.2}s` }}
                                />
                              ))}
                            </div>
                            and {preview.length - 5} more cards
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced JSON Format Example */}
                <div className="collapse collapse-arrow surface-secondary border border-subtle mb-6 rounded-xl backdrop-blur">
                  <input type="checkbox" />
                  <div className="collapse-title text-sm font-medium text-secondary flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Expected JSON Format
                  </div>
                  <div className="collapse-content">
                    <div className="text-sm text-muted mb-3">
                      Your JSON file should contain an array of objects with
                      "front" and "back" properties (or equivalent names):
                    </div>
                    <div className="mockup-code text-xs surface-elevated border border-subtle rounded-lg">
                      <pre className="text-primary">
                        <code>{getExampleJson()}</code>
                      </pre>
                    </div>
                    <div className="mt-3 p-3 surface-elevated border border-subtle rounded-lg">
                      <div className="text-xs text-muted">
                        <strong className="text-secondary">
                          Supported property names:
                        </strong>
                        <br />• front, question, q, prompt (for front side)
                        <br />• back, answer, a, response (for back side)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enhanced Actions */}
                <div className="modal-action">
                  <button
                    className="btn surface-secondary border-subtle interactive-hover rounded-xl"
                    onClick={handleClose}
                    disabled={importing}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn bg-gradient-brand hover:bg-gradient-brand-hover text-white border-0 shadow-brand hover:shadow-brand-lg transition-all transition-normal relative overflow-hidden group rounded-xl"
                    onClick={handleImport}
                    disabled={preview.length === 0 || importing}
                  >
                    <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />
                    <div className="relative z-10 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Import {preview.length} Card
                      {preview.length !== 1 ? "s" : ""}
                    </div>
                  </button>
                </div>
              </div>
            </div>
            <div
              className="modal-backdrop bg-black/40 backdrop-blur-sm"
              onClick={handleClose}
            ></div>
          </div>,
          document.body
        )}
    </>
  );
}
