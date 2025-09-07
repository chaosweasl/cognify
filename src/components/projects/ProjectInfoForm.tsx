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
    icon: React.ElementType;
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
    <div className="space-y-10 relative p-6">
      {/* Enhanced background floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
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

      {/* Enhanced Project Name */}
      <div className="relative group">
        <label className="block mb-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-2xl transition-all duration-500 ${
                focusedField === "name"
                  ? "bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 shadow-brand-lg scale-110"
                  : "glass-surface border border-brand-primary/20"
              }`}
            >
              <BookOpen
                className={`w-6 h-6 transition-all duration-500 ${
                  focusedField === "name"
                    ? "text-brand-primary scale-110 rotate-12"
                    : "text-text-muted"
                }`}
              />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
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
            className={`w-full h-16 px-6 text-xl font-semibold glass-surface rounded-2xl border-2 transition-all duration-500 ${
              focusedField === "name"
                ? "border-brand-primary text-text-primary shadow-brand-lg scale-[1.02] ring-2 ring-brand-primary/20"
                : isValid
                ? "border-brand-primary/30 text-text-primary hover:border-brand-primary/50"
                : name.trim().length > 0
                ? "border-status-error text-text-primary focus:border-status-error"
                : "border-brand-primary/30 text-text-primary hover:border-brand-primary/50"
            } placeholder:text-text-muted disabled:opacity-50`}
            disabled={saving}
            maxLength={100}
          />

          {/* Enhanced input glow effect */}
          {focusedField === "name" && (
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary/30 to-brand-secondary/30 rounded-2xl blur opacity-70 -z-10" />
          )}

          {/* Enhanced character count indicator */}
          <div className="absolute right-5 top-1/2 -translate-y-1/2">
            <div
              className={`text-sm px-3 py-2 rounded-xl font-medium transition-all duration-300 ${
                name.length > 80
                  ? "surface-elevated text-status-warning border border-status-warning"
                  : name.length > 60
                  ? "surface-elevated text-status-warning border border-status-warning"
                  : "glass-surface text-text-muted border border-brand-primary/20"
              }`}
            >
              {name.length}/100
            </div>
          </div>
        </div>

        <div className="mt-4">
          <span className="text-text-muted flex items-center gap-3 text-base">
            <Sparkles className="w-4 h-4" />
            Choose a clear, memorable name for your study project
          </span>
        </div>
      </div>

      {/* Enhanced Project Description */}
      <div className="relative group">
        <label className="block mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-2xl transition-all duration-500 ${
                  focusedField === "description"
                    ? "bg-gradient-to-br from-brand-secondary/20 to-brand-tertiary/20 shadow-brand-lg scale-110"
                    : "glass-surface border border-brand-secondary/20"
                }`}
              >
                <Users
                  className={`w-6 h-6 transition-all duration-500 ${
                    focusedField === "description"
                      ? "text-brand-secondary scale-110 rotate-12"
                      : "text-text-muted"
                  }`}
                />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-brand-secondary to-brand-tertiary bg-clip-text text-transparent">
                Description
              </span>
            </div>
            <span className="text-sm text-text-muted bg-surface-muted px-3 py-1 rounded-full border border-brand-secondary/20">
              Optional
            </span>
          </div>
        </label>

        <div className="relative">
          <textarea
            placeholder="Describe what this project covers, learning goals, or any notes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={() => setFocusedField("description")}
            onBlur={() => setFocusedField(null)}
            rows={5}
            className={`w-full px-6 py-4 text-lg glass-surface rounded-2xl border-2 transition-all duration-500 resize-none ${
              focusedField === "description"
                ? "border-brand-secondary text-text-primary shadow-brand-lg scale-[1.01] ring-2 ring-brand-secondary/20"
                : "border-brand-secondary/30 text-text-primary hover:border-brand-secondary/50"
            } placeholder:text-text-muted disabled:opacity-50`}
            disabled={saving}
            maxLength={500}
          />

          {/* Enhanced textarea glow effect */}
          {focusedField === "description" && (
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-secondary/30 to-brand-tertiary/30 rounded-2xl blur opacity-70 -z-10" />
          )}

          {/* Enhanced character count for textarea */}
          <div className="absolute bottom-4 right-4">
            <div
              className={`text-sm px-3 py-2 rounded-xl font-medium transition-all duration-300 ${
                description.length > 400
                  ? "surface-elevated text-status-warning border border-status-warning"
                  : description.length > 300
                  ? "surface-elevated text-status-warning border border-status-warning"
                  : "glass-surface text-text-muted border border-brand-secondary/20"
              }`}
            >
              {description.length}/500
            </div>
          </div>
        </div>

        <div className="mt-4">
          <span className="text-text-muted flex items-center gap-3 text-base">
            <TrendingUp className="w-4 h-4" />
            Help others understand what this project is about
          </span>
        </div>
      </div>

      {/* Enhanced Animated Divider */}
      <div className="relative my-12 flex items-center justify-center">
        <div className="flex items-center gap-4 px-8 py-4 glass-surface rounded-3xl border-2 border-brand-primary/20 shadow-brand-md bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5">
          <div className="p-3 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 rounded-2xl shadow-brand">
            <Calendar className="w-6 h-6 text-brand-primary" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
            Daily Study Limits
          </span>
        </div>

        {/* Enhanced animated line */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-brand-primary/60 to-transparent animate-pulse" />
      </div>

      {/* Enhanced Daily Limits Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Enhanced New Cards Per Day */}
        <div className="relative group">
          <label className="block mb-4">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-2xl transition-all duration-500 ${
                  focusedField === "newCards"
                    ? "bg-gradient-to-br from-brand-tertiary/20 to-status-success/20 shadow-brand-lg scale-110"
                    : "glass-surface border border-brand-tertiary/20"
                }`}
              >
                <Target
                  className={`w-6 h-6 transition-all duration-500 ${
                    focusedField === "newCards"
                      ? "text-brand-tertiary scale-110 rotate-12"
                      : "text-text-muted"
                  }`}
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-brand-tertiary to-status-success bg-clip-text text-transparent">
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
              className={`w-full h-16 px-6 text-xl font-bold glass-surface rounded-2xl border-2 transition-all duration-500 ${
                focusedField === "newCards"
                  ? "border-brand-tertiary text-text-primary shadow-brand-lg scale-[1.02] ring-2 ring-brand-tertiary/20"
                  : "border-brand-tertiary/30 text-text-primary hover:border-brand-tertiary/50"
              } disabled:opacity-50`}
              disabled={saving}
            />

            {/* Enhanced number input glow */}
            {focusedField === "newCards" && (
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-tertiary/30 to-status-success/30 rounded-2xl blur opacity-70 -z-10" />
            )}

            {/* Enhanced value indicator */}
            <div className="absolute right-5 top-1/2 -translate-y-1/2">
              <div
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                  newCardsPerDay > 30
                    ? "surface-elevated text-status-error border border-status-error"
                    : newCardsPerDay > 15
                    ? "surface-elevated text-status-warning border border-status-warning"
                    : "surface-elevated text-status-success border border-status-success"
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

          <div className="mt-4">
            <span className="text-text-muted flex items-center gap-3 text-base">
              <Zap className="w-4 h-4" />
              How many new cards to learn each day
            </span>
          </div>
        </div>

        {/* Enhanced Max Reviews Per Day */}
        <div className="relative group">
          <label className="block mb-4">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-2xl transition-all duration-500 ${
                  focusedField === "maxReviews"
                    ? "bg-gradient-to-br from-brand-accent/20 to-brand-secondary/20 shadow-brand-lg scale-110"
                    : "glass-surface border border-brand-accent/20"
                }`}
              >
                <Target
                  className={`w-6 h-6 transition-all duration-500 ${
                    focusedField === "maxReviews"
                      ? "text-brand-accent scale-110 rotate-12"
                      : "text-text-muted"
                  }`}
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-brand-accent to-brand-secondary bg-clip-text text-transparent">
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
              className={`w-full h-16 px-6 text-xl font-bold glass-surface rounded-2xl border-2 transition-all duration-500 ${
                focusedField === "maxReviews"
                  ? "border-brand-accent text-text-primary shadow-brand-lg scale-[1.02] ring-2 ring-brand-accent/20"
                  : "border-brand-accent/30 text-text-primary hover:border-brand-accent/50"
              } disabled:opacity-50`}
              disabled={saving}
            />

            {/* Enhanced number input glow */}
            {focusedField === "maxReviews" && (
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-accent/30 to-brand-secondary/30 rounded-2xl blur opacity-70 -z-10" />
            )}

            {/* Enhanced value indicator */}
            <div className="absolute right-5 top-1/2 -translate-y-1/2">
              <div
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                  maxReviewsPerDay === 0
                    ? "surface-elevated text-status-success border border-status-success"
                    : maxReviewsPerDay > 200
                    ? "surface-elevated text-status-warning border border-status-warning"
                    : "surface-elevated text-status-info border border-status-info"
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

          <div className="mt-4">
            <span className="text-text-muted flex items-center gap-3 text-base">
              <Brain className="w-4 h-4" />
              Maximum review cards per day (0 = unlimited)
            </span>
          </div>
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
                <div className="p-2 bg-gradient-to-br from-status-success/20 to-status-success/20 rounded-lg flex-shrink-0">
                  <div className="w-3 h-3 bg-status-success rounded-full animate-pulse" />
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
                <div className="p-2 bg-gradient-to-br from-status-info/20 to-status-info/20 rounded-lg flex-shrink-0">
                  <div
                    className="w-3 h-3 bg-status-info rounded-full animate-pulse"
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
                <div className="p-2 bg-gradient-to-br from-brand-secondary/20 to-brand-secondary/20 rounded-lg flex-shrink-0">
                  <div
                    className="w-3 h-3 bg-brand-secondary rounded-full animate-pulse"
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
