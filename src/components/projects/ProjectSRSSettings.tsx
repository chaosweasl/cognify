import React from "react";
import { Brain, Settings, Clock, Target } from "lucide-react";
import { NormalizedProject } from "@/lib/utils/normalizeProject";

interface ProjectSRSSettingsProps {
  project: NormalizedProject;
  onChange: (updates: Partial<NormalizedProject>) => void;
  disabled?: boolean;
}

export function ProjectSRSSettings({
  project,
  onChange,
  disabled,
}: ProjectSRSSettingsProps) {
  const handleNumberArrayChange = (field: string, value: string) => {
    try {
      const numbers = value
        .split(",")
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n) && n > 0);
      onChange({ [field]: numbers });
    } catch {
      // Invalid input, ignore
    }
  };

  const handleNumberChange = (field: string, value: number) => {
    if (value >= 0) {
      onChange({ [field]: value });
    }
  };

  const handleFloatChange = (field: string, value: number) => {
    if (value >= 0) {
      onChange({ [field]: value });
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    onChange({ [field]: value });
  };

  const handleBooleanChange = (field: string, value: boolean) => {
    onChange({ [field]: value });
  };

  return (
    <div className="card surface-glass backdrop-blur shadow-lg border-primary">
      <div className="card-body p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 brand-primary" />
          <h2 className="card-title text-lg text-primary">
            Spaced Repetition Settings
          </h2>
        </div>

        <div className="space-y-6">
          {/* Learning Steps */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium text-secondary">
                Learning Steps (minutes)
              </span>
              <span className="label-text-alt text-subtle">
                Comma-separated intervals for new cards
              </span>
            </label>
            <input
              type="text"
              value={project.learning_steps?.join(", ") || "1, 10"}
              onChange={(e) =>
                handleNumberArrayChange("learning_steps", e.target.value)
              }
              className="input input-bordered border-primary interactive-focus"
              placeholder="1, 10"
              disabled={disabled}
            />
            <label className="label">
              <span className="label-text-alt text-muted">
                New cards will be shown again after these intervals (in minutes)
              </span>
            </label>
          </div>

          {/* Relearning Steps */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium text-secondary">
                Relearning Steps (minutes)
              </span>
              <span className="label-text-alt text-subtle">
                Intervals for failed review cards
              </span>
            </label>
            <input
              type="text"
              value={project.relearning_steps?.join(", ") || "10"}
              onChange={(e) =>
                handleNumberArrayChange("relearning_steps", e.target.value)
              }
              className="input input-bordered border-primary interactive-focus"
              placeholder="10"
              disabled={disabled}
            />
          </div>

          {/* Intervals Section */}
          <div className="divider text-sm text-muted">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Graduation Intervals</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-secondary">
                  Graduating Interval (days)
                </span>
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={project.graduating_interval || 1}
                onChange={(e) =>
                  handleNumberChange(
                    "graduating_interval",
                    parseInt(e.target.value) || 1
                  )
                }
                className="input input-bordered border-primary interactive-focus"
                disabled={disabled}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-secondary">
                  Easy Interval (days)
                </span>
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={project.easy_interval || 4}
                onChange={(e) =>
                  handleNumberChange(
                    "easy_interval",
                    parseInt(e.target.value) || 4
                  )
                }
                className="input input-bordered border-primary interactive-focus"
                disabled={disabled}
              />
            </div>
          </div>

          {/* Ease Factors Section */}
          <div className="divider text-sm text-muted">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>Ease Factors</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-secondary">
                  Starting Ease
                </span>
              </label>
              <input
                type="number"
                min="1.0"
                max="5.0"
                step="0.1"
                value={project.starting_ease || 2.5}
                onChange={(e) =>
                  handleFloatChange(
                    "starting_ease",
                    parseFloat(e.target.value) || 2.5
                  )
                }
                className="input input-bordered border-primary interactive-focus"
                disabled={disabled}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-secondary">
                  Minimum Ease
                </span>
              </label>
              <input
                type="number"
                min="1.0"
                max="3.0"
                step="0.1"
                value={project.minimum_ease || 1.3}
                onChange={(e) =>
                  handleFloatChange(
                    "minimum_ease",
                    parseFloat(e.target.value) || 1.3
                  )
                }
                className="input input-bordered border-primary interactive-focus"
                disabled={disabled}
              />
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="divider text-sm text-muted">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Advanced Settings</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-secondary">
                  Easy Bonus
                </span>
              </label>
              <input
                type="number"
                min="1.0"
                max="3.0"
                step="0.1"
                value={project.easy_bonus || 1.3}
                onChange={(e) =>
                  handleFloatChange(
                    "easy_bonus",
                    parseFloat(e.target.value) || 1.3
                  )
                }
                className="input input-bordered border-primary interactive-focus"
                disabled={disabled}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-secondary">
                  Hard Interval Factor
                </span>
              </label>
              <input
                type="number"
                min="0.5"
                max="1.0"
                step="0.05"
                value={project.hard_interval_factor || 1.2}
                onChange={(e) =>
                  handleFloatChange(
                    "hard_interval_factor",
                    parseFloat(e.target.value) || 1.2
                  )
                }
                className="input input-bordered border-primary interactive-focus"
                disabled={disabled}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-secondary">
                  Leech Threshold
                </span>
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={project.leech_threshold || 8}
                onChange={(e) =>
                  handleNumberChange(
                    "leech_threshold",
                    parseInt(e.target.value) || 8
                  )
                }
                className="input input-bordered border-primary interactive-focus"
                disabled={disabled}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-secondary">
                  Max Interval (days)
                </span>
              </label>
              <input
                type="number"
                min="1"
                max="36500"
                value={project.max_interval || 36500}
                onChange={(e) =>
                  handleNumberChange(
                    "max_interval",
                    parseInt(e.target.value) || 36500
                  )
                }
                className="input input-bordered border-primary interactive-focus"
                disabled={disabled}
              />
            </div>
          </div>

          {/* Boolean Settings */}
          <div className="space-y-3">
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text text-secondary">Review Ahead</span>
                <input
                  type="checkbox"
                  checked={project.review_ahead || false}
                  onChange={(e) =>
                    handleBooleanChange("review_ahead", e.target.checked)
                  }
                  className="checkbox checkbox-primary"
                  disabled={disabled}
                />
              </label>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text text-secondary">Bury Siblings</span>
                <input
                  type="checkbox"
                  checked={project.bury_siblings || false}
                  onChange={(e) =>
                    handleBooleanChange("bury_siblings", e.target.checked)
                  }
                  className="checkbox checkbox-primary"
                  disabled={disabled}
                />
              </label>
            </div>
          </div>

          {/* Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-secondary">
                  New Card Order
                </span>
              </label>
              <select
                value={project.new_card_order || "random"}
                onChange={(e) =>
                  handleSelectChange("new_card_order", e.target.value)
                }
                className="select select-bordered border-primary interactive-focus"
                disabled={disabled}
              >
                <option value="random">Random</option>
                <option value="fifo">First In, First Out</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium text-secondary">
                  Leech Action
                </span>
              </label>
              <select
                value={project.leech_action || "suspend"}
                onChange={(e) =>
                  handleSelectChange("leech_action", e.target.value)
                }
                className="select select-bordered border-primary interactive-focus"
                disabled={disabled}
              >
                <option value="suspend">Suspend</option>
                <option value="tag">Tag Only</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-muted surface-secondary p-3 rounded-lg">
            <p className="font-medium mb-1 text-secondary">
              SRS Settings Information:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>
                These settings control how this project&apos;s spaced repetition
                algorithm works
              </li>
              <li>
                Changes only affect new reviews, not cards already in progress
              </li>
              <li>
                Reset the SRS data below to apply new settings to existing cards
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
