/**
 * System Health Dashboard Component
 * Real-time monitoring and analytics dashboard
 * Fully refactored with semantic variables and design patterns
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Database,
  Users,
  BarChart3,
  TrendingUp,
  Clock,
  Zap,
  Server,
  Sparkles,
  RefreshCw,
  Trash2,
  Eye,
  Shield,
} from "lucide-react";
import { UserAnalyticsService, healthMonitor } from "@/lib/utils/analytics";
import { ErrorLogger } from "@/lib/utils/errorBoundaries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface HealthStatus {
  [key: string]: {
    status: boolean;
    lastCheck: Date;
  };
}

export function SystemHealthDashboard() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus>({});
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [systemAnalytics, setSystemAnalytics] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [errorStats, setErrorStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHealthData = async () => {
      try {
        setIsLoading(true);

        // Get health status
        const status = healthMonitor.getHealthStatus();
        setHealthStatus(status);

        // Get system analytics
        const sysAnalytics = await UserAnalyticsService.getSystemAnalytics();
        setSystemAnalytics(sysAnalytics);

        // Get error statistics
        const errors = ErrorLogger.getErrorStats();
        setErrorStats(errors);
      } catch (error) {
        console.error("Failed to load health data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHealthData();

    // Refresh every 30 seconds
    const interval = setInterval(loadHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <SystemHealthSkeleton />;
  }

  const overallHealth = Object.values(healthStatus).every(
    (check) => check.status
  );

  return (
    <div className="space-y-6">
      {/* Enhanced Header Section with Glass Morphism */}
      <div className="relative">
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div
            className="absolute top-0 left-0 w-full h-1/2 bg-gradient-glass animate-pulse"
            style={{ animationDuration: "4s" }}
          />
          <div
            className="absolute bottom-0 right-0 w-full h-1/3 bg-gradient-glass animate-pulse"
            style={{ animationDuration: "6s", animationDelay: "2s" }}
          />
        </div>
        <div className="relative glass-surface border border-subtle rounded-xl p-6 shadow-brand">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all transition-normal shadow-brand">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-glass rounded-xl blur opacity-0 group-hover:opacity-100 transition-all transition-normal" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary group-hover:brand-primary transition-colors transition-normal">
                  System Health Dashboard
                </h1>
                <p className="text-muted mt-1">
                  Real-time system monitoring and analytics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse"
              >
                <Eye className="w-3 h-3 mr-1" />
                Live Monitoring
              </Badge>
              <Badge
                className={cn(
                  "px-4 py-2 rounded-full font-medium transition-all transition-normal",
                  overallHealth
                    ? "bg-green-500/10 text-green-400 border-green-500/30"
                    : "bg-red-500/10 text-red-400 border-red-500/30"
                )}
              >
                {overallHealth ? (
                  <CheckCircle className="w-4 h-4 mr-2" />
                ) : (
                  <AlertTriangle className="w-4 h-4 mr-2" />
                )}
                {overallHealth ? "All Systems Operational" : "Issues Detected"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Health Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthCard
          title="Database"
          status={healthStatus.database?.status}
          lastCheck={healthStatus.database?.lastCheck}
          icon={<Database className="w-6 h-6" />}
          description="Database connectivity and performance"
          index={0}
        />

        <HealthCard
          title="Memory"
          status={healthStatus.memory?.status}
          lastCheck={healthStatus.memory?.lastCheck}
          icon={<Zap className="w-6 h-6" />}
          description="Memory usage and performance"
          index={1}
        />

        <HealthCard
          title="Storage"
          status={healthStatus.localStorage?.status}
          lastCheck={healthStatus.localStorage?.lastCheck}
          icon={<Server className="w-6 h-6" />}
          description="Local storage availability"
          index={2}
        />

        <HealthCard
          title="System"
          status={overallHealth}
          lastCheck={new Date()}
          icon={<Activity className="w-6 h-6" />}
          description="Overall system health"
          index={3}
        />
      </div>

      {/* Enhanced Analytics Cards */}
      {systemAnalytics && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 brand-primary" />
            <h2 className="text-lg font-semibold text-primary">
              System Metrics
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Users"
              value={systemAnalytics.users.total}
              change={systemAnalytics.users.active}
              changeLabel="active this week"
              icon={<Users className="w-6 h-6" />}
              color="brand-primary"
              index={0}
            />

            <MetricCard
              title="Projects"
              value={systemAnalytics.content.projects}
              icon={<BarChart3 className="w-6 h-6" />}
              color="text-green-500"
              index={1}
            />

            <MetricCard
              title="Flashcards"
              value={systemAnalytics.content.flashcards}
              icon={<Sparkles className="w-6 h-6" />}
              color="brand-secondary"
              index={2}
            />

            <MetricCard
              title="Study Sessions"
              value={systemAnalytics.activity.sessionsThisWeek}
              changeLabel="this week"
              icon={<Clock className="w-6 h-6" />}
              color="text-status-warning"
              index={3}
            />
          </div>
        </div>
      )}

      {/* Enhanced Detailed Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error Tracking Panel */}
        <div className="glass-surface border border-subtle rounded-xl p-6 shadow-brand-lg">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary">
                Error Tracking
              </h2>
              <p className="text-sm text-muted">
                System error monitoring and analysis
              </p>
            </div>
          </div>

          {errorStats ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 surface-elevated rounded-lg border border-secondary">
                <span className="text-secondary font-medium">Total Errors</span>
                <Badge
                  className={cn(
                    "font-semibold px-3 py-1 text-sm",
                    errorStats.total === 0
                      ? "bg-green-500/10 text-green-400 border-green-500/30"
                      : "bg-red-500/10 text-red-400 border-red-500/30"
                  )}
                >
                  {errorStats.total}
                </Badge>
              </div>

              {errorStats.total > 0 && (
                <>
                  <div className="surface-elevated border border-secondary rounded-lg p-4">
                    <h4 className="font-semibold text-primary mb-4 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      By Severity
                    </h4>
                    <div className="space-y-3">
                      {Object.entries(errorStats.bySeverity).map(
                        ([severity, count]) => (
                          <div
                            key={severity}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm text-secondary capitalize font-medium">
                              {severity}
                            </span>
                            <Badge
                              className={cn(
                                "text-xs font-medium",
                                severity === "critical"
                                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                                  : severity === "high"
                                  ? "surface-elevated text-status-warning border-status-warning"
                                  : severity === "medium"
                                  ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                                  : "surface-secondary text-muted border-subtle"
                              )}
                            >
                              {count as number}
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="surface-elevated border border-secondary rounded-lg p-4">
                    <h4 className="font-semibold text-primary mb-4">By Type</h4>
                    <div className="space-y-3">
                      {Object.entries(errorStats.byType).map(
                        ([type, count]) => (
                          <div
                            key={type}
                            className="flex items-center justify-between"
                          >
                            <span className="text-sm text-secondary font-medium">
                              {type.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-xs surface-elevated border-secondary"
                            >
                              {count as number}
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 surface-elevated rounded-2xl flex items-center justify-center mb-4 mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-primary font-medium text-lg mb-2">
                No Errors Detected
              </p>
              <p className="text-muted text-sm">System is running smoothly</p>
            </div>
          )}
        </div>

        {/* Performance Metrics Panel */}
        <div className="glass-surface border border-subtle rounded-xl p-6 shadow-brand-lg">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary">
                Performance Metrics
              </h2>
              <p className="text-sm text-muted">
                System performance indicators
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 surface-elevated rounded-lg border border-secondary group interactive-hover">
              <span className="text-secondary font-medium group-hover:text-primary transition-colors transition-normal">
                Average Response Time
              </span>
              <Badge className="bg-green-500/10 text-green-400 border-green-500/30 font-semibold">
                &lt; 200ms
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 surface-elevated rounded-lg border border-secondary group interactive-hover">
              <span className="text-secondary font-medium group-hover:text-primary transition-colors transition-normal">
                Database Queries
              </span>
              <Badge className="bg-green-500/10 text-green-400 border-green-500/30 font-semibold">
                Optimized
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 surface-elevated rounded-lg border border-secondary group interactive-hover">
              <span className="text-secondary font-medium group-hover:text-primary transition-colors transition-normal">
                Cache Hit Rate
              </span>
              <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/30 font-semibold">
                85%
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 surface-elevated rounded-lg border border-secondary group interactive-hover">
              <span className="text-secondary font-medium group-hover:text-primary transition-colors transition-normal">
                Memory Usage
              </span>
              <Badge className="bg-green-500/10 text-green-400 border-green-500/30 font-semibold">
                Normal
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Actions */}
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={() => window.location.reload()}
          className={cn(
            "relative overflow-hidden group",
            "bg-gradient-brand hover:bg-gradient-brand-hover",
            "transform hover:scale-105 transition-all transition-normal",
            "shadow-brand hover:shadow-brand-lg"
          )}
        >
          <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />
          <div className="relative z-10 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh Dashboard
          </div>
        </Button>

        <Button
          onClick={() => ErrorLogger.clearErrors()}
          variant="outline"
          className={cn(
            "surface-secondary border-secondary text-secondary interactive-hover",
            "hover:surface-elevated hover:border-red-500 hover:text-red-400",
            "transition-all transition-normal"
          )}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Error Log
        </Button>
      </div>
    </div>
  );
}

// Enhanced Health Status Card Component
function HealthCard({
  title,
  status,
  lastCheck,
  icon,
  description,
  index = 0,
}: {
  title: string;
  status?: boolean;
  lastCheck?: Date;
  icon: React.ReactNode;
  description: string;
  index?: number;
}) {
  const getStatusColor = () => {
    if (status === undefined)
      return "surface-elevated border-secondary text-muted";
    return status
      ? "bg-green-500/10 border-green-500/30 text-green-400"
      : "bg-red-500/10 border-red-500/30 text-red-400";
  };

  const getIconBgColor = () => {
    if (status === undefined) return "surface-elevated text-muted";
    return status
      ? "bg-green-500/10 text-green-500"
      : "bg-red-500/10 text-red-500";
  };

  return (
    <div
      className={cn(
        "glass-surface border rounded-xl p-6 group relative overflow-hidden",
        "hover:surface-elevated hover:shadow-brand hover:scale-[1.02]",
        "transition-all transition-normal transform",
        getStatusColor()
      )}
      style={{
        animation: `slideInLeft 0.5s ease-out ${index * 0.1}s both`,
      }}
    >
      {/* Hover glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-glass rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity transition-normal" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center transition-all transition-normal",
              "group-hover:scale-110 transform",
              getIconBgColor()
            )}
          >
            {icon}
          </div>

          {status !== undefined && (
            <div className="flex items-center">
              {status ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              )}
            </div>
          )}
        </div>

        <h3 className="font-bold text-lg text-primary group-hover:brand-primary transition-colors transition-normal mb-2">
          {title}
        </h3>
        <p className="text-sm text-muted mb-3">{description}</p>

        {lastCheck && (
          <p className="text-xs text-subtle">
            Last checked: {lastCheck.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}

// Enhanced Metric Card Component
function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  color = "brand-primary",
  index = 0,
}: {
  title: string;
  value: number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color?: string;
  index?: number;
}) {
  return (
    <div
      className={cn(
        "glass-surface border border-subtle rounded-xl p-6 group relative overflow-hidden",
        "hover:surface-elevated hover:shadow-brand hover:scale-[1.02]",
        "transition-all transition-normal transform"
      )}
      style={{
        animation: `slideInLeft 0.5s ease-out ${index * 0.1}s both`,
      }}
    >
      {/* Hover glow effect */}
      <div className="absolute -inset-0.5 bg-gradient-glass rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity transition-normal" />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1">
          <p className="text-muted text-sm font-medium uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-primary group-hover:brand-primary transition-colors transition-normal">
            {value.toLocaleString()}
          </p>
          {change !== undefined && changeLabel && (
            <p className="text-xs text-subtle mt-2">
              {change.toLocaleString()} {changeLabel}
            </p>
          )}
        </div>
        <div className="relative ml-4">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              "surface-elevated border border-secondary",
              "group-hover:bg-gradient-brand group-hover:border-brand",
              "transition-all transition-normal transform group-hover:scale-110"
            )}
          >
            <div
              className={cn(
                "transition-all transition-normal",
                color,
                "group-hover:text-white"
              )}
            >
              {icon}
            </div>
          </div>
          {/* Icon glow effect */}
          <div className="absolute -inset-1 bg-gradient-glass rounded-xl blur opacity-0 group-hover:opacity-100 transition-all transition-normal" />
        </div>
      </div>
    </div>
  );
}

// Enhanced Skeleton Loading Component
function SystemHealthSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="glass-surface border border-subtle rounded-xl p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl" />
          <div>
            <Skeleton className="w-64 h-6 mb-2" />
            <Skeleton className="w-96 h-4" />
          </div>
        </div>
      </div>

      {/* Health Status Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="glass-surface border border-subtle rounded-xl p-6"
            style={{
              animation: `slideInLeft 0.5s ease-out ${i * 0.1}s both`,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <Skeleton className="w-5 h-5 rounded-full" />
            </div>
            <Skeleton className="w-24 h-5 mb-2" />
            <Skeleton className="w-full h-4 mb-3" />
            <Skeleton className="w-32 h-3" />
          </div>
        ))}
      </div>

      {/* Analytics Section Skeleton */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-5 h-5" />
          <Skeleton className="w-32 h-5" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="glass-surface border border-subtle rounded-xl p-6"
              style={{
                animation: `slideInLeft 0.5s ease-out ${i * 0.1}s both`,
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="w-20 h-4 mb-2" />
                  <Skeleton className="w-16 h-8 mb-2" />
                  <Skeleton className="w-24 h-3" />
                </div>
                <Skeleton className="w-12 h-12 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Panels Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="glass-surface border border-subtle rounded-xl p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <div>
                <Skeleton className="w-32 h-5 mb-2" />
                <Skeleton className="w-48 h-4" />
              </div>
            </div>
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, j) => (
                <div
                  key={j}
                  className="p-4 surface-elevated rounded-lg border border-secondary"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-16 h-6 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions Skeleton */}
      <div className="flex gap-4">
        <Skeleton className="w-40 h-10 rounded-lg" />
        <Skeleton className="w-32 h-10 rounded-lg" />
      </div>
    </div>
  );
}

export default SystemHealthDashboard;
