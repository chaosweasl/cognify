/**
 * Code Splitting and Lazy Loading Utilities
 * Dynamic imports, component lazy loading, and bundle optimization
 */

import React, {
  lazy,
  Suspense,
  Component,
  ReactNode,
  ComponentType,
  forwardRef,
  useState,
  useEffect,
  useCallback,
  ErrorInfo,
} from "react";

// Type definitions for code splitting
type ComponentProps = Record<string, unknown>;

// Lazy loading configuration
export const LAZY_LOADING_CONFIG = {
  // Default loading delay to prevent flash of loading state
  minLoadingTime: 200,

  // Retry attempts for failed lazy loads
  retryAttempts: 3,

  // Default loading component
  defaultLoadingComponent: () => (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ),

  // Default error component
  defaultErrorComponent: ({
    error,
    retry,
  }: {
    error: Error;
    retry: () => void;
  }) => (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-red-50 border border-red-200 rounded-lg">
      <div className="text-red-600 mb-2">⚠️ Failed to load component</div>
      <div className="text-sm text-red-500 mb-4 max-w-md text-center">
        {error.message || "Component failed to load"}
      </div>
      <button
        onClick={retry}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
        type="button"
      >
        Retry
      </button>
    </div>
  ),
};

/**
 * Enhanced Lazy Loading with Retry Logic
 */
export function createLazyComponent<T extends ComponentType<ComponentProps>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    fallback?: ReactNode;
    errorFallback?: ComponentType<{ error: Error; retry: () => void }>;
    retryAttempts?: number;
    minLoadingTime?: number;
  } = {}
) {
  const {
    fallback = <LAZY_LOADING_CONFIG.defaultLoadingComponent />,
    errorFallback = LAZY_LOADING_CONFIG.defaultErrorComponent,
    retryAttempts = LAZY_LOADING_CONFIG.retryAttempts,
    minLoadingTime = LAZY_LOADING_CONFIG.minLoadingTime,
  } = options;

  // Create lazy component with retry logic
  const LazyComponent = lazy(() => {
    let retryCount = 0;

    const loadWithRetry = async (): Promise<{ default: T }> => {
      const startTime = Date.now();

      try {
        const result = await importFn();

        // Ensure minimum loading time to prevent flash
        const elapsed = Date.now() - startTime;
        if (elapsed < minLoadingTime) {
          await new Promise((resolve) =>
            setTimeout(resolve, minLoadingTime - elapsed)
          );
        }

        return result;
      } catch (error) {
        retryCount++;

        if (retryCount <= retryAttempts) {
          console.warn(
            `Lazy load failed, retrying (${retryCount}/${retryAttempts}):`,
            error
          );
          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, retryCount) * 1000)
          );
          return loadWithRetry();
        }

        throw error;
      }
    };

    return loadWithRetry();
  });

  // Wrapper component with error boundary
  const LazyWrapper = forwardRef<unknown, ComponentProps>((props) => (
    <LazyErrorBoundary errorFallback={errorFallback}>
      <Suspense fallback={fallback}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <LazyComponent {...(props as any)} />
      </Suspense>
    </LazyErrorBoundary>
  ));

  LazyWrapper.displayName = `LazyWrapper(Component)`;

  return LazyWrapper;
}

/**
 * Error Boundary for Lazy Components
 */
class LazyErrorBoundary extends Component<
  {
    children: ReactNode;
    errorFallback: ComponentType<{ error: Error; retry: () => void }>;
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: {
    children: ReactNode;
    errorFallback: ComponentType<{ error: Error; retry: () => void }>;
  }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Lazy component error:", error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const ErrorComponent = this.props.errorFallback;
      return <ErrorComponent error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

/**
 * Route-Based Code Splitting
 * Lazy load page components with preloading
 */
export class RouteCodeSplitter {
  private static preloadedRoutes = new Set<string>();
  private static routeImports = new Map<
    string,
    () => Promise<{ default: ComponentType<ComponentProps> }>
  >();

  static registerRoute(
    path: string,
    importFn: () => Promise<{ default: ComponentType<ComponentProps> }>
  ) {
    this.routeImports.set(path, importFn);
  }

  static createLazyRoute(
    path: string,
    importFn: () => Promise<{ default: ComponentType<ComponentProps> }>
  ) {
    this.registerRoute(path, importFn);

    return createLazyComponent(importFn, {
      fallback: (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading page...</div>
          </div>
        </div>
      ),
    });
  }

  static preloadRoute(path: string) {
    if (this.preloadedRoutes.has(path)) return;

    const importFn = this.routeImports.get(path);
    if (importFn) {
      this.preloadedRoutes.add(path);
      importFn().catch((error) => {
        console.warn(`Failed to preload route ${path}:`, error);
        this.preloadedRoutes.delete(path);
      });
    }
  }

  static preloadMultipleRoutes(paths: string[]) {
    paths.forEach((path) => this.preloadRoute(path));
  }
}

/**
 * Feature-Based Code Splitting
 * Lazy load feature modules
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function createLazyFeature<T extends ComponentType<any>>(
  featureName: string,
  importFn: () => Promise<{ default: T }>
) {
  // Preload dependencies first
  const loadWithDependencies = async () => {
    // In a real implementation, you'd load dependencies here
    // For now, we'll just load the main feature
    return importFn();
  };

  return createLazyComponent(loadWithDependencies, {
    fallback: (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
          </div>
          <div className="text-sm text-gray-500 mt-4">
            Loading {featureName}...
          </div>
        </div>
      </div>
    ),
  });
}

/**
 * Hook for Progressive Enhancement
 * Load non-critical features after initial render
 */
export function useProgressiveEnhancement<T>(importFn: () => Promise<T>) {
  const [feature, setFeature] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadFeature = async () => {
      if (feature) return; // Already loaded

      setIsLoading(true);
      setError(null);

      try {
        // Wait for next tick to ensure initial render is complete
        await new Promise((resolve) => setTimeout(resolve, 0));

        if (cancelled) return;

        const result = await importFn();

        if (!cancelled) {
          setFeature(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadFeature();

    return () => {
      cancelled = true;
    };
  }, [feature, importFn]);

  return { feature, isLoading, error };
}

/**
 * Lazy Load Hook for Components
 * Load components based on user interaction or visibility
 */
export function useLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  trigger: "hover" | "click" | "visible" | "idle" = "visible"
) {
  const [Component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (Component || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await importFn();
      setComponent(() => result.default);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to load component")
      );
    } finally {
      setIsLoading(false);
    }
  }, [Component, isLoading, importFn]);

  useEffect(() => {
    if (trigger === "idle") {
      // Load when browser is idle
      if ("requestIdleCallback" in window) {
        const id = requestIdleCallback(load);
        return () => cancelIdleCallback(id);
      } else {
        // Fallback for browsers without requestIdleCallback
        const timeoutId = setTimeout(load, 100);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [load, trigger]);

  const handlers = {
    onMouseEnter: trigger === "hover" ? load : undefined,
    onClick: trigger === "click" ? load : undefined,
  };

  return {
    Component,
    isLoading,
    error,
    load,
    handlers,
  };
}

/**
 * Bundle Analysis Helper
 * Analyze and optimize bundle size
 */
export const BundleOptimization = {
  // Log bundle sizes in development
  logBundleInfo: () => {
    if (
      process.env.NODE_ENV === "development" &&
      typeof window !== "undefined"
    ) {
      console.group("Bundle Information");

      // Log performance navigation timing
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      if (navigation) {
        console.log(
          "DOM Content Loaded:",
          navigation.domContentLoadedEventEnd -
            navigation.domContentLoadedEventStart,
          "ms"
        );
        console.log(
          "Load Complete:",
          navigation.loadEventEnd - navigation.loadEventStart,
          "ms"
        );
      }

      // Log resource timing
      const resources = performance.getEntriesByType("resource");
      const jsResources = resources.filter((r: any) => r.name.endsWith(".js"));
      const cssResources = resources.filter((r: any) =>
        r.name.endsWith(".css")
      );

      console.log("JavaScript files:", jsResources.length);
      console.log("CSS files:", cssResources.length);

      console.groupEnd();
    }
  },

  // Preload critical routes
  preloadCriticalRoutes: (routes: string[]) => {
    RouteCodeSplitter.preloadMultipleRoutes(routes);
  },

  // Get current bundle stats
  getBundleStats: () => {
    if (typeof window === "undefined") return null;

    const resources = performance.getEntriesByType(
      "resource"
    ) as PerformanceResourceTiming[];
    const jsResources = resources.filter((r) => r.name.endsWith(".js"));
    const cssResources = resources.filter((r) => r.name.endsWith(".css"));

    return {
      jsFiles: jsResources.length,
      cssFiles: cssResources.length,
      totalTransferSize: resources.reduce(
        (sum, r) => sum + (r.transferSize || 0),
        0
      ),
      totalDecodedSize: resources.reduce(
        (sum, r) => sum + (r.decodedBodySize || 0),
        0
      ),
    };
  },
};

// Pre-configured lazy components for common features
export const LazyComponents = {
  // Dashboard components
  StudyStatsDashboard: createLazyFeature("Study Statistics", () =>
    import("@/src/components/study/StudyStatsDashboard").then((mod) => ({
      default: mod.StudyStatsDashboard,
    }))
  ),

  // Project management
  ProjectTemplates: createLazyFeature("Project Templates", () =>
    import("@/src/components/projects/ProjectTemplates").then((mod) => ({
      default: mod.ProjectTemplates,
    }))
  ),

  // Settings components
  AIConfigurationSection: createLazyFeature("AI Configuration", () =>
    import("@/src/components/settings/AIConfigurationSection").then((mod) => ({
      default: mod.AIConfigurationSection,
    }))
  ),

  // Flashcard components
  ManageFlashcardsModal: createLazyFeature("Flashcard Manager", () =>
    import("@/src/components/flashcards/ManageFlashcardsModal").then((mod) => ({
      default: mod.ManageFlashcardsModal,
    }))
  ),
};
