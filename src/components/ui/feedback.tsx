"use client";

import { useState, useEffect } from "react";
import { Check, X, AlertCircle, Info, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ToastProps {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  onClose: () => void;
}

export function Toast({
  type,
  title,
  message,
  duration = 5000,
  onClose,
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: Check,
    error: X,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success:
      "from-green-500/10 to-green-600/5 border-green-500/20 text-green-700 dark:text-green-300",
    error:
      "from-red-500/10 to-red-600/5 border-red-500/20 text-red-700 dark:text-red-300",
    warning:
      "from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-700 dark:text-amber-300",
    info: "from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-700 dark:text-blue-300",
  };

  const Icon = icons[type];

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm",
        "shadow-lg transition-all duration-300 ease-out",
        "bg-gradient-to-r",
        colors[type],
        isVisible
          ? "animate-in slide-in-from-right-full"
          : "animate-out slide-out-to-right-full"
      )}
    >
      <div className="flex-shrink-0 mt-0.5">
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-semibold">{title}</h4>
        {message && <p className="text-sm opacity-80 mt-1">{message}</p>}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="flex-shrink-0 h-auto p-1 opacity-60 hover:opacity-100"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

export function LoadingSpinner({
  size = "md",
  text,
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <Loader2
        className={cn("animate-spin text-brand-primary", sizeClasses[size])}
      />
      {text && <span className="text-sm text-secondary">{text}</span>}
    </div>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: "default" | "success" | "warning" | "error";
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  variant = "default",
  className,
}: ProgressBarProps) {
  const percentage = Math.round((value / max) * 100);

  const variants = {
    default: "bg-brand-primary",
    success: "bg-green-500",
    warning: "bg-amber-500",
    error: "bg-red-500",
  };

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-primary font-medium">{label}</span>}
          {showPercentage && (
            <span className="text-secondary">{percentage}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-surface-secondary rounded-full h-2.5 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            variants[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
}

export function ErrorBoundaryFallback({
  error,
  resetError,
}: ErrorBoundaryFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>

        <h2 className="text-xl font-semibold text-primary mb-2">
          Something went wrong
        </h2>

        <p className="text-secondary mb-6">
          We&apos;re sorry, but something unexpected happened. Please try again.
        </p>

        <div className="space-y-3">
          <Button
            onClick={resetError}
            className="bg-gradient-brand hover:bg-gradient-brand-hover text-white"
          >
            Try Again
          </Button>

          <details className="text-left">
            <summary className="cursor-pointer text-sm text-muted hover:text-secondary">
              Error Details
            </summary>
            <pre className="text-xs text-muted bg-surface-secondary p-3 rounded-lg mt-2 overflow-auto">
              {error.message}
            </pre>
          </details>
        </div>
      </div>
    </div>
  );
}

interface StepIndicatorProps {
  steps: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
  currentStep: number;
  className?: string;
}

export function StepIndicator({
  steps,
  currentStep,
  className,
}: StepIndicatorProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div key={step.id} className="flex items-start gap-4">
            {/* Step indicator */}
            <div
              className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                "transition-all duration-200",
                isCompleted
                  ? "bg-green-500 text-white"
                  : isActive
                  ? "bg-brand-primary text-white"
                  : "bg-surface-secondary text-muted"
              )}
            >
              {isCompleted ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>

            {/* Step content */}
            <div className="flex-1 pb-8 last:pb-0">
              <h3
                className={cn(
                  "font-semibold transition-colors duration-200",
                  isActive
                    ? "text-brand-primary"
                    : isCompleted
                    ? "text-green-600 dark:text-green-400"
                    : "text-primary"
                )}
              >
                {step.title}
              </h3>
              {step.description && (
                <p
                  className={cn(
                    "text-sm mt-1 transition-colors duration-200",
                    isActive
                      ? "text-brand-primary/80"
                      : isCompleted
                      ? "text-green-600/80 dark:text-green-400/80"
                      : "text-secondary"
                  )}
                >
                  {step.description}
                </p>
              )}
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "absolute left-4 top-8 w-0.5 h-8 -ml-px transition-colors duration-200",
                  index < currentStep ? "bg-green-500" : "bg-surface-secondary"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface RatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
}

export function Rating({
  value,
  onChange,
  max = 5,
  size = "md",
  disabled = false,
  className,
}: RatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[...Array(max)].map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= (hoverValue || value);

        return (
          <button
            key={index}
            type="button"
            disabled={disabled}
            className={cn(
              "transition-all duration-200 touch-manipulation",
              disabled
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:scale-110"
            )}
            onMouseEnter={() => !disabled && setHoverValue(starValue)}
            onMouseLeave={() => !disabled && setHoverValue(0)}
            onClick={() => !disabled && onChange(starValue)}
          >
            <Star
              className={cn(
                sizeClasses[size],
                "transition-colors duration-200",
                isFilled
                  ? "text-amber-400 fill-amber-400"
                  : "text-gray-300 dark:text-gray-600"
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 animate-in zoom-in-95 duration-200">
        <div className="glass-surface border border-subtle rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-primary mb-2">{title}</h2>
          <p className="text-secondary mb-6">{message}</p>

          <div className="flex items-center gap-3 justify-end">
            <Button variant="ghost" onClick={onClose}>
              {cancelText}
            </Button>
            <Button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              variant={variant === "destructive" ? "destructive" : "default"}
              className={
                variant === "default"
                  ? "bg-gradient-brand hover:bg-gradient-brand-hover text-white"
                  : ""
              }
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// Context for managing user feedback
interface ToastItem extends ToastProps {
  id: string;
  onClose: () => void;
}

interface FeedbackState {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, "id" | "onClose">) => void;
  removeToast: (id: string) => void;
}

export const useFeedback = (): FeedbackState => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (toast: Omit<ToastItem, "id" | "onClose">) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastItem = {
      ...toast,
      id,
      onClose: () => removeToast(id),
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return { toasts, addToast, removeToast };
};
