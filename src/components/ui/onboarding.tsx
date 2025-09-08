"use client";

import { useState, useEffect } from "react";
import {
  X,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for the target element
  position?: "top" | "bottom" | "left" | "right";
  action?: {
    text: string;
    onClick: () => void;
  };
}

interface OnboardingTourProps {
  steps: OnboardingStep[];
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingTour({
  steps,
  isVisible,
  onComplete,
  onSkip,
}: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isVisible || !steps[currentStep]?.target) return;

    const element = document.querySelector(
      steps[currentStep].target!
    ) as HTMLElement;
    setTargetElement(element);

    if (element) {
      // Highlight the target element
      element.classList.add("onboarding-highlight");
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return () => {
      if (element) {
        element.classList.remove("onboarding-highlight");
      }
    };
  }, [currentStep, isVisible, steps]);

  if (!isVisible || steps.length === 0) return null;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (currentStepData.action) {
      currentStepData.action.onClick();
    }

    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />

      {/* Tooltip */}
      <div
        className={cn(
          "fixed z-50 max-w-sm p-6 bg-surface-primary border border-subtle rounded-2xl shadow-xl",
          "animate-in fade-in-0 zoom-in-95 duration-200",
          // Position the tooltip based on target element or center it
          targetElement
            ? "absolute"
            : "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
        )}
        style={
          targetElement
            ? getTooltipPosition(targetElement, currentStepData.position)
            : {}
        }
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-primary">
                {currentStepData.title}
              </h3>
              <p className="text-sm text-secondary">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-muted hover:text-primary"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="w-full bg-surface-secondary rounded-full h-2">
            <div
              className="bg-gradient-brand h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <p className="text-secondary mb-6">{currentStepData.description}</p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="text-muted hover:text-primary disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={onSkip}
              className="text-muted hover:text-primary"
            >
              Skip Tour
            </Button>
            <Button
              onClick={handleNext}
              className="bg-gradient-brand hover:bg-gradient-brand-hover text-white"
            >
              {currentStepData.action?.text || (isLastStep ? "Finish" : "Next")}
              {!isLastStep ? (
                <ChevronRight className="w-4 h-4 ml-1" />
              ) : (
                <Check className="w-4 h-4 ml-1" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

function getTooltipPosition(
  element: HTMLElement,
  position: OnboardingStep["position"] = "bottom"
) {
  const rect = element.getBoundingClientRect();
  const tooltipOffset = 20;

  switch (position) {
    case "top":
      return {
        bottom: window.innerHeight - rect.top + tooltipOffset,
        left: rect.left + rect.width / 2,
        transform: "translateX(-50%)",
      };
    case "bottom":
      return {
        top: rect.bottom + tooltipOffset,
        left: rect.left + rect.width / 2,
        transform: "translateX(-50%)",
      };
    case "left":
      return {
        top: rect.top + rect.height / 2,
        right: window.innerWidth - rect.left + tooltipOffset,
        transform: "translateY(-50%)",
      };
    case "right":
      return {
        top: rect.top + rect.height / 2,
        left: rect.right + tooltipOffset,
        transform: "translateY(-50%)",
      };
    default:
      return {
        top: rect.bottom + tooltipOffset,
        left: rect.left + rect.width / 2,
        transform: "translateX(-50%)",
      };
  }
}

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: {
    text: string;
    onClick: () => void;
  };
  secondaryAction?: {
    text: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-surface-elevated to-surface-secondary flex items-center justify-center">
        <Icon className="w-8 h-8 text-muted" />
      </div>
      <h3 className="text-xl font-semibold text-primary mb-2">{title}</h3>
      <p className="text-secondary max-w-md mb-6">{description}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <Button
            onClick={action.onClick}
            className="bg-gradient-brand hover:bg-gradient-brand-hover text-white"
          >
            {action.text}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.text}
          </Button>
        )}
      </div>
    </div>
  );
}

interface FeatureCalloutProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  badge?: string;
  action?: {
    text: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  className?: string;
}

export function FeatureCallout({
  title,
  description,
  icon: Icon,
  badge,
  action,
  onDismiss,
  className,
}: FeatureCalloutProps) {
  return (
    <div
      className={cn(
        "relative p-6 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5",
        "border border-brand-primary/20 rounded-2xl",
        "animate-in slide-in-from-top-2 duration-500",
        className
      )}
    >
      {/* Dismiss button */}
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="absolute top-2 right-2 text-muted hover:text-primary"
        >
          <X className="w-4 h-4" />
        </Button>
      )}

      <div className="flex items-start gap-4">
        {Icon && (
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-primary">{title}</h4>
            {badge && (
              <span className="px-2 py-1 text-xs font-medium bg-brand-primary/10 text-brand-primary rounded-full">
                {badge}
              </span>
            )}
          </div>
          <p className="text-secondary text-sm mb-4">{description}</p>
          {action && (
            <Button
              variant="outline"
              size="sm"
              onClick={action.onClick}
              className="border-brand-primary/30 text-brand-primary hover:bg-brand-primary/5"
            >
              {action.text}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

interface OnboardingChecklist {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
}

interface OnboardingChecklistProps {
  title: string;
  description: string;
  items: OnboardingChecklist[];
  className?: string;
}

export function OnboardingChecklistComponent({
  title,
  description,
  items,
  className,
}: OnboardingChecklistProps) {
  const completedCount = items.filter((item) => item.completed).length;
  const progress = (completedCount / items.length) * 100;

  return (
    <div
      className={cn(
        "p-6 glass-surface rounded-2xl border border-subtle",
        className
      )}
    >
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-primary mb-2">{title}</h3>
        <p className="text-secondary mb-4">{description}</p>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-surface-secondary rounded-full h-2">
            <div
              className="bg-gradient-brand h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-sm text-secondary font-medium">
            {completedCount}/{items.length}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "flex items-start gap-3 p-4 rounded-xl transition-all duration-200",
              item.completed
                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                : "bg-surface-elevated border border-subtle hover:border-brand-primary/30"
            )}
          >
            <div
              className={cn(
                "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                "transition-all duration-200",
                item.completed
                  ? "bg-green-500 text-white"
                  : "bg-surface-secondary text-muted"
              )}
            >
              {item.completed ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4
                className={cn(
                  "font-medium transition-colors duration-200",
                  item.completed
                    ? "text-green-700 dark:text-green-300"
                    : "text-primary"
                )}
              >
                {item.title}
              </h4>
              <p
                className={cn(
                  "text-sm transition-colors duration-200",
                  item.completed
                    ? "text-green-600 dark:text-green-400"
                    : "text-secondary"
                )}
              >
                {item.description}
              </p>
            </div>

            {!item.completed && item.action && (
              <Button
                variant="ghost"
                size="sm"
                onClick={item.action}
                className="text-brand-primary hover:bg-brand-primary/5"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Hook to manage onboarding state
export function useOnboarding(userId: string | null) {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [currentTour, setCurrentTour] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const onboardingData = localStorage.getItem(`onboarding-${userId}`);
    if (onboardingData) {
      const data = JSON.parse(onboardingData);
      setIsOnboardingComplete(data.completed || false);
    }
  }, [userId]);

  const completeOnboarding = () => {
    if (!userId) return;

    const onboardingData = {
      completed: true,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem(
      `onboarding-${userId}`,
      JSON.stringify(onboardingData)
    );
    setIsOnboardingComplete(true);
    setCurrentTour(null);
  };

  const startTour = (tourId: string) => {
    setCurrentTour(tourId);
  };

  const skipTour = () => {
    setCurrentTour(null);
  };

  return {
    isOnboardingComplete,
    currentTour,
    completeOnboarding,
    startTour,
    skipTour,
  };
}
