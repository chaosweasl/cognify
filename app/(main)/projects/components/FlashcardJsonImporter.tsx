"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Upload, FileText, AlertTriangle, CheckCircle2, X } from "lucide-react";

// Define Flashcard type to match your existing code
type Flashcard = {
  question: string;
  answer: string;
};

interface FlashcardJsonImporterProps {
  onImport: (flashcards: Flashcard[]) => void;
  disabled?: boolean;
  existingFlashcards?: Flashcard[];
}

export function FlashcardJsonImporter({
  onImport,
  disabled = false,
  existingFlashcards = [],
}: FlashcardJsonImporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<Flashcard[]>([]);
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

  const validateAndNormalizeFlashcards = (data: unknown): Flashcard[] => {
    const flashcards: Flashcard[] = [];

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
      let question =
        itemObj.question || itemObj.front || itemObj.q || itemObj.prompt;
      let answer =
        itemObj.answer || itemObj.back || itemObj.a || itemObj.response;

      // Convert to string and validate
      const questionStr =
        typeof question === "string" ? question : String(question || "");
      const answerStr =
        typeof answer === "string" ? answer : String(answer || "");

      // Only include cards with both question and answer
      if (questionStr.trim() && answerStr.trim()) {
        flashcards.push({
          question: questionStr.trim(),
          answer: answerStr.trim(),
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
          question: "What is the capital of France?",
          answer: "Paris",
        },
        {
          question: "What is 2 + 2?",
          answer: "4",
        },
      ],
      null,
      2
    );
  };

  return (
    <>
      {/* Import Button */}
      <button
        className="btn btn-outline btn-primary hover:shadow-md transition-all duration-200"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
      >
        <Upload className="w-4 h-4" />
        Import JSON
      </button>

      {/* Modal rendered via Portal */}
      {isOpen &&
        typeof window !== "undefined" &&
        createPortal(
          <div className="modal modal-open z-[1000]">
            <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      Import Flashcards from JSON
                    </h3>
                    <p className="text-base-content/60">
                      Upload a JSON file containing your flashcards
                    </p>
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-circle btn-ghost"
                  onClick={handleClose}
                  disabled={importing}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* File Input */}
              <div className="mb-6">
                <label className="label">
                  <span className="label-text font-medium">
                    Select JSON File
                  </span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="file-input file-input-bordered file-input-primary w-full"
                  disabled={importing}
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="alert alert-error mb-6">
                  <AlertTriangle className="w-5 h-5" />
                  <div>
                    <div className="font-bold">Import Error</div>
                    <div className="text-sm">{error}</div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {importing && (
                <div className="flex items-center justify-center py-8">
                  <div className="loading loading-spinner loading-lg text-primary"></div>
                  <span className="ml-3 text-lg">Processing file...</span>
                </div>
              )}

              {/* Preview */}
              {preview.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <span className="font-medium text-success">
                      Found {preview.length} valid flashcard
                      {preview.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="bg-base-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <div className="space-y-3">
                      {preview.slice(0, 5).map((card, index) => (
                        <div key={index} className="bg-base-100 rounded-lg p-3">
                          <div className="text-sm font-medium text-base-content/60 mb-1">
                            Card {index + 1}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs font-medium text-base-content/40 mb-1">
                                Question:
                              </div>
                              <div className="text-sm line-clamp-2">
                                {card.question}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-base-content/40 mb-1">
                                Answer:
                              </div>
                              <div className="text-sm line-clamp-2">
                                {card.answer}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {preview.length > 5 && (
                        <div className="text-center text-sm text-base-content/60 py-2">
                          ... and {preview.length - 5} more cards
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* JSON Format Example */}
              <div className="collapse collapse-arrow bg-base-200 mb-6">
                <input type="checkbox" />
                <div className="collapse-title text-sm font-medium">
                  📋 Expected JSON Format
                </div>
                <div className="collapse-content">
                  <div className="text-sm text-base-content/60 mb-3">
                    Your JSON file should contain an array of objects with
                    &quot;question&quot; and &quot;answer&quot; properties:
                  </div>
                  <div className="mockup-code text-xs">
                    <pre>
                      <code>{getExampleJson()}</code>
                    </pre>
                  </div>
                  <div className="mt-3 text-xs text-base-content/60">
                    <strong>Supported property names:</strong>
                    <br />• question, front, q, prompt (for questions)
                    <br />• answer, back, a, response (for answers)
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="modal-action">
                <button
                  className="btn btn-ghost"
                  onClick={handleClose}
                  disabled={importing}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleImport}
                  disabled={preview.length === 0 || importing}
                >
                  <Upload className="w-4 h-4" />
                  Import {preview.length} Card{preview.length !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
            <div className="modal-backdrop" onClick={handleClose}></div>
          </div>,
          document.body
        )}
    </>
  );
}
