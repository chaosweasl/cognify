import React from "react";
import {
  Edit3,
  CheckCircle2,
  AlertCircle,
  Calendar,
  RotateCcw,
} from "lucide-react";

interface ProjectInfoFormProps {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  newCardsPerDay: number;
  setNewCardsPerDay: (v: number) => void;
  maxReviewsPerDay: number;
  setMaxReviewsPerDay: (v: number) => void;
  isValid: boolean;
  saving: boolean;
}

export function ProjectInfoForm({
  name,
  setName,
  description,
  setDescription,
  newCardsPerDay,
  setNewCardsPerDay,
  maxReviewsPerDay,
  setMaxReviewsPerDay,
  isValid,
  saving,
}: ProjectInfoFormProps) {
  return (
    <div className="card surface-glass backdrop-blur shadow-lg border-primary">
      <div className="card-body p-6">
        <div className="flex items-center gap-2 mb-4">
          <Edit3 className="w-5 h-5 brand-secondary" />
          <h2 className="card-title text-lg text-primary">Project Details</h2>
        </div>
        <div className="space-y-5">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium text-secondary">
                Project Name
              </span>
              <span className="label-text-alt text-status-error">
                {!name.trim() && "*Required"}
              </span>
            </label>
            <input
              className={`input input-bordered w-full transition-all duration-fast ${
                !name.trim()
                  ? "border-status-error text-status-error"
                  : "border-primary interactive-focus"
              }`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              disabled={saving}
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium text-secondary">
                Description
              </span>
              <span className="label-text-alt text-subtle">Optional</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full h-28 resize-none border-primary interactive-focus transition-all duration-fast"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your flashcard set..."
              disabled={saving}
            />
          </div>

          {/* Daily Limits Section */}
          <div className="divider text-sm text-muted">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Daily Study Limits</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-secondary">
                  <div className="flex items-center gap-2">
                    <span>New Cards Per Day</span>
                    <div
                      className="tooltip"
                      data-tip="Maximum number of new flashcards to introduce each day"
                    >
                      <AlertCircle className="w-4 h-4 text-subtle" />
                    </div>
                  </div>
                </span>
              </label>
              <input
                type="number"
                min="0"
                max="9999"
                className="input input-bordered w-full border-primary interactive-focus transition-all duration-fast"
                value={newCardsPerDay}
                onChange={(e) =>
                  setNewCardsPerDay(Math.max(0, parseInt(e.target.value) || 0))
                }
                disabled={saving}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-secondary">
                  <div className="flex items-center gap-2">
                    <span>Max Reviews Per Day</span>
                    <div
                      className="tooltip"
                      data-tip="Maximum number of review cards to show each day (0 = unlimited)"
                    >
                      <RotateCcw className="w-4 h-4 text-subtle" />
                    </div>
                  </div>
                </span>
              </label>
              <input
                type="number"
                min="0"
                max="9999"
                className="input input-bordered w-full border-primary interactive-focus transition-all duration-fast"
                value={maxReviewsPerDay}
                onChange={(e) =>
                  setMaxReviewsPerDay(
                    Math.max(0, parseInt(e.target.value) || 0)
                  )
                }
                disabled={saving}
              />
            </div>
          </div>

          <div className="text-sm text-muted surface-secondary p-3 rounded-lg">
            <p className="font-medium mb-1 text-secondary">
              Daily Limits Explanation:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>
                <strong>New Cards:</strong> Controls how many unstudied cards
                are introduced daily
              </li>
              <li>
                <strong>Reviews:</strong> Limits daily review sessions (set to 0
                for unlimited)
              </li>
              <li>
                <strong>Learning cards</strong> are never limited and must
                always be completed
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-6 p-3 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            {isValid ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-status-success" />
                <span className="text-status-success font-medium">
                  Ready to save
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-status-warning" />
                <span className="text-status-warning font-medium">
                  Project name required
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
