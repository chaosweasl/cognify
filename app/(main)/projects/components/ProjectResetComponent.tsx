import { useState } from "react";
import { resetProjectSRSData } from "../actions/project-reset-actions";

interface ProjectResetComponentProps {
  projectId: string;
  projectName: string;
  onResetComplete?: () => void;
}

export default function ProjectResetComponent({
  projectId,
  projectName,
  onResetComplete,
}: ProjectResetComponentProps) {
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);

    try {
      const result = await resetProjectSRSData(projectId);

      if (result.success) {
        // Show success message
        const toast = document.createElement("div");
        toast.className = "toast toast-top toast-end";
        toast.innerHTML = `
          <div class="alert alert-success">
            <span>Project SRS data reset successfully!</span>
          </div>
        `;
        document.body.appendChild(toast);

        // Remove toast after 3 seconds
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 3000);

        onResetComplete?.();
      } else {
        // Show error message
        const toast = document.createElement("div");
        toast.className = "toast toast-top toast-end";
        toast.innerHTML = `
          <div class="alert alert-error">
            <span>Failed to reset project: ${result.error}</span>
          </div>
        `;
        document.body.appendChild(toast);

        // Remove toast after 5 seconds
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 5000);
      }
    } catch (error) {
      console.error("Reset failed:", error);

      // Show error message
      const toast = document.createElement("div");
      toast.className = "toast toast-top toast-end";
      toast.innerHTML = `
        <div class="alert alert-error">
          <span>An unexpected error occurred</span>
        </div>
      `;
      document.body.appendChild(toast);

      // Remove toast after 5 seconds
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 5000);
    } finally {
      setIsResetting(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <>
      <div className="card bg-base-100 shadow-xl border border-warning">
        <div className="card-body">
          <h3 className="card-title text-warning">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.924-.833-2.598 0L3.616 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            Reset SRS Data
          </h3>
          <p className="text-base-content/80">
            This will permanently delete all SRS learning progress for this
            project, including:
          </p>
          <ul className="list-disc list-inside text-sm text-base-content/70 ml-4">
            <li>All flashcard learning states and schedules</li>
            <li>Daily study statistics for today</li>
            <li>Related notifications</li>
          </ul>
          <p className="text-warning font-medium">
            ⚠️ This action cannot be undone!
          </p>
          <div className="card-actions justify-end">
            <button
              className="btn btn-warning"
              onClick={() => setShowConfirmModal(true)}
              disabled={isResetting}
            >
              {isResetting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Resetting...
                </>
              ) : (
                "Reset SRS Data"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-error">Confirm Reset</h3>
            <p className="py-4">
              Are you sure you want to reset all SRS data for{" "}
              <span className="font-semibold">&quot;{projectName}&quot;</span>?
            </p>
            <p className="text-sm text-base-content/70 mb-4">
              This will permanently delete all learning progress and cannot be
              undone.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowConfirmModal(false)}
                disabled={isResetting}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={handleReset}
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Resetting...
                  </>
                ) : (
                  "Yes, Reset Data"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
