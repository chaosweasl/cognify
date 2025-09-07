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
    <div className="space-y-10 p-6">
      {/* Enhanced Learning Steps Section */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center shadow-brand-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              Learning Steps
            </h3>
            <p className="text-text-muted text-base">
              Configure initial learning intervals for new cards
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enhanced Learning Steps Input */}
          <div className="glass-surface p-6 rounded-2xl border border-brand-primary/20 hover:border-brand-primary/40 transition-all duration-300 group">
            <label className="block">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-lg text-text-primary group-hover:text-brand-primary transition-colors">
                  Learning Steps (minutes)
                </span>
                <span className="text-sm text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full border border-brand-primary/20">
                  New cards
                </span>
              </div>
              <input
                type="text"
                value={project.learning_steps?.join(", ") || "1, 10"}
                onChange={(e) =>
                  handleNumberArrayChange("learning_steps", e.target.value)
                }
                className="w-full px-4 py-4 rounded-xl border border-brand-primary/30 glass-surface text-text-primary placeholder:text-text-muted focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all duration-300 disabled:opacity-50"
                placeholder="1, 10"
                disabled={disabled}
              />
              <p className="text-sm text-text-muted mt-3 leading-relaxed">
                Comma-separated intervals for when new cards will be shown again
              </p>
            </label>
          </div>

          {/* Enhanced Relearning Steps Input */}
          <div className="glass-surface p-6 rounded-2xl border border-brand-secondary/20 hover:border-brand-secondary/40 transition-all duration-300 group">
            <label className="block">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-lg text-text-primary group-hover:text-brand-secondary transition-colors">
                  Relearning Steps (minutes)
                </span>
                <span className="text-sm text-red-600 bg-red-100 px-3 py-1 rounded-full border border-red-200">
                  Failed cards
                </span>
              </div>
              <input
                type="text"
                value={project.relearning_steps?.join(", ") || "10"}
                onChange={(e) =>
                  handleNumberArrayChange("relearning_steps", e.target.value)
                }
                className="w-full px-4 py-4 rounded-xl border border-brand-secondary/30 glass-surface text-text-primary placeholder:text-text-muted focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/20 transition-all duration-300 disabled:opacity-50"
                placeholder="10"
                disabled={disabled}
              />
              <p className="text-sm text-text-muted mt-3 leading-relaxed">
                Intervals for cards that you got wrong during review
              </p>
            </label>
          </div>
        </div>
      </div>

      {/* Enhanced Graduation Intervals Section */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-brand-secondary to-brand-tertiary rounded-2xl flex items-center justify-center shadow-brand-lg">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-brand-secondary to-brand-tertiary bg-clip-text text-transparent">
              Graduation Settings
            </h3>
            <p className="text-text-muted text-base">
              When cards become mature and move to review phase
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-surface p-6 rounded-2xl border border-blue-200/50 hover:border-blue-300/70 transition-all duration-300 group">
            <label className="block">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-lg text-text-primary group-hover:text-blue-600 transition-colors">
                  Graduating Interval
                </span>
                <span className="text-sm text-blue-600 bg-blue-100 px-3 py-1 rounded-full border border-blue-200">
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
                className="w-full px-4 py-4 rounded-xl border border-blue-200/50 glass-surface text-text-primary focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 disabled:opacity-50"
                disabled={disabled}
              />
              <p className="text-sm text-text-muted mt-3 leading-relaxed">
                Days until next review after passing learning steps
              </p>
            </label>
          </div>

          <div className="glass-surface p-6 rounded-2xl border border-green-200/50 hover:border-green-300/70 transition-all duration-300 group">
            <label className="block">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-lg text-text-primary group-hover:text-green-600 transition-colors">
                  Easy Interval
                </span>
                <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full border border-green-200">
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
                className="w-full px-4 py-4 rounded-xl border border-green-200/50 glass-surface text-text-primary focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 disabled:opacity-50"
                disabled={disabled}
              />
              <p className="text-sm text-text-muted mt-3 leading-relaxed">
                Days when you click "Easy" on a new card
              </p>
            </label>
          </div>
        </div>
      </div>

      {/* Enhanced Ease Factors Section */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-brand-tertiary to-green-500 rounded-2xl flex items-center justify-center shadow-brand-lg">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-brand-tertiary to-green-500 bg-clip-text text-transparent">
              Ease Factors
            </h3>
            <p className="text-text-muted text-base">
              How intervals change based on your performance
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-surface p-6 rounded-2xl border border-orange-200/50 hover:border-orange-300/70 transition-all duration-300 group">
            <label className="block">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-lg text-text-primary group-hover:text-orange-600 transition-colors">
                  Starting Ease
                </span>
                <span className="text-sm text-orange-600 bg-orange-100 px-3 py-1 rounded-full border border-orange-200">
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
                className="w-full px-4 py-4 rounded-xl border border-orange-200/50 glass-surface text-text-primary focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 disabled:opacity-50"
                disabled={disabled}
              />
              <p className="text-sm text-text-muted mt-3 leading-relaxed">
                Initial ease factor for new cards (2.5 = 250%)
              </p>
            </label>
          </div>

          <div className="glass-surface p-6 rounded-2xl border border-purple-200/50 hover:border-purple-300/70 transition-all duration-300 group">
            <label className="block">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-lg text-text-primary group-hover:text-purple-600 transition-colors">
                  Minimum Ease
                </span>
                <span className="text-sm text-purple-600 bg-purple-100 px-3 py-1 rounded-full border border-purple-200">
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
                className="w-full px-4 py-4 rounded-xl border border-purple-200/50 glass-surface text-text-primary focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 disabled:opacity-50"
                disabled={disabled}
              />
              <p className="text-sm text-text-muted mt-3 leading-relaxed">
                Lowest possible ease factor (prevents cards from becoming too
                frequent)
              </p>
            </label>
          </div>
        </div>
      </div>

      {/* Enhanced Advanced Settings Section */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-brand-lg">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Advanced Settings
            </h3>
            <p className="text-text-muted text-base">
              Fine-tune your learning algorithm parameters
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Easy Bonus */}
          <div className="glass-surface p-6 rounded-2xl border border-green-200/50 hover:border-green-300/70 transition-all duration-300 group">
            <label className="block">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-text-primary group-hover:text-green-600 transition-colors">
                  Easy Bonus
                </span>
                <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full border border-green-200">
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
                className="w-full px-4 py-4 rounded-xl border border-green-200/50 glass-surface text-text-primary focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300 disabled:opacity-50"
                disabled={disabled}
              />
              <p className="text-xs text-text-muted mt-3">
                Extra multiplier when you click "Easy"
              </p>
            </label>
          </div>

          {/* Hard Factor */}
          <div className="glass-surface p-6 rounded-2xl border border-orange-200/50 hover:border-orange-300/70 transition-all duration-300 group">
            <label className="block">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-text-primary group-hover:text-orange-600 transition-colors">
                  Hard Factor
                </span>
                <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full border border-orange-200">
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
                className="w-full px-4 py-4 rounded-xl border border-orange-200/50 glass-surface text-text-primary focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all duration-300 disabled:opacity-50"
                disabled={disabled}
              />
              <p className="text-xs text-text-muted mt-3">
                Interval multiplier when you click "Hard"
              </p>
            </label>
          </div>

          {/* Leech Threshold */}
          <div className="glass-surface p-6 rounded-2xl border border-red-200/50 hover:border-red-300/70 transition-all duration-300 group">
            <label className="block">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-text-primary group-hover:text-red-600 transition-colors">
                  Leech Threshold
                </span>
                <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full border border-red-200">
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
                className="w-full px-4 py-4 rounded-xl border border-red-200/50 glass-surface text-text-primary focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-300 disabled:opacity-50"
                disabled={disabled}
              />
              <p className="text-xs text-text-muted mt-3">
                Lapses before a card becomes a "leech"
              </p>
            </label>
          </div>

          {/* Max Interval */}
          <div className="glass-surface p-6 rounded-2xl border border-blue-200/50 hover:border-blue-300/70 transition-all duration-300 group">
            <label className="block">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-text-primary group-hover:text-blue-600 transition-colors">
                  Max Interval
                </span>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full border border-blue-200">
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
                className="w-full px-4 py-4 rounded-xl border border-blue-200/50 glass-surface text-text-primary focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 disabled:opacity-50"
                disabled={disabled}
              />
              <p className="text-xs text-text-muted mt-3">
                Maximum days between reviews (100 years default)
              </p>
            </label>
          </div>

          {/* Lapse Penalty */}
          <div className="glass-surface p-6 rounded-2xl border border-purple-200/50 hover:border-purple-300/70 transition-all duration-300 group">
            <label className="block">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-text-primary group-hover:text-purple-600 transition-colors">
                  Lapse Penalty
                </span>
                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full border border-purple-200">
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
                className="w-full px-4 py-4 rounded-xl border border-purple-200/50 glass-surface text-text-primary focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 disabled:opacity-50"
                disabled={disabled}
              />
              <p className="text-xs text-text-muted mt-3">
                How much ease decreases when you lapse a card
              </p>
            </label>
          </div>

          {/* Recovery Factor */}
          <div className="glass-surface p-6 rounded-2xl border border-teal-200/50 hover:border-teal-300/70 transition-all duration-300 group">
            <label className="block">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-text-primary group-hover:text-teal-600 transition-colors">
                  Recovery Factor
                </span>
                <span className="text-xs text-teal-600 bg-teal-100 px-2 py-1 rounded-full border border-teal-200">
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
                className="w-full px-4 py-4 rounded-xl border border-teal-200/50 glass-surface text-text-primary focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-300 disabled:opacity-50"
                disabled={disabled}
              />
              <p className="text-xs text-text-muted mt-3">
                How much interval decreases when you lapse a card
              </p>
            </label>
          </div>
        </div>
      </div>

      {/* Enhanced Behavior Settings Section */}
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-brand-lg">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Behavior Settings
            </h3>
            <p className="text-text-muted text-base">
              How cards are presented and managed during study
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Enhanced Dropdowns */}
          <div className="space-y-6">
            <div className="glass-surface p-6 rounded-2xl border border-indigo-200/50 hover:border-indigo-300/70 transition-all duration-300 group">
              <label className="block">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-lg text-text-primary group-hover:text-indigo-600 transition-colors">
                    New Card Order
                  </span>
                  <span className="text-sm text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full border border-indigo-200">
                    sequence
                  </span>
                </div>
                <select
                  value={project.new_card_order || "random"}
                  onChange={(e) =>
                    handleSelectChange("new_card_order", e.target.value)
                  }
                  className="w-full px-4 py-4 rounded-xl border border-indigo-200/50 glass-surface text-text-primary focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 cursor-pointer disabled:opacity-50"
                  disabled={disabled}
                >
                  <option value="random">Random Order</option>
                  <option value="fifo">First In, First Out</option>
                </select>
                <p className="text-sm text-text-muted mt-3 leading-relaxed">
                  How new cards are selected for study sessions
                </p>
              </label>
            </div>

            <div className="glass-surface p-6 rounded-2xl border border-red-200/50 hover:border-red-300/70 transition-all duration-300 group">
              <label className="block">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-lg text-text-primary group-hover:text-red-600 transition-colors">
                    Leech Action
                  </span>
                  <span className="text-sm text-red-600 bg-red-100 px-3 py-1 rounded-full border border-red-200">
                    behavior
                  </span>
                </div>
                <select
                  value={project.leech_action || "suspend"}
                  onChange={(e) =>
                    handleSelectChange("leech_action", e.target.value)
                  }
                  className="w-full px-4 py-4 rounded-xl border border-red-200/50 glass-surface text-text-primary focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all duration-300 cursor-pointer disabled:opacity-50"
                  disabled={disabled}
                >
                  <option value="suspend">Suspend Card</option>
                  <option value="tag">Tag Only</option>
                </select>
                <p className="text-sm text-text-muted mt-3 leading-relaxed">
                  What happens when a card becomes a leech
                </p>
              </label>
            </div>
          </div>

          {/* Enhanced Boolean Settings */}
          <div className="space-y-6">
            <div className="space-y-6">
              <div className="glass-surface p-6 rounded-2xl border border-blue-200/50 hover:border-blue-300/70 transition-all duration-300 group hover:shadow-brand-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-lg text-text-primary group-hover:text-blue-600 transition-colors">
                        Review Ahead
                      </div>
                      <div className="text-sm text-text-muted">
                        Study cards before they're due
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
                    <div className="relative w-14 h-7 bg-surface-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-brand-primary peer-checked:to-brand-secondary shadow-inner"></div>
                  </label>
                </div>
              </div>

              <div className="glass-surface p-6 rounded-2xl border border-orange-200/50 hover:border-orange-300/70 transition-all duration-300 group hover:shadow-brand-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-lg text-text-primary group-hover:text-orange-600 transition-colors">
                        Bury Siblings
                      </div>
                      <div className="text-sm text-text-muted">
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
                    <div className="relative w-14 h-7 bg-surface-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-brand-primary peer-checked:to-brand-secondary shadow-inner"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Information Card */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-brand-primary/20 glass-surface bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent" />
        <div className="relative p-8">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center flex-shrink-0 shadow-brand-lg">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent mb-4">
                About SRS Settings
              </h4>
              <div className="space-y-3 text-base text-text-primary leading-relaxed">
                <p>
                  • These settings control how your project's spaced repetition
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
                  • You can reset SRS data to apply new settings to existing
                  cards
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
