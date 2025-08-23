"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Save,
  X,
  Loader2,
  Sparkles,
  BookOpen,
  Target,
  Lightbulb,
  ArrowRight,
  Brain,
  Clock,
  Zap,
  TrendingUp,
} from "lucide-react";
import { createProject } from "@/app/(main)/projects/actions";
import { ProjectInfoForm } from "./ProjectInfoForm";
import { ProjectSRSSettings } from "./ProjectSRSSettings";
import { CacheInvalidation } from "@/hooks/useCache";
import { useProjectsStore } from "@/hooks/useProjects";
import { NormalizedProject } from "@/lib/utils/normalizeProject";

// Default project data for new projects
const DEFAULT_PROJECT = {
  name: "",
  description: "",
  new_cards_per_day: 20,
  max_reviews_per_day: 100,
  // Default SRS settings (Anki-compatible)
  learning_steps: [1, 10],
  relearning_steps: [10],
  graduating_interval: 1,
  easy_interval: 4,
  starting_ease: 2.5,
  minimum_ease: 1.3,
  easy_bonus: 1.3,
  hard_interval_factor: 1.2,
  easy_interval_factor: 1.3,
  lapse_recovery_factor: 0.5,
  leech_threshold: 8,
  leech_action: "suspend" as const,
  new_card_order: "random" as const,
  review_ahead: false,
  bury_siblings: false,
  max_interval: 36500,
  lapse_ease_penalty: 0.2,
};

export function ProjectCreator() {
  const router = useRouter();
  const { reset: resetProjects } = useProjectsStore();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [newCardsPerDay, setNewCardsPerDay] = useState(
    DEFAULT_PROJECT.new_cards_per_day
  );
  const [maxReviewsPerDay, setMaxReviewsPerDay] = useState(
    DEFAULT_PROJECT.max_reviews_per_day
  );
  const [srsSettings, setSrsSettings] = useState({
    learning_steps: DEFAULT_PROJECT.learning_steps,
    relearning_steps: DEFAULT_PROJECT.relearning_steps,
    graduating_interval: DEFAULT_PROJECT.graduating_interval,
    easy_interval: DEFAULT_PROJECT.easy_interval,
    starting_ease: DEFAULT_PROJECT.starting_ease,
    minimum_ease: DEFAULT_PROJECT.minimum_ease,
    easy_bonus: DEFAULT_PROJECT.easy_bonus,
    hard_interval_factor: DEFAULT_PROJECT.hard_interval_factor,
    easy_interval_factor: DEFAULT_PROJECT.easy_interval_factor,
    lapse_recovery_factor: DEFAULT_PROJECT.lapse_recovery_factor,
    leech_threshold: DEFAULT_PROJECT.leech_threshold,
    leech_action: DEFAULT_PROJECT.leech_action,
    new_card_order: DEFAULT_PROJECT.new_card_order,
    review_ahead: DEFAULT_PROJECT.review_ahead,
    bury_siblings: DEFAULT_PROJECT.bury_siblings,
    max_interval: DEFAULT_PROJECT.max_interval,
    lapse_ease_penalty: DEFAULT_PROJECT.lapse_ease_penalty,
  });

  // UI state
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form validation
  const isValid = name.trim().length > 0;
  const isLoading = creating;

  const handleCreate = async () => {
    if (!isValid) return;

    setCreating(true);
    setError(null);

    try {
      const projectId = await createProject({
        name: name.trim(),
        description: description.trim(),
        new_cards_per_day: newCardsPerDay,
        max_reviews_per_day: maxReviewsPerDay,
        ...srsSettings,
      });

      // Invalidate cache to ensure UI updates
      CacheInvalidation.invalidatePattern("user_projects");

      // Reset projects store to ensure fresh data
      resetProjects();

      // Navigate to the edit page to add flashcards
      router.push(`/projects/${projectId}/edit`);
    } catch (err) {
      console.error("Error creating project:", err);
      setError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = () => {
    router.push("/projects");
  };

  return (
    <div className="min-h-screen surface-primary">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-glass rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute bottom-32 right-16 w-48 h-48 bg-gradient-glass rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-glass rounded-full blur-3xl opacity-20 animate-pulse"
          style={{ animationDuration: "8s", animationDelay: "1s" }}
        />
      </div>

      <div className="relative container mx-auto px-4 py-8">
        {/* Enhanced Header with Animation */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6 group">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-brand rounded-3xl flex items-center justify-center shadow-brand-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all transition-slow">
                <Plus className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -inset-2 bg-gradient-glass rounded-3xl blur opacity-0 group-hover:opacity-100 transition-all transition-slow" />
              {/* Floating sparkles */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce opacity-80">
                <Sparkles className="w-3 h-3 text-white m-0.5" />
              </div>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-text-primary via-brand-primary to-brand-secondary bg-clip-text text-transparent">
            Create New Project
          </h1>

          <p className="text-text-muted text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
            Transform your learning with AI-powered spaced repetition.{" "}
            <span className="text-brand-primary font-semibold">
              Start your knowledge journey today.
            </span>
          </p>
        </div>

        {/* Enhanced Error Alert */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="relative overflow-hidden rounded-2xl border border-red-500/20 glass-surface shadow-brand-lg backdrop-blur group">
              <div className="absolute inset-0 bg-red-500/5" />
              <div className="relative p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center">
                    <X className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <div className="font-bold text-red-400 text-lg mb-1">
                      Creation Failed
                    </div>
                    <div className="text-red-400/80">{error}</div>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="ml-auto p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Left Column - Project Info (2 columns on xl) */}
            <div className="xl:col-span-3 space-y-8">
              {/* Project Information Card */}
              <div className="relative overflow-hidden rounded-2xl glass-surface border border-subtle shadow-brand-lg backdrop-blur group">
                {/* Card glow effect */}
                <div className="absolute -inset-0.5 bg-gradient-glass rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all transition-slow" />

                <div className="relative p-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-brand">
                      <BookOpen className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-primary mb-1">
                        Project Details
                      </h2>
                      <p className="text-text-muted">
                        Give your project a name and set your study goals
                      </p>
                    </div>
                  </div>

                  <ProjectInfoForm
                    name={name}
                    setName={setName}
                    description={description}
                    setDescription={setDescription}
                    newCardsPerDay={newCardsPerDay}
                    setNewCardsPerDay={setNewCardsPerDay}
                    maxReviewsPerDay={maxReviewsPerDay}
                    setMaxReviewsPerDay={setMaxReviewsPerDay}
                    isValid={isValid}
                    saving={isLoading}
                  />
                </div>
              </div>

              {/* Study Settings Card */}
              <div className="relative overflow-hidden rounded-2xl glass-surface border border-subtle shadow-brand-lg backdrop-blur group">
                <div className="absolute -inset-0.5 bg-gradient-glass rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all transition-slow" />

                <div className="relative p-8">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-gradient-to-r from-brand-secondary to-brand-accent rounded-2xl flex items-center justify-center shadow-brand">
                      <Target className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-primary mb-1">
                        Study Settings
                      </h2>
                      <p className="text-text-muted">
                        Configure your spaced repetition algorithm
                      </p>
                    </div>
                  </div>

                  <ProjectSRSSettings
                    project={
                      {
                        ...DEFAULT_PROJECT,
                        ...srsSettings,
                      } as NormalizedProject
                    }
                    onChange={(updates) => {
                      // Filter updates to only include SRS settings that match our state shape
                      const srsUpdates = Object.fromEntries(
                        Object.entries(updates).filter(
                          ([key]) => key in srsSettings
                        )
                      ) as Partial<typeof srsSettings>;

                      setSrsSettings((prev) => ({ ...prev, ...srsUpdates }));
                    }}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Tips & Preview (1 column on xl) */}
            <div className="xl:col-span-1 space-y-6">
              {/* Quick Tips Card */}
              <div className="relative overflow-hidden rounded-2xl glass-surface border border-subtle shadow-brand backdrop-blur group">
                <div className="absolute inset-0 bg-gradient-glass opacity-20" />
                <div className="relative p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                    </div>
                    <h3 className="text-xl font-bold text-primary">Pro Tips</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="w-3 h-3 rounded-full bg-gradient-brand mt-2 flex-shrink-0 shadow-brand" />
                      <div>
                        <div className="font-bold text-secondary mb-1">
                          Descriptive Names
                        </div>
                        <div className="text-muted text-sm leading-relaxed">
                          Choose clear, specific names that reflect your study
                          topic for easy organization
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-brand-secondary to-brand-accent mt-2 flex-shrink-0 shadow-brand" />
                      <div>
                        <div className="font-bold text-secondary mb-1">
                          Realistic Goals
                        </div>
                        <div className="text-muted text-sm leading-relaxed">
                          Set achievable daily limits to build consistent study
                          habits without burnout
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-brand-tertiary to-green-400 mt-2 flex-shrink-0 shadow-brand" />
                      <div>
                        <div className="font-bold text-secondary mb-1">
                          Smart Defaults
                        </div>
                        <div className="text-muted text-sm leading-relaxed">
                          Our optimized SRS settings work great for most
                          learners - no need to change them
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Learning Journey Card */}
              <div className="relative overflow-hidden rounded-2xl glass-surface border border-subtle shadow-brand backdrop-blur">
                <div className="absolute inset-0 bg-gradient-glass opacity-30" />
                <div className="relative p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center shadow-brand">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-primary">
                      Your Journey
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 surface-elevated rounded-xl border border-subtle group hover:shadow-brand transition-all transition-normal">
                      <div className="w-8 h-8 rounded-full bg-gradient-brand text-white text-sm flex items-center justify-center font-bold shadow-brand">
                        1
                      </div>
                      <div className="flex-1">
                        <span className="text-secondary font-semibold">
                          Create Project
                        </span>
                        <div className="w-full bg-brand-primary/20 rounded-full h-1 mt-2">
                          <div className="bg-gradient-brand h-1 rounded-full w-full shadow-brand" />
                        </div>
                      </div>
                      <Zap className="w-4 h-4 text-brand-primary opacity-60" />
                    </div>

                    <div className="flex items-center gap-4 p-4 surface-secondary rounded-xl border border-subtle opacity-60 group">
                      <div className="w-8 h-8 rounded-full bg-text-muted text-white text-sm flex items-center justify-center font-bold">
                        2
                      </div>
                      <div className="flex-1">
                        <span className="text-muted font-semibold">
                          Add Flashcards
                        </span>
                        <div className="w-full bg-text-muted/20 rounded-full h-1 mt-2">
                          <div className="bg-text-muted/40 h-1 rounded-full w-0" />
                        </div>
                      </div>
                      <Clock className="w-4 h-4 text-muted" />
                    </div>

                    <div className="flex items-center gap-4 p-4 surface-secondary rounded-xl border border-subtle opacity-60 group">
                      <div className="w-8 h-8 rounded-full bg-text-muted text-white text-sm flex items-center justify-center font-bold">
                        3
                      </div>
                      <div className="flex-1">
                        <span className="text-muted font-semibold">
                          Start Learning
                        </span>
                        <div className="w-full bg-text-muted/20 rounded-full h-1 mt-2">
                          <div className="bg-text-muted/40 h-1 rounded-full w-0" />
                        </div>
                      </div>
                      <TrendingUp className="w-4 h-4 text-muted" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics Preview */}
              <div className="relative overflow-hidden rounded-2xl glass-surface border border-subtle shadow-brand backdrop-blur">
                <div className="absolute inset-0 bg-gradient-glass opacity-20" />
                <div className="relative p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-brand">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-primary mb-2">
                      Ready to Start?
                    </h3>
                    <p className="text-muted text-sm leading-relaxed">
                      Join thousands of learners using AI-powered spaced
                      repetition to master new skills faster than ever.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="max-w-7xl mx-auto mt-12">
          <div className="flex flex-col sm:flex-row sm:justify-end gap-6">
            <button
              className="btn btn-ghost btn-lg interactive-hover border-2 border-subtle hover:border-brand hover:shadow-brand transition-all transition-normal group relative overflow-hidden rounded-xl px-8 py-4"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <div className="absolute inset-0 bg-gradient-glass opacity-0 group-hover:opacity-100 transition-opacity transition-normal" />
              <div className="relative flex items-center gap-3">
                <X className="w-5 h-5" />
                <span className="font-semibold">Cancel</span>
              </div>
            </button>

            <button
              className={`relative overflow-hidden rounded-xl px-8 py-4 font-semibold transition-all transition-normal group ${
                isValid && !isLoading
                  ? "bg-gradient-brand hover:shadow-brand-lg text-white border-0 hover:scale-[1.02] shadow-brand"
                  : "bg-surface-secondary text-muted border border-subtle cursor-not-allowed"
              }`}
              onClick={handleCreate}
              disabled={!isValid || isLoading}
            >
              {/* Button shine effect */}
              {isValid && !isLoading && (
                <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />
              )}

              <div className="relative flex items-center gap-3">
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Project...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Create & Add Cards</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform transition-fast" />
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
