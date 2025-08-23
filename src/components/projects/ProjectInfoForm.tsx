import React from "react";
import { BookOpen, Target, Users, Calendar } from "lucide-react";

interface ProjectInfoFormProps {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  newCardsPerDay: number;
  setNewCardsPerDay: (count: number) => void;
  maxReviewsPerDay: number;
  setMaxReviewsPerDay: (count: number) => void;
  isValid: boolean;
  saving?: boolean;
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
  saving = false,
}: ProjectInfoFormProps) {
  return (
    <div className="space-y-6">
      {/* Project Name */}
      <div className="form-control">
        <label className="label">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 brand-primary" />
            <span className="label-text font-semibold text-secondary">
              Project Name *
            </span>
          </div>
        </label>
        <input
          type="text"
          placeholder="Enter a descriptive project name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`input input-bordered h-12 text-primary placeholder:text-muted surface-secondary border-secondary interactive-focus transition-all transition-normal ${
            isValid
              ? "focus:border-brand focus:shadow-brand"
              : name.trim().length > 0
              ? "border-red-500/50 focus:border-red-500"
              : "focus:border-brand focus:shadow-brand"
          }`}
          disabled={saving}
          maxLength={100}
        />
        <label className="label">
          <span className="label-text-alt text-muted">
            Choose a clear, memorable name for your study project
          </span>
          <span className="label-text-alt text-subtle">{name.length}/100</span>
        </label>
      </div>

      {/* Project Description */}
      <div className="form-control">
        <label className="label">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 brand-secondary" />
            <span className="label-text font-semibold text-secondary">
              Description
            </span>
          </div>
          <span className="label-text-alt text-subtle">Optional</span>
        </label>
        <textarea
          placeholder="Describe what this project covers, learning goals, or any notes..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="textarea textarea-bordered resize-none text-primary placeholder:text-muted surface-secondary border-secondary interactive-focus focus:border-brand focus:shadow-brand transition-all transition-normal"
          disabled={saving}
          maxLength={500}
        />
        <label className="label">
          <span className="label-text-alt text-muted">
            Help others understand what this project is about
          </span>
          <span className="label-text-alt text-subtle">
            {description.length}/500
          </span>
        </label>
      </div>

      {/* Daily Limits Section */}
      <div className="divider text-sm text-muted">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>Daily Study Limits</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* New Cards Per Day */}
        <div className="form-control">
          <label className="label">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 brand-tertiary" />
              <span className="label-text font-semibold text-secondary">
                New Cards/Day
              </span>
            </div>
          </label>
          <input
            type="number"
            min="0"
            max="999"
            value={newCardsPerDay}
            onChange={(e) => {
              const value = Math.max(
                0,
                Math.min(999, parseInt(e.target.value) || 0)
              );
              setNewCardsPerDay(value);
            }}
            className="input input-bordered h-12 text-primary surface-secondary border-secondary interactive-focus focus:border-brand focus:shadow-brand transition-all transition-normal"
            disabled={saving}
          />
          <label className="label">
            <span className="label-text-alt text-muted">
              How many new cards to learn each day
            </span>
          </label>
        </div>

        {/* Max Reviews Per Day */}
        <div className="form-control">
          <label className="label">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 brand-accent" />
              <span className="label-text font-semibold text-secondary">
                Max Reviews/Day
              </span>
            </div>
          </label>
          <input
            type="number"
            min="0"
            max="9999"
            value={maxReviewsPerDay}
            onChange={(e) => {
              const value = Math.max(
                0,
                Math.min(9999, parseInt(e.target.value) || 0)
              );
              setMaxReviewsPerDay(value);
            }}
            className="input input-bordered h-12 text-primary surface-secondary border-secondary interactive-focus focus:border-brand focus:shadow-brand transition-all transition-normal"
            disabled={saving}
          />
          <label className="label">
            <span className="label-text-alt text-muted">
              Maximum review cards per day (0 = unlimited)
            </span>
          </label>
        </div>
      </div>

      {/* Helpful Tips Card */}
      <div className="card surface-glass border border-subtle backdrop-blur p-4">
        <div className="text-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-brand-primary rounded-full" />
            <span className="font-semibold text-secondary">Study Tips</span>
          </div>
          <ul className="space-y-2 text-muted">
            <li className="flex gap-2">
              <span className="brand-primary">•</span>
              <span>
                Start with 10-20 new cards per day for manageable learning
              </span>
            </li>
            <li className="flex gap-2">
              <span className="brand-secondary">•</span>
              <span>
                Unlimited reviews (0) ensures you never miss due cards
              </span>
            </li>
            <li className="flex gap-2">
              <span className="brand-tertiary">•</span>
              <span>
                You can adjust these limits anytime in project settings
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
