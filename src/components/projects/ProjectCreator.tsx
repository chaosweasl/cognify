"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  BookOpen,
  Target,
  Clock,
  Zap,
  User,
  ChevronDown,
  Play,
  Settings,
  Star,
  Coffee,
  GraduationCap,
  Briefcase,
  Heart,
  Code,
  Palette,
  Globe,
  Dumbbell,
  Rocket,
} from "lucide-react";

// Wizard steps
const STEPS = {
  WELCOME: 0,
  PURPOSE: 1,
  CATEGORY: 2,
  INTENSITY: 3,
  SCHEDULE: 4,
  ADVANCED: 5,
  CONFIRMATION: 6,
};

// Category options with icons and descriptions
const CATEGORIES = [
  {
    id: "language",
    icon: Globe,
    title: "Language Learning",
    description: "Master new languages with smart repetition",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "academic",
    icon: GraduationCap,
    title: "Academic Study",
    description: "Excel in your coursework and exams",
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "professional",
    icon: Briefcase,
    title: "Professional Skills",
    description: "Advance your career with targeted learning",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "coding",
    icon: Code,
    title: "Programming",
    description: "Learn coding concepts and syntax",
    color: "from-orange-500 to-red-500",
  },
  {
    id: "creative",
    icon: Palette,
    title: "Creative Arts",
    description: "Develop your artistic talents",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "fitness",
    icon: Dumbbell,
    title: "Health & Fitness",
    description: "Build healthy habits and knowledge",
    color: "from-green-500 to-lime-500",
  },
  {
    id: "hobby",
    icon: Heart,
    title: "Personal Interest",
    description: "Pursue your passions and hobbies",
    color: "from-indigo-500 to-blue-500",
  },
  {
    id: "other",
    icon: Sparkles,
    title: "Something Else",
    description: "Create a custom learning experience",
    color: "from-yellow-500 to-orange-500",
  },
];

// Study intensity options
const INTENSITY_OPTIONS = [
  {
    id: "light",
    title: "Light & Steady",
    subtitle: "5-10 min/day",
    newCards: 5,
    maxReviews: 50,
    icon: Coffee,
    color: "from-emerald-400 to-teal-400",
  },
  {
    id: "moderate",
    title: "Balanced",
    subtitle: "15-20 min/day",
    newCards: 15,
    maxReviews: 100,
    icon: Target,
    color: "from-blue-400 to-violet-400",
  },
  {
    id: "intensive",
    title: "Intensive",
    subtitle: "30+ min/day",
    newCards: 30,
    maxReviews: 200,
    icon: Zap,
    color: "from-orange-400 to-red-400",
  },
];

// Schedule options
const SCHEDULE_OPTIONS = [
  { id: "daily", title: "Daily", subtitle: "Every day", icon: Clock },
  {
    id: "weekdays",
    title: "Weekdays",
    subtitle: "Monday - Friday",
    icon: Briefcase,
  },
  {
    id: "flexible",
    title: "Flexible",
    subtitle: "When I have time",
    icon: Star,
  },
];

// Add types for options
type CategoryOption = (typeof CATEGORIES)[number];
type IntensityOption = (typeof INTENSITY_OPTIONS)[number];
type ScheduleOption = (typeof SCHEDULE_OPTIONS)[number];

export function ProjectCreator() {
  const [currentStep, setCurrentStep] = useState(STEPS.WELCOME);
  const [formData, setFormData] = useState<{
    name: string;
    purpose: string;
    category: CategoryOption | null;
    intensity: IntensityOption | null;
    schedule: ScheduleOption | null;
    customSettings: boolean;
  }>({
    name: "",
    purpose: "",
    category: null,
    intensity: null,
    schedule: null,
    customSettings: false,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [animationClass, setAnimationClass] = useState("");

  // Animation handler for smooth transitions
  const handleStepChange = (newStep: React.SetStateAction<number>) => {
    setAnimationClass("opacity-0 transform translate-x-4");
    setTimeout(() => {
      setCurrentStep(newStep);
      setAnimationClass("opacity-100 transform translate-x-0");
    }, 150);
  };

  // Auto-animate on mount
  useEffect(() => {
    setTimeout(() => {
      setAnimationClass("opacity-100 transform translate-x-0");
    }, 100);
  }, []);

  // Progress calculation
  const progress = ((currentStep + 1) / Object.keys(STEPS).length) * 100;

  // Welcome Step Component
  const WelcomeStep = () => (
    <div className="text-center space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <div className="relative inline-flex items-center justify-center">
        <div className="w-32 h-32 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-3xl flex items-center justify-center shadow-brand-lg transform hover:scale-105 transition-all transition-slow group">
          <Rocket className="w-16 h-16 text-white group-hover:animate-bounce" />
        </div>
        <div className="absolute -inset-4 bg-gradient-glass rounded-3xl blur opacity-60 animate-pulse" />

        {/* Floating elements */}
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-bounce opacity-80 delay-300">
          <Sparkles className="w-5 h-5 text-white m-1.5" />
        </div>
        <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-pink-400 rounded-full animate-bounce opacity-80 delay-500">
          <Star className="w-3 h-3 text-white m-1.5" />
        </div>
      </div>

      <div className="space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-text-primary via-brand-primary to-brand-secondary bg-clip-text text-transparent">
          Welcome to Cognify
        </h1>
        <p className="text-xl text-text-muted max-w-2xl mx-auto leading-relaxed">
          Let's create your perfect learning experience in just a few steps.
          <span className="block mt-2 text-brand-primary font-semibold">
            ✨ Personalized • 🧠 AI-Powered • 🚀 Effective
          </span>
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button
          onClick={() => handleStepChange(STEPS.PURPOSE)}
          className="group relative overflow-hidden bg-gradient-brand hover:shadow-brand-lg text-white font-semibold px-8 py-4 rounded-xl transition-all transition-normal hover:scale-[1.02] shadow-brand"
        >
          <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />
          <div className="relative flex items-center gap-3">
            <Play className="w-5 h-5" />
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        <div className="flex items-center gap-2 text-text-muted text-sm">
          <Clock className="w-4 h-4" />
          <span>Takes 2 minutes</span>
        </div>
      </div>
    </div>
  );

  // Purpose Step Component
  const PurposeStep = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-brand-secondary to-brand-accent rounded-2xl flex items-center justify-center mx-auto shadow-brand">
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-primary">
          Tell us about your project
        </h2>
        <p className="text-text-muted max-w-xl mx-auto">
          Give your learning project a name and describe what you want to
          achieve.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="space-y-3">
          <label className="block text-secondary font-semibold">
            Project Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Spanish Vocabulary, React Fundamentals, MCAT Prep..."
            className="w-full px-4 py-4 surface-elevated border border-subtle rounded-xl text-primary placeholder:text-muted focus:border-brand focus:shadow-brand transition-all transition-normal text-lg"
            autoFocus
          />
        </div>

        <div className="space-y-3">
          <label className="block text-secondary font-semibold">
            What's your goal?
          </label>
          <textarea
            value={formData.purpose}
            onChange={(e) =>
              setFormData({ ...formData, purpose: e.target.value })
            }
            placeholder="Describe what you want to learn and why it's important to you..."
            rows={4}
            className="w-full px-4 py-4 surface-elevated border border-subtle rounded-xl text-primary placeholder:text-muted focus:border-brand focus:shadow-brand transition-all transition-normal resize-none"
          />
        </div>
      </div>
    </div>
  );

  // Category Step Component
  const CategoryStep = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-brand-tertiary to-green-400 rounded-2xl flex items-center justify-center mx-auto shadow-brand">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-primary">
          What type of project is this?
        </h2>
        <p className="text-text-muted max-w-xl mx-auto">
          Choose the category that best matches your learning goals.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
        {CATEGORIES.map((category, index) => {
          const IconComponent = category.icon;
          const isSelected = formData.category?.id === category.id;

          return (
            <button
              key={category.id}
              onClick={() => setFormData({ ...formData, category })}
              className={`group relative overflow-hidden p-6 rounded-2xl border transition-all transition-normal hover:scale-[1.02] hover:shadow-brand text-left ${
                isSelected
                  ? "border-brand surface-elevated shadow-brand"
                  : "border-subtle surface-secondary hover:border-brand"
              }`}
              style={{
                animationDelay: `${index * 100}ms`,
                animation: "slideInUp 0.6s ease-out both",
              }}
            >
              {isSelected && (
                <div className="absolute -inset-0.5 bg-gradient-glass rounded-2xl blur opacity-100" />
              )}

              <div className="relative space-y-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center shadow-brand group-hover:scale-110 transition-transform transition-normal`}
                >
                  <IconComponent className="w-6 h-6 text-white" />
                </div>

                <div>
                  <h3 className="font-bold text-primary mb-1 group-hover:brand-primary transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-sm text-muted leading-relaxed">
                    {category.description}
                  </p>
                </div>

                {isSelected && (
                  <div className="absolute top-4 right-4 w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Intensity Step Component
  const IntensityStep = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-2xl flex items-center justify-center mx-auto shadow-brand">
          <Target className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-primary">
          How intensive should your study sessions be?
        </h2>
        <p className="text-text-muted max-w-xl mx-auto">
          Choose a pace that fits your lifestyle and goals. You can always
          adjust this later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {INTENSITY_OPTIONS.map((option, index) => {
          const IconComponent = option.icon;
          const isSelected = formData.intensity?.id === option.id;

          return (
            <button
              key={option.id}
              onClick={() => setFormData({ ...formData, intensity: option })}
              className={`group relative overflow-hidden p-8 rounded-2xl border transition-all transition-normal hover:scale-[1.02] hover:shadow-brand text-center ${
                isSelected
                  ? "border-brand surface-elevated shadow-brand"
                  : "border-subtle surface-secondary hover:border-brand"
              }`}
              style={{
                animationDelay: `${index * 200}ms`,
                animation: "slideInUp 0.6s ease-out both",
              }}
            >
              {isSelected && (
                <div className="absolute -inset-0.5 bg-gradient-glass rounded-2xl blur opacity-100" />
              )}

              <div className="relative space-y-6">
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${option.color} rounded-2xl flex items-center justify-center mx-auto shadow-brand group-hover:scale-110 transition-transform transition-normal`}
                >
                  <IconComponent className="w-8 h-8 text-white" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-primary mb-2 group-hover:brand-primary transition-colors">
                    {option.title}
                  </h3>
                  <p className="text-brand-primary font-semibold text-lg mb-3">
                    {option.subtitle}
                  </p>
                  <div className="text-sm text-muted space-y-1">
                    <div>{option.newCards} new cards/day</div>
                    <div>Up to {option.maxReviews} reviews/day</div>
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute top-4 right-4 w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Schedule Step Component
  const ScheduleStep = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center mx-auto shadow-brand">
          <Clock className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-primary">
          When do you plan to study?
        </h2>
        <p className="text-text-muted max-w-xl mx-auto">
          Set up a schedule that works for you. Consistency is key to effective
          learning.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {SCHEDULE_OPTIONS.map((option, index) => {
          const IconComponent = option.icon;
          const isSelected = formData.schedule?.id === option.id;

          return (
            <button
              key={option.id}
              onClick={() => setFormData({ ...formData, schedule: option })}
              className={`group relative overflow-hidden p-8 rounded-2xl border transition-all transition-normal hover:scale-[1.02] hover:shadow-brand text-center ${
                isSelected
                  ? "border-brand surface-elevated shadow-brand"
                  : "border-subtle surface-secondary hover:border-brand"
              }`}
              style={{
                animationDelay: `${index * 200}ms`,
                animation: "slideInUp 0.6s ease-out both",
              }}
            >
              {isSelected && (
                <div className="absolute -inset-0.5 bg-gradient-glass rounded-2xl blur opacity-100" />
              )}

              <div className="relative space-y-6">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-2xl flex items-center justify-center mx-auto shadow-brand group-hover:scale-110 transition-transform transition-normal">
                  <IconComponent className="w-8 h-8 text-white" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-primary mb-2 group-hover:brand-primary transition-colors">
                    {option.title}
                  </h3>
                  <p className="text-text-muted">{option.subtitle}</p>
                </div>

                {isSelected && (
                  <div className="absolute top-4 right-4 w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full p-4 surface-secondary border border-subtle rounded-xl text-left transition-all transition-normal hover:border-brand hover:shadow-brand group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-muted group-hover:brand-primary transition-colors" />
              <span className="font-semibold text-secondary group-hover:text-primary transition-colors">
                Advanced Settings
              </span>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-muted transition-transform ${
                showAdvanced ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {showAdvanced && (
          <div className="mt-4 p-6 surface-elevated border border-subtle rounded-xl space-y-4 animate-in slide-in-from-top-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-secondary">
                  Custom SRS Settings
                </div>
                <div className="text-sm text-muted">
                  Fine-tune the spaced repetition algorithm
                </div>
              </div>
              <button
                onClick={() =>
                  setFormData({
                    ...formData,
                    customSettings: !formData.customSettings,
                  })
                }
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  formData.customSettings ? "bg-brand-primary" : "bg-text-muted"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    formData.customSettings
                      ? "translate-x-6"
                      : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Confirmation Step Component
  const ConfirmationStep = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-gradient-brand rounded-3xl flex items-center justify-center mx-auto shadow-brand-lg animate-pulse">
          <Check className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-primary">
          Perfect! Your project is ready
        </h2>
        <p className="text-text-muted max-w-xl mx-auto">
          Review your choices below, then create your personalized learning
          experience.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        <div className="surface-elevated border border-subtle rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-primary text-lg">
                {formData.name || "Untitled Project"}
              </div>
              <div className="text-text-muted">
                {formData.purpose || "No description provided"}
              </div>
            </div>
          </div>
        </div>

        {formData.category && (
          <div className="surface-elevated border border-subtle rounded-xl p-6">
            <div className="flex items-center gap-4">
              {React.createElement(formData.category.icon, {
                className: "w-6 h-6 text-brand-primary",
              })}
              <div>
                <div className="font-semibold text-secondary">Category</div>
                <div className="text-primary">{formData.category.title}</div>
              </div>
            </div>
          </div>
        )}

        {formData.intensity && (
          <div className="surface-elevated border border-subtle rounded-xl p-6">
            <div className="flex items-center gap-4">
              <Target className="w-6 h-6 text-brand-primary" />
              <div>
                <div className="font-semibold text-secondary">
                  Study Intensity
                </div>
                <div className="text-primary">
                  {formData.intensity.title} - {formData.intensity.subtitle}
                </div>
              </div>
            </div>
          </div>
        )}

        {formData.schedule && (
          <div className="surface-elevated border border-subtle rounded-xl p-6">
            <div className="flex items-center gap-4">
              <Clock className="w-6 h-6 text-brand-primary" />
              <div>
                <div className="font-semibold text-secondary">Schedule</div>
                <div className="text-primary">
                  {formData.schedule.title} - {formData.schedule.subtitle}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-center">
        <button
          onClick={() => {
            // Here you would normally create the project
            alert("Project created successfully! 🎉");
          }}
          className="group relative overflow-hidden bg-gradient-brand hover:shadow-brand-lg text-white font-bold text-lg px-10 py-4 rounded-xl transition-all transition-normal hover:scale-[1.02] shadow-brand"
        >
          <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />
          <div className="relative flex items-center gap-3">
            <Sparkles className="w-6 h-6" />
            <span>Create My Project</span>
            <Rocket className="w-6 h-6 group-hover:animate-bounce" />
          </div>
        </button>
      </div>
    </div>
  );

  // Navigation buttons
  const canGoNext = () => {
    switch (currentStep) {
      case STEPS.WELCOME:
        return true;
      case STEPS.PURPOSE:
        return formData.name.trim().length > 0;
      case STEPS.CATEGORY:
        return formData.category !== null;
      case STEPS.INTENSITY:
        return formData.intensity !== null;
      case STEPS.SCHEDULE:
        return formData.schedule !== null;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canGoNext() && currentStep < STEPS.CONFIRMATION) {
      handleStepChange(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > STEPS.WELCOME) {
      handleStepChange(currentStep - 1);
    }
  };

  // Step component renderer
  const renderStep = () => {
    const steps = [
      WelcomeStep,
      PurposeStep,
      CategoryStep,
      IntensityStep,
      ScheduleStep,
      null, // Advanced settings (handled in schedule)
      ConfirmationStep,
    ];

    const StepComponent = steps[currentStep];
    return StepComponent ? <StepComponent /> : null;
  };

  return (
    <div className="flex-1 surface-primary relative overflow-hidden">
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

      {/* Progress bar */}
      {currentStep > STEPS.WELCOME && (
        <div className="relative z-10 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="surface-secondary rounded-full h-2 overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-brand transition-all duration-1000 ease-out shadow-brand"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-4 text-sm">
              <span className="text-text-muted">
                Step {currentStep + 1} of {Object.keys(STEPS).length}
              </span>
              <span className="text-brand-primary font-semibold">
                {Math.round(progress)}% complete
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div
        className={`relative z-10 w-full max-w-7xl mx-auto px-6 py-8 md:py-12 transition-all transition-normal ${animationClass}`}
      >
        {renderStep()}
      </div>

      {/* Navigation */}
      {currentStep > STEPS.WELCOME && currentStep < STEPS.CONFIRMATION && (
        <div className="relative z-10 p-4 md:p-6 border-t border-subtle">
          <div className="max-w-7xl mx-auto flex justify-between">
            <button
              onClick={handlePrev}
              className="group flex items-center gap-2 px-4 md:px-6 py-3 surface-secondary border border-subtle rounded-xl text-secondary hover:text-primary hover:border-brand transition-all transition-normal interactive-hover"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="font-semibold">Back</span>
            </button>

            <button
              onClick={handleNext}
              disabled={!canGoNext()}
              className={`group flex items-center gap-2 px-4 md:px-6 py-3 rounded-xl font-semibold transition-all transition-normal ${
                canGoNext()
                  ? "bg-gradient-brand text-white hover:shadow-brand shadow-brand hover:scale-[1.02]"
                  : "surface-secondary text-muted border border-subtle cursor-not-allowed"
              }`}
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
