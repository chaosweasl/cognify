"use client";
import React from "react";
import { useEnhancedSettings } from "@/components/CacheProvider";
import { useToast } from "@/components/toast-provider";
import { Info, RotateCcw } from "lucide-react";

export function SRSSettingsTab() {
  const {
    srsSettings,
    updateSRSSettings,
    resetSRSSettings,
    validateSRSSettings,
    error,
  } = useEnhancedSettings();
  const { showToast } = useToast();

  const [formData, setFormData] = React.useState(srsSettings);

  React.useEffect(() => {
    setFormData(srsSettings);
  }, [srsSettings]);

  const handleUpdate = (
    field: keyof typeof srsSettings,
    value: string | number | number[]
  ) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    // Validate and update
    const errors = validateSRSSettings({ [field]: value });
    if (errors.length === 0) {
      updateSRSSettings({ [field]: value });
      showToast("Setting updated", "success");
    } else {
      showToast(errors[0], "error");
    }
  };

  const handleLearningStepsChange = (steps: string) => {
    try {
      const parsedSteps = steps
        .split(",")
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n));
      if (parsedSteps.length > 0) {
        handleUpdate("LEARNING_STEPS", parsedSteps);
      }
    } catch {
      showToast("Invalid learning steps format", "error");
    }
  };

  const handleRelearningStepsChange = (steps: string) => {
    try {
      const parsedSteps = steps
        .split(",")
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n));
      if (parsedSteps.length > 0) {
        handleUpdate("RELEARNING_STEPS", parsedSteps);
      }
    } catch {
      showToast("Invalid relearning steps format", "error");
    }
  };

  const handleReset = () => {
    if (confirm("Reset all card settings to default?")) {
      resetSRSSettings();
      showToast("Card settings reset to default", "success");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-base-content">
          Card & Study Settings
        </h2>
        <button onClick={handleReset} className="btn btn-outline btn-sm gap-2">
          <RotateCcw className="w-4 h-4" />
          Reset to Default
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Daily Limits */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-base-content border-b pb-2">
          Daily Limits
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">New Cards Per Day</span>
              <div
                className="tooltip tooltip-left"
                data-tip="Maximum number of new cards to introduce each day"
              >
                <Info className="w-4 h-4 text-base-content/50" />
              </div>
            </label>
            <input
              type="number"
              min="0"
              value={formData.NEW_CARDS_PER_DAY}
              onChange={(e) =>
                handleUpdate("NEW_CARDS_PER_DAY", parseInt(e.target.value))
              }
              className="input input-bordered"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Max Reviews Per Day</span>
              <div
                className="tooltip tooltip-left"
                data-tip="Maximum number of review cards per day (0 = unlimited)"
              >
                <Info className="w-4 h-4 text-base-content/50" />
              </div>
            </label>
            <input
              type="number"
              min="0"
              value={formData.MAX_REVIEWS_PER_DAY}
              onChange={(e) =>
                handleUpdate("MAX_REVIEWS_PER_DAY", parseInt(e.target.value))
              }
              className="input input-bordered"
            />
          </div>
        </div>
      </div>

      {/* Learning Steps */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-base-content border-b pb-2">
          Learning & Relearning
        </h3>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Learning Steps (minutes)</span>
            <div
              className="tooltip tooltip-left"
              data-tip="Comma-separated steps for new cards (e.g., 1, 10, 1440)"
            >
              <Info className="w-4 h-4 text-base-content/50" />
            </div>
          </label>
          <input
            type="text"
            value={formData.LEARNING_STEPS.join(", ")}
            onChange={(e) => handleLearningStepsChange(e.target.value)}
            className="input input-bordered"
            placeholder="1, 10, 1440"
          />
          <label className="label">
            <span className="label-text-alt">
              Current:{" "}
              {formData.LEARNING_STEPS.map((s) =>
                s >= 1440 ? `${Math.round(s / 1440)}d` : `${s}m`
              ).join(" → ")}
            </span>
          </label>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Relearning Steps (minutes)</span>
            <div
              className="tooltip tooltip-left"
              data-tip="Steps for cards that lapse from review"
            >
              <Info className="w-4 h-4 text-base-content/50" />
            </div>
          </label>
          <input
            type="text"
            value={formData.RELEARNING_STEPS.join(", ")}
            onChange={(e) => handleRelearningStepsChange(e.target.value)}
            className="input input-bordered"
            placeholder="10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Graduating Interval (days)</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.GRADUATING_INTERVAL}
              onChange={(e) =>
                handleUpdate("GRADUATING_INTERVAL", parseInt(e.target.value))
              }
              className="input input-bordered"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Easy Interval (days)</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.EASY_INTERVAL}
              onChange={(e) =>
                handleUpdate("EASY_INTERVAL", parseInt(e.target.value))
              }
              className="input input-bordered"
            />
          </div>
        </div>
      </div>

      {/* Ease Factors */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-base-content border-b pb-2">
          Ease Factors & Intervals
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Starting Ease</span>
            </label>
            <input
              type="number"
              min="1.3"
              max="5"
              step="0.1"
              value={formData.STARTING_EASE}
              onChange={(e) =>
                handleUpdate("STARTING_EASE", parseFloat(e.target.value))
              }
              className="input input-bordered"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Minimum Ease</span>
            </label>
            <input
              type="number"
              min="1.0"
              max="3"
              step="0.1"
              value={formData.MINIMUM_EASE}
              onChange={(e) =>
                handleUpdate("MINIMUM_EASE", parseFloat(e.target.value))
              }
              className="input input-bordered"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Easy Bonus</span>
            </label>
            <input
              type="number"
              min="1.0"
              max="2"
              step="0.1"
              value={formData.EASY_BONUS}
              onChange={(e) =>
                handleUpdate("EASY_BONUS", parseFloat(e.target.value))
              }
              className="input input-bordered"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Hard Interval Factor</span>
            </label>
            <input
              type="number"
              min="0.1"
              max="1"
              step="0.1"
              value={formData.HARD_INTERVAL_FACTOR}
              onChange={(e) =>
                handleUpdate("HARD_INTERVAL_FACTOR", parseFloat(e.target.value))
              }
              className="input input-bordered"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Easy Interval Factor</span>
            </label>
            <input
              type="number"
              min="1.0"
              max="2"
              step="0.1"
              value={formData.EASY_INTERVAL_FACTOR}
              onChange={(e) =>
                handleUpdate("EASY_INTERVAL_FACTOR", parseFloat(e.target.value))
              }
              className="input input-bordered"
            />
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-base-content border-b pb-2">
          Advanced Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Lapse Recovery Factor</span>
              <div
                className="tooltip tooltip-left"
                data-tip="Multiplier for interval when card returns from relearning"
              >
                <Info className="w-4 h-4 text-base-content/50" />
              </div>
            </label>
            <input
              type="number"
              min="0.1"
              max="1"
              step="0.1"
              value={formData.LAPSE_RECOVERY_FACTOR}
              onChange={(e) =>
                handleUpdate(
                  "LAPSE_RECOVERY_FACTOR",
                  parseFloat(e.target.value)
                )
              }
              className="input input-bordered"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Leech Threshold</span>
              <div
                className="tooltip tooltip-left"
                data-tip="Number of lapses before marking card as leech"
              >
                <Info className="w-4 h-4 text-base-content/50" />
              </div>
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.LEECH_THRESHOLD}
              onChange={(e) =>
                handleUpdate("LEECH_THRESHOLD", parseInt(e.target.value))
              }
              className="input input-bordered"
            />
          </div>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Leech Action</span>
          </label>
          <select
            value={formData.LEECH_ACTION}
            onChange={(e) => handleUpdate("LEECH_ACTION", e.target.value)}
            className="select select-bordered"
          >
            <option value="suspend">Suspend</option>
            <option value="tag">Tag Only</option>
          </select>
        </div>
      </div>
    </div>
  );
}
