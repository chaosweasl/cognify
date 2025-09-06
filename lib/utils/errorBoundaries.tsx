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

  static logError(errorInfo: CustomErrorInfo): void {
    // Add to local storage
    this.errors.unshift(errorInfo);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error logged:", errorInfo);
    }

    // Send to external service in production
    if (process.env.NODE_ENV === "production") {
      this.sendToErrorService(errorInfo).catch(console.error);
    }
  }

  private static async sendToErrorService(
    errorInfo: CustomErrorInfo
  ): Promise<void> {
    try {
      // In a real app, send to service like Sentry, LogRocket, etc.
      await fetch("/api/system/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...errorInfo,
          error: {
            message: errorInfo.error.message,
            stack: errorInfo.error.stack,
            name: errorInfo.error.name,
          },
        }),
      });
    } catch (error) {
      console.error("Failed to send error to service:", error);
    }
  }

  static getErrors(): CustomErrorInfo[] {
    return [...this.errors];
  }

  static clearErrors(): void {
    this.errors = [];
  }

  static getErrorStats() {
    const byType = this.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = this.errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.errors.length,
      byType,
      bySeverity,
      recent: this.errors.slice(0, 10),
    };
  }

  // Compatibility alias for other modules that call `ErrorLogger.log`
  // Accepts either a CustomErrorInfo or a flexible object and normalizes it
  static log(payload: CustomErrorInfo | Partial<CustomErrorInfo> | Error) {
    if (payload instanceof Error) {
      const info: CustomErrorInfo = {
        type: ErrorType.RENDERING_ERROR,
        severity: ErrorSeverity.MEDIUM,
        error: payload,
        timestamp: new Date(),
        userAgent:
          typeof window !== "undefined" ? window.navigator.userAgent : "Server",
        url: typeof window !== "undefined" ? window.location.href : "Server",
      };
      return this.logError(info);
    }

    const p = payload as Partial<CustomErrorInfo>;
    const raw = payload as unknown as Record<string, unknown>;

    const type = p.type ?? ErrorType.RENDERING_ERROR;
    const severity = p.severity ?? ErrorSeverity.MEDIUM;

    const messageFromRaw =
      typeof raw?.message === "string" ? String(raw.message) : undefined;

    const errorObj: Error =
      p.error instanceof Error
        ? p.error
        : messageFromRaw
        ? new Error(messageFromRaw)
        : new Error("Unknown error");

    const timestamp = p.timestamp
      ? p.timestamp instanceof Date
        ? p.timestamp
        : new Date(String(p.timestamp))
      : new Date();

    const normalized: CustomErrorInfo = {
      type,
      severity,
      error: errorObj,
      errorInfo: p.errorInfo,
      context: p.context,
      userId: typeof p.userId === "string" ? p.userId : undefined,
      timestamp,
      userAgent:
        p.userAgent ??
        (typeof window !== "undefined" ? window.navigator.userAgent : "Server"),
      url:
        p.url ??
        (typeof window !== "undefined" ? window.location.href : "Server"),
    };

    return this.logError(normalized);
  }
}

/**
 * Main Error Boundary Component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ComponentType<{
    error: Error;
    retry: () => void;
    errorInfo?: ErrorInfo;
  }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  context?: string;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private retryTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    const customErrorInfo: CustomErrorInfo = {
      type: this.categorizeError(error),
      severity: this.determineSeverity(error),
      error,
      errorInfo,
      context: this.props.context,
      timestamp: new Date(),
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : "Server",
      url: typeof window !== "undefined" ? window.location.href : "Server",
    };

    ErrorLogger.logError(customErrorInfo);

    this.setState({ errorInfo });

    // Call onError callback if provided
    this.props.onError?.(error, errorInfo);
  }

  private categorizeError(error: Error): ErrorType {
    if (error.message.includes("Loading chunk")) {
      return ErrorType.CHUNK_LOAD_ERROR;
    }
    if (error.message.includes("fetch")) {
      return ErrorType.NETWORK_ERROR;
    }
    if (
      error.message.includes("permission") ||
      error.message.includes("unauthorized")
    ) {
      return ErrorType.PERMISSION_ERROR;
    }
    return ErrorType.RENDERING_ERROR;
  }

  private determineSeverity(error: Error): ErrorSeverity {
    if (error.message.includes("Loading chunk")) {
      return ErrorSeverity.MEDIUM;
    }
    if (error.message.includes("Network") || error.message.includes("fetch")) {
      return ErrorSeverity.HIGH;
    }
    return ErrorSeverity.MEDIUM;
  }

  private handleRetry = () => {
    const maxRetries = this.props.maxRetries || 3;

    if (this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));

    // Clear any existing timeout
    if (this.retryTimeoutId) {
      window.clearTimeout(this.retryTimeoutId);
    }

    // Reset retry count after successful recovery
    this.retryTimeoutId = window.setTimeout(() => {
      this.setState({ retryCount: 0 });
    }, 10000);
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      window.clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;

      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo || undefined}
          retry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * App-level Error Boundary component used by layouts.
 * Exported as `AppErrorBoundary` for backward compatibility with imports.
 */
export const AppErrorBoundary: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

/**
 * Default Error Fallback Component
 */
const DefaultErrorFallback: ComponentType<{
  error: Error;
  errorInfo?: ErrorInfo | null;
  retry: () => void;
}> = ({ error, retry }) => (
  <div className="min-h-[400px] flex items-center justify-center p-6">
    <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <AlertTriangle className="mx-auto h-12 w-12 text-red-600 mb-4" />
      <h2 className="text-lg font-semibold text-red-800 mb-2">
        Something went wrong
      </h2>
      <p className="text-red-600 mb-4 text-sm">
        {error.message || "An unexpected error occurred"}
      </p>
      <div className="space-y-2">
        <button
          onClick={retry}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded hover:bg-red-100 transition-colors"
        >
          <Home className="h-4 w-4" />
          Go Home
        </button>
      </div>
    </div>
  </div>
);

/**
 * Chunk Loading Error Boundary
 * Specialized error boundary for code splitting failures
 */
export const ChunkErrorBoundary: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <ErrorBoundary
    context="ChunkLoading"
    fallback={({ retry }) => (
      <div className="min-h-[300px] flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-orange-600 mb-3" />
          <h3 className="font-medium text-orange-800 mb-2">Loading Error</h3>
          <p className="text-orange-600 text-sm mb-4">
            Failed to load part of the application. Please try refreshing.
          </p>
          <button
            onClick={retry}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>
    )}
  >
    {children}
  </ErrorBoundary>
);

/**
 * Hook for async error handling
 */
export function useAsyncError() {
  const [, setError] = useState();
  return (error: Error) => {
    setError(() => {
      throw error;
    });
  };
}

/**
 * Higher-order component for wrapping components with error boundaries
 */
export function withErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name
  })`;

  return WrappedComponent;
}
