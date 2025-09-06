/**
 * Asset Optimization Utilities
 * Image optimization, lazy loading, and performance enhancements
 */

import { useState, useEffect, useRef, useCallback } from "react";

// Image optimization configuration
export const IMAGE_OPTIMIZATION_CONFIG = {
  // Supported formats in order of preference
  formats: ["webp", "avif", "jpg", "png"] as const,

  // Quality settings for different use cases
  quality: {
    thumbnail: 60,
    medium: 75,
    high: 85,
    original: 95,
  } as const,

  // Size presets for responsive images
  sizes: {
    xs: 320,
    sm: 480,
    md: 768,
    lg: 1024,
    xl: 1280,
    xxl: 1920,
  } as const,

  // Lazy loading thresholds
  lazyLoadThreshold: {
    rootMargin: "50px",
    threshold: 0.1,
  },
};

/**
 * Image Optimization Hook
 * Provides optimized image URLs and lazy loading functionality
 */
export function useOptimizedImage(
  src: string,
  options: {
    size?: keyof typeof IMAGE_OPTIMIZATION_CONFIG.sizes;
    quality?: keyof typeof IMAGE_OPTIMIZATION_CONFIG.quality;
    format?: (typeof IMAGE_OPTIMIZATION_CONFIG.formats)[number];
    lazy?: boolean;
  } = {}
) {
  const { size = "md", quality = "medium", lazy = true } = options;

  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.disconnect();
      }
    }, IMAGE_OPTIMIZATION_CONFIG.lazyLoadThreshold);

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isInView]);

  // Generate optimized image URL
  const optimizedSrc = useCallback(() => {
    if (!src || !isInView) return "";

    // If it's already an optimized URL or external URL, return as-is
    if (src.includes("/_next/image") || src.startsWith("http")) {
      return src;
    }

    // For Next.js Image Optimization
    const targetWidth = IMAGE_OPTIMIZATION_CONFIG.sizes[size];
    const targetQuality = IMAGE_OPTIMIZATION_CONFIG.quality[quality];

    // Construct optimized URL using Next.js image optimization
    const params = new URLSearchParams({
      url: src,
      w: targetWidth.toString(),
      q: targetQuality.toString(),
    });

    return `/_next/image?${params.toString()}`;
  }, [src, size, quality, isInView]);

  // Handle image load success
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setError(null);
  }, []);

  // Handle image load error
  const handleError = useCallback(() => {
    setError("Failed to load image");
    setIsLoaded(false);
  }, []);

  return {
    src: optimizedSrc(),
    isLoaded,
    isInView,
    error,
    ref: imgRef,
    onLoad: handleLoad,
    onError: handleError,
  };
}

/**
 * Lazy Loading Hook for Any Component
 * Generic lazy loading with Intersection Observer
 */
export function useLazyLoad(options: IntersectionObserverInit = {}) {
  const [isInView, setIsInView] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "50px",
        threshold: 0.1,
        ...options,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [options]);

  return { isInView, ref };
}

/**
 * Performance Monitoring Hook
 * Track component performance metrics
 */
export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(Date.now());
  const mountTime = useRef<number | null>(null);

  useEffect(() => {
    // Component mounted
    mountTime.current = Date.now();
    const mountDuration = mountTime.current - renderStartTime.current;

    // Log slow components in development
    if (process.env.NODE_ENV === "development" && mountDuration > 100) {
      console.warn(
        `Slow component mount: ${componentName} took ${mountDuration}ms`
      );
    }

    return () => {
      // Component unmounted

      // Track component lifecycle metrics
      if (typeof window !== "undefined" && "performance" in window) {
        performance.mark(`${componentName}-unmount`);

        // Use performance.now() for more accurate timing
        const lifetimeDuration = mountTime.current
          ? Date.now() - mountTime.current
          : 0;

        if (process.env.NODE_ENV === "development" && lifetimeDuration > 1000) {
          console.warn(
            `Long-lived component: ${componentName} lived for ${lifetimeDuration}ms`
          );
        }
      }
    };
  }, [componentName]);

  const trackUserInteraction = useCallback(
    (action: string) => {
      if (typeof window !== "undefined" && "performance" in window) {
        performance.mark(`${componentName}-${action}`);

        // In production, send to analytics
        if (process.env.NODE_ENV === "production") {
          // Example: send to analytics service
          // analytics.track(`${componentName}:${action}`, data)
        }
      }
    },
    [componentName]
  );

  return { trackUserInteraction };
}

/**
 * Asset Preloader Hook
 * Preload critical assets for better performance
 */
export function useAssetPreloader(
  assets: Array<{
    type: "image" | "font" | "script";
    src: string;
    priority?: boolean;
  }>
) {
  const [loadedAssets, setLoadedAssets] = useState<Set<string>>(new Set());
  const [failedAssets, setFailedAssets] = useState<Set<string>>(new Set());

  useEffect(() => {
    const preloadAsset = (asset: (typeof assets)[0]) => {
      return new Promise<void>((resolve, reject) => {
        switch (asset.type) {
          case "image": {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => reject();
            img.src = asset.src;
            break;
          }

          case "font": {
            const link = document.createElement("link");
            link.rel = "preload";
            link.as = "font";
            link.href = asset.src;
            link.crossOrigin = "anonymous";
            link.onload = () => resolve();
            link.onerror = () => reject();
            document.head.appendChild(link);
            break;
          }

          case "script": {
            const script = document.createElement("script");
            script.src = asset.src;
            script.onload = () => resolve();
            script.onerror = () => reject();
            if (asset.priority) {
              script.async = false;
              script.defer = false;
            }
            document.head.appendChild(script);
            break;
          }

          default:
            reject(new Error(`Unsupported asset type: ${asset.type}`));
        }
      });
    };

    // Preload assets in order of priority
    const priorityAssets = assets.filter((a) => a.priority);
    const regularAssets = assets.filter((a) => !a.priority);

    const preloadSequence = async () => {
      // Load priority assets first
      for (const asset of priorityAssets) {
        try {
          await preloadAsset(asset);
          setLoadedAssets((prev) => new Set([...prev, asset.src]));
        } catch {
          setFailedAssets((prev) => new Set([...prev, asset.src]));
        }
      }

      // Load regular assets in parallel
      const regularPromises = regularAssets.map(async (asset) => {
        try {
          await preloadAsset(asset);
          setLoadedAssets((prev) => new Set([...prev, asset.src]));
        } catch {
          setFailedAssets((prev) => new Set([...prev, asset.src]));
        }
      });

      await Promise.allSettled(regularPromises);
    };

    preloadSequence();
  }, [assets]);

  return {
    loadedAssets: Array.from(loadedAssets),
    failedAssets: Array.from(failedAssets),
    isComplete: loadedAssets.size + failedAssets.size === assets.length,
  };
}

/**
 * Critical CSS Inliner
 * Inline critical CSS for above-the-fold content
 */
export function inlineCriticalCSS(css: string) {
  if (typeof document === "undefined") return;

  const style = document.createElement("style");
  style.textContent = css;
  style.setAttribute("data-critical", "true");
  document.head.insertBefore(style, document.head.firstChild);
}

/**
 * Resource Hints Generator
 * Generate resource hints for better loading performance
 */
export function generateResourceHints(): Array<{
  rel: string;
  href: string;
  as?: string;
  crossorigin?: string;
}> {
  return [
    // DNS prefetch for external domains
    { rel: "dns-prefetch", href: "//fonts.googleapis.com" },
    { rel: "dns-prefetch", href: "//fonts.gstatic.com" },

    // Preconnect for critical external resources
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossorigin: "anonymous",
    },

    // Preload critical assets
    {
      rel: "preload",
      href: "/fonts/inter.woff2",
      as: "font",
      crossorigin: "anonymous",
    },
    { rel: "preload", href: "/assets/critical.css", as: "style" },
  ];
}

/**
 * Web Vitals Monitoring
 * Monitor Core Web Vitals for performance tracking
 */
export function useWebVitals() {
  const [vitals, setVitals] = useState<{
    cls: number | null;
    fid: number | null;
    fcp: number | null;
    lcp: number | null;
    ttfb: number | null;
  }>({
    cls: null,
    fid: null,
    fcp: null,
    lcp: null,
    ttfb: null,
  });

  useEffect(() => {
    if (typeof window === "undefined" || !("performance" in window)) return;

    // Use web-vitals library if available, otherwise implement basic monitoring
    const trackVital = (name: string, value: number) => {
      setVitals((prev) => ({ ...prev, [name.toLowerCase()]: value }));

      // In production, send to analytics
      if (process.env.NODE_ENV === "production") {
        // Example: send to analytics service
        console.log(`Web Vital ${name}: ${value}`);
      }
    };

    // Basic LCP monitoring
    if ("PerformanceObserver" in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
            startTime: number;
          };
          trackVital("LCP", lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });

        // Basic CLS monitoring
        const clsObserver = new PerformanceObserver((list) => {
          let cls = 0;
          for (const entry of list.getEntries() as PerformanceEntry[]) {
            if (
              !("hadRecentInput" in entry) ||
              !(entry as PerformanceEntry & { hadRecentInput?: boolean })
                .hadRecentInput
            ) {
              cls +=
                (entry as PerformanceEntry & { value?: number }).value || 0;
            }
          }
          trackVital("CLS", cls);
        });
        clsObserver.observe({ entryTypes: ["layout-shift"] });

        return () => {
          lcpObserver.disconnect();
          clsObserver.disconnect();
        };
      } catch (error) {
        console.warn("Performance monitoring not supported:", error);
      }
    }
  }, []);

  return vitals;
}

// Export utility functions for use in components
export const AssetOptimization = {
  useOptimizedImage,
  useLazyLoad,
  usePerformanceMonitor,
  useAssetPreloader,
  useWebVitals,
  inlineCriticalCSS,
  generateResourceHints,
  IMAGE_OPTIMIZATION_CONFIG,
};
