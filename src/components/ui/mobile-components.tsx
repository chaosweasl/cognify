import { cn } from "@/lib/utils";
import { forwardRef, useState } from "react";

interface MobileButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  children: React.ReactNode;
  className?: string;
}

/**
 * Mobile-optimized button with enhanced touch targets (min 44px)
 * and improved visual feedback for touch interactions
 */
export const MobileButton = forwardRef<HTMLButtonElement, MobileButtonProps>(
  (
    { className, variant = "primary", size = "md", children, ...props },
    ref
  ) => {
    const baseClasses = [
      // Base styles
      "inline-flex items-center justify-center rounded-lg font-medium",
      "transition-all duration-200 ease-out",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      // Mobile touch feedback
      "active:scale-95 touch-manipulation select-none",
      // Enhanced accessibility
      "relative overflow-hidden",
    ];

    // Size variants with minimum touch targets
    const sizeClasses = {
      sm: "min-h-[44px] px-4 text-sm gap-2", // Mobile minimum
      md: "min-h-[48px] px-6 text-base gap-2", // Comfortable mobile
      lg: "min-h-[52px] px-8 text-lg gap-3", // Large mobile
      icon: "min-h-[44px] min-w-[44px] p-2", // Icon button minimum
    };

    // Visual variants optimized for mobile
    const variantClasses = {
      primary: [
        "bg-gradient-brand hover:bg-gradient-brand-hover text-white",
        "shadow-lg hover:shadow-xl active:shadow-md",
        "border border-brand-primary/20",
      ].join(" "),
      secondary: [
        "bg-brand-secondary hover:bg-brand-secondary-hover text-white",
        "shadow-md hover:shadow-lg active:shadow-sm",
      ].join(" "),
      outline: [
        "border-2 border-brand-primary/30 hover:border-brand-primary",
        "bg-transparent hover:bg-brand-primary/5 active:bg-brand-primary/10",
        "text-brand-primary hover:text-brand-primary-hover",
      ].join(" "),
      ghost: [
        "bg-transparent hover:bg-surface-elevated active:bg-surface-secondary",
        "text-primary hover:text-brand-primary",
      ].join(" "),
      destructive: [
        "bg-red-500 hover:bg-red-600 active:bg-red-700 text-white",
        "shadow-md hover:shadow-lg active:shadow-sm",
      ].join(" "),
    };

    return (
      <button
        className={cn(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        ref={ref}
        {...props}
      >
        {/* Ripple effect container */}
        <span className="absolute inset-0 bg-white/10 opacity-0 active:opacity-100 transition-opacity duration-150 pointer-events-none" />
        {children}
      </button>
    );
  }
);

MobileButton.displayName = "MobileButton";

interface MobileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Mobile-optimized card component with enhanced touch feedback
 */
export const MobileCard = forwardRef<HTMLDivElement, MobileCardProps>(
  ({ className, interactive = false, children, ...props }, ref) => {
    const baseClasses = [
      "glass-surface rounded-xl border border-subtle",
      "shadow-md transition-all duration-200",
    ];

    const interactiveClasses = interactive
      ? [
          "hover:border-brand hover:shadow-lg active:scale-[0.98]",
          "cursor-pointer touch-manipulation",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
        ]
      : [];

    return (
      <div
        className={cn(baseClasses, interactiveClasses, className)}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

MobileCard.displayName = "MobileCard";

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
}

/**
 * Mobile-optimized input with enhanced touch targets and better visibility
 */
export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-primary">
            {label}
          </label>
        )}
        <input
          className={cn(
            // Base styles
            "flex w-full rounded-lg border border-subtle bg-surface-primary",
            "px-4 py-3 text-base text-primary", // Larger touch targets
            "placeholder:text-muted",
            // Focus styles
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
            "focus-visible:border-brand-primary",
            // Mobile optimizations
            "min-h-[48px] touch-manipulation",
            "transition-all duration-200",
            // Error state
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

MobileInput.displayName = "MobileInput";

interface SwipeableProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}

/**
 * Swipeable container for mobile gesture support
 */
export function Swipeable({
  children,
  onSwipeLeft,
  onSwipeRight,
  className,
}: SwipeableProps) {
  let startX = 0;
  let startY = 0;
  let isTracking = false;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isTracking = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isTracking) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - startX;
    const deltaY = endY - startY;

    // Only trigger if horizontal swipe is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    isTracking = false;
  };

  return (
    <div
      className={cn("touch-pan-y", className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
}

interface MobileNavigationProps {
  items: Array<{
    id: string;
    label: string;
    icon: React.ElementType;
    href?: string;
    onClick?: () => void;
    active?: boolean;
    badge?: string | number;
  }>;
  className?: string;
}

/**
 * Mobile bottom navigation component
 */
export function MobileNavigation({ items, className }: MobileNavigationProps) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "bg-surface-secondary/95 backdrop-blur-xl border-t border-subtle",
        "safe-area-inset-bottom", // iOS safe area
        className
      )}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const content = (
            <div className="flex flex-col items-center justify-center min-h-[48px] px-3 py-2 rounded-lg transition-all duration-200 touch-manipulation group relative">
              <div className="relative">
                <Icon
                  className={cn(
                    "h-5 w-5 transition-colors duration-200",
                    item.active
                      ? "text-brand-primary"
                      : "text-muted group-hover:text-primary group-active:text-brand-primary"
                  )}
                />
                {item.badge && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-xs mt-1 transition-colors duration-200",
                  item.active
                    ? "text-brand-primary font-medium"
                    : "text-muted group-hover:text-primary group-active:text-brand-primary"
                )}
              >
                {item.label}
              </span>
              {item.active && (
                <div className="absolute top-0 w-8 h-0.5 bg-brand-primary rounded-full" />
              )}
            </div>
          );

          return item.href ? (
            <a
              key={item.id}
              href={item.href}
              className="flex-1 flex justify-center max-w-[80px]"
            >
              {content}
            </a>
          ) : (
            <button
              key={item.id}
              onClick={item.onClick}
              className="flex-1 flex justify-center max-w-[80px]"
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

/**
 * Pull-to-refresh component for mobile
 */
export function PullToRefresh({
  onRefresh,
  children,
  className,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  let startY = 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && !isRefreshing) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, (currentY - startY) / 2);
      setPullDistance(Math.min(distance, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60 && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  };

  return (
    <div
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="flex justify-center items-center transition-all duration-200"
        style={{
          height: Math.max(0, pullDistance),
          opacity: pullDistance > 20 ? 1 : 0,
        }}
      >
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-2 bg-surface-elevated rounded-full shadow-md",
            isRefreshing && "animate-pulse"
          )}
        >
          <div
            className={cn(
              "w-4 h-4 border-2 border-brand-primary rounded-full",
              isRefreshing
                ? "animate-spin border-t-transparent"
                : "border-b-transparent",
              pullDistance > 60 && "border-green-500"
            )}
          />
          <span className="text-sm text-primary">
            {isRefreshing
              ? "Refreshing..."
              : pullDistance > 60
              ? "Release to refresh"
              : "Pull to refresh"}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
