/**
 * System Monitoring Dashboard Component
 * Real-time system health and performance monitoring
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Server,
  Database,
  Users,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface SystemHealth {
  health: {
    checks: Record<string, boolean>;
    status: Record<string, { status: boolean; lastCheck: Date }>;
    overall: boolean;
  };
  metrics: Array<{
    timestamp: Date;
    database: {
      responseTime: number;
      activeConnections: number;
      errorRate: number;
      slowQueries: number;
    };
    application: {
      memoryUsage: number;
      activeUsers: number;
      requestsPerMinute: number;
      averageResponseTime: number;
    };
    features: {
      studySessions: number;
      flashcardsReviewed: number;
      projectsCreated: number;
      aiGenerations: number;
    };
    errors: {
      total: number;
      byType: Record<string, number>;
      bySeverity: Record<string, number>;
    };
  }>;
  analytics: {
    users: {
      total: number;
      active: number;
      retentionRate: number;
    };
    content: {
      projects: number;
      flashcards: number;
    };
    activity: {
      sessionsThisWeek: number;
    };
    timestamp: Date;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recentCount: number;
    trend: "increasing" | "decreasing" | "stable";
  };
  usage: {
    totalEvents: number;
    eventsByType: Record<string, number>;
    uniqueUsers: number;
    sessionId: string;
    userId?: string;
  };
  timestamp: string;
}

export function SystemMonitoringDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadSystemHealth();

    if (autoRefresh) {
      const interval = setInterval(loadSystemHealth, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadSystemHealth = async () => {
    try {
      setError(null);

      const response = await fetch("/api/system/analytics?endpoint=health");

      if (!response.ok) {
        throw new Error("Failed to load system health data");
      }

      const data = await response.json();
      setSystemHealth(data);
    } catch (error) {
      console.error("Failed to load system health:", error);
      setError("Failed to load system health data");
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 bg-surface-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="p-6 glass-surface border border-subtle text-center">
          <AlertTriangle className="w-8 h-8 text-error mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            System Health Unavailable
          </h3>
          <p className="text-text-muted mb-4">{error}</p>
          <Button onClick={loadSystemHealth} variant="outline">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (!systemHealth) {
    return null;
  }

  const latestMetrics = systemHealth.metrics[systemHealth.metrics.length - 1];
  const overallHealth = systemHealth.health.overall;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <Activity
              className={`w-8 h-8 ${
                overallHealth ? "text-success" : "text-error"
              }`}
            />
            System Monitoring
          </h1>
          <p className="text-text-muted mt-2">
            Real-time system health and performance monitoring
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Auto Refresh
          </Button>
          <Button onClick={loadSystemHealth} variant="outline" size="sm">
            Refresh Now
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <Card className="p-6 glass-surface border border-subtle">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">
            System Status
          </h3>
          <Badge
            className={
              overallHealth
                ? "surface-elevated text-status-success border-status-success"
                : "surface-elevated text-status-error border-status-error"
            }
          >
            {overallHealth ? (
              <>
                <CheckCircle className="w-4 h-4 mr-1" />
                Healthy
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-1" />
                Issues Detected
              </>
            )}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(systemHealth.health.checks).map(([check, status]) => (
            <div key={check} className="flex items-center gap-2">
              {status ? (
                <CheckCircle className="w-4 h-4 text-success" />
              ) : (
                <XCircle className="w-4 h-4 text-error" />
              )}
              <span className="text-sm text-text-primary capitalize">
                {check.replace(/([A-Z])/g, " $1").trim()}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Users"
          value={systemHealth.analytics.users.active}
          subtitle={`${systemHealth.analytics.users.total} total`}
          icon={Users}
          color="text-brand-primary"
          bgColor="surface-elevated"
        />
        <MetricCard
          title="DB Response"
          value={`${latestMetrics?.database.responseTime || 0}ms`}
          subtitle="Average response time"
          icon={Database}
          color="text-status-success"
          bgColor="surface-elevated"
        />
        <MetricCard
          title="Memory Usage"
          value={`${Math.round(latestMetrics?.application.memoryUsage || 0)}MB`}
          subtitle="Application memory"
          icon={Server}
          color="text-brand-accent"
          bgColor="surface-elevated"
        />
        <MetricCard
          title="Error Rate"
          value={systemHealth.errors.recentCount}
          subtitle="Last 24 hours"
          icon={AlertTriangle}
          color={
            systemHealth.errors.recentCount > 10
              ? "text-status-error"
              : "text-status-success"
          }
          bgColor={
            systemHealth.errors.recentCount > 10 ? "surface-elevated" : "surface-elevated"
          }
        />
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Performance */}
        <Card className="p-6 glass-surface border border-subtle">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-brand-primary" />
            Database Performance
          </h3>
          <DatabaseMetrics metrics={latestMetrics?.database} />
        </Card>

        {/* Application Metrics */}
        <Card className="p-6 glass-surface border border-subtle">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Server className="w-5 h-5 text-brand-primary" />
            Application Metrics
          </h3>
          <ApplicationMetrics metrics={latestMetrics?.application} />
        </Card>

        {/* Feature Usage */}
        <Card className="p-6 glass-surface border border-subtle">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-primary" />
            Feature Usage
          </h3>
          <FeatureMetrics metrics={latestMetrics?.features} />
        </Card>

        {/* Content Statistics */}
        <Card className="p-6 glass-surface border border-subtle">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-primary" />
            Content Statistics
          </h3>
          <ContentStats analytics={systemHealth.analytics} />
        </Card>
      </div>

      {/* System Timeline */}
      {systemHealth.metrics.length > 0 && (
        <Card className="p-6 glass-surface border border-subtle">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            System Timeline (Last 24 Hours)
          </h3>
          <SystemTimeline metrics={systemHealth.metrics.slice(-24)} />
        </Card>
      )}

      <div className="text-xs text-text-muted text-center">
        Last updated: {new Date(systemHealth.timestamp).toLocaleString()}
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: number | string;
  subtitle: string;
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
          <p className="text-text-muted text-sm mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </Card>
  );
}

function DatabaseMetrics({
  metrics,
}: {
  metrics?: SystemHealth["metrics"][0]["database"];
}) {
  if (!metrics) {
    return <div className="text-text-muted">No database metrics available</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-text-muted">Response Time</span>
        <span
          className={`font-semibold ${
            metrics.responseTime < 100
              ? "text-success"
              : metrics.responseTime < 500
              ? "text-warning"
              : "text-error"
          }`}
        >
          {metrics.responseTime}ms
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-text-muted">Active Connections</span>
        <span className="font-semibold text-text-primary">
          {metrics.activeConnections}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-text-muted">Error Rate</span>
        <span
          className={`font-semibold ${
            metrics.errorRate === 0 ? "text-success" : "text-error"
          }`}
        >
          {metrics.errorRate}%
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-text-muted">Slow Queries</span>
        <span
          className={`font-semibold ${
            metrics.slowQueries === 0 ? "text-success" : "text-warning"
          }`}
        >
          {metrics.slowQueries}
        </span>
      </div>
    </div>
  );
}

function ApplicationMetrics({
  metrics,
}: {
  metrics?: SystemHealth["metrics"][0]["application"];
}) {
  if (!metrics) {
    return (
      <div className="text-text-muted">No application metrics available</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-text-muted">Memory Usage</span>
        <span className="font-semibold text-text-primary">
          {Math.round(metrics.memoryUsage)}MB
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-text-muted">Active Users</span>
        <span className="font-semibold text-brand-primary">
          {metrics.activeUsers}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-text-muted">Requests/min</span>
        <span className="font-semibold text-text-primary">
          {metrics.requestsPerMinute}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-text-muted">Avg Response</span>
        <span className="font-semibold text-text-primary">
          {metrics.averageResponseTime}ms
        </span>
      </div>
    </div>
  );
}

function FeatureMetrics({
  metrics,
}: {
  metrics?: SystemHealth["metrics"][0]["features"];
}) {
  if (!metrics) {
    return <div className="text-text-muted">No feature metrics available</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-text-muted">Study Sessions</span>
        <span className="font-semibold text-text-primary">
          {metrics.studySessions}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-text-muted">Cards Reviewed</span>
        <span className="font-semibold text-brand-primary">
          {metrics.flashcardsReviewed}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-text-muted">Projects Created</span>
        <span className="font-semibold text-text-primary">
          {metrics.projectsCreated}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-text-muted">AI Generations</span>
        <span className="font-semibold text-text-primary">
          {metrics.aiGenerations}
        </span>
      </div>
    </div>
  );
}

function ContentStats({ analytics }: { analytics: SystemHealth["analytics"] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-text-muted">Total Users</span>
        <span className="font-semibold text-text-primary">
          {analytics.users.total}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-text-muted">Retention Rate</span>
        <span className="font-semibold text-brand-primary">
          {Math.round(analytics.users.retentionRate * 100)}%
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-text-muted">Total Projects</span>
        <span className="font-semibold text-text-primary">
          {analytics.content.projects}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-text-muted">Total Flashcards</span>
        <span className="font-semibold text-text-primary">
          {analytics.content.flashcards}
        </span>
      </div>
    </div>
  );
}

function SystemTimeline({ metrics }: { metrics: SystemHealth["metrics"] }) {
  const maxResponseTime = Math.max(
    ...metrics.map((m) => m.database.responseTime)
  );

  return (
    <div className="space-y-3">
      {metrics.slice(-12).map((metric, index) => {
        const time = new Date(metric.timestamp).toLocaleTimeString();
        const responseTimePercent =
          maxResponseTime > 0
            ? (metric.database.responseTime / maxResponseTime) * 100
            : 0;

        return (
          <div key={index} className="flex items-center gap-4">
            <span className="text-sm text-text-muted w-20">{time}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-text-muted">DB Response:</span>
                <span className="text-xs text-text-primary">
                  {metric.database.responseTime}ms
                </span>
              </div>
              <Progress value={responseTimePercent} className="h-2" />
            </div>
            <div className="text-xs text-text-muted">
              {metric.features.studySessions} sessions
            </div>
          </div>
        );
      })}
    </div>
  );
}
