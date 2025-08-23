import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Trash2, Eye, AlertTriangle, CheckCircle2 } from "lucide-react";

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
    <div className="modal modal-open z-[1000]">
      <div className="modal-box max-w-4xl w-full max-h-[90vh] overflow-y-auto surface-elevated border border-subtle backdrop-blur">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-subtle">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-gradient-glass rounded-lg">
              <Eye className="w-6 h-6 brand-primary" />
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
                  className="btn btn-sm border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 interactive-hover"
                  onClick={deleteSelectedCards}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Selected ({selectedCards.size})
                </button>
                <div className="divider divider-horizontal mx-0" />
              </>
            )}

            <button
              className="btn btn-sm border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 interactive-hover"
              onClick={() => setConfirmDeleteAll(true)}
              disabled={flashcards.length === 0}
            >
              <Trash2 className="w-4 h-4" />
              Delete All
            </button>

            <button
              className="btn btn-sm btn-circle surface-secondary border-subtle interactive-hover"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="stat surface-secondary border border-subtle rounded-xl p-4 backdrop-blur">
            <div className="stat-title text-xs text-muted uppercase tracking-wider">
              Total Cards
            </div>
            <div className="stat-value text-2xl text-primary">
              {flashcards.length}
            </div>
          </div>
          <div className="stat surface-secondary border border-subtle rounded-xl p-4 backdrop-blur">
            <div className="stat-title text-xs text-muted uppercase tracking-wider">
              Valid Cards
            </div>
            <div className="stat-value text-2xl text-green-500">
              {validCards.length}
            </div>
          </div>
          <div className="stat surface-secondary border border-subtle rounded-xl p-4 backdrop-blur">
            <div className="stat-title text-xs text-muted uppercase tracking-wider">
              Selected
            </div>
            <div className="stat-value text-2xl brand-primary">
              {selectedCards.size}
            </div>
          </div>
        </div>

        {/* Enhanced Table */}
        <div className="overflow-x-auto mb-6 surface-secondary border border-subtle rounded-xl backdrop-blur">
          <table className="table table-zebra w-full text-sm">
            <thead className="surface-elevated">
              <tr>
                <th className="w-12">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={
                      selectedCards.size === flashcards.length &&
                      flashcards.length > 0
                    }
                    onChange={selectAllCards}
                  />
                </th>
                <th className="w-16">#</th>
                <th className="w-8">Status</th>
                <th className="min-w-48">Front</th>
                <th className="min-w-48">Back</th>
                <th className="text-center w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flashcards.map((fc, idx) => {
                const isValid = isCardValid(fc);
                const isSelected = selectedCards.has(idx);

                return (
                  <tr
                    key={idx}
                    className={`transition-all transition-fast ${
                      isSelected ? "surface-elevated border-brand" : ""
                    }`}
                  >
                    <td>
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={isSelected}
                        onChange={() => toggleCardSelection(idx)}
                      />
                    </td>
                    <td className="font-medium text-secondary">{idx + 1}</td>
                    <td>
                      {isValid ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      )}
                    </td>
                    <td className="max-w-48">
                      <div
                        className={`truncate ${
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
                        className={`truncate ${
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
                          className="btn btn-xs btn-outline border-brand-primary text-brand-primary hover:bg-gradient-brand hover:text-white interactive-hover"
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
                          className="btn btn-xs border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 interactive-hover"
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
              <div className="text-muted">No flashcards found</div>
            </div>
          )}
        </div>

        {/* Enhanced Footer */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-4 border-t border-subtle">
          <div className="text-sm text-muted">
            Changes will be saved when you save the project
          </div>
          <button
            className="btn surface-secondary border-subtle interactive-hover"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {/* Enhanced Confirm Delete All Modal */}
        {confirmDeleteAll && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="modal-box max-w-md surface-elevated border border-subtle backdrop-blur">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/10 rounded-lg">
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
                  className="btn surface-secondary border-subtle interactive-hover"
                  onClick={() => setConfirmDeleteAll(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-500 interactive-hover"
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
