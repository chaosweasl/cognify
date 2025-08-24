"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ArrowRight,
  ArrowLeft,
  Check,
  Brain,
  Target,
  Sparkles,
  BookOpen,
  Clock,
  Zap,
  Settings,
  Lightbulb,
  Star,
} from "lucide-react";
import { createProject } from "@/app/(main)/projects/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CacheInvalidation } from "@/hooks/useCache";
import { useProjectsStore } from "@/hooks/useProjects";

// Default project data for new projects
const DEFAULT_PROJECT = {
  name: "",
  description: "",
  new_cards_per_day: 20,
  max_reviews_per_day: 100,
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

const STEPS = [
  {
    id: "welcome",
    title: "Welcome",
    subtitle: "Let's create something amazing",
    icon: Sparkles,
  },
  {
    id: "basics",
    title: "Project Basics",
    subtitle: "Tell us about your project",
    icon: BookOpen,
  },
  {
    id: "goals",
    title: "Study Goals",
    subtitle: "Set your learning pace",
    icon: Target,
  },
  {
    id: "advanced",
    title: "Advanced Settings",
    subtitle: "Fine-tune your experience",
    icon: Settings,
  },
  {
    id: "ready",
    title: "Ready to Go!",
    subtitle: "Your project is ready",
    icon: Check,
  },
];

export function InteractiveProjectCreator() {
  const router = useRouter();
  const { reset: resetProjects } = useProjectsStore();

  // Step management
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [newCardsPerDay, setNewCardsPerDay] = useState(DEFAULT_PROJECT.new_cards_per_day);
  const [maxReviewsPerDay, setMaxReviewsPerDay] = useState(DEFAULT_PROJECT.max_reviews_per_day);
  const [useAdvancedSettings, setUseAdvancedSettings] = useState(false);
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

  const currentStepData = STEPS[currentStep];

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0: // Welcome
        return true;
      case 1: // Basics
        return name.trim().length > 0;
      case 2: // Goals
        return newCardsPerDay > 0 && maxReviewsPerDay > 0;
      case 3: // Advanced
        return true;
      case 4: // Ready
        return true;
      default:
        return true;
    }
  };

  const canProceed = validateCurrentStep();

  const handleNext = () => {
    if (canProceed && currentStep < STEPS.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkipToStep = (stepIndex: number) => {
    if (stepIndex <= currentStep || completedSteps.has(stepIndex - 1)) {
      setCurrentStep(stepIndex);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) return;

    setCreating(true);
    setError(null);

    try {
      const projectData = {
        name: name.trim(),
        description: description.trim(),
        new_cards_per_day: newCardsPerDay,
        max_reviews_per_day: maxReviewsPerDay,
        ...(useAdvancedSettings ? srsSettings : DEFAULT_PROJECT),
      };

      const projectId = await createProject(projectData);

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

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <div className="text-center space-y-8">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-brand rounded-full flex items-center justify-center mx-auto shadow-brand-lg">
                <Brain className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-primary mb-4">
                Welcome to Your Learning Journey!
              </h2>
              <p className="text-xl text-secondary max-w-2xl mx-auto leading-relaxed">
                Let's create a personalized learning project that adapts to your pace and helps you master new knowledge effectively.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="surface-elevated border border-subtle hover:surface-glass transition-all transition-normal">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-primary mb-2">Smart Learning</h3>
                  <p className="text-sm text-secondary">AI-powered spaced repetition algorithm</p>
                </CardContent>
              </Card>
              <Card className="surface-elevated border border-subtle hover:surface-glass transition-all transition-normal">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-brand-secondary to-brand-accent rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-primary mb-2">Flexible Pacing</h3>
                  <p className="text-sm text-secondary">Study at your own comfortable speed</p>
                </CardContent>
              </Card>
              <Card className="surface-elevated border border-subtle hover:surface-glass transition-all transition-normal">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-brand-tertiary to-green-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-primary mb-2">Proven Results</h3>
                  <p className="text-sm text-secondary">Memory science-backed methodology</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 1: // Basics
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-brand">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-primary mb-4">Project Basics</h2>
              <p className="text-lg text-secondary max-w-2xl mx-auto">
                Give your project a memorable name and description to keep you motivated.
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-lg font-semibold text-secondary mb-3">
                  Project Name *
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Spanish Vocabulary, Biology Terms, History Facts..."
                  className="h-14 text-lg surface-secondary border-secondary focus:border-brand-primary transition-all transition-normal"
                />
              </div>

              <div>
                <label className="block text-lg font-semibold text-secondary mb-3">
                  Description (Optional)
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What will you be learning? Add some motivation for yourself..."
                  rows={4}
                  className="text-lg surface-secondary border-secondary focus:border-brand-primary transition-all transition-normal resize-none"
                />
              </div>

              {name.trim() && (
                <Card className="bg-green-500/10 border border-green-500/30 animate-[slideUp_0.3s_ease-out]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-green-400">Looking great!</p>
                        <p className="text-sm text-green-400/80">Your project "{name}" is ready to go.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      case 2: // Goals
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-brand-secondary to-brand-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-brand">
                <Target className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-primary mb-4">Study Goals</h2>
              <p className="text-lg text-secondary max-w-2xl mx-auto">
                Set realistic daily limits to build a sustainable learning habit.
              </p>
            </div>

            <div className="max-w-2xl mx-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="surface-elevated border border-subtle hover:surface-glass transition-all transition-normal">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center">
                        <Plus className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-primary">New Cards per Day</h3>
                    </div>
                    <Input
                      type="number"
                      value={newCardsPerDay}
                      onChange={(e) => setNewCardsPerDay(parseInt(e.target.value) || 0)}
                      min={1}
                      max={100}
                      className="h-12 text-lg surface-secondary border-secondary focus:border-brand-primary transition-all transition-normal"
                    />
                    <p className="text-sm text-muted mt-2">
                      How many new flashcards to learn each day
                    </p>
                  </CardContent>
                </Card>

                <Card className="surface-elevated border border-subtle hover:surface-glass transition-all transition-normal">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-brand-secondary to-brand-accent rounded-xl flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-primary">Max Reviews per Day</h3>
                    </div>
                    <Input
                      type="number"
                      value={maxReviewsPerDay}
                      onChange={(e) => setMaxReviewsPerDay(parseInt(e.target.value) || 0)}
                      min={10}
                      max={500}
                      className="h-12 text-lg surface-secondary border-secondary focus:border-brand-primary transition-all transition-normal"
                    />
                    <p className="text-sm text-muted mt-2">
                      Maximum daily reviews to prevent overwhelm
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-brand-primary/5 border border-brand-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary mb-2">Recommended Settings</h3>
                      <p className="text-secondary text-sm leading-relaxed">
                        For beginners, we recommend 15-25 new cards and 50-100 reviews per day. 
                        You can always adjust these later as you find your optimal pace.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 3: // Advanced
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-brand-secondary to-brand-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-brand">
                <Settings className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-primary mb-4">Advanced Settings</h2>
              <p className="text-lg text-secondary max-w-2xl mx-auto">
                Our default settings work great for most learners, but you can customize them if needed.
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
              <Card className="surface-elevated border border-subtle">
                <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-primary mb-2">
                        Use Advanced SRS Settings
                      </h3>
                      <p className="text-secondary">
                        Customize learning steps, ease factors, and intervals
                      </p>
                    </div>
                    <Button
                      variant={useAdvancedSettings ? "default" : "outline"}
                      onClick={() => setUseAdvancedSettings(!useAdvancedSettings)}
                      className={useAdvancedSettings ? "bg-gradient-brand" : ""}
                    >
                      {useAdvancedSettings ? "Advanced" : "Default"}
                    </Button>
                  </div>

                  {!useAdvancedSettings ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex justify-between py-3 border-b border-subtle">
                          <span className="font-medium text-secondary">Learning Steps</span>
                          <span className="text-muted">1, 10 minutes</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-subtle">
                          <span className="font-medium text-secondary">Graduating Interval</span>
                          <span className="text-muted">1 day</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-subtle">
                          <span className="font-medium text-secondary">Easy Interval</span>
                          <span className="text-muted">4 days</span>
                        </div>
                        <div className="flex justify-between py-3 border-b border-subtle">
                          <span className="font-medium text-secondary">Starting Ease</span>
                          <span className="text-muted">250%</span>
                        </div>
                      </div>
                      <Card className="bg-green-500/10 border border-green-500/30">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-green-400">Perfect for most learners!</p>
                              <p className="text-sm text-green-400/80">These settings are optimized for effective retention.</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-secondary mb-2">
                            Learning Steps (minutes)
                          </label>
                          <Input
                            type="text"
                            value={srsSettings.learning_steps.join(", ")}
                            onChange={(e) => setSrsSettings(prev => ({
                              ...prev,
                              learning_steps: e.target.value.split(",").map(s => parseInt(s.trim()) || 1)
                            }))}
                            className="surface-secondary border-secondary focus:border-brand-primary transition-all transition-normal"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-secondary mb-2">
                            Graduating Interval (days)
                          </label>
                          <Input
                            type="number"
                            value={srsSettings.graduating_interval}
                            onChange={(e) => setSrsSettings(prev => ({
                              ...prev,
                              graduating_interval: parseInt(e.target.value) || 1
                            }))}
                            className="surface-secondary border-secondary focus:border-brand-primary transition-all transition-normal"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-secondary mb-2">
                            Easy Interval (days)
                          </label>
                          <Input
                            type="number"
                            value={srsSettings.easy_interval}
                            onChange={(e) => setSrsSettings(prev => ({
                              ...prev,
                              easy_interval: parseInt(e.target.value) || 4
                            }))}
                            className="surface-secondary border-secondary focus:border-brand-primary transition-all transition-normal"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-secondary mb-2">
                            Starting Ease (%)
                          </label>
                          <Input
                            type="number"
                            value={Math.round(srsSettings.starting_ease * 100)}
                            onChange={(e) => setSrsSettings(prev => ({
                              ...prev,
                              starting_ease: (parseInt(e.target.value) || 250) / 100
                            }))}
                            className="surface-secondary border-secondary focus:border-brand-primary transition-all transition-normal"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 4: // Ready
        return (
          <div className="text-center space-y-8">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-brand rounded-full flex items-center justify-center mx-auto shadow-brand-lg">
                <Check className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                <Star className="w-8 h-8 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-primary mb-4">
                🎉 Your Project is Ready!
              </h2>
              <p className="text-xl text-secondary max-w-2xl mx-auto leading-relaxed">
                <strong className="text-brand-primary">"{name}"</strong> has been configured with your preferences. 
                Let's add some flashcards and start your learning journey!
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <Card className="bg-gradient-glass border border-brand">
                <CardContent className="p-6">
                  <h3 className="font-bold text-primary mb-4">Project Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary">Daily new cards:</span>
                      <Badge variant="secondary">{newCardsPerDay}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Max daily reviews:</span>
                      <Badge variant="secondary">{maxReviewsPerDay}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">SRS settings:</span>
                      <Badge variant="outline">
                        {useAdvancedSettings ? "Custom" : "Optimized"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {error && (
              <Card className="border-red-500/20 bg-red-500/5 max-w-md mx-auto">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-red-400 font-semibold mb-1">Creation Failed</p>
                    <p className="text-xs text-red-400/80">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen surface-primary relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-15">
        <div
          className="absolute top-0 right-0 w-96 h-96 bg-gradient-glass rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-r from-brand-secondary/30 to-brand-accent/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "12s", animationDelay: "4s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-primary/20 rounded-full blur-2xl animate-pulse"
          style={{ animationDuration: "10s", animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center justify-between mb-8">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = completedSteps.has(index);
              const isClickable = index <= currentStep || isCompleted;

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => handleSkipToStep(index)}
                    disabled={!isClickable}
                    className={`relative flex flex-col items-center group transition-all transition-normal ${
                      isClickable ? "cursor-pointer" : "cursor-not-allowed"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 transition-all transition-normal ${
                        isActive
                          ? "bg-gradient-brand shadow-brand-lg scale-110"
                          : isCompleted
                          ? "bg-green-500 shadow-brand"
                          : "surface-elevated border border-subtle"
                      } ${isClickable ? "hover:scale-105" : ""}`}
                    >
                      <StepIcon
                        className={`w-6 h-6 ${
                          isActive || isCompleted ? "text-white" : "text-muted"
                        }`}
                      />
                    </div>
                    <div className="text-center">
                      <div
                        className={`text-sm font-semibold ${
                          isActive ? "text-brand-primary" : isCompleted ? "text-green-400" : "text-muted"
                        }`}
                      >
                        {step.title}
                      </div>
                      <div className="text-xs text-muted hidden sm:block">
                        {step.subtitle}
                      </div>
                    </div>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-px w-8 md:w-16 mx-2 transition-all transition-normal ${
                        isCompleted ? "bg-green-500" : "border-subtle"
                      }`}
                      style={{ borderTopWidth: 1, borderTopStyle: "dashed" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-5xl mx-auto mb-12">
          <Card className="surface-elevated glass-surface border border-subtle shadow-brand-lg">
            <CardContent className="p-8 md:p-12">
              {renderStepContent()}
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={currentStep === 0 ? () => router.push("/projects") : handlePrevious}
              className="px-6 py-3 surface-elevated border-subtle hover:surface-glass hover:border-brand transition-all transition-normal"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 0 ? "Back to Projects" : "Previous"}
            </Button>

            <div className="flex items-center gap-2">
              {STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all transition-normal ${
                    index === currentStep
                      ? "bg-brand-primary w-8"
                      : completedSteps.has(index)
                      ? "bg-green-500"
                      : "bg-subtle"
                  }`}
                />
              ))}
            </div>

            {currentStep < STEPS.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className={`px-6 py-3 ${
                  canProceed
                    ? "bg-gradient-brand hover:shadow-brand-lg"
                    : "surface-secondary border border-subtle"
                }`}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={creating || !canProceed}
                className="px-8 py-3 bg-gradient-brand hover:shadow-brand-lg"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create & Add Cards
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}