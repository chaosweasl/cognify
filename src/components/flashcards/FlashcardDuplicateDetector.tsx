"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, Copy, Trash2, CheckSquare, Zap } from "lucide-react";
import { toast } from "sonner";
import { Flashcard } from "@/src/types";

interface DuplicateFlashcard {
  original: Flashcard;
  duplicates: Flashcard[];
  selectedToKeep?: string; // ID of the flashcard to keep
  selectedToDelete: string[]; // IDs of flashcards to delete
}

interface FlashcardDuplicateDetectorProps {
  flashcards: Flashcard[];
  onMergeDuplicates: (flashcardsToDelete: string[]) => Promise<void>;
  disabled?: boolean;
}

export function FlashcardDuplicateDetector({
  flashcards,
  onMergeDuplicates,
  disabled = false,
}: FlashcardDuplicateDetectorProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);

  // Detect duplicates using fuzzy matching
  const duplicateGroups = useMemo(() => {
    const groups: DuplicateFlashcard[] = [];
    const processed = new Set<string>();

    for (const card of flashcards) {
      if (processed.has(card.id)) continue;

      const duplicates = flashcards.filter((other) => {
        if (other.id === card.id) return false;
        if (processed.has(other.id)) return false;

        // Exact match check
        if (
          card.front.trim().toLowerCase() ===
            other.front.trim().toLowerCase() &&
          card.back.trim().toLowerCase() === other.back.trim().toLowerCase()
        ) {
          return true;
        }

        // Fuzzy match check (90% similarity)
        const frontSimilarity = calculateSimilarity(card.front, other.front);
        const backSimilarity = calculateSimilarity(card.back, other.back);

        return frontSimilarity > 0.9 && backSimilarity > 0.9;
      });

      if (duplicates.length > 0) {
        // Mark all as processed
        processed.add(card.id);
        duplicates.forEach((dup) => processed.add(dup.id));

        groups.push({
          original: card,
          duplicates,
          selectedToKeep: card.id, // Default to keeping the original
          selectedToDelete: duplicates.map((dup) => dup.id),
        });
      }
    }

    return groups;
  }, [flashcards]);

  // Simple similarity function using Levenshtein distance
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    const matrix = [];
    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLength = Math.max(s1.length, s2.length);
    return (maxLength - matrix[s2.length][s1.length]) / maxLength;
  };

  const handleDetectDuplicates = () => {
    setIsDetecting(true);

    // Simulate processing time for better UX
    setTimeout(() => {
      setIsDetecting(false);
      setShowDuplicates(true);

      if (duplicateGroups.length === 0) {
        toast.success("No duplicates found! Your flashcards are clean.");
      } else {
        toast.info(
          `Found ${duplicateGroups.length} duplicate group${
            duplicateGroups.length !== 1 ? "s" : ""
          }`
        );
      }
    }, 1000);
  };

  const handleMerge = async () => {
    if (duplicateGroups.length === 0) return;

    setIsMerging(true);
    try {
      const allIdsToDelete = duplicateGroups.flatMap(
        (group) => group.selectedToDelete
      );

      await onMergeDuplicates(allIdsToDelete);

      toast.success(
        `Merged duplicates! Deleted ${
          allIdsToDelete.length
        } duplicate flashcard${allIdsToDelete.length !== 1 ? "s" : ""}.`
      );

      setShowDuplicates(false);
    } catch (error) {
      console.error("Merge error:", error);
      toast.error("Failed to merge duplicates. Please try again.");
    } finally {
      setIsMerging(false);
    }
  };

  if (!showDuplicates) {
    return (
      <button
        className="btn btn-outline border-warning text-warning hover:bg-warning hover:text-warning-content interactive-hover transition-all transition-normal rounded-xl group relative overflow-hidden"
        onClick={handleDetectDuplicates}
        disabled={disabled || isDetecting || flashcards.length === 0}
        title={
          flashcards.length === 0
            ? "No flashcards to check"
            : `Check ${flashcards.length} flashcard${
                flashcards.length !== 1 ? "s" : ""
              } for duplicates`
        }
      >
        <div className="absolute inset-0 bg-gradient-glass translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />
        <div className="relative z-10 flex items-center gap-2">
          {isDetecting ? (
            <>
              <Copy className="w-4 h-4 animate-pulse" />
              Detecting...
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Find Duplicates
              {flashcards.length > 0 && (
                <span className="text-xs opacity-75">
                  ({flashcards.length})
                </span>
              )}
            </>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-primary">
            Duplicate Detection Results
          </h4>
          {duplicateGroups.length > 0 && (
            <span className="badge badge-warning">
              {duplicateGroups.length} group
              {duplicateGroups.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {duplicateGroups.length > 0 && (
            <button
              className="btn bg-gradient-brand hover:bg-gradient-brand-hover text-white border-0 shadow-brand hover:shadow-brand-lg transition-all transition-normal relative overflow-hidden group rounded-xl"
              onClick={handleMerge}
              disabled={isMerging}
            >
              <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />
              <div className="relative z-10 flex items-center gap-2">
                {isMerging ? (
                  <>
                    <Zap className="w-4 h-4 animate-pulse" />
                    Merging...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Merge All
                  </>
                )}
              </div>
            </button>
          )}

          <button
            className="btn surface-secondary border-subtle interactive-hover rounded-xl"
            onClick={() => setShowDuplicates(false)}
          >
            Close
          </button>
        </div>
      </div>

      {duplicateGroups.length === 0 ? (
        <div className="alert bg-green-500/10 border-green-500/30 text-green-400 rounded-xl">
          <CheckSquare className="w-5 h-5" />
          <div>
            <div className="font-bold">No duplicates found!</div>
            <div className="text-sm mt-1">
              Your flashcards are already clean and unique.
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="alert bg-yellow-500/10 border-yellow-500/30 text-yellow-400 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <div className="font-bold">Duplicates detected</div>
              <div className="text-sm mt-1">
                Review the groups below. Cards selected for deletion will be
                removed.
              </div>
            </div>
          </div>

          {duplicateGroups.map((group, groupIndex) => (
            <div
              key={groupIndex}
              className="surface-elevated border border-subtle rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center gap-2 mb-3">
                <Copy className="w-4 h-4 text-warning" />
                <span className="font-medium text-secondary">
                  Duplicate Group {groupIndex + 1}
                </span>
                <span className="text-xs text-muted">
                  ({group.duplicates.length + 1} cards)
                </span>
              </div>

              <div className="grid gap-3">
                {/* Original card */}
                <div className="flex items-center gap-3 p-3 surface-secondary border border-subtle rounded-lg">
                  <CheckSquare className="w-5 h-5 text-success flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-success mb-1">
                      ✓ Keep (Original)
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                          Front:
                        </div>
                        <div className="text-sm text-primary truncate">
                          {group.original.front}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                          Back:
                        </div>
                        <div className="text-sm text-primary truncate">
                          {group.original.back}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Duplicate cards */}
                {group.duplicates.map((duplicate) => (
                  <div
                    key={duplicate.id}
                    className="flex items-center gap-3 p-3 surface-elevated border border-error/30 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5 text-error flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-error mb-1">
                        ✗ Delete (Duplicate)
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                            Front:
                          </div>
                          <div className="text-sm text-primary truncate">
                            {duplicate.front}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-muted uppercase tracking-wider mb-1">
                            Back:
                          </div>
                          <div className="text-sm text-primary truncate">
                            {duplicate.back}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
