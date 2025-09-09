"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  FileText,
  Copy,
  CheckCircle,
  ArrowRight,
  Wifi,
  Clock,
  Key,
} from "lucide-react";
import { AIError, AIFallbackSuggestion } from "@/lib/utils/aiErrorHandling";

interface AIErrorHandlerProps {
  error: AIError;
  suggestions: AIFallbackSuggestion[];
  onRetry?: () => void;
  onDismiss?: () => void;
  isRetrying?: boolean;
  className?: string;
}

interface ErrorIconProps {
  errorType: string;
  className?: string;
}

function ErrorIcon({ errorType, className = "w-6 h-6" }: ErrorIconProps) {
  switch (errorType) {
    case "CORS_ERROR":
      return <Wifi className={`${className} text-blue-500`} />;
    case "RATE_LIMIT_ERROR":
      return <Clock className={`${className} text-yellow-500`} />;
    case "AUTH_ERROR":
      return <Key className={`${className} text-red-500`} />;
    default:
      return <AlertTriangle className={`${className} text-orange-500`} />;
  }
}

function getErrorColor(errorType: string): string {
  switch (errorType) {
    case "CORS_ERROR":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "RATE_LIMIT_ERROR":
      return "border-yellow-200 bg-yellow-50 text-yellow-800";
    case "AUTH_ERROR":
      return "border-red-200 bg-red-50 text-red-800";
    default:
      return "border-orange-200 bg-orange-50 text-orange-800";
  }
}

function FallbackSuggestionCard({
  suggestion,
  className = "",
}: {
  suggestion: AIFallbackSuggestion;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopySteps = async () => {
    const stepsText = suggestion.steps
      .map((step, i) => `${i + 1}. ${step}`)
      .join("\n");
    await navigator.clipboard.writeText(stepsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const priorityColor = {
    high: "border-red-200 bg-red-50",
    medium: "border-yellow-200 bg-yellow-50",
    low: "border-gray-200 bg-gray-50",
  };

  const priorityBadgeColor = {
    high: "bg-red-100 text-red-800 border-red-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <div
      className={`surface-elevated border border-subtle rounded-xl p-4 transition-all transition-normal hover:shadow-brand ${className}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-primary">{suggestion.title}</h4>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-md border ${
                priorityBadgeColor[suggestion.priority]
              }`}
            >
              {suggestion.priority} priority
            </span>
          </div>
          <p className="text-sm text-muted mb-3">{suggestion.description}</p>
        </div>
      </div>

      {/* Action Steps */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-secondary">Steps:</span>
          <button
            onClick={handleCopySteps}
            className="btn btn-xs btn-outline gap-1 interactive-hover transition-all transition-normal rounded-lg"
          >
            {copied ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                Copy Steps
              </>
            )}
          </button>
        </div>
        <ol className="space-y-1">
          {suggestion.steps.map((step, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-sm text-muted"
            >
              <span className="flex-shrink-0 w-5 h-5 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Action Button */}
      {suggestion.actionUrl && (
        <div className="flex justify-end">
          <a
            href={suggestion.actionUrl}
            target={
              suggestion.actionUrl.startsWith("http") ? "_blank" : undefined
            }
            rel={
              suggestion.actionUrl.startsWith("http")
                ? "noopener noreferrer"
                : undefined
            }
            className="btn btn-sm bg-gradient-brand hover:bg-gradient-brand-hover text-white border-0 shadow-brand hover:shadow-brand-lg transition-all transition-normal relative overflow-hidden group rounded-lg"
          >
            <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />
            <div className="relative z-10 flex items-center gap-1">
              <span>{suggestion.actionText}</span>
              {suggestion.actionUrl.startsWith("http") ? (
                <ExternalLink className="w-3 h-3" />
              ) : (
                <ArrowRight className="w-3 h-3" />
              )}
            </div>
          </a>
        </div>
      )}
    </div>
  );
}

export function AIErrorHandler({
  error,
  suggestions,
  onRetry,
  onDismiss,
  isRetrying = false,
  className = "",
}: AIErrorHandlerProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const handleDismiss = async () => {
    if (!onDismiss) return;
    setDismissing(true);
    await new Promise((resolve) => setTimeout(resolve, 200)); // Small delay for UX
    onDismiss();
  };

  const errorColorClass = getErrorColor(error.code);

  return (
    <div
      className={`border border-subtle rounded-xl overflow-hidden surface-elevated shadow-brand-sm transition-all transition-normal ${className}`}
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b border-subtle ${errorColorClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ErrorIcon errorType={error.code} />
            <div>
              <h3 className="font-semibold">AI Operation Failed</h3>
              <p className="text-sm opacity-90">{error.message}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className="btn btn-sm btn-outline interactive-hover transition-all transition-normal rounded-lg"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRetrying ? "animate-spin" : ""}`}
                />
                {isRetrying ? "Retrying..." : "Retry"}
              </button>
            )}

            {onDismiss && (
              <button
                onClick={handleDismiss}
                disabled={dismissing}
                className="btn btn-sm btn-ghost interactive-hover transition-all transition-normal rounded-lg"
              >
                {dismissing ? "Closing..." : "Dismiss"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Details (Expandable) */}
      <div className="px-4 py-3 border-b border-subtle surface-secondary">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center justify-between w-full text-left text-sm text-muted hover:text-secondary transition-colors transition-normal"
        >
          <span>Technical Details</span>
          <ArrowRight
            className={`w-4 h-4 transition-transform transition-normal ${
              showDetails ? "rotate-90" : ""
            }`}
          />
        </button>

        {showDetails && (
          <div className="mt-3 p-3 surface-elevated border border-subtle rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-secondary">Provider:</span>
                <span className="text-muted ml-2">
                  {error.provider || "Unknown"}
                </span>
              </div>
              <div>
                <span className="font-medium text-secondary">Model:</span>
                <span className="text-muted ml-2">
                  {error.model || "Unknown"}
                </span>
              </div>
              <div className="col-span-2">
                <span className="font-medium text-secondary">Error Code:</span>
                <span className="text-muted ml-2 font-mono text-xs">
                  {error.code}
                </span>
              </div>
            </div>

            {error.originalError && (
              <details className="mt-3">
                <summary className="text-xs font-medium text-muted cursor-pointer hover:text-secondary transition-colors transition-normal">
                  Original Error Message
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700 overflow-x-auto">
                  {typeof error.originalError === "string"
                    ? error.originalError
                    : JSON.stringify(error.originalError, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Fallback Suggestions */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-brand-primary" />
          <h4 className="font-semibold text-primary">Recommended Solutions</h4>
        </div>

        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <FallbackSuggestionCard key={index} suggestion={suggestion} />
          ))}
        </div>

        {/* Additional Help */}
        <div className="mt-6 p-3 surface-secondary border border-subtle rounded-lg">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gradient-brand rounded-lg">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h5 className="font-medium text-primary mb-1">Need More Help?</h5>
              <p className="text-sm text-muted mb-2">
                If these solutions don't work, you can always use our
                comprehensive manual workflow guide.
              </p>
              <a
                href="/docs/troubleshooting"
                className="inline-flex items-center gap-1 text-sm text-brand-primary hover:text-brand-secondary transition-colors transition-normal"
              >
                View Troubleshooting Guide
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
