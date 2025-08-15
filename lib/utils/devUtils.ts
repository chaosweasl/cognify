/**
 * Simple Development Utilities for Cognify
 * 
 * Lightweight logging and basic performance monitoring for solo development
 */

import { useEffect, useRef } from 'react';

// Simple logging with levels
interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export const logger: Logger = {
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[DEBUG]', ...args);
    }
  },
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args);
  },
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },
};

// Simple render monitoring for development
export function useRenderMonitor(componentName: string) {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    if (process.env.NODE_ENV === 'development') {
      if (renderCount.current > 10) {
        logger.warn(`${componentName} has rendered ${renderCount.current} times - check for unnecessary re-renders`);
      }
    }
  });
  
  return renderCount.current;
}

// Basic performance utilities
export const PerfUtils = {
  /**
   * Simple throttle function
   */
  throttle: <T extends unknown[]>(
    fn: (...args: T) => void,
    limit: number
  ) => {
    let inThrottle: boolean;
    return (...args: T) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  /**
   * Simple debounce function
   */
  debounce: <T extends unknown[]>(
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