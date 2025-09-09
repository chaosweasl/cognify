"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  Code,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";
import {
  validateImportData,
  generateImportGuidance,
  ImportPreview,
} from "@/lib/utils/importValidation";

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
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(
    null
  );
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [showInvalid, setShowInvalid] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setImportPreview(null);
    setSelectedItems(new Set());

    try {
      // Validate file type
      if (!file.name.toLowerCase().endsWith(".json")) {
        throw new Error("Please select a JSON file (.json)");
      }

      // Check file size (max 5MB for performance)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(
          "File too large. Please select a file smaller than 5MB."
        );
      }

      // Read file content
      const text = await file.text();

      // Validate and parse the data
      const preview = validateImportData(text);

      if (
        preview.validation.errors.length > 0 &&
        preview.metadata.validCount === 0
      ) {
        // Show first error if no valid items found
        throw new Error(preview.validation.errors[0].message);
      }

      setImportPreview(preview);

      // Auto-select all valid items
      const validIndices = new Set(
        preview.flashcards
          .map((card, index) => (card.isValid ? index : -1))
          .filter((index) => index !== -1)
      );
      setSelectedItems(validIndices);
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

  const handleImport = () => {
    if (!importPreview || selectedItems.size === 0) return;

    // Get selected valid flashcards
    const selectedFlashcards = Array.from(selectedItems)
      .map((index) => importPreview.flashcards[index])
      .filter((card) => card && card.isValid)
      .map((card) => ({
        front: card.front,
        back: card.back,
      }));

    if (selectedFlashcards.length > 0) {
      // Merge with existing flashcards
      const merged = [...existingFlashcards, ...selectedFlashcards];
      onImport(merged);
      handleClose();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setError(null);
    setImportPreview(null);
    setSelectedItems(new Set());
    setShowInvalid(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleItemSelection = (index: number) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedItems(newSelection);
  };

  const selectAllValid = () => {
    if (!importPreview) return;
    const validIndices = new Set(
      importPreview.flashcards
        .map((card, index) => (card.isValid ? index : -1))
        .filter((index) => index !== -1)
    );
    setSelectedItems(validIndices);
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
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

  // Generate import guidance for display
  const guidance = importPreview ? generateImportGuidance(importPreview) : null;

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
            <div className="modal-box max-w-6xl max-h-[90vh] overflow-y-auto surface-elevated border border-subtle backdrop-blur rounded-2xl shadow-brand-lg">
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
                  <div className="alert surface-elevated border-status-error text-status-error mb-6 rounded-xl">
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

                {/* Import Guidance */}
                {guidance && (
                  <div className="mb-6">
                    <div
                      className={`alert rounded-xl ${
                        importPreview?.metadata.validCount === 0
                          ? "surface-elevated border-status-error text-status-error"
                          : importPreview?.metadata.hasWarnings
                          ? "surface-elevated border-yellow-200 text-yellow-800 bg-yellow-50"
                          : "surface-elevated border-status-success text-status-success"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="font-bold mb-1">{guidance.title}</div>
                          <div className="text-sm mb-3">
                            {guidance.description}
                          </div>
                          {guidance.suggestions.length > 0 && (
                            <ul className="text-sm space-y-1">
                              {guidance.suggestions.map((suggestion, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2"
                                >
                                  <span className="text-xs mt-1">•</span>
                                  <span>{suggestion}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Preview */}
                {importPreview && importPreview.flashcards.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-status-success" />
                        <span className="font-medium text-primary">
                          Preview ({importPreview.metadata.totalFound} items
                          found)
                        </span>
                        {importPreview.metadata.hasWarnings && (
                          <div className="flex items-center gap-1 ml-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            <span className="text-xs text-yellow-600">
                              Has warnings
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowInvalid(!showInvalid)}
                          className="btn btn-xs btn-outline gap-1 interactive-hover transition-all transition-normal rounded-lg"
                          disabled={importPreview.metadata.invalidCount === 0}
                        >
                          {showInvalid ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                          {showInvalid ? "Hide" : "Show"} Invalid (
                          {importPreview.metadata.invalidCount})
                        </button>
                      </div>
                    </div>

                    {/* Selection Controls */}
                    <div className="flex items-center justify-between mb-4 p-3 surface-secondary border border-subtle rounded-xl">
                      <span className="text-sm text-muted">
                        {selectedItems.size} of{" "}
                        {importPreview.metadata.validCount} valid items selected
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={selectAllValid}
                          className="btn btn-xs btn-outline interactive-hover transition-all transition-normal rounded-lg"
                          disabled={
                            selectedItems.size ===
                            importPreview.metadata.validCount
                          }
                        >
                          Select All Valid
                        </button>
                        <button
                          onClick={deselectAll}
                          className="btn btn-xs btn-outline interactive-hover transition-all transition-normal rounded-lg"
                          disabled={selectedItems.size === 0}
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    <div className="surface-secondary border border-subtle rounded-xl p-4 max-h-96 overflow-y-auto custom-scrollbar backdrop-blur">
                      <div className="space-y-3">
                        {importPreview.flashcards.map((card, index) => {
                          if (!showInvalid && !card.isValid) return null;

                          return (
                            <div
                              key={index}
                              className={`surface-elevated border rounded-xl p-3 group transition-all transition-normal ${
                                card.isValid
                                  ? selectedItems.has(index)
                                    ? "border-brand-primary bg-brand-primary/5 shadow-brand"
                                    : "border-subtle hover:shadow-brand"
                                  : "border-red-200 bg-red-50"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {card.isValid && (
                                  <input
                                    type="checkbox"
                                    checked={selectedItems.has(index)}
                                    onChange={() => toggleItemSelection(index)}
                                    className="checkbox checkbox-sm checkbox-primary mt-1 flex-shrink-0"
                                  />
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-medium text-muted">
                                      Card {index + 1}
                                    </span>
                                    {card.isValid ? (
                                      <CheckCircle2 className="w-4 h-4 text-status-success" />
                                    ) : (
                                      <AlertTriangle className="w-4 h-4 text-status-error" />
                                    )}
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <div className="text-xs font-medium text-muted mb-1 uppercase tracking-wider">
                                        Front:
                                      </div>
                                      <div className="text-sm text-primary line-clamp-3 bg-white/50 rounded p-2">
                                        {card.front || (
                                          <span className="text-red-500 italic">
                                            Missing
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs font-medium text-muted mb-1 uppercase tracking-wider">
                                        Back:
                                      </div>
                                      <div className="text-sm text-primary line-clamp-3 bg-white/50 rounded p-2">
                                        {card.back || (
                                          <span className="text-red-500 italic">
                                            Missing
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Show validation errors for invalid cards */}
                                  {!card.isValid && card.validationErrors && (
                                    <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs">
                                      <div className="font-medium text-red-800 mb-1">
                                        Validation Errors:
                                      </div>
                                      <ul className="space-y-1">
                                        {card.validationErrors.map(
                                          (error, errorIndex) => (
                                            <li
                                              key={errorIndex}
                                              className="text-red-700"
                                            >
                                              • {error.message}
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {importPreview.flashcards.filter(
                          (card) => showInvalid || card.isValid
                        ).length === 0 && (
                          <div className="text-center text-muted py-8">
                            {showInvalid
                              ? "No items to display"
                              : "No valid items found. Click 'Show Invalid' to see problematic items."}
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
                      &quot;front&quot; and &quot;back&quot; properties (or
                      equivalent names):
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
                        <br />• front, question, q, prompt, term, word, concept,
                        problem (for front side)
                        <br />• back, answer, a, response, definition, solution,
                        explanation, meaning (for back side)
                        <br />• tags, categories, labels, keywords, topics (for
                        optional tags)
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
                    disabled={
                      !importPreview || selectedItems.size === 0 || importing
                    }
                  >
                    <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />
                    <div className="relative z-10 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Import {selectedItems.size} Card
                      {selectedItems.size !== 1 ? "s" : ""}
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
