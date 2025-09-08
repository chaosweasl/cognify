"use client";

/* =========================== 
   ACCESSIBILITY UTILITIES
   Comprehensive a11y helpers and components
   =========================== */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// Screen reader utilities
export const ScreenReader = {
  announce: (message: string, priority: "polite" | "assertive" = "polite") => {
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", priority);
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Clean up after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },
};

// Focus management utilities
export const FocusManager = {
  // Trap focus within a container
  trapFocus: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener("keydown", handleTabKey);
    return () => container.removeEventListener("keydown", handleTabKey);
  },

  // Return focus to previous element
  returnFocus: (previousElement: HTMLElement | null) => {
    if (previousElement && document.contains(previousElement)) {
      previousElement.focus();
    }
  },

  // Get next focusable element
  getNextFocusable: (current: HTMLElement, forward = true) => {
    const focusableElements = Array.from(
      document.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );

    const currentIndex = focusableElements.indexOf(current);
    if (currentIndex === -1) return null;

    const nextIndex = forward
      ? (currentIndex + 1) % focusableElements.length
      : (currentIndex - 1 + focusableElements.length) %
        focusableElements.length;

    return focusableElements[nextIndex];
  },
};

// Keyboard navigation hook
export function useKeyboardNavigation(options: {
  onEnter?: () => void;
  onSpace?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEscape?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
}) {
  return (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
        options.onEnter?.();
        break;
      case " ":
        e.preventDefault();
        options.onSpace?.();
        break;
      case "ArrowUp":
        e.preventDefault();
        options.onArrowUp?.();
        break;
      case "ArrowDown":
        e.preventDefault();
        options.onArrowDown?.();
        break;
      case "ArrowLeft":
        options.onArrowLeft?.();
        break;
      case "ArrowRight":
        options.onArrowRight?.();
        break;
      case "Escape":
        options.onEscape?.();
        break;
      case "Home":
        e.preventDefault();
        options.onHome?.();
        break;
      case "End":
        e.preventDefault();
        options.onEnd?.();
        break;
    }
  };
}

// Accessible modal component
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  className = "",
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;

      // Focus the modal
      modalRef.current?.focus();

      // Trap focus within modal
      const cleanup = modalRef.current
        ? FocusManager.trapFocus(modalRef.current)
        : undefined;

      // Prevent body scroll
      document.body.style.overflow = "hidden";

      return () => {
        cleanup?.();
        document.body.style.overflow = "";
        FocusManager.returnFocus(previousFocusRef.current);
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-modal bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={`fixed inset-0 flex items-center justify-center p-4 ${className}`}
      >
        <div className="glass-surface rounded-xl card-padding-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="modal-title"
              className="text-xl font-semibold text-text-primary"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="touch-target-comfortable rounded-lg hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

// Skip to content link
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only fixed top-4 left-4 z-system bg-brand-primary text-white px-4 py-2 rounded-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      Skip to main content
    </a>
  );
}

// Live region for dynamic content announcements
interface LiveRegionProps {
  message: string;
  priority?: "polite" | "assertive";
  className?: string;
}

export function LiveRegion({
  message,
  priority = "polite",
  className = "",
}: LiveRegionProps) {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className={`sr-only ${className}`}
    >
      {message}
    </div>
  );
}

// Accessible heading structure
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
}

export function Heading({ level, children, className = "" }: HeadingProps) {
  const baseClasses = {
    1: "text-4xl font-bold",
    2: "text-3xl font-bold",
    3: "text-2xl font-semibold",
    4: "text-xl font-semibold",
    5: "text-lg font-medium",
    6: "text-base font-medium",
  };

  const commonClass = `${baseClasses[level]} text-text-primary ${className}`;

  switch (level) {
    case 1:
      return <h1 className={commonClass}>{children}</h1>;
    case 2:
      return <h2 className={commonClass}>{children}</h2>;
    case 3:
      return <h3 className={commonClass}>{children}</h3>;
    case 4:
      return <h4 className={commonClass}>{children}</h4>;
    case 5:
      return <h5 className={commonClass}>{children}</h5>;
    case 6:
      return <h6 className={commonClass}>{children}</h6>;
    default:
      return <h1 className={commonClass}>{children}</h1>;
  }
}

// Accessible progress indicator
interface ProgressProps {
  value: number;
  max?: number;
  label: string;
  className?: string;
}

export function AccessibleProgress({
  value,
  max = 100,
  label,
  className = "",
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemax={max}
        aria-label={`${label}: ${Math.round(percentage)}%`}
        className="h-2 bg-surface-elevated rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-gradient-brand-primary transition-all duration-normal"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Color contrast utilities
export const ColorContrast = {
  // Check if text meets WCAG contrast requirements
  meetsWCAG: (
    foreground: string,
    background: string,
    level: "AA" | "AAA" = "AA"
  ) => {
    // This would need a full color contrast calculation library
    // For now, return true as a placeholder
    return true;
  },

  // Get high contrast version of a color
  getHighContrast: (color: string, background: string) => {
    // Placeholder - would calculate actual high contrast color
    return color;
  },
};

// Touch gesture utilities for mobile accessibility
export function useTouchGestures(options: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
}) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(
    null
  );
  const threshold = options.threshold ?? 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;

    // Determine dominant direction
    const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);

    if (isHorizontal) {
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          options.onSwipeLeft?.();
        } else {
          options.onSwipeRight?.();
        }
      }
    } else {
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
          options.onSwipeUp?.();
        } else {
          options.onSwipeDown?.();
        }
      }
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}

// Reduced motion detection
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

// High contrast mode detection
export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-contrast: high)");
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersHighContrast;
}
