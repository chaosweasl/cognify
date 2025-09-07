/**
 * Error Tracking Dashboard Component
 * Display system errors and error statistics
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  XCircle,
  AlertCircle,
  Info,
  Clock,
  Filter,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ErrorLog {
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  stack?: string;
  timestamp: string;
  userId?: string;
  url?: string;
  userAgent?: string;
  context?: Record<string, unknown>;
}

interface ErrorStats {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  recentCount: number;
  trend: "increasing" | "decreasing" | "stable";
}

export function ErrorTrackingDashboard() {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    loadErrors();
  }, []);

  const loadErrors = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/system/errors");

      if (!response.ok) {
        throw new Error("Failed to load error logs");
      }

      const data = await response.json();
      setErrors(data.errors || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error("Failed to load errors:", error);
      setError("Failed to load error logs");
    } finally {
      setIsLoading(false);
    }
  };

  const clearErrors = async () => {
    try {
      const response = await fetch("/api/system/errors", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear errors");
      }

      await loadErrors();
    } catch (error) {
      console.error("Failed to clear errors:", error);
      setError("Failed to clear error logs");
    }
  };

  const filteredErrors = errors.filter((error) => {
    if (filterSeverity !== "all" && error.severity !== filterSeverity) {
      return false;
    }
    if (filterType !== "all" && error.type !== filterType) {
      return false;
    }
    return true;
  });

  const uniqueTypes = Array.from(new Set(errors.map((e) => e.type)));

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-surface-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-surface-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-error" />
            Error Tracking
          </h1>
          <p className="text-text-muted mt-2">
            Monitor and manage application errors
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={loadErrors} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={clearErrors}
            variant="outline"
            size="sm"
            disabled={errors.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Error Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Errors"
            value={stats.total}
            icon={XCircle}
            color="text-error"
            bgColor="surface-elevated"
          />
          <StatCard
            title="Critical Errors"
            value={stats.bySeverity.critical || 0}
            icon={AlertTriangle}
            color="text-error"
            bgColor="surface-elevated"
          />
          <StatCard
            title="Recent (24h)"
            value={stats.recentCount}
            icon={Clock}
            color="text-warning"
            bgColor="surface-elevated"
          />
          <StatCard
            title="Trend"
            value={stats.trend}
            icon={Info}
            color={
              stats.trend === "increasing"
                ? "text-error"
                : stats.trend === "decreasing"
                ? "text-success"
                : "text-text-muted"
            }
            bgColor={
              stats.trend === "increasing"
                ? "surface-elevated"
                : stats.trend === "decreasing"
                ? "surface-elevated"
                : "surface-secondary"
            }
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <span className="text-sm font-medium text-text-muted">
            Filter by:
          </span>
        </div>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {uniqueTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-text-muted">
          Showing {filteredErrors.length} of {errors.length} errors
        </span>
      </div>

      {/* Error List */}
      {error && (
        <Card className="p-6 glass-surface border border-subtle text-center">
          <AlertCircle className="w-8 h-8 text-error mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Failed to Load Errors
          </h3>
          <p className="text-text-muted">{error}</p>
        </Card>
      )}

      {filteredErrors.length === 0 && !error ? (
        <Card className="p-6 glass-surface border border-subtle text-center">
          <Info className="w-8 h-8 text-success mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            No Errors Found
          </h3>
          <p className="text-text-muted">
            {errors.length === 0
              ? "No errors have been logged yet."
              : "No errors match your current filters."}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredErrors.map((errorLog) => (
            <ErrorCard key={errorLog.id} error={errorLog} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}) {
  return (
    <Card className="p-6 glass-surface border border-subtle hover-lift transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-text-muted text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-text-primary mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </Card>
  );
}

function ErrorCard({ error }: { error: ErrorLog }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "surface-elevated text-status-error border-status-error";
      case "high":
        return "surface-elevated text-status-warning border-status-warning";
      case "medium":
        return "surface-elevated text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "surface-secondary text-secondary border-subtle";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="w-4 h-4" />;
      case "high":
        return <AlertTriangle className="w-4 h-4" />;
      case "medium":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  return (
    <Card className="glass-surface border border-subtle">
      <div
        className="p-4 cursor-pointer hover:bg-surface-hover transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge className={getSeverityColor(error.severity)}>
                {getSeverityIcon(error.severity)}
                <span className="ml-1 capitalize">{error.severity}</span>
              </Badge>
              <Badge variant="outline">{error.type}</Badge>
              <span className="text-sm text-text-muted">
                {new Date(error.timestamp).toLocaleString()}
              </span>
            </div>
            <h4 className="font-medium text-text-primary mb-1 line-clamp-2">
              {error.message}
            </h4>
            {error.url && (
              <p className="text-sm text-text-muted">URL: {error.url}</p>
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-subtle p-4 bg-surface-muted">
          {error.stack && (
            <div className="mb-4">
              <h5 className="font-medium text-text-primary mb-2">
                Stack Trace:
              </h5>
              <pre className="text-xs text-text-muted bg-surface rounded p-3 overflow-x-auto whitespace-pre-wrap">
                {error.stack}
              </pre>
            </div>
          )}

          {error.context && Object.keys(error.context).length > 0 && (
            <div className="mb-4">
              <h5 className="font-medium text-text-primary mb-2">Context:</h5>
              <pre className="text-xs text-text-muted bg-surface rounded p-3 overflow-x-auto">
                {JSON.stringify(error.context, null, 2)}
              </pre>
            </div>
          )}

          {error.userAgent && (
            <div className="mb-2">
              <span className="font-medium text-text-primary text-sm">
                User Agent:{" "}
              </span>
              <span className="text-sm text-text-muted">{error.userAgent}</span>
            </div>
          )}

          {error.userId && (
            <div className="mb-2">
              <span className="font-medium text-text-primary text-sm">
                User ID:{" "}
              </span>
              <span className="text-sm text-text-muted font-mono">
                {error.userId}
              </span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
