import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

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
  if (!open || typeof window === "undefined") return null;
  return createPortal(
    <div className="modal modal-open z-[1000]">
      <div className="modal-box max-w-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Manage Flashcards</h3>
            <div className="flex gap-2 items-center">
              <button
                className="btn btn-outline btn-error btn-sm"
                onClick={() => setConfirmDeleteAll(true)}
                disabled={flashcards.length === 0}
              >
                Delete All Cards
              </button>
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="text-xs text-base-content/50 mt-1 ml-1">
            Changes will be updated when you save the project.
          </div>
        </div>
        <div className="overflow-x-auto mb-4">
          <table className="table table-zebra w-full text-sm">
            <thead>
              <tr>
                <th className="w-8">#</th>
                <th className="w-40 max-w-[10rem]">Front</th>
                <th className="w-40 max-w-[10rem]">Back</th>
                <th className="text-center w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flashcards.map((fc, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td className="max-w-[10rem] truncate" title={fc.front}>
                    {fc.front}
                  </td>
                  <td className="max-w-[10rem] truncate" title={fc.back}>
                    {fc.back}
                  </td>
                  <td className="flex gap-2 justify-center">
                    <button
                      className="btn btn-xs btn-outline btn-primary"
                      onClick={() => {
                        onJump(idx);
                        onClose();
                      }}
                    >
                      Jump to
                    </button>
                    <button
                      className="btn btn-xs btn-outline btn-error"
                      onClick={() => onDelete(idx)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end items-center mt-4">
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>
        {/* Confirm Delete All Modal */}
        {confirmDeleteAll && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40">
            <div className="modal-box max-w-sm">
              <h4 className="font-bold mb-2">Delete all flashcards?</h4>
              <p className="mb-4 text-sm">
                This action cannot be undone. Are you sure you want to delete
                all cards?
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  className="btn btn-ghost"
                  onClick={() => setConfirmDeleteAll(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-error"
                  onClick={() => {
                    onDeleteAll();
                    setConfirmDeleteAll(false);
                    onClose();
                  }}
                >
                  Delete All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>,
    document.body
  );
}
