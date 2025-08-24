import { useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Settings,
  MoreHorizontal,
} from "lucide-react";

type ModalFlashcard = {
  front: string;
  back: string;
};

interface ManageFlashcardsModalProps {
  open: boolean;
  onClose: () => void;
  flashcards: ModalFlashcard[];
  onJump: (idx: number) => void;
  onDelete: (idx: number) => void;
  onDeleteAll: () => void;
}

export function ManageFlashcardsModal({
  open,
  onClose,
  flashcards,
  onJump,
  onDelete,
  onDeleteAll,
}: ManageFlashcardsModalProps) {
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());

  if (!open || typeof window === "undefined") return null;

  const validCards = flashcards.filter(
    (fc, idx) =>
      fc &&
      typeof fc === "object" &&
      ((typeof fc.front === "string" && fc.front.trim()) ||
        (typeof fc.back === "string" && fc.back.trim()))
  );

  const toggleCardSelection = (idx: number) => {
    const newSelection = new Set(selectedCards);
    if (newSelection.has(idx)) {
      newSelection.delete(idx);
    } else {
      newSelection.add(idx);
    }
    setSelectedCards(newSelection);
  };

  const selectAllCards = () => {
    if (selectedCards.size === flashcards.length) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(flashcards.map((_, idx) => idx)));
    }
  };

  const deleteSelectedCards = () => {
    const sortedIndices = Array.from(selectedCards).sort((a, b) => b - a);
    sortedIndices.forEach((idx) => onDelete(idx));
    setSelectedCards(new Set());
  };

  const isCardValid = (card: ModalFlashcard) => {
    return (
      card &&
      typeof card === "object" &&
      ((typeof card.front === "string" && card.front.trim()) ||
        (typeof card.back === "string" && card.back.trim()))
    );
  };

  return createPortal(
    <div className="modal modal-open z-[1000] bg-black/40 backdrop-blur-sm">
      <div className="modal-box max-w-5xl w-full max-h-[90vh] overflow-y-auto surface-elevated border border-subtle backdrop-blur rounded-2xl shadow-brand-lg">
        {/* Animated background overlay */}
        <div className="absolute inset-0 bg-gradient-glass opacity-20 pointer-events-none rounded-2xl" />

        <div className="relative z-10">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-subtle">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="p-3 bg-gradient-brand rounded-xl shadow-brand transform group-hover:scale-110 transition-all transition-normal">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-glass rounded-xl blur opacity-0 group-hover:opacity-100 transition-all transition-normal" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-primary">
                  Manage Flashcards
                </h3>
                <p className="text-sm text-muted mt-1">
                  View, navigate, and organize your flashcard collection
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Bulk Actions */}
              {selectedCards.size > 0 && (
                <>
                  <button
                    className="btn btn-sm bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 interactive-hover rounded-xl transition-all transition-normal"
                    onClick={deleteSelectedCards}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Selected ({selectedCards.size})
                  </button>
                  <div className="divider divider-horizontal mx-0" />
                </>
              )}

              <button
                className="btn btn-sm bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 interactive-hover rounded-xl transition-all transition-normal"
                onClick={() => setConfirmDeleteAll(true)}
                disabled={flashcards.length === 0}
              >
                <Trash2 className="w-4 h-4" />
                Delete All
              </button>

              <button
                className="btn btn-sm btn-circle surface-secondary border-subtle interactive-hover rounded-xl"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Enhanced Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="stat surface-secondary border border-subtle rounded-xl p-4 backdrop-blur group hover:shadow-brand transition-all transition-normal">
              <div className="stat-title text-xs text-muted uppercase tracking-wider">
                Total Cards
              </div>
              <div className="stat-value text-2xl text-primary group-hover:brand-primary transition-colors transition-normal">
                {flashcards.length}
              </div>
              <div className="w-full h-1 bg-border-subtle rounded-full mt-2">
                <div
                  className="h-full bg-gradient-brand rounded-full"
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <div className="stat surface-secondary border border-subtle rounded-xl p-4 backdrop-blur group hover:shadow-brand transition-all transition-normal">
              <div className="stat-title text-xs text-muted uppercase tracking-wider">
                Valid Cards
              </div>
              <div className="stat-value text-2xl text-green-500 group-hover:scale-110 transition-transform transition-normal">
                {validCards.length}
              </div>
              <div className="w-full h-1 bg-border-subtle rounded-full mt-2">
                <div
                  className="h-full bg-green-500 rounded-full transition-all transition-normal"
                  style={{
                    width: `${
                      flashcards.length > 0
                        ? (validCards.length / flashcards.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="stat surface-secondary border border-subtle rounded-xl p-4 backdrop-blur group hover:shadow-brand transition-all transition-normal">
              <div className="stat-title text-xs text-muted uppercase tracking-wider">
                Selected
              </div>
              <div className="stat-value text-2xl brand-primary group-hover:scale-110 transition-transform transition-normal">
                {selectedCards.size}
              </div>
              <div className="w-full h-1 bg-border-subtle rounded-full mt-2">
                <div
                  className="h-full bg-gradient-brand rounded-full transition-all transition-normal"
                  style={{
                    width: `${
                      flashcards.length > 0
                        ? (selectedCards.size / flashcards.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Enhanced Table */}
          <div className="overflow-x-auto mb-6 surface-secondary border border-subtle rounded-xl backdrop-blur">
            <table className="table table-zebra w-full text-sm">
              <thead className="surface-elevated">
                <tr>
                  <th className="w-12">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary"
                        checked={
                          selectedCards.size === flashcards.length &&
                          flashcards.length > 0
                        }
                        onChange={selectAllCards}
                      />
                    </label>
                  </th>
                  <th className="w-16 font-semibold text-secondary">#</th>
                  <th className="w-8 font-semibold text-secondary">Status</th>
                  <th className="min-w-48 font-semibold text-secondary">
                    Front
                  </th>
                  <th className="min-w-48 font-semibold text-secondary">
                    Back
                  </th>
                  <th className="text-center w-40 font-semibold text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {flashcards.map((fc, idx) => {
                  const isValid = isCardValid(fc);
                  const isSelected = selectedCards.has(idx);

                  return (
                    <tr
                      key={idx}
                      className={`transition-all transition-fast group hover:surface-elevated ${
                        isSelected
                          ? "surface-elevated border-brand shadow-brand"
                          : ""
                      }`}
                    >
                      <td>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary"
                            checked={isSelected}
                            onChange={() => toggleCardSelection(idx)}
                          />
                        </label>
                      </td>
                      <td className="font-medium text-secondary">{idx + 1}</td>
                      <td>
                        {isValid ? (
                          <div className="relative">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <div className="absolute inset-0 w-4 h-4 text-green-500 animate-ping opacity-25">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                          </div>
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        )}
                      </td>
                      <td className="max-w-48">
                        <div
                          className={`truncate transition-colors transition-normal ${
                            isValid ? "text-primary" : "text-muted"
                          }`}
                          title={fc.front}
                        >
                          {fc.front || (
                            <span className="italic text-muted">Empty</span>
                          )}
                        </div>
                      </td>
                      <td className="max-w-48">
                        <div
                          className={`truncate transition-colors transition-normal ${
                            isValid ? "text-primary" : "text-muted"
                          }`}
                          title={fc.back}
                        >
                          {fc.back || (
                            <span className="italic text-muted">Empty</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2 justify-center">
                          <button
                            className="btn btn-xs btn-outline border-brand-primary text-brand-primary hover:bg-gradient-brand hover:text-white interactive-hover transition-all transition-normal rounded-lg"
                            onClick={() => {
                              onJump(idx);
                              onClose();
                            }}
                            title="Jump to this card in editor"
                          >
                            <Eye className="w-3 h-3" />
                            Edit
                          </button>
                          <button
                            className="btn btn-xs bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 interactive-hover transition-all transition-normal rounded-lg"
                            onClick={() => onDelete(idx)}
                            title="Delete this card"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {flashcards.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 surface-elevated rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-muted" />
                </div>
                <div className="text-muted">No flashcards found</div>
              </div>
            )}
          </div>

          {/* Enhanced Footer */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-4 border-t border-subtle">
            <div className="text-sm text-muted flex items-center gap-2">
              <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
              Changes will be saved when you save the project
            </div>
            <button
              className="btn surface-secondary border-subtle interactive-hover rounded-xl"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        {/* Enhanced Confirm Delete All Modal */}
        {confirmDeleteAll && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="modal-box max-w-md surface-elevated border border-subtle backdrop-blur rounded-2xl shadow-brand-lg">
              {/* Background overlay */}
              <div className="absolute inset-0 bg-gradient-glass opacity-20 pointer-events-none rounded-2xl" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-red-500/10 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-primary">
                      Delete All Flashcards?
                    </h4>
                    <p className="text-sm text-muted">
                      This action cannot be undone
                    </p>
                  </div>
                </div>

                <p className="text-secondary mb-6">
                  Are you sure you want to delete all {flashcards.length}{" "}
                  flashcards? This will permanently remove all cards from your
                  project.
                </p>

                <div className="flex gap-3 justify-end">
                  <button
                    className="btn surface-secondary border-subtle interactive-hover rounded-xl"
                    onClick={() => setConfirmDeleteAll(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 interactive-hover transition-all transition-normal rounded-xl"
                    onClick={() => {
                      onDeleteAll();
                      setSelectedCards(new Set());
                      setConfirmDeleteAll(false);
                      onClose();
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete All Cards
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div
        className="modal-backdrop bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
    </div>,
    document.body
  );
}
