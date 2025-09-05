"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Clock,
  Target,
  Award,
  RefreshCw,
  Brain,
  Zap,
  AlertCircle,
  Star,
} from "lucide-react";
import { useUserId } from "@/hooks/useUserId";
import { createClient } from "@/lib/supabase/client";

interface DailyStats {
  study_date: string;
  new_cards_studied: number;
  reviews_completed: number;
  time_spent_seconds: number;
  cards_learned: number;
  cards_lapsed: number;
  project_id?: string;
  project_name?: string;
}

interface StudyStreak {
  current: number;
  longest: number;
  lastStudyDate: string | null;
}

interface ProjectStats {
  project_id: string;
  project_name: string;
  total_flashcards: number;
  due_cards: number;
  learning_cards: number;
  new_cards: number;
  mature_cards: number;
  total_studies: number;
  avg_ease: number;
  retention_rate: number;
}

interface StudyStatsDashboardProps {
  projectId?: string;
  className?: string;
}

export function StudyStatsDashboard({
  projectId,
  className = "",
}: StudyStatsDashboardProps) {
  const userId = useUserId();
  const supabase = createClient();

  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [studyStreak, setStudyStreak] = useState<StudyStreak>({
    current: 0,
    longest: 0,
    lastStudyDate: null,
  });
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">(
    "month"
  );

  // Load stats data
  useEffect(() => {
    if (!userId) return;

    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date(endDate);
        if (timeRange === "week") {
          startDate.setDate(startDate.getDate() - 7);
        } else if (timeRange === "month") {
          startDate.setDate(startDate.getDate() - 30);
        } else {
          startDate.setFullYear(startDate.getFullYear() - 1);
        }

        // Load daily stats
        const dailyStatsQuery = supabase
          .from("daily_study_stats")
          .select(
            `
            study_date,
            new_cards_studied,
            reviews_completed,
            time_spent_seconds,
            cards_learned,
            cards_lapsed,
            project_id,
            projects!inner(name)
          `
          )
          .eq("user_id", userId)
          .gte("study_date", startDate.toISOString().split("T")[0])
          .lte("study_date", endDate.toISOString().split("T")[0])
          .order("study_date", { ascending: true });

        if (projectId) {
          dailyStatsQuery.eq("project_id", projectId);
        }

        const { data: dailyData, error: dailyError } = await dailyStatsQuery;

        if (dailyError) throw dailyError;

        // Transform data to include project names
        const transformedDailyStats: DailyStats[] = (dailyData || []).map(
          (stat) => ({
            study_date: stat.study_date,
            new_cards_studied: stat.new_cards_studied,
            reviews_completed: stat.reviews_completed,
            time_spent_seconds: stat.time_spent_seconds,
            cards_learned: stat.cards_learned,
            cards_lapsed: stat.cards_lapsed,
            project_id: stat.project_id,
            project_name:
              (stat.projects as unknown as { name: string } | null)?.name ||
              "Unknown Project",
          })
        );

        setDailyStats(transformedDailyStats);

        // Calculate study streak
        const allStats = await supabase
          .from("daily_study_stats")
          .select("study_date, new_cards_studied, reviews_completed")
          .eq("user_id", userId)
          .order("study_date", { ascending: false });

        if (allStats.data) {
          calculateStudyStreak(allStats.data);
        }

        // Load project stats if not filtering by specific project
        if (!projectId) {
          const { data: projectData, error: projectError } = await supabase
            .from("projects")
            .select(
              `
              id,
              name,
              flashcards(count),
              srs_states(state, ease_factor)
            `
            )
            .eq("user_id", userId);

          if (!projectError && projectData) {
            const statsWithCounts: ProjectStats[] = projectData.map(
              (project) => {
                const srsStates =
                  (project.srs_states as Array<{
                    state: string;
                    ease_factor: number;
                    due: string;
                  }>) || [];
                const totalFlashcards =
                  (project.flashcards as Array<{ count: number }>)?.[0]
                    ?.count || 0;

                const newCards = srsStates.filter(
                  (s) => s.state === "new"
                ).length;
                const learningCards = srsStates.filter(
                  (s) => s.state === "learning" || s.state === "relearning"
                ).length;
                const reviewCards = srsStates.filter(
                  (s) => s.state === "review"
                ).length;
                const dueCards = srsStates.filter(
                  (s) => s.state !== "new" && new Date(s.due) <= new Date()
                ).length;

                const avgEase =
                  srsStates.length > 0
                    ? srsStates.reduce(
                        (sum, s) => sum + (s.ease_factor || 2.5),
                        0
                      ) / srsStates.length
                    : 2.5;

                const totalStudies = transformedDailyStats
                  .filter((stat) => stat.project_id === project.id)
                  .reduce((sum, stat) => sum + stat.reviews_completed, 0);

                const retentionRate =
                  srsStates.length > 0
                    ? (reviewCards / Math.max(reviewCards + learningCards, 1)) *
                      100
                    : 100;

                return {
                  project_id: project.id,
                  project_name: project.name,
                  total_flashcards: totalFlashcards,
                  due_cards: dueCards,
                  learning_cards: learningCards,
                  new_cards: newCards,
                  mature_cards: reviewCards,
                  total_studies: totalStudies,
                  avg_ease: avgEase,
                  retention_rate: retentionRate,
                };
              }
            );

            setProjectStats(statsWithCounts);
          }
        }
      } catch (err) {
        console.error("Error loading study stats:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load statistics"
        );
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [userId, supabase, timeRange, projectId]);

  const calculateStudyStreak = (
    stats: Array<{
      study_date: string;
      new_cards_studied: number;
      reviews_completed: number;
    }>
  ) => {
    if (stats.length === 0) {
      setStudyStreak({ current: 0, longest: 0, lastStudyDate: null });
      return;
    }

    // Sort by date (most recent first)
    const sortedStats = stats.sort(
      (a, b) =>
        new Date(b.study_date).getTime() - new Date(a.study_date).getTime()
    );

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const today = new Date().toISOString().split("T")[0];
    const checkDate = new Date();

    // Check current streak
    for (const stat of sortedStats) {
      const statDate = stat.study_date;
      const expectedDate = checkDate.toISOString().split("T")[0];

      if (
        statDate === expectedDate &&
        (stat.new_cards_studied > 0 || stat.reviews_completed > 0)
      ) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (statDate === today) {
        // Today's study hasn't happened yet, continue checking
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      } else {
        break;
      }
    }

    // Calculate longest streak
    for (let i = 0; i < sortedStats.length; i++) {
      if (
        sortedStats[i].new_cards_studied > 0 ||
        sortedStats[i].reviews_completed > 0
      ) {
        tempStreak = 1;
        for (let j = i + 1; j < sortedStats.length; j++) {
          const currentDate = new Date(sortedStats[j - 1].study_date);
          const nextDate = new Date(sortedStats[j].study_date);
          const dayDiff =
            (currentDate.getTime() - nextDate.getTime()) / (1000 * 3600 * 24);

          if (
            dayDiff === 1 &&
            (sortedStats[j].new_cards_studied > 0 ||
              sortedStats[j].reviews_completed > 0)
          ) {
            tempStreak++;
          } else {
            break;
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak);
        i += tempStreak - 1; // Skip the days we've already counted
      }
    }

    setStudyStreak({
      current: currentStreak,
      longest: longestStreak,
      lastStudyDate: sortedStats[0]?.study_date || null,
    });
  };

  // Calculate aggregated stats
  const aggregatedStats = useMemo(() => {
    const totalNewCards = dailyStats.reduce(
      (sum, stat) => sum + stat.new_cards_studied,
      0
    );
    const totalReviews = dailyStats.reduce(
      (sum, stat) => sum + stat.reviews_completed,
      0
    );
    const totalTimeSeconds = dailyStats.reduce(
      (sum, stat) => sum + stat.time_spent_seconds,
      0
    );
    const totalLearned = dailyStats.reduce(
      (sum, stat) => sum + stat.cards_learned,
      0
    );
    const totalLapsed = dailyStats.reduce(
      (sum, stat) => sum + stat.cards_lapsed,
      0
    );

    const avgStudyTime =
      dailyStats.length > 0 ? totalTimeSeconds / dailyStats.length : 0;
    const retentionRate =
      totalLearned + totalLapsed > 0
        ? (totalLearned / (totalLearned + totalLapsed)) * 100
        : 100;

    return {
      totalNewCards,
      totalReviews,
      totalTimeSeconds,
      totalLearned,
      totalLapsed,
      avgStudyTime,
      retentionRate,
      studyDays: dailyStats.filter(
        (stat) => stat.new_cards_studied > 0 || stat.reviews_completed > 0
      ).length,
    };
  }, [dailyStats]);

  if (loading) {
    return (
      <div
        className={`glass-surface border border-subtle rounded-xl p-6 ${className}`}
      >
        <div className="flex items-center justify-center h-32">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-primary" />
          <span className="ml-2 text-text-muted">Loading statistics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`glass-surface border border-subtle rounded-xl p-6 ${className}`}
      >
        <div className="flex items-center justify-center h-32 text-red-500">
          <AlertCircle className="w-8 h-8 mr-2" />
          <span>Error loading statistics: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Tabs
        value={timeRange}
        onValueChange={(value) =>
          setTimeRange(value as "week" | "month" | "year")
        }
        className="w-full"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-brand-primary" />
              Study Statistics
            </h2>
            <p className="text-text-muted mt-1">
              Track your learning progress and performance
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 glass-surface border border-subtle">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-muted text-sm">Study Streak</p>
                <p className="text-2xl font-bold text-primary">
                  {studyStreak.current}
                </p>
                <p className="text-xs text-text-muted">days</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-4 glass-surface border border-subtle">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-muted text-sm">Cards Studied</p>
                <p className="text-2xl font-bold text-primary">
                  {aggregatedStats.totalReviews}
                </p>
                <p className="text-xs text-text-muted">reviews</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-4 glass-surface border border-subtle">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-muted text-sm">Study Time</p>
                <p className="text-2xl font-bold text-primary">
                  {Math.round(aggregatedStats.totalTimeSeconds / 60)}
                </p>
                <p className="text-xs text-text-muted">minutes</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-400 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-4 glass-surface border border-subtle">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-muted text-sm">Retention</p>
                <p className="text-2xl font-bold text-primary">
                  {Math.round(aggregatedStats.retentionRate)}%
                </p>
                <p className="text-xs text-text-muted">accuracy</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-400 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
            </div>
          </Card>
        </div>

        <TabsContent value="week">
          <DailyProgressChart data={dailyStats.slice(-7)} />
        </TabsContent>

        <TabsContent value="month">
          <DailyProgressChart data={dailyStats.slice(-30)} />
        </TabsContent>

        <TabsContent value="year">
          <MonthlyProgressChart data={dailyStats} />
        </TabsContent>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Streak Information */}
          <Card className="p-6 glass-surface border border-subtle">
            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-primary" />
              Study Streaks
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-text-muted">Current Streak</span>
                  <span className="font-bold text-primary">
                    {studyStreak.current} days
                  </span>
                </div>
                <Progress
                  value={Math.min(
                    (studyStreak.current / Math.max(studyStreak.longest, 1)) *
                      100,
                    100
                  )}
                  className="h-2"
                />
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Longest Streak</span>
                  <span className="font-bold text-primary">
                    {studyStreak.longest} days
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Study Days</span>
                  <span className="font-bold text-primary">
                    {aggregatedStats.studyDays} / {dailyStats.length}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Performance Metrics */}
          <Card className="p-6 glass-surface border border-subtle">
            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-primary" />
              Performance
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-text-muted">Avg Study Time</span>
                  <span className="font-bold text-primary">
                    {Math.round(aggregatedStats.avgStudyTime / 60)} min/day
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-text-muted">Cards per Day</span>
                  <span className="font-bold text-primary">
                    {Math.round(
                      aggregatedStats.totalReviews /
                        Math.max(aggregatedStats.studyDays, 1)
                    )}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-text-muted">Retention Rate</span>
                  <span className="font-bold text-primary">
                    {Math.round(aggregatedStats.retentionRate)}%
                  </span>
                </div>
                <Progress
                  value={aggregatedStats.retentionRate}
                  className="h-2"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Project Stats (if not filtering by project) */}
        {!projectId && projectStats.length > 0 && (
          <Card className="p-6 glass-surface border border-subtle">
            <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-brand-primary" />
              Project Performance
            </h3>
            <div className="space-y-4">
              {projectStats.map((project) => (
                <div
                  key={project.project_id}
                  className="p-4 surface-elevated border border-subtle rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-primary">
                      {project.project_name}
                    </h4>
                    <span className="text-sm text-text-muted">
                      {project.total_studies} studies
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-text-muted">Due:</span>
                      <span className="ml-1 font-medium text-primary">
                        {project.due_cards}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted">Learning:</span>
                      <span className="ml-1 font-medium text-primary">
                        {project.learning_cards}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted">Mature:</span>
                      <span className="ml-1 font-medium text-primary">
                        {project.mature_cards}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted">Retention:</span>
                      <span className="ml-1 font-medium text-primary">
                        {Math.round(project.retention_rate)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </Tabs>
    </div>
  );
}

// Simple chart components for progress visualization
function DailyProgressChart({ data }: { data: DailyStats[] }) {
  const maxCards = Math.max(
    ...data.map((d) => d.new_cards_studied + d.reviews_completed),
    1
  );

  return (
    <Card className="p-6 glass-surface border border-subtle">
      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-brand-primary" />
        Daily Progress
      </h3>
      <div className="space-y-3">
        {data.map((day) => {
          const totalCards = day.new_cards_studied + day.reviews_completed;
          const progress = maxCards > 0 ? (totalCards / maxCards) * 100 : 0;

          return (
            <div key={day.study_date} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted">
                  {new Date(day.study_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="flex gap-4">
                  <span className="text-primary">
                    <span className="text-green-500">
                      {day.new_cards_studied}
                    </span>{" "}
                    new
                  </span>
                  <span className="text-primary">
                    <span className="text-blue-500">
                      {day.reviews_completed}
                    </span>{" "}
                    reviews
                  </span>
                  <span className="text-text-muted">
                    {Math.round(day.time_spent_seconds / 60)}m
                  </span>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function MonthlyProgressChart({ data }: { data: DailyStats[] }) {
  // Group data by month
  const monthlyData = data.reduce(
    (acc, day) => {
      const month = new Date(day.study_date).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = {
          month,
          new_cards_studied: 0,
          reviews_completed: 0,
          time_spent_seconds: 0,
          study_days: 0,
        };
      }
      acc[month].new_cards_studied += day.new_cards_studied;
      acc[month].reviews_completed += day.reviews_completed;
      acc[month].time_spent_seconds += day.time_spent_seconds;
      if (day.new_cards_studied > 0 || day.reviews_completed > 0) {
        acc[month].study_days += 1;
      }
      return acc;
    },
    {} as Record<
      string,
      {
        month: string;
        new_cards_studied: number;
        reviews_completed: number;
        time_spent_seconds: number;
        study_days: number;
      }
    >
  );

  const months = Object.values(monthlyData).sort((a, b) =>
    a.month.localeCompare(b.month)
  );
  const maxCards = Math.max(
    ...months.map((m) => m.new_cards_studied + m.reviews_completed),
    1
  );

  return (
    <Card className="p-6 glass-surface border border-subtle">
      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-brand-primary" />
        Monthly Progress
      </h3>
      <div className="space-y-4">
        {months.map((month) => {
          const totalCards = month.new_cards_studied + month.reviews_completed;
          const progress = maxCards > 0 ? (totalCards / maxCards) * 100 : 0;

          return (
            <div key={month.month} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted">
                  {new Date(month.month + "-01").toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  })}
                </span>
                <div className="flex gap-4">
                  <span className="text-primary">
                    <span className="text-green-500">
                      {month.new_cards_studied}
                    </span>{" "}
                    new
                  </span>
                  <span className="text-primary">
                    <span className="text-blue-500">
                      {month.reviews_completed}
                    </span>{" "}
                    reviews
                  </span>
                  <span className="text-text-muted">
                    {month.study_days} days
                  </span>
                  <span className="text-text-muted">
                    {Math.round(month.time_spent_seconds / 3600)}h
                  </span>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
