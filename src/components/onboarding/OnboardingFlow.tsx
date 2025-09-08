"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  CheckCircle,
  X,
  Upload,
  FileText,
  Brain,
  Play,
  Settings,
  TrendingUp,
} from "lucide-react";
import { useEnhancedToast } from "@/src/components/ui/enhanced-toast";

/* =========================== 
   ONBOARDING SYSTEM
   Progressive user guidance for new users
   =========================== */

interface OnboardingStep {
  id: string;
  target: string;
  title: string;
  content: string;
  icon: React.ReactNode;
  position: "top" | "bottom" | "left" | "right";
  offset?: { x: number; y: number };
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    target: "body",
    title: "Welcome to Cognify!",
    content:
      "Let's get you started with AI-powered learning. We'll show you the key features in just a few steps.",
    icon: <Brain className="w-5 h-5 text-brand-primary" />,
    position: "bottom",
  },
  {
    id: "create-project",
    target: "[data-onboarding='create-project']",
    title: "Create Your First Project",
    content:
      "Start by creating a project. Upload PDFs or add flashcards manually to organize your learning materials.",
    icon: <FileText className="w-5 h-5 text-brand-secondary" />,
    position: "bottom",
  },
  {
    id: "upload-content",
    target: "[data-onboarding='upload']",
    title: "Upload Learning Materials",
    content:
      "Drop your PDF files here and let our AI transform them into effective flashcards automatically.",
    icon: <Upload className="w-5 h-5 text-status-success" />,
    position: "top",
  },
  {
    id: "sidebar-nav",
    target: "[data-onboarding='sidebar']",
    title: "Quick Navigation",
    content:
      "Use the sidebar to quickly access your projects, study sessions, and settings.",
    icon: <TrendingUp className="w-5 h-5 text-brand-tertiary" />,
    position: "right",
    offset: { x: 20, y: 0 },
  },
  {
    id: "study-session",
    target: "[data-onboarding='study-button']",
    title: "Start Studying",
    content:
      "Click here to begin a spaced repetition study session. Our algorithm will optimize your learning schedule.",
    icon: <Play className="w-5 h-5 text-status-info" />,
    position: "top",
  },
  {
    id: "settings",
    target: "[data-onboarding='settings']",
    title: "Customize Your Experience",
    content:
      "Access settings to configure AI providers, study preferences, and personalize your learning experience.",
    icon: <Settings className="w-5 h-5 text-text-muted" />,
    position: "left",
  },
];

interface OnboardingFlowProps {
  onComplete?: () => void;
  autoStart?: boolean;
}

export function OnboardingFlow({
  onComplete,
  autoStart = true,
}: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightPosition, setHighlightPosition] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const overlayRef = useRef<HTMLDivElement>(null);
  const { showInfo } = useEnhancedToast();

  useEffect(() => {
    if (autoStart) {
      const hasSeenOnboarding = localStorage.getItem(
        "cognify-onboarding-completed"
      );
      if (!hasSeenOnboarding) {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          setIsVisible(true);
          // highlight will be updated by the other effect when isVisible changes
        }, 1500);
      }
    }
  }, [autoStart]);

  const updateHighlight = React.useCallback(() => {
    const step = ONBOARDING_STEPS[currentStep];
    const target = document.querySelector(step.target);

    if (target) {
      const rect = target.getBoundingClientRect();
      setHighlightPosition({
        x: rect.left - 8,
        y: rect.top - 8,
        width: rect.width + 16,
        height: rect.height + 16,
      });
    } else if (step.target === "body") {
      // Center highlight for welcome message
      setHighlightPosition({
        x: window.innerWidth / 2 - 200,
        y: window.innerHeight / 2 - 100,
        width: 400,
        height: 200,
      });
    }
  }, [currentStep]);

  useEffect(() => {
    if (isVisible && currentStep < ONBOARDING_STEPS.length) {
      updateHighlight();
    }
  }, [isVisible, updateHighlight, currentStep]);

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
    showInfo("You can restart the tour anytime from Settings.");
  };

  const completeOnboarding = () => {
    localStorage.setItem("cognify-onboarding-completed", "true");
    setIsVisible(false);
    onComplete?.();
  };

  // restartOnboarding removed (unused) - can be reintroduced if a UI control needs it

  if (!isVisible || currentStep >= ONBOARDING_STEPS.length) {
    return null;
  }

  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[--z-modal]"
        style={{ zIndex: 1060 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-description"
      >
        {/* Highlight cutout */}
        <div
          className="absolute border-2 border-brand-primary rounded-lg bg-transparent pointer-events-none transition-all duration-normal"
          style={{
            left: highlightPosition.x,
            top: highlightPosition.y,
            width: highlightPosition.width,
            height: highlightPosition.height,
            boxShadow: `
              0 0 0 4px rgba(59, 130, 246, 0.3),
              0 0 0 9999px rgba(0, 0, 0, 0.6)
            `,
          }}
        />

        {/* Tooltip */}
        <OnboardingTooltip
          step={step}
          currentStepIndex={currentStep}
          totalSteps={ONBOARDING_STEPS.length}
          progress={progress}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipOnboarding}
          onComplete={completeOnboarding}
          highlightPosition={highlightPosition}
        />
      </div>
    </>
  );
}

interface OnboardingTooltipProps {
  step: OnboardingStep;
  currentStepIndex: number;
  totalSteps: number;
  progress: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
  highlightPosition: { x: number; y: number; width: number; height: number };
}

function OnboardingTooltip({
  step,
  currentStepIndex,
  totalSteps,
  progress,
  onNext,
  onPrev,
  onSkip,
  onComplete,
  highlightPosition,
}: OnboardingTooltipProps) {
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Calculate tooltip position based on highlight and step position
    let x = highlightPosition.x;
    let y = highlightPosition.y;

    switch (step.position) {
      case "top":
        x = highlightPosition.x + highlightPosition.width / 2 - 200;
        y = highlightPosition.y - 160;
        break;
      case "bottom":
        x = highlightPosition.x + highlightPosition.width / 2 - 200;
        y = highlightPosition.y + highlightPosition.height + 20;
        break;
      case "left":
        x = highlightPosition.x - 420;
        y = highlightPosition.y + highlightPosition.height / 2 - 80;
        break;
      case "right":
        x = highlightPosition.x + highlightPosition.width + 20;
        y = highlightPosition.y + highlightPosition.height / 2 - 80;
        break;
    }

    // Apply custom offset if provided
    if (step.offset) {
      x += step.offset.x;
      y += step.offset.y;
    }

    // Ensure tooltip stays within viewport
    x = Math.max(20, Math.min(x, window.innerWidth - 420));
    y = Math.max(20, Math.min(y, window.innerHeight - 180));

    setTooltipPosition({ x, y });
  }, [highlightPosition, step]);

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  return (
    <div
      className="absolute glass-surface rounded-2xl card-padding-lg max-w-sm w-96 transition-all duration-normal shadow-2xl border border-border-brand"
      style={{
        left: tooltipPosition.x,
        top: tooltipPosition.y,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {step.icon}
          <h3
            id="onboarding-title"
            className="text-lg font-semibold text-text-primary"
          >
            {step.title}
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSkip}
          className="touch-target-comfortable"
          aria-label="Skip onboarding"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-text-muted mb-2">
          <span>
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-surface-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-brand-primary transition-all duration-slow ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <p
        id="onboarding-description"
        className="text-text-secondary mb-6 leading-relaxed"
      >
        {step.content}
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onPrev}
          disabled={isFirstStep}
          className="touch-target-comfortable"
          aria-label="Previous step"
        >
          Previous
        </Button>

        <div className="flex items-center space-x-2">
          {/* Step indicators */}
          <div className="flex space-x-1">
            {Array.from({ length: totalSteps }, (_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-fast ${
                  index <= currentStepIndex
                    ? "bg-brand-primary"
                    : "bg-surface-elevated"
                }`}
              />
            ))}
          </div>
        </div>

        <Button
          onClick={isLastStep ? onComplete : onNext}
          className="touch-target-comfortable bg-gradient-brand-primary hover:bg-gradient-brand-hover"
          aria-label={isLastStep ? "Finish onboarding" : "Next step"}
        >
          {isLastStep ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Get Started!
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

/* =========================== 
   FEATURE HIGHLIGHTS
   Contextual tooltips for features
   =========================== */

interface FeatureHighlightProps {
  children: React.ReactNode;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  showOnHover?: boolean;
  className?: string;
}

export function FeatureHighlight({
  children,
  title,
  description,
  position = "top",
  showOnHover = true,
  className = "",
}: FeatureHighlightProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Only show feature highlights after onboarding is complete
    const hasCompletedOnboarding = localStorage.getItem(
      "cognify-onboarding-completed"
    );
    setShouldShow(!!hasCompletedOnboarding);
  }, []);

  if (!shouldShow) {
    return <>{children}</>;
  }

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={() => showOnHover && setIsVisible(true)}
      onMouseLeave={() => showOnHover && setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          className={`absolute z-tooltip glass-surface rounded-lg p-3 max-w-xs shadow-lg border border-border-subtle transition-all duration-fast ${
            position === "top"
              ? "bottom-full mb-2 left-1/2 -translate-x-1/2"
              : position === "bottom"
              ? "top-full mt-2 left-1/2 -translate-x-1/2"
              : position === "left"
              ? "right-full mr-2 top-1/2 -translate-y-1/2"
              : position === "right"
              ? "left-full ml-2 top-1/2 -translate-y-1/2"
              : ""
          }`}
        >
          <div className="text-sm font-medium text-text-primary mb-1">
            {title}
          </div>
          <div className="text-xs text-text-muted">{description}</div>
        </div>
      )}
    </div>
  );
}

/* =========================== 
   ONBOARDING RESET BUTTON
   For settings or help sections
   =========================== */

export function OnboardingResetButton() {
  const { showInfo } = useEnhancedToast();

  const handleReset = () => {
    localStorage.removeItem("cognify-onboarding-completed");
    showInfo("Onboarding tour will start again on next page reload.");

    // Optionally trigger immediate restart
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  return (
    <Button
      variant="outline"
      onClick={handleReset}
      className="touch-target-comfortable"
    >
      <Play className="w-4 h-4 mr-2" />
      Restart Tour
    </Button>
  );
}

/* =========================== 
   EMPTY STATE WITH ONBOARDING HINTS
   =========================== */

interface EmptyStateWithHintsProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  hints?: string[];
}

export function EmptyStateWithHints({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  hints = [],
}: EmptyStateWithHintsProps) {
  return (
    <div className="text-center py-12 max-w-md mx-auto">
      {icon && (
        <div className="flex justify-center mb-6 text-text-muted">{icon}</div>
      )}

      <h3 className="text-xl font-semibold text-text-primary mb-3">{title}</h3>
      <p className="text-text-secondary mb-8 leading-relaxed">{description}</p>

      {hints.length > 0 && (
        <div className="glass-surface rounded-xl card-padding-md mb-8 text-left">
          <h4 className="font-medium text-text-primary mb-3 text-center">
            💡 Quick Tips:
          </h4>
          <ul className="space-y-2 text-sm text-text-muted">
            {hints.map((hint, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="text-brand-primary mt-0.5">•</span>
                <span>{hint}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {primaryAction && (
          <Button
            onClick={primaryAction.onClick}
            className="touch-target-comfortable bg-gradient-brand-primary hover:bg-gradient-brand-hover"
          >
            {primaryAction.icon}
            {primaryAction.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            variant="outline"
            onClick={secondaryAction.onClick}
            className="touch-target-comfortable"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
