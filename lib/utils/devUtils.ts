/**
 * Development Utilities for Cognify
 * 
 * Provides performance monitoring, debugging tools, and development helpers
 * Helps catch infinite loops, excessive re-renders, and performance bottlenecks
 * 
 * Key features:
 * - React render monitoring
 * - Performance measurement utilities
 * - Memory usage tracking
 * - API call monitoring
 * - Debug logging with levels
 * - Development-only utilities
 */

import { useEffect, useRef, useState } from 'react';

// Performance monitoring interfaces
interface RenderInfo {
  componentName: string;
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTime: number;
  isExcessive: boolean;
}

interface APICallInfo {
  url: string;
  method: string;
  timestamp: number;
  duration?: number;
  status?: number;
  size?: number;
}

interface PerformanceMetrics {
  renders: Map<string, RenderInfo>;
  apiCalls: APICallInfo[];
  memoryUsage: MemoryInfo[];
  warnings: string[];
}

// Memory info interface (browser API)
interface MemoryInfo {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// Debug log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Global performance tracker
class PerformanceTracker {
  private metrics: PerformanceMetrics = {
    renders: new Map(),
    apiCalls: [],
    memoryUsage: [],
    warnings: [],
  };
  private isEnabled: boolean = process.env.NODE_ENV === 'development';
  private memoryInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (this.isEnabled && typeof window !== 'undefined') {
      this.startMemoryMonitoring();
      this.interceptFetch();
    }
  }

  /**
   * Track component render
   */
  trackRender(componentName: string, renderTime: number = 0): void {
    if (!this.isEnabled) return;

    const existing = this.metrics.renders.get(componentName);
    
    if (existing) {
      existing.renderCount++;
      existing.lastRenderTime = Date.now();
      existing.totalRenderTime += renderTime;
      existing.averageRenderTime = existing.totalRenderTime / existing.renderCount;
      existing.isExcessive = existing.renderCount > 10; // Flag excessive renders
      
      if (existing.isExcessive && existing.renderCount % 10 === 0) {
        this.addWarning(`Component ${componentName} has rendered ${existing.renderCount} times`);
      }
    } else {
      this.metrics.renders.set(componentName, {
        componentName,
        renderCount: 1,
        lastRenderTime: Date.now(),
        averageRenderTime: renderTime,
        totalRenderTime: renderTime,
        isExcessive: false,
      });
    }
  }

  /**
   * Track API call
   */
  trackAPICall(info: APICallInfo): void {
    if (!this.isEnabled) return;

    this.metrics.apiCalls.push(info);
    
    // Keep only last 100 API calls
    if (this.metrics.apiCalls.length > 100) {
      this.metrics.apiCalls.shift();
    }

    // Check for potential issues
    if (info.duration && info.duration > 5000) {
      this.addWarning(`Slow API call: ${info.method} ${info.url} took ${info.duration}ms`);
    }

    // Check for duplicate calls in short time frame
    const recentCalls = this.metrics.apiCalls.filter(
      call => call.url === info.url && 
               call.method === info.method && 
               Date.now() - call.timestamp < 1000
    );
    
    if (recentCalls.length > 2) {
      this.addWarning(`Duplicate API calls detected: ${info.method} ${info.url}`);
    }
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    if (!('memory' in performance)) return;

    this.memoryInterval = setInterval(() => {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage.push({
        timestamp: Date.now(),
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      });

      // Keep only last 60 samples (5 minutes at 5-second intervals)
      if (this.metrics.memoryUsage.length > 60) {
        this.metrics.memoryUsage.shift();
      }

      // Check for memory leaks
      if (this.metrics.memoryUsage.length > 10) {
        const recent = this.metrics.memoryUsage.slice(-10);
        const trend = recent[recent.length - 1].usedJSHeapSize - recent[0].usedJSHeapSize;
        
        if (trend > 10 * 1024 * 1024) { // 10MB increase in 50 seconds
          this.addWarning('Potential memory leak detected: Memory usage increasing rapidly');
        }
      }
    }, 5000);
  }

  /**
   * Intercept fetch for API monitoring
   */
  private interceptFetch(): void {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      const method = args[1]?.method || 'GET';
      
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        // Get response size if available
        const contentLength = response.headers.get('content-length');
        const size = contentLength ? parseInt(contentLength, 10) : undefined;
        
        this.trackAPICall({
          url,
          method,
          timestamp: startTime,
          duration,
          status: response.status,
          size,
        });
        
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        this.trackAPICall({
          url,
          method,
          timestamp: startTime,
          duration,
          status: 0, // Indicate network error
        });
        
        throw error;
      }
    };
  }

  /**
   * Add warning to metrics
   */
  private addWarning(warning: string): void {
    this.metrics.warnings.push(warning);
    console.warn(`⚠️ Performance Warning: ${warning}`);
    
    // Keep only last 50 warnings
    if (this.metrics.warnings.length > 50) {
      this.metrics.warnings.shift();
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      renders: new Map(this.metrics.renders),
      apiCalls: [...this.metrics.apiCalls],
      memoryUsage: [...this.metrics.memoryUsage],
      warnings: [...this.metrics.warnings],
    };
  }

  /**
   * Get metrics summary
   */
  getSummary() {
    const renders = Array.from(this.metrics.renders.values());
    const excessiveRenders = renders.filter(r => r.isExcessive);
    const slowAPICalls = this.metrics.apiCalls.filter(call => call.duration && call.duration > 2000);
    
    const currentMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    const initialMemory = this.metrics.memoryUsage[0];
    const memoryGrowth = currentMemory && initialMemory 
      ? currentMemory.usedJSHeapSize - initialMemory.usedJSHeapSize 
      : 0;

    return {
      totalComponents: renders.length,
      excessiveRenders: excessiveRenders.length,
      totalAPIcalls: this.metrics.apiCalls.length,
      slowAPICalls: slowAPICalls.length,
      memoryGrowthMB: Math.round(memoryGrowth / (1024 * 1024) * 100) / 100,
      totalWarnings: this.metrics.warnings.length,
      lastWarning: this.metrics.warnings[this.metrics.warnings.length - 1],
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = {
      renders: new Map(),
      apiCalls: [],
      memoryUsage: [],
      warnings: [],
    };
  }

  /**
   * Clean up
   */
  destroy(): void {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
  }
}

// Global instance
const performanceTracker = new PerformanceTracker();

// React hooks for performance monitoring
export function useRenderMonitor(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(0);

  useEffect(() => {
    renderCount.current++;
    startTime.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - startTime.current;
    performanceTracker.trackRender(componentName, renderTime);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${componentName} rendered (${renderCount.current}) in ${renderTime.toFixed(2)}ms`);
    }
  });

  return renderCount.current;
}

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState(() => performanceTracker.getSummary());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(performanceTracker.getSummary());
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  return metrics;
}

// Debug logging utility
class DebugLogger {
  private level: LogLevel = LogLevel.DEBUG;
  private prefix: string = '🔍 Cognify';

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG && process.env.NODE_ENV === 'development') {
      console.log(`${this.prefix} [DEBUG]`, message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO && process.env.NODE_ENV === 'development') {
      console.info(`${this.prefix} [INFO]`, message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`${this.prefix} [WARN]`, message, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`${this.prefix} [ERROR]`, message, ...args);
    }
  }

  group(label: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.group(`${this.prefix} ${label}`);
    }
  }

  groupEnd(): void {
    if (process.env.NODE_ENV === 'development') {
      console.groupEnd();
    }
  }

  time(label: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.time(`${this.prefix} ${label}`);
    }
  }

  timeEnd(label: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(`${this.prefix} ${label}`);
    }
  }
}

export const logger = new DebugLogger();

// Performance measurement utilities
export const PerfUtils = {
  /**
   * Measure function execution time
   */
  measure: async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      logger.info(`${label} completed in ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      logger.error(`${label} failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  },

  /**
   * Create performance timer
   */
  timer: (label: string) => {
    const start = performance.now();
    return {
      end: () => {
        const duration = performance.now() - start;
        logger.info(`${label}: ${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  },

  /**
   * Throttle function calls
   */
  throttle: <T extends any[]>(
    fn: (...args: T) => void,
    delay: number
  ) => {
    let lastCall = 0;
    return (...args: T) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        fn(...args);
      }
    };
  },

  /**
   * Debounce function calls
   */
  debounce: <T extends any[]>(
    fn: (...args: T) => void,
    delay: number
  ) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: T) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  },
};

// Development utilities only available in development mode
export const DevUtils = process.env.NODE_ENV === 'development' ? {
  // Performance tracker access
  performance: performanceTracker,
  
  // Manual performance tracking
  trackRender: (componentName: string, renderTime?: number) => {
    performanceTracker.trackRender(componentName, renderTime);
  },
  
  // Get performance summary
  getPerformanceSummary: () => performanceTracker.getSummary(),
  
  // Get detailed metrics
  getDetailedMetrics: () => performanceTracker.getMetrics(),
  
  // Clear metrics
  clearMetrics: () => performanceTracker.clear(),
  
  // Logger access
  logger,
  
  // Performance utilities
  ...PerfUtils,
  
} : {};

// Make development utilities available globally in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).cognifyDev = DevUtils;
}

// Cleanup on unmount
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    performanceTracker.destroy();
  });
}