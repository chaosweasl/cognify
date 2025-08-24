import React, { useState } from "react";
import {
  BookOpen,
  Target,
  Users,
  Calendar,
  Sparkles,
  TrendingUp,
  Zap,
  Brain,
} from "lucide-react";

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
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Floating particles component
  const FloatingIcon = ({
    icon: Icon,
    className,
    style,
  }: {
    icon: any;
    className: string;
    style: React.CSSProperties;
  }) => (
    <div
      className={`absolute ${className} opacity-20 animate-pulse pointer-events-none`}
      style={style}
    >
      <Icon className="w-4 h-4" />
    </div>
  );

  return (
    <div className="space-y-8 relative">
      {/* Background floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingIcon
          icon={BookOpen}
          className="top-8 right-8 text-brand-primary"
          style={{ animationDelay: "0s", animationDuration: "4s" }}
        />
        <FloatingIcon
          icon={Target}
          className="bottom-16 left-12 text-brand-secondary"
          style={{ animationDelay: "2s", animationDuration: "5s" }}
        />
        <FloatingIcon
          icon={Brain}
          className="top-32 left-16 text-brand-tertiary"
          style={{ animationDelay: "1s", animationDuration: "3s" }}
        />
      </div>

      {/* Project Name - Enhanced */}
      <div className="form-control relative group">
        <label className="label mb-2">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl transition-all duration-300 ${
                focusedField === "name"
                  ? "bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 shadow-brand"
                  : "bg-surface-glass"
              }`}
            >
              <BookOpen
                className={`w-5 h-5 transition-all duration-300 ${
                  focusedField === "name"
                    ? "text-brand-primary scale-110"
                    : "text-muted"
                }`}
              />
            </div>
            <span className="label-text font-bold text-lg text-secondary">
              Project Name *
            </span>
          </div>
        </label>

        <div className="relative">
          <input
            type="text"
            placeholder="Enter a descriptive project name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setFocusedField("name")}
            onBlur={() => setFocusedField(null)}
            className={`input input-bordered h-14 text-lg font-medium text-primary placeholder:text-muted surface-secondary border-2 transition-all duration-300 ${
              focusedField === "name"
                ? "border-brand shadow-brand-lg transform scale-[1.02]"
                : isValid
                ? "border-secondary hover:border-brand/50"
                : name.trim().length > 0
                ? "border-red-500/50 focus:border-red-500"
                : "border-secondary hover:border-brand/50"
            } ${focusedField === "name" ? "shadow-brand-lg" : "shadow-brand"}`}
            disabled={saving}
            maxLength={100}
          />

          {/* Input glow effect */}
          {focusedField === "name" && (
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 rounded-xl blur opacity-50 -z-10" />
          )}

          {/* Character count indicator */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div
              className={`text-xs px-2 py-1 rounded-full transition-all duration-200 ${
                name.length > 80
                  ? "bg-orange-500/10 text-orange-400"
                  : name.length > 60
                  ? "bg-yellow-500/10 text-yellow-400"
                  : "bg-surface-glass text-subtle"
              }`}
            >
              {name.length}/100
            </div>
          </div>
        </div>

        <label className="label mt-2">
          <span className="label-text-alt text-muted flex items-center gap-2">
            <Sparkles className="w-3 h-3" />
            Choose a clear, memorable name for your study project
          </span>
        </label>
      </div>

      {/* Project Description - Enhanced */}
      <div className="form-control relative group">
        <label className="label mb-2">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl transition-all duration-300 ${
                focusedField === "description"
                  ? "bg-gradient-to-br from-brand-secondary/20 to-brand-tertiary/20 shadow-brand"
                  : "bg-surface-glass"
              }`}
            >
              <Users
                className={`w-5 h-5 transition-all duration-300 ${
                  focusedField === "description"
                    ? "text-brand-secondary scale-110"
                    : "text-muted"
                }`}
              />
            </div>
            <span className="label-text font-bold text-lg text-secondary">
              Description
            </span>
          </div>
          <span className="label-text-alt text-subtle bg-surface-glass px-2 py-1 rounded-full text-xs">
            Optional
          </span>
        </label>

        <div className="relative">
          <textarea
            placeholder="Describe what this project covers, learning goals, or any notes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={() => setFocusedField("description")}
            onBlur={() => setFocusedField(null)}
            rows={4}
            className={`textarea textarea-bordered resize-none text-base text-primary placeholder:text-muted surface-secondary border-2 transition-all duration-300 ${
              focusedField === "description"
                ? "border-brand shadow-brand-lg transform scale-[1.01]"
                : "border-secondary hover:border-brand/50"
            }`}
            disabled={saving}
            maxLength={500}
          />

          {/* Textarea glow effect */}
          {focusedField === "description" && (
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-secondary/20 to-brand-tertiary/20 rounded-xl blur opacity-50 -z-10" />
          )}

          {/* Character count for textarea */}
          <div className="absolute bottom-3 right-3">
            <div
              className={`text-xs px-2 py-1 rounded-full transition-all duration-200 ${
                description.length > 400
                  ? "bg-orange-500/10 text-orange-400"
                  : description.length > 300
                  ? "bg-yellow-500/10 text-yellow-400"
                  : "bg-surface-glass text-subtle"
              }`}
            >
              {description.length}/500
            </div>
          </div>
        </div>

        <label className="label mt-2">
          <span className="label-text-alt text-muted flex items-center gap-2">
            <TrendingUp className="w-3 h-3" />
            Help others understand what this project is about
          </span>
        </label>
      </div>

      {/* Enhanced Animated Divider */}
      <div className="divider text-base text-secondary my-8 relative">
        <div className="flex items-center gap-3 px-4 py-2 surface-glass rounded-full border border-subtle shadow-brand">
          <div className="p-2 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 rounded-lg">
            <Calendar className="w-5 h-5 text-brand-primary" />
          </div>
          <span className="font-semibold">Daily Study Limits</span>
        </div>

        {/* Animated line */}
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-border-primary to-transparent" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent animate-pulse" />
      </div>

      {/* Enhanced Daily Limits Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {/* New Cards Per Day - Enhanced */}
        <div className="form-control relative group">
          <label className="label mb-2">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl transition-all duration-300 ${
                  focusedField === "newCards"
                    ? "bg-gradient-to-br from-brand-tertiary/20 to-green-500/20 shadow-brand"
                    : "bg-surface-glass"
                }`}
              >
                <Target
                  className={`w-5 h-5 transition-all duration-300 ${
                    focusedField === "newCards"
                      ? "text-brand-tertiary scale-110"
                      : "text-muted"
                  }`}
                />
              </div>
              <span className="label-text font-bold text-lg text-secondary">
                New Cards/Day
              </span>
            </div>
          </label>

          <div className="relative">
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
              onFocus={() => setFocusedField("newCards")}
              onBlur={() => setFocusedField(null)}
              className={`input input-bordered h-14 text-lg font-bold text-primary surface-secondary border-2 transition-all duration-300 ${
                focusedField === "newCards"
                  ? "border-brand-tertiary shadow-brand-lg transform scale-[1.02]"
                  : "border-secondary hover:border-brand/50"
              }`}
              disabled={saving}
            />

            {/* Number input glow */}
            {focusedField === "newCards" && (
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-tertiary/20 to-green-500/20 rounded-xl blur opacity-50 -z-10" />
            )}

            {/* Value indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div
                className={`px-3 py-1 rounded-full text-sm font-semibold transition-all duration-200 ${
                  newCardsPerDay > 30
                    ? "bg-red-500/10 text-red-400"
                    : newCardsPerDay > 15
                    ? "bg-yellow-500/10 text-yellow-400"
                    : "bg-green-500/10 text-green-400"
                }`}
              >
                {newCardsPerDay === 0
                  ? "None"
                  : newCardsPerDay > 30
                  ? "High"
                  : newCardsPerDay > 15
                  ? "Medium"
                  : "Good"}
              </div>
            </div>
          </div>

          <label className="label mt-2">
            <span className="label-text-alt text-muted flex items-center gap-2">
              <Zap className="w-3 h-3" />
              How many new cards to learn each day
            </span>
          </label>
        </div>

        {/* Max Reviews Per Day - Enhanced */}
        <div className="form-control relative group">
          <label className="label mb-2">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl transition-all duration-300 ${
                  focusedField === "maxReviews"
                    ? "bg-gradient-to-br from-brand-accent/20 to-purple-500/20 shadow-brand"
                    : "bg-surface-glass"
                }`}
              >
                <Target
                  className={`w-5 h-5 transition-all duration-300 ${
                    focusedField === "maxReviews"
                      ? "text-brand-accent scale-110"
                      : "text-muted"
                  }`}
                />
              </div>
              <span className="label-text font-bold text-lg text-secondary">
                Max Reviews/Day
              </span>
            </div>
          </label>

          <div className="relative">
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
              onFocus={() => setFocusedField("maxReviews")}
              onBlur={() => setFocusedField(null)}
              className={`input input-bordered h-14 text-lg font-bold text-primary surface-secondary border-2 transition-all duration-300 ${
                focusedField === "maxReviews"
                  ? "border-brand-accent shadow-brand-lg transform scale-[1.02]"
                  : "border-secondary hover:border-brand/50"
              }`}
              disabled={saving}
            />

            {/* Number input glow */}
            {focusedField === "maxReviews" && (
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-accent/20 to-purple-500/20 rounded-xl blur opacity-50 -z-10" />
            )}

            {/* Value indicator */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div
                className={`px-3 py-1 rounded-full text-sm font-semibold transition-all duration-200 ${
                  maxReviewsPerDay === 0
                    ? "bg-green-500/10 text-green-400"
                    : maxReviewsPerDay > 200
                    ? "bg-yellow-500/10 text-yellow-400"
                    : "bg-blue-500/10 text-blue-400"
                }`}
              >
                {maxReviewsPerDay === 0
                  ? "Unlimited"
                  : maxReviewsPerDay > 200
                  ? "High"
                  : "Limited"}
              </div>
            </div>
          </div>

          <label className="label mt-2">
            <span className="label-text-alt text-muted flex items-center gap-2">
              <Brain className="w-3 h-3" />
              Maximum review cards per day (0 = unlimited)
            </span>
          </label>
        </div>
      </div>

      {/* Enhanced Helpful Tips Card */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-glass rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all duration-500" />
        <div className="relative card surface-glass border-2 border-subtle backdrop-blur p-6 rounded-2xl overflow-hidden group-hover:border-brand/30 transition-all duration-300">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <pattern
                  id="tips-pattern"
                  x="0"
                  y="0"
                  width="30"
                  height="30"
                  patternUnits="userSpaceOnUse"
                >
                  <circle
                    cx="15"
                    cy="15"
                    r="2"
                    fill="currentColor"
                    className="text-brand-primary"
                  />
                  <circle
                    cx="5"
                    cy="8"
                    r="1"
                    fill="currentColor"
                    className="text-brand-secondary"
                  />
                  <circle
                    cx="25"
                    cy="22"
                    r="1.5"
                    fill="currentColor"
                    className="text-brand-tertiary"
                  />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#tips-pattern)" />
            </svg>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 rounded-xl shadow-brand">
                <Sparkles className="w-6 h-6 text-brand-primary" />
              </div>
              <span className="font-bold text-xl text-secondary">
                Study Tips
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 surface-elevated rounded-xl border border-subtle group-hover:shadow-brand transition-all duration-200">
                <div className="p-2 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg flex-shrink-0">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <div className="font-semibold text-secondary mb-1">
                    Start Small
                  </div>
                  <div className="text-muted text-sm leading-relaxed">
                    Begin with 10-20 new cards per day for manageable learning.
                    You can always increase this later as you build momentum.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 surface-elevated rounded-xl border border-subtle group-hover:shadow-brand transition-all duration-200">
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex-shrink-0">
                  <div
                    className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"
                    style={{ animationDelay: "0.5s" }}
                  />
                </div>
                <div>
                  <div className="font-semibold text-secondary mb-1">
                    Unlimited Reviews
                  </div>
                  <div className="text-muted text-sm leading-relaxed">
                    Setting reviews to 0 (unlimited) ensures you never miss due
                    cards and maintain your learning streak.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 surface-elevated rounded-xl border border-subtle group-hover:shadow-brand transition-all duration-200">
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex-shrink-0">
                  <div
                    className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"
                    style={{ animationDelay: "1s" }}
                  />
                </div>
                <div>
                  <div className="font-semibold text-secondary mb-1">
                    Flexible Settings
                  </div>
                  <div className="text-muted text-sm leading-relaxed">
                    You can adjust these limits anytime in project settings as
                    your learning needs evolve.
                  </div>
                </div>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="mt-6 p-4 bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5 rounded-xl border border-brand/20">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-brand-primary font-medium">
                  <Brain className="w-4 h-4" />
                  <span>Optimized for Learning</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                  <div
                    className="w-2 h-2 bg-brand-secondary rounded-full animate-pulse"
                    style={{ animationDelay: "0.3s" }}
                  />
                  <div
                    className="w-2 h-2 bg-brand-tertiary rounded-full animate-pulse"
                    style={{ animationDelay: "0.6s" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
