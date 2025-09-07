/**
 * Analytics Dashboard Component
 * Comprehensive user analytics and study insights
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Calendar,
  BookOpen,
  Brain,
  Award,
  AlertCircle,
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
import { Progress } from "@/components/ui/progress";

interface UsageStats {
  summary: {
    totalTimeStudied: number;
    totalCardsStudied: number;
    totalCardsLearned: number;
    retentionRate: number;
    activeProjects: number;
  };
  dailyStats: Array<{
    study_date: string;
    new_cards_studied: number;
    reviews_completed: number;
    time_spent_seconds: number;
    cards_learned: number;
    cards_lapsed: number;
    project_id: string;
    projects: { name: string };
  }>;
  projects: Array<{
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    flashcards: Array<{ count: number }>;
    srs_states: Array<{ state: string; ease_factor: number }>;
  }>;
  timeframe: string;
}

interface PerformanceMetrics {
  cardDistribution: {
    new: number;
    learning: number;
    young: number;
    mature: number;
    suspended: number;
  };
  performance: {
    averageEase: number;
    successRate: number;
    leechCards: number;
    totalLapses: number;
    totalRepetitions: number;
  };
}

export function AnalyticsDashboard() {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics | null>(null);
  const [timeframe, setTimeframe] = useState<string>("30");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalyticsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [usageResponse, performanceResponse] = await Promise.all([
        fetch(`/api/analytics?type=usage&days=${timeframe}`),
        fetch(`/api/analytics?type=performance`),
      ]);

      if (!usageResponse.ok || !performanceResponse.ok) {
        throw new Error("Failed to load analytics data");
      }

      const [usageData, performanceData] = await Promise.all([
        usageResponse.json(),
        performanceResponse.json(),
      ]);

      setUsageStats(usageData);
      setPerformanceMetrics(performanceData);
    } catch (error) {
      console.error("Failed to load analytics:", error);
      setError("Failed to load analytics data");
    } finally {
      setIsLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);
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
          <AlertCircle className="w-8 h-8 text-error mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Failed to Load Analytics
          </h3>
          <p className="text-text-muted mb-4">{error}</p>
          <Button onClick={loadAnalyticsData} variant="outline">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (!usageStats || !performanceMetrics) {
    return null;
  }

  const { summary } = usageStats;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-brand-primary" />
            Study Analytics
          </h1>
          <p className="text-text-muted mt-2">
            Insights into your learning progress and patterns
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadAnalyticsData} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          title="Study Time"
          value={`${summary.totalTimeStudied}m`}
          subtitle={`${Math.round(
            summary.totalTimeStudied / parseInt(timeframe)
          )}m/day avg`}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={BookOpen}
          title="Cards Studied"
          value={summary.totalCardsStudied.toString()}
          subtitle={`${summary.totalCardsLearned} learned`}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          icon={Target}
          title="Retention Rate"
          value={`${summary.retentionRate}%`}
          subtitle="Success rate"
          color="text-brand-accent"
          bgColor="surface-elevated"
        />
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Progress Chart */}
        <Card className="p-6 glass-surface border border-subtle">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-primary" />
            Study Progress
          </h3>
          <StudyProgressChart data={usageStats.dailyStats} />
        </Card>

        {/* Card Distribution */}
        <Card className="p-6 glass-surface border border-subtle">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-brand-primary" />
            Card Distribution
          </h3>
          <CardDistributionChart data={performanceMetrics.cardDistribution} />
        </Card>

        {/* Performance Metrics */}
        <Card className="p-6 glass-surface border border-subtle">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-primary" />
            Performance Metrics
          </h3>
          <PerformanceDetails data={performanceMetrics.performance} />
        </Card>

        {/* Project Overview */}
        <Card className="p-6 glass-surface border border-subtle">
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-primary" />
            Project Overview
          </h3>
          <ProjectOverview projects={usageStats.projects} />
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6 glass-surface border border-subtle">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Recent Study Activity
        </h3>
        <RecentActivityList data={usageStats.dailyStats.slice(-7)} />
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color,
  bgColor,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  subtitle: string;
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

function StudyProgressChart({
  data,
}: {
  data: Array<{
    study_date: string;
    new_cards_studied: number;
    reviews_completed: number;
    time_spent_seconds: number;
  }>;
}) {
  const last7Days = data.slice(-7);

  return (
    <div className="space-y-4">
      {last7Days.map((day, index) => {
        const totalCards = day.new_cards_studied + day.reviews_completed;
        const timeMinutes = Math.round(day.time_spent_seconds / 60);
        const date = new Date(day.study_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        return (
          <div key={index} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-text-muted w-12">
                {date}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Progress
                    value={Math.min((totalCards / 50) * 100, 100)}
                    className="flex-1 h-2"
                  />
                  <span className="text-sm text-text-muted">{totalCards}</span>
                </div>
              </div>
            </div>
            <span className="text-sm text-text-muted">{timeMinutes}m</span>
          </div>
        );
      })}
    </div>
  );
}

function CardDistributionChart({
  data,
}: {
  data: {
    new: number;
    learning: number;
    young: number;
    mature: number;
    suspended: number;
  };
}) {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No cards to analyze yet</p>
      </div>
    );
  }

  const categories = [
    { key: "new", label: "New", color: "bg-blue-500" },
    { key: "learning", label: "Learning", color: "bg-yellow-500" },
    { key: "young", label: "Young", color: "bg-green-500" },
    { key: "mature", label: "Mature", color: "surface-elevated" },
    { key: "suspended", label: "Suspended", color: "bg-status-muted" },
  ];

  return (
    <div className="space-y-4">
      {categories.map((category) => {
        const count = data[category.key as keyof typeof data];
        const percentage = (count / total) * 100;

        return (
          <div key={category.key} className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${category.color}`} />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-text-primary">
                  {category.label}
                </span>
                <span className="text-sm text-text-muted">
                  {count} ({Math.round(percentage)}%)
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PerformanceDetails({
  data,
}: {
  data: {
    averageEase: number;
    successRate: number;
    leechCards: number;
    totalLapses: number;
    totalRepetitions: number;
  };
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-text-muted">Average Ease</span>
        <span className="font-semibold text-text-primary">
          {data.averageEase.toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-text-muted">Success Rate</span>
        <span className="font-semibold text-brand-primary">
          {data.successRate.toFixed(1)}%
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-text-muted">Leech Cards</span>
        <span
          className={`font-semibold ${
            data.leechCards > 0 ? "text-error" : "text-success"
          }`}
        >
          {data.leechCards}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-text-muted">Total Reviews</span>
        <span className="font-semibold text-text-primary">
          {data.totalRepetitions}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-text-muted">Lapses</span>
        <span className="font-semibold text-text-primary">
          {data.totalLapses}
        </span>
      </div>
    </div>
  );
}

function ProjectOverview({
  projects,
}: {
  projects: Array<{
    id: string;
    name: string;
    created_at: string;
    flashcards: Array<{ count: number }>;
  }>;
}) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No projects created yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {projects.slice(0, 5).map((project) => (
        <div
          key={project.id}
          className="flex items-center justify-between p-3 rounded-lg glass-surface border border-subtle hover-lift transition-all duration-200"
        >
          <div>
            <h4 className="font-medium text-text-primary">{project.name}</h4>
            <p className="text-sm text-text-muted">
              Created {new Date(project.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-text-primary">
              {project.flashcards?.[0]?.count || 0}
            </div>
            <div className="text-xs text-text-muted">cards</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentActivityList({
  data,
}: {
  data: Array<{
    study_date: string;
    new_cards_studied: number;
    reviews_completed: number;
    time_spent_seconds: number;
    projects: { name: string };
  }>;
}) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No recent study activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.reverse().map((activity, index) => {
        const totalCards =
          activity.new_cards_studied + activity.reviews_completed;
        const timeMinutes = Math.round(activity.time_spent_seconds / 60);
        const date = new Date(activity.study_date);

        return (
          <div
            key={index}
            className="flex items-center justify-between p-4 rounded-lg glass-surface border border-subtle"
          >
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-sm font-medium text-text-primary">
                  {date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="text-xs text-text-muted">
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
              </div>
              <div>
                <div className="font-medium text-text-primary">
                  Studied {totalCards} cards in {activity.projects.name}
                </div>
                <div className="text-sm text-text-muted">
                  {activity.new_cards_studied} new •{" "}
                  {activity.reviews_completed} reviews
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-text-primary">
                {timeMinutes}m
              </div>
              <div className="text-xs text-text-muted">study time</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
