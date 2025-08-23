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
} from "lucide-react";
import { createProject } from "@/app/(main)/projects/actions";
import { ProjectInfoForm } from "./ProjectInfoForm";
import { ProjectSRSSettings } from "./ProjectSRSSettings";
import { CacheInvalidation } from "@/hooks/useCache";
import { useProjectsStore } from "@/hooks/useProjects";

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
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-brand opacity-5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute bottom-32 right-16 w-48 h-48 bg-gradient-to-r from-brand-secondary to-brand-tertiary opacity-5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "2s" }}
        />
      </div>

      <div className="relative container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4 group">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-brand transform group-hover:scale-110 transition-all transition-normal">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-glass rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all transition-normal" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4 bg-gradient-to-r from-text-primary via-brand-primary to-text-primary bg-clip-text">
            Create New Project
          </h1>

          <p className="text-text-muted text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Start your learning journey by creating a new flashcard project.
            Customize your study preferences and begin building your knowledge
            base.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="alert alert-error surface-elevated border-red-500/20 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <div>
                  <div className="font-bold text-red-400">Creation Failed</div>
                  <div className="text-sm text-red-400/80">{error}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column - Project Info */}
            <div className="xl:col-span-2 space-y-8">
              {/* Project Information Card */}
              <div className="card surface-elevated border border-subtle shadow-brand-lg backdrop-blur group">
                <div className="card-body p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-glass rounded-lg">
                      <BookOpen className="w-6 h-6 brand-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary">
                      Project Details
                    </h2>
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
              <div className="card surface-elevated border border-subtle shadow-brand-lg backdrop-blur group">
                <div className="card-body p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-glass rounded-lg">
                      <Target className="w-6 h-6 brand-secondary" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary">
                      Study Settings
                    </h2>
                  </div>

                  <ProjectSRSSettings
                    project={{ ...DEFAULT_PROJECT, ...srsSettings }}
                    onChange={setSrsSettings}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Preview & Tips */}
            <div className="xl:col-span-1 space-y-6">
              {/* Quick Tips Card */}
              <div className="card surface-elevated border border-subtle shadow-brand backdrop-blur">
                <div className="card-body p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-glass rounded-lg">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                    </div>
                    <h3 className="text-lg font-bold text-primary">
                      Quick Tips
                    </h3>
                  </div>

                  <div className="space-y-4 text-sm">
                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-primary mt-2 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-secondary">
                          Clear Project Name
                        </div>
                        <div className="text-muted">
                          Choose a descriptive name that reflects your study
                          topic
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-secondary mt-2 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-secondary">
                          Daily Limits
                        </div>
                        <div className="text-muted">
                          Set realistic daily goals to maintain consistent study
                          habits
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-tertiary mt-2 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-secondary">
                          SRS Settings
                        </div>
                        <div className="text-muted">
                          The default settings work well for most learners
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Steps Card */}
              <div className="card surface-elevated border border-subtle shadow-brand backdrop-blur overflow-hidden">
                <div className="absolute inset-0 bg-gradient-glass opacity-30" />
                <div className="card-body p-6 relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-gradient-glass rounded-lg">
                      <Sparkles className="w-5 h-5 brand-accent" />
                    </div>
                    <h3 className="text-lg font-bold text-primary">
                      What's Next?
                    </h3>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 p-3 surface-secondary rounded-lg border border-subtle">
                      <div className="w-6 h-6 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center font-bold">
                        1
                      </div>
                      <span className="text-secondary">
                        Create your project
                      </span>
                    </div>

                    <div className="flex items-center gap-3 p-3 surface-glass rounded-lg border border-subtle opacity-60">
                      <div className="w-6 h-6 rounded-full bg-text-muted text-white text-xs flex items-center justify-center font-bold">
                        2
                      </div>
                      <span className="text-muted">
                        Add flashcards to your project
                      </span>
                    </div>

                    <div className="flex items-center gap-3 p-3 surface-glass rounded-lg border border-subtle opacity-60">
                      <div className="w-6 h-6 rounded-full bg-text-muted text-white text-xs flex items-center justify-center font-bold">
                        3
                      </div>
                      <span className="text-muted">
                        Start studying and learning
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="max-w-6xl mx-auto mt-12">
          <div className="flex flex-col sm:flex-row sm:justify-end gap-4">
            <button
              className="btn btn-ghost btn-lg interactive-hover border border-subtle hover:shadow-brand transition-all transition-normal"
              onClick={handleCancel}
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
              Cancel
            </button>

            <button
              className={`btn btn-lg shadow-brand hover:shadow-brand-lg transition-all transition-normal relative overflow-hidden group ${
                isValid && !isLoading
                  ? "bg-gradient-brand hover:bg-gradient-brand-hover text-white border-0"
                  : "btn-disabled"
              }`}
              onClick={handleCreate}
              disabled={!isValid || isLoading}
            >
              {/* Button glow effect */}
              <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />

              <div className="relative z-10 flex items-center gap-3">
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Create & Add Cards
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
