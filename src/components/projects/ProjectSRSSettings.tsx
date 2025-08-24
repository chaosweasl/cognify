import React from "react";
import {
  Brain,
  Settings,
  Clock,
  Target,
  Zap,
  Layers,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
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
    <div className="space-y-8">
      {/* Learning Steps Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center shadow-brand">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-primary">Learning Steps</h3>
            <p className="text-text-muted text-sm">
              Configure initial learning intervals
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Learning Steps */}
          <div className="relative group">
            <label className="block mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-secondary">
                  Learning Steps (minutes)
                </span>
                <span className="text-xs text-subtle bg-surface-elevated px-2 py-1 rounded-full">
                  New cards
                </span>
              </div>
              <input
                type="text"
                value={project.learning_steps?.join(", ") || "1, 10"}
                onChange={(e) =>
                  handleNumberArrayChange("learning_steps", e.target.value)
                }
                className="w-full px-4 py-3 rounded-xl border border-subtle surface-secondary text-primary placeholder:text-muted interactive-focus interactive-hover transition-all transition-normal group-hover:border-brand"
                placeholder="1, 10"
                disabled={disabled}
              />
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Comma-separated intervals for when new cards will be shown again
              </p>
            </label>
          </div>

          {/* Relearning Steps */}
          <div className="relative group">
            <label className="block mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-secondary">
                  Relearning Steps (minutes)
                </span>
                <span className="text-xs text-subtle bg-surface-elevated px-2 py-1 rounded-full">
                  Failed cards
                </span>
              </div>
              <input
                type="text"
                value={project.relearning_steps?.join(", ") || "10"}
                onChange={(e) =>
                  handleNumberArrayChange("relearning_steps", e.target.value)
                }
                className="w-full px-4 py-3 rounded-xl border border-subtle surface-secondary text-primary placeholder:text-muted interactive-focus interactive-hover transition-all transition-normal group-hover:border-brand"
                placeholder="10"
                disabled={disabled}
              />
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Intervals for cards that you got wrong during review
              </p>
            </label>
          </div>
        </div>
      </div>

      {/* Graduation Intervals Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-brand-secondary to-brand-accent rounded-lg flex items-center justify-center shadow-brand">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-primary">
              Graduation Settings
            </h3>
            <p className="text-text-muted text-sm">When cards become mature</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative group">
            <label className="block">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-secondary">
                  Graduating Interval
                </span>
                <span className="text-xs text-subtle bg-surface-elevated px-2 py-1 rounded-full">
                  days
                </span>
              </div>
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
                className="w-full px-4 py-3 rounded-xl border border-subtle surface-secondary text-primary interactive-focus interactive-hover transition-all transition-normal group-hover:border-brand"
                disabled={disabled}
              />
              <p className="text-xs text-muted mt-2">
                Days until next review after passing learning steps
              </p>
            </label>
          </div>

          <div className="relative group">
            <label className="block">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-secondary">
                  Easy Interval
                </span>
                <span className="text-xs text-subtle bg-surface-elevated px-2 py-1 rounded-full">
                  days
                </span>
              </div>
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
                className="w-full px-4 py-3 rounded-xl border border-subtle surface-secondary text-primary interactive-focus interactive-hover transition-all transition-normal group-hover:border-brand"
                disabled={disabled}
              />
              <p className="text-xs text-muted mt-2">
                Days when you click &quot;Easy&quot; on a new card
              </p>
            </label>
          </div>
        </div>
      </div>

      {/* Ease Factors Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-brand-tertiary to-green-400 rounded-lg flex items-center justify-center shadow-brand">
            <Target className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-primary">Ease Factors</h3>
            <p className="text-text-muted text-sm">
              How intervals change based on performance
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative group">
            <label className="block">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-secondary">
                  Starting Ease
                </span>
                <span className="text-xs text-subtle bg-surface-elevated px-2 py-1 rounded-full">
                  multiplier
                </span>
              </div>
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
                className="w-full px-4 py-3 rounded-xl border border-subtle surface-secondary text-primary interactive-focus interactive-hover transition-all transition-normal group-hover:border-brand"
                disabled={disabled}
              />
              <p className="text-xs text-muted mt-2">
                Initial ease factor for new cards (2.5 = 250%)
              </p>
            </label>
          </div>

          <div className="relative group">
            <label className="block">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-secondary">
                  Minimum Ease
                </span>
                <span className="text-xs text-subtle bg-surface-elevated px-2 py-1 rounded-full">
                  multiplier
                </span>
              </div>
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
                className="w-full px-4 py-3 rounded-xl border border-subtle surface-secondary text-primary interactive-focus interactive-hover transition-all transition-normal group-hover:border-brand"
                disabled={disabled}
              />
              <p className="text-xs text-muted mt-2">
                Lowest possible ease factor (prevents cards from becoming too
                frequent)
              </p>
            </label>
          </div>
        </div>
      </div>

      {/* Advanced Settings Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-brand">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-primary">
              Advanced Settings
            </h3>
            <p className="text-text-muted text-sm">
              Fine-tune your learning algorithm
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="relative group">
            <label className="block">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-secondary">Easy Bonus</span>
                <span className="text-xs text-subtle bg-surface-elevated px-2 py-1 rounded-full">
                  multiplier
                </span>
              </div>
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
                className="w-full px-4 py-3 rounded-xl border border-subtle surface-secondary text-primary interactive-focus interactive-hover transition-all transition-normal group-hover:border-brand"
                disabled={disabled}
              />
              <p className="text-xs text-muted mt-2">
                Extra multiplier when you click &quot;Easy&quot;
              </p>
            </label>
          </div>

          <div className="relative group">
            <label className="block">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-secondary">
                  Hard Factor
                </span>
                <span className="text-xs text-subtle bg-surface-elevated px-2 py-1 rounded-full">
                  multiplier
                </span>
              </div>
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
                className="w-full px-4 py-3 rounded-xl border border-subtle surface-secondary text-primary interactive-focus interactive-hover transition-all transition-normal group-hover:border-brand"
                disabled={disabled}
              />
              <p className="text-xs text-muted mt-2">
                Interval multiplier when you click &quot;Hard&quot;
              </p>
            </label>
          </div>

          <div className="relative group">
            <label className="block">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-secondary">
                  Leech Threshold
                </span>
                <span className="text-xs text-subtle bg-surface-elevated px-2 py-1 rounded-full">
                  lapses
                </span>
              </div>
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
                className="w-full px-4 py-3 rounded-xl border border-subtle surface-secondary text-primary interactive-focus interactive-hover transition-all transition-normal group-hover:border-brand"
                disabled={disabled}
              />
              <p className="text-xs text-muted mt-2">
                Lapses before a card becomes a &quot;leech&quot;
              </p>
            </label>
          </div>

          <div className="relative group">
            <label className="block">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-secondary">
                  Max Interval
                </span>
                <span className="text-xs text-subtle bg-surface-elevated px-2 py-1 rounded-full">
                  days
                </span>
              </div>
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
                className="w-full px-4 py-3 rounded-xl border border-subtle surface-secondary text-primary interactive-focus interactive-hover transition-all transition-normal group-hover:border-brand"
                disabled={disabled}
              />
              <p className="text-xs text-muted mt-2">
                Maximum days between reviews (100 years default)
              </p>
            </label>
          </div>

          <div className="relative group">
            <label className="block">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-secondary">
                  Lapse Penalty
                </span>
                <span className="text-xs text-subtle bg-surface-elevated px-2 py-1 rounded-full">
                  reduction
                </span>
              </div>
              <input
                type="number"
                min="0.0"
                max="1.0"
                step="0.05"
                value={project.lapse_ease_penalty || 0.2}
                onChange={(e) =>
                  handleFloatChange(
                    "lapse_ease_penalty",
                    parseFloat(e.target.value) || 0.2
                  )
                }
                className="w-full px-4 py-3 rounded-xl border border-subtle surface-secondary text-primary interactive-focus interactive-hover transition-all transition-normal group-hover:border-brand"
                disabled={disabled}
              />
              <p className="text-xs text-muted mt-2">
                How much ease decreases when you lapse a card
              </p>
            </label>
          </div>

          <div className="relative group">
            <label className="block">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-secondary">
                  Recovery Factor
                </span>
                <span className="text-xs text-subtle bg-surface-elevated px-2 py-1 rounded-full">
                  multiplier
                </span>
              </div>
              <input
                type="number"
                min="0.1"
                max="1.0"
                step="0.05"
                value={project.lapse_recovery_factor || 0.5}
                onChange={(e) =>
                  handleFloatChange(
                    "lapse_recovery_factor",
                    parseFloat(e.target.value) || 0.5
                  )
                }
                className="w-full px-4 py-3 rounded-xl border border-subtle surface-secondary text-primary interactive-focus interactive-hover transition-all transition-normal group-hover:border-brand"
                disabled={disabled}
              />
              <p className="text-xs text-muted mt-2">
                How much interval decreases when you lapse a card
              </p>
            </label>
          </div>
        </div>
      </div>

      {/* Behavior Settings Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-brand">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-primary">
              Behavior Settings
            </h3>
            <p className="text-text-muted text-sm">
              How cards are presented and managed
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dropdowns */}
          <div className="space-y-6">
            <div className="relative group">
              <label className="block">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-secondary">
                    New Card Order
                  </span>
                  <span className="text-xs text-subtle bg-surface-elevated px-2 py-1 rounded-full">
                    sequence
                  </span>
                </div>
                <select
                  value={project.new_card_order || "random"}
                  onChange={(e) =>
                    handleSelectChange("new_card_order", e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-xl border border-subtle surface-secondary text-primary interactive-focus interactive-hover transition-all transition-normal group-hover:border-brand cursor-pointer"
                  disabled={disabled}
                >
                  <option value="random">Random Order</option>
                  <option value="fifo">First In, First Out</option>
                </select>
                <p className="text-xs text-muted mt-2">
                  How new cards are selected for study sessions
                </p>
              </label>
            </div>

            <div className="relative group">
              <label className="block">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-secondary">
                    Leech Action
                  </span>
                  <span className="text-xs text-subtle bg-surface-elevated px-2 py-1 rounded-full">
                    behavior
                  </span>
                </div>
                <select
                  value={project.leech_action || "suspend"}
                  onChange={(e) =>
                    handleSelectChange("leech_action", e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-xl border border-subtle surface-secondary text-primary interactive-focus interactive-hover transition-all transition-normal group-hover:border-brand cursor-pointer"
                  disabled={disabled}
                >
                  <option value="suspend">Suspend Card</option>
                  <option value="tag">Tag Only</option>
                </select>
                <p className="text-xs text-muted mt-2">
                  What happens when a card becomes a leech
                </p>
              </label>
            </div>
          </div>

          {/* Boolean Settings */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 surface-elevated rounded-xl border border-subtle group hover:shadow-brand transition-all transition-normal">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-secondary">
                      Review Ahead
                    </div>
                    <div className="text-xs text-muted">
                      Study cards before they&apos;re due
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={project.review_ahead || false}
                    onChange={(e) =>
                      handleBooleanChange("review_ahead", e.target.checked)
                    }
                    className="sr-only peer"
                    disabled={disabled}
                  />
                  <div className="relative w-11 h-6 bg-surface-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-brand shadow-inner"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 surface-elevated rounded-xl border border-subtle group hover:shadow-brand transition-all transition-normal">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-secondary">
                      Bury Siblings
                    </div>
                    <div className="text-xs text-muted">
                      Hide related cards until tomorrow
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={project.bury_siblings || false}
                    onChange={(e) =>
                      handleBooleanChange("bury_siblings", e.target.checked)
                    }
                    className="sr-only peer"
                    disabled={disabled}
                  />
                  <div className="relative w-11 h-6 bg-surface-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-brand shadow-inner"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Information Card */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 glass-surface backdrop-blur">
        <div className="absolute inset-0 bg-blue-500/5" />
        <div className="relative p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-blue-400 mb-2">
                About SRS Settings
              </h4>
              <div className="space-y-2 text-sm text-blue-400/80">
                <p>
                  • These settings control how your project&apos;s spaced repetition
                  algorithm works
                </p>
                <p>
                  • Changes only affect new reviews, not cards already in
                  progress
                </p>
                <p>
                  • The default values are optimized for most learning scenarios
                </p>
                <p>
                  • You can reset SRS data below to apply new settings to
                  existing cards
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
