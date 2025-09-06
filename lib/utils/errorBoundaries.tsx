"use client";

/**
 * Error Boundaries and Fallback Components
 * Comprehensive error handling for React components
 */

import React, {
  Component,
  ErrorInfo,
  ReactNode,
  useState,
  useEffect,
  ComponentType,
} from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

// Error types for better categorization
export enum ErrorType {
  CHUNK_LOAD_ERROR = "ChunkLoadError",
  NETWORK_ERROR = "NetworkError",
  RENDERING_ERROR = "RenderingError",
  ASYNC_ERROR = "AsyncError",
  PERMISSION_ERROR = "PermissionError",
  NOT_FOUND_ERROR = "NotFoundError",
}

// Error severity levels
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface CustomErrorInfo {
  type: ErrorType;
  severity: ErrorSeverity;
  error: Error;
  errorInfo?: ErrorInfo;
  context?: string;
  userId?: string;
  timestamp: Date;
  userAgent: string;
  url: string;
}

/**
 * Error Logger
 * Centralized error logging and reporting
 */
export class ErrorLogger {
  private static errors: CustomErrorInfo[] = [];
  private static maxErrors = 100;

  static log(errorInfo: Partial<CustomErrorInfo> & { error: Error }) {
    const fullErrorInfo: CustomErrorInfo = {
      type: ErrorType.RENDERING_ERROR,
      severity: ErrorSeverity.MEDIUM,
      timestamp: new Date(),
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : "server",
      url: typeof window !== "undefined" ? window.location.href : "server",
      ...errorInfo,
    };

    // Add to local storage
    this.errors.unshift(fullErrorInfo);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.group(
        `🚨 ${fullErrorInfo.severity.toUpperCase()} ERROR: ${
          fullErrorInfo.type
        }`
      );
      console.error("Error:", fullErrorInfo.error);
      console.log("Context:", fullErrorInfo.context);
      console.log("Timestamp:", fullErrorInfo.timestamp.toISOString());
      if (fullErrorInfo.errorInfo) {
        console.log("Error Info:", fullErrorInfo.errorInfo);
      }
      console.groupEnd();
    }

    // In production, send to error reporting service
    if (process.env.NODE_ENV === "production") {
      this.sendToErrorService(fullErrorInfo);
    }
  }

  private static sendToErrorService(errorInfo: CustomErrorInfo) {
    // Example: Send to external error reporting service
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorInfo)
    // }).catch(() => {
    //   // Silently fail if error reporting fails
    // })

    console.warn("[ERROR SERVICE]", errorInfo);
  }

  static getErrors() {
    return [...this.errors];
  }

  static clearErrors() {
    this.errors = [];
  }

  static getErrorStats() {
    return {
      total: this.errors.length,
      bySeverity: this.errors.reduce((acc, err) => {
        acc[err.severity] = (acc[err.severity] || 0) + 1;
        return acc;
      }, {} as Record<ErrorSeverity, number>),
      byType: this.errors.reduce((acc, err) => {
        acc[err.type] = (acc[err.type] || 0) + 1;
        return acc;
      }, {} as Record<ErrorType, number>),
    };
  }
}

/**
 * Main Application Error Boundary
 */
export class AppErrorBoundary extends Component<
  {
    children: ReactNode;
    fallback?: ComponentType<ErrorBoundaryProps>;
    onError?: (error: Error, errorInfo: CustomErrorInfo) => void;
  },
  { hasError: boolean; error: Error | null; errorId: string }
> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: "",
    };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorDetails: Partial<CustomErrorInfo> = {
      error,
      errorInfo,
      type: this.categorizeError(error),
      severity: this.determineSeverity(error),
      context: "AppErrorBoundary",
    };

    ErrorLogger.log(
      errorDetails as Partial<CustomErrorInfo> & { error: Error }
    );

    if (this.props.onError) {
      this.props.onError(error, errorDetails as CustomErrorInfo);
    }
  }

  categorizeError(error: Error): ErrorType {
    const message = error.message.toLowerCase();

    if (
      message.includes("loading chunk") ||
      message.includes("failed to fetch")
    ) {
      return ErrorType.CHUNK_LOAD_ERROR;
    }
    if (message.includes("network") || message.includes("fetch")) {
      return ErrorType.NETWORK_ERROR;
    }
    if (message.includes("permission") || message.includes("unauthorized")) {
      return ErrorType.PERMISSION_ERROR;
    }
    if (message.includes("not found") || message.includes("404")) {
      return ErrorType.NOT_FOUND_ERROR;
    }

    return ErrorType.RENDERING_ERROR;
  }

  determineSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();

    if (message.includes("chunk") || message.includes("network")) {
      return ErrorSeverity.MEDIUM;
    }
    if (message.includes("permission") || message.includes("unauthorized")) {
      return ErrorSeverity.HIGH;
    }
    if (message.includes("critical") || message.includes("security")) {
      return ErrorSeverity.CRITICAL;
    }

    return ErrorSeverity.LOW;
  }

  retry = () => {
    // Clear error state after a brief delay to prevent immediate re-render
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorId: "",
      });
    }, 100);
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || ApplicationErrorFallback;

      return (
        <FallbackComponent
          error={this.state.error}
          retry={this.retry}
          errorId={this.state.errorId}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Feature-Specific Error Boundary
 */
export class FeatureErrorBoundary extends Component<
  {
    children: ReactNode;
    feature: string;
    fallback?: ComponentType<ErrorBoundaryProps>;
    level?: "feature" | "component";
  },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: {
    children: ReactNode;
    feature: string;
    fallback?: ComponentType<ErrorBoundaryProps>;
    level?: "feature" | "component";
  }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    ErrorLogger.log({
      error,
      errorInfo,
      type: ErrorType.RENDERING_ERROR,
      severity: ErrorSeverity.MEDIUM,
      context: `FeatureErrorBoundary:${this.props.feature}`,
    });
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent =
        this.props.fallback ||
        (this.props.level === "component"
          ? ComponentErrorFallback
          : FeatureErrorFallback);

      return (
        <FallbackComponent
          error={this.state.error}
          retry={this.retry}
          feature={this.props.feature}
        />
      );
    }

    return this.props.children;
  }
}

// Error boundary props interface
interface ErrorBoundaryProps {
  error: Error;
  retry: () => void;
  errorId?: string;
  feature?: string;
}

/**
 * Application-Level Error Fallback
 */
export const ApplicationErrorFallback: React.FC<ErrorBoundaryProps> = ({
  error,
  retry,
  errorId,
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Something went wrong
      </h1>

      <p className="text-gray-600 mb-6">
        We&apos;re sorry, but something unexpected happened. Our team has been
        notified.
      </p>

      {process.env.NODE_ENV === "development" && (
        <div className="mb-6 p-4 bg-gray-100 rounded text-left text-sm">
          <p className="font-mono text-red-600 break-all">{error.message}</p>
          {errorId && <p className="text-gray-500 mt-2">Error ID: {errorId}</p>}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={retry}
          className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </button>

        <button
          onClick={() => (window.location.href = "/")}
          className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          <Home className="w-4 h-4 mr-2" />
          Go Home
        </button>
      </div>
    </div>
  </div>
);

/**
 * Feature-Level Error Fallback
 */
export const FeatureErrorFallback: React.FC<ErrorBoundaryProps> = ({
  error,
  retry,
  feature,
}) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
    <div className="flex items-start">
      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
      <div className="flex-1">
        <h3 className="text-lg font-medium text-red-800 mb-2">
          {feature} Unavailable
        </h3>
        <p className="text-red-700 mb-4">
          This feature is temporarily unavailable. You can continue using other
          parts of the application.
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="mb-4 p-3 bg-red-100 rounded text-sm">
            <p className="font-mono text-red-800 break-all">{error.message}</p>
          </div>
        )}

        <button
          onClick={retry}
          className="flex items-center px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry {feature}
        </button>
      </div>
    </div>
  </div>
);

/**
 * Component-Level Error Fallback
 */
export const ComponentErrorFallback: React.FC<ErrorBoundaryProps> = ({
  error,
  retry,
  feature,
}) => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 my-2">
    <div className="flex items-center">
      <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
      <div className="flex-1">
        <p className="text-sm text-yellow-800">
          {feature || "Component"} failed to load
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="text-xs text-yellow-700 mt-1 font-mono">
            {error.message}
          </p>
        )}
      </div>
      <button
        onClick={retry}
        className="text-xs px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
      >
        Retry
      </button>
    </div>
  </div>
);

/**
 * Async Error Hook
 * Handle errors in async operations
 */
export function useAsyncError() {
  const [error, setError] = useState<Error | null>(null);

  const throwError = (error: Error) => {
    ErrorLogger.log({
      error,
      type: ErrorType.ASYNC_ERROR,
      severity: ErrorSeverity.MEDIUM,
      context: "useAsyncError",
    });
    setError(error);
  };

  const clearError = () => setError(null);

  useEffect(() => {
    if (error) {
      throw error; // This will be caught by error boundary
    }
  }, [error]);

  return { throwError, clearError, error };
}

/**
 * Global Error Handler
 * Handle uncaught errors and promise rejections
 */
export function setupGlobalErrorHandlers() {
  if (typeof window === "undefined") return;

  // Handle uncaught JavaScript errors
  window.addEventListener("error", (event) => {
    ErrorLogger.log({
      error: event.error || new Error(event.message),
      type: ErrorType.RENDERING_ERROR,
      severity: ErrorSeverity.HIGH,
      context: "Global Error Handler",
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

    ErrorLogger.log({
      error,
      type: ErrorType.ASYNC_ERROR,
      severity: ErrorSeverity.HIGH,
      context: "Unhandled Promise Rejection",
    });

    // Prevent the default console error
    event.preventDefault();
  });
}

/**
 * Error Recovery Utilities
 */
export const ErrorRecovery = {
  // Retry with exponential backoff
  retryWithBackoff: async function <T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    initialDelay = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === maxRetries) break;

        const delay = initialDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  },

  // Graceful degradation
  withFallback: function <T>(primary: () => T, fallback: () => T): T {
    try {
      return primary();
    } catch (err) {
      ErrorLogger.log({
        error: err instanceof Error ? err : new Error(String(err)),
        type: ErrorType.RENDERING_ERROR,
        severity: ErrorSeverity.LOW,
        context: "Graceful Degradation",
      });
      return fallback();
    }
  },
};

// Setup global error handlers on module load
if (typeof window !== "undefined") {
  setupGlobalErrorHandlers();
}
