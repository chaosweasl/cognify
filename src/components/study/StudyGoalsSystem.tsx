"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Clock,
  Brain,
  Trophy,
  Settings,
  Save,
  RotateCcw,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Star,
  Zap,
} from "lucide-react";
import { useUserId } from "@/hooks/useUserId";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface StudyGoal {
  id: string;
  user_id: string;
  goal_type:
    | "daily_new_cards"
    | "daily_reviews"
    | "daily_time"
    | "weekly_streak"
    | "monthly_cards";
  target_value: number;
  current_value: number;
  period_start: string;
  period_end: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface StudyGoalsSystemProps {
  projectId?: string;
  className?: string;
}

export function StudyGoalsSystem({
  projectId,
  className = "",
}: StudyGoalsSystemProps) {
  const userId = useUserId();
  const supabase = createClient();

  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [dailyStats, setDailyStats] = useState({
    newCardsStudied: 0,
    reviewsCompleted: 0,
    timeSpentSeconds: 0,
    studyDays: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [goalInputs, setGoalInputs] = useState({
    dailyNewCards: 20,
    dailyReviews: 100,
    dailyTimeMinutes: 30,
    weeklyStreakDays: 5,
    monthlyCards: 500,
  });

  const createDefaultGoals = useCallback(async () => {
    if (!userId) return;

    const today = new Date();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay()); // Start of week
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

    const defaultGoals: Partial<StudyGoal>[] = [
      {
        user_id: userId,
        goal_type: "daily_new_cards",
        target_value: goalInputs.dailyNewCards,
        current_value: dailyStats.newCardsStudied,
        period_start: today.toISOString().split("T")[0],
        period_end: today.toISOString().split("T")[0],
        is_active: true,
      },
      {
        user_id: userId,
        goal_type: "daily_reviews",
        target_value: goalInputs.dailyReviews,
        current_value: dailyStats.reviewsCompleted,
        period_start: today.toISOString().split("T")[0],
        period_end: today.toISOString().split("T")[0],
        is_active: true,
      },
      {
        user_id: userId,
        goal_type: "daily_time",
        target_value: goalInputs.dailyTimeMinutes,
        current_value: Math.floor(dailyStats.timeSpentSeconds / 60),
        period_start: today.toISOString().split("T")[0],
        period_end: today.toISOString().split("T")[0],
        is_active: true,
      },
      {
        user_id: userId,
        goal_type: "weekly_streak",
        target_value: goalInputs.weeklyStreakDays,
        current_value: 0, // Streak calculation would need separate logic
        period_start: thisWeekStart.toISOString().split("T")[0],
        period_end: thisWeekEnd.toISOString().split("T")[0],
        is_active: true,
      },
      {
        user_id: userId,
        goal_type: "monthly_cards",
        target_value: goalInputs.monthlyCards,
        current_value: dailyStats.newCardsStudied + dailyStats.reviewsCompleted,
        period_start: new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .split("T")[0],
        period_end: new Date(today.getFullYear(), today.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0],
        is_active: true,
      },
    ];

    const { error } = await supabase.from("study_goals").insert(defaultGoals);

    if (error) {
      console.error("Error creating default goals:", error);
      throw error;
    }

    // Reload the page to show new goals
    window.location.reload();
  }, [userId, goalInputs, dailyStats, supabase]);

  // Load goals and current progress
  useEffect(() => {
    if (!userId) return;

    const loadGoalsAndProgress = async () => {
      try {
        setLoading(true);

        // Load existing goals
        const { data: goalsData, error: goalsError } = await supabase
          .from("study_goals")
          .select("*")
          .eq("user_id", userId)
          .eq("is_active", true);

        if (goalsError) throw goalsError;

        // Load today's stats
        const today = new Date().toISOString().split("T")[0];
        const statsQuery = supabase
          .from("daily_study_stats")
          .select("new_cards_studied, reviews_completed, time_spent_seconds")
          .eq("user_id", userId)
          .eq("study_date", today);

        if (projectId) {
          statsQuery.eq("project_id", projectId);
        }

        const { data: todayStats } = await statsQuery.single();

        // Load weekly stats for streak calculation
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 6); // Last 7 days
        const { data: weekStats } = await supabase
          .from("daily_study_stats")
          .select("study_date, new_cards_studied, reviews_completed")
          .eq("user_id", userId)
          .gte("study_date", weekStart.toISOString().split("T")[0])
          .lte("study_date", today);

        // Calculate study days this week
        const studyDays = (weekStats || []).filter(
          (stat) => stat.new_cards_studied > 0 || stat.reviews_completed > 0
        ).length;

        setDailyStats({
          newCardsStudied: todayStats?.new_cards_studied || 0,
          reviewsCompleted: todayStats?.reviews_completed || 0,
          timeSpentSeconds: todayStats?.time_spent_seconds || 0,
          studyDays,
        });

        // Set goals from database or create defaults
        if (goalsData && goalsData.length > 0) {
          setGoals(goalsData);

          // Update goal inputs with current values
          const goalsByType = goalsData.reduce((acc, goal) => {
            acc[goal.goal_type] = goal.target_value;
            return acc;
          }, {} as Record<string, number>);

          setGoalInputs({
            dailyNewCards: goalsByType.daily_new_cards || 20,
            dailyReviews: goalsByType.daily_reviews || 100,
            dailyTimeMinutes: goalsByType.daily_time || 30,
            weeklyStreakDays: goalsByType.weekly_streak || 5,
            monthlyCards: goalsByType.monthly_cards || 500,
          });
        } else {
          // Create default goals
          await createDefaultGoals();
        }
      } catch (error) {
        console.error("Error loading goals:", error);
        toast.error("Failed to load study goals");
      } finally {
        setLoading(false);
      }
    };

    loadGoalsAndProgress();
  }, [userId, supabase, projectId, createDefaultGoals]);

  /*
  const createDefaultGoals = async () => {
    if (!userId) return;

    const today = new Date();
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay()); // Start of week
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

    const defaultGoals: Partial<StudyGoal>[] = [
      {
        user_id: userId,
        goal_type: "daily_new_cards",
        target_value: goalInputs.dailyNewCards,
        current_value: dailyStats.newCardsStudied,
        period_start: today.toISOString().split("T")[0],
        period_end: today.toISOString().split("T")[0],
        is_active: true,
      },
      {
        user_id: userId,
        goal_type: "daily_reviews",
        target_value: goalInputs.dailyReviews,
        current_value: dailyStats.reviewsCompleted,
        period_start: today.toISOString().split("T")[0],
        period_end: today.toISOString().split("T")[0],
        is_active: true,
      },
      {
        user_id: userId,
        goal_type: "daily_time",
        target_value: goalInputs.dailyTimeMinutes,
        current_value: Math.round(dailyStats.timeSpentSeconds / 60),
        period_start: today.toISOString().split("T")[0],
        period_end: today.toISOString().split("T")[0],
        is_active: true,
      },
      {
        user_id: userId,
        goal_type: "weekly_streak",
        target_value: goalInputs.weeklyStreakDays,
        current_value: dailyStats.studyDays,
        period_start: thisWeekStart.toISOString().split("T")[0],
        period_end: thisWeekEnd.toISOString().split("T")[0],
        is_active: true,
      },
    ];

    try {
      const { data, error } = await supabase
        .from("study_goals")
        .insert(defaultGoals)
        .select();

      if (error) throw error;
      if (data) setGoals(data);

      toast.success("Study goals created successfully!");
    } catch (error) {
      console.error("Error creating default goals:", error);
      toast.error("Failed to create study goals");
    }
  };
  */

  const updateGoals = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const today = new Date();
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      const thisWeekEnd = new Date(thisWeekStart);
      thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

      const updatedGoals = [
        {
          goal_type: "daily_new_cards",
          target_value: goalInputs.dailyNewCards,
          period_start: today.toISOString().split("T")[0],
          period_end: today.toISOString().split("T")[0],
        },
        {
          goal_type: "daily_reviews",
          target_value: goalInputs.dailyReviews,
          period_start: today.toISOString().split("T")[0],
          period_end: today.toISOString().split("T")[0],
        },
        {
          goal_type: "daily_time",
          target_value: goalInputs.dailyTimeMinutes,
          period_start: today.toISOString().split("T")[0],
          period_end: today.toISOString().split("T")[0],
        },
        {
          goal_type: "weekly_streak",
          target_value: goalInputs.weeklyStreakDays,
          period_start: thisWeekStart.toISOString().split("T")[0],
          period_end: thisWeekEnd.toISOString().split("T")[0],
        },
      ];

      // Delete existing goals and create new ones (simpler than complex updates)
      await supabase.from("study_goals").delete().eq("user_id", userId);

      const { data, error } = await supabase
        .from("study_goals")
        .insert(
          updatedGoals.map((goal) => ({
            ...goal,
            user_id: userId,
            current_value: getCurrentValue(
              goal.goal_type as StudyGoal["goal_type"]
            ),
            is_active: true,
          }))
        )
        .select();

      if (error) throw error;
      if (data) setGoals(data);

      setEditMode(false);
      toast.success("Study goals updated successfully!");
    } catch (error) {
      console.error("Error updating goals:", error);
      toast.error("Failed to update study goals");
    } finally {
      setLoading(false);
    }
  };

  const getCurrentValue = (goalType: StudyGoal["goal_type"]) => {
    switch (goalType) {
      case "daily_new_cards":
        return dailyStats.newCardsStudied;
      case "daily_reviews":
        return dailyStats.reviewsCompleted;
      case "daily_time":
        return Math.round(dailyStats.timeSpentSeconds / 60);
      case "weekly_streak":
        return dailyStats.studyDays;
      default:
        return 0;
    }
  };

  const resetGoal = async (goalId: string) => {
    try {
      const { error } = await supabase
        .from("study_goals")
        .update({ current_value: 0 })
        .eq("id", goalId);

      if (error) throw error;

      setGoals((prev) =>
        prev.map((goal) =>
          goal.id === goalId ? { ...goal, current_value: 0 } : goal
        )
      );

      toast.success("Goal progress reset!");
    } catch (error) {
      console.error("Error resetting goal:", error);
      toast.error("Failed to reset goal");
    }
  };

  const getGoalIcon = (goalType: StudyGoal["goal_type"]) => {
    switch (goalType) {
      case "daily_new_cards":
        return <Star className="w-5 h-5" />;
      case "daily_reviews":
        return <Brain className="w-5 h-5" />;
      case "daily_time":
        return <Clock className="w-5 h-5" />;
      case "weekly_streak":
        return <Zap className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getGoalTitle = (goalType: StudyGoal["goal_type"]) => {
    switch (goalType) {
      case "daily_new_cards":
        return "Daily New Cards";
      case "daily_reviews":
        return "Daily Reviews";
      case "daily_time":
        return "Daily Study Time";
      case "weekly_streak":
        return "Weekly Study Days";
      default:
        return "Study Goal";
    }
  };

  const getGoalUnit = (goalType: StudyGoal["goal_type"]) => {
    switch (goalType) {
      case "daily_new_cards":
        return "cards";
      case "daily_reviews":
        return "reviews";
      case "daily_time":
        return "minutes";
      case "weekly_streak":
        return "days";
      default:
        return "units";
    }
  };

  if (loading) {
    return (
      <div
        className={`glass-surface border border-subtle rounded-xl p-6 ${className}`}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-subtle rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-subtle rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Target className="w-6 h-6 text-brand-primary" />
            Study Goals
          </h2>
          <p className="text-text-muted mt-1">
            Set and track your daily learning targets
          </p>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button
                onClick={updateGoals}
                className="bg-brand-primary text-primary-foreground"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Goals
              </Button>
              <Button variant="outline" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)}>
              <Settings className="w-4 h-4 mr-2" />
              Edit Goals
            </Button>
          )}
        </div>
      </div>

      {editMode ? (
        <Card className="p-6 glass-surface border border-subtle">
          <h3 className="text-lg font-semibold text-primary mb-4">
            Configure Your Goals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">
                Daily New Cards Goal
              </label>
              <Input
                type="number"
                value={goalInputs.dailyNewCards}
                onChange={(e) =>
                  setGoalInputs((prev) => ({
                    ...prev,
                    dailyNewCards: parseInt(e.target.value) || 0,
                  }))
                }
                min={1}
                max={100}
                className="w-full"
              />
              <p className="text-xs text-text-muted">
                Recommended: 10-30 cards per day
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">
                Daily Reviews Goal
              </label>
              <Input
                type="number"
                value={goalInputs.dailyReviews}
                onChange={(e) =>
                  setGoalInputs((prev) => ({
                    ...prev,
                    dailyReviews: parseInt(e.target.value) || 0,
                  }))
                }
                min={1}
                max={500}
                className="w-full"
              />
              <p className="text-xs text-text-muted">
                Recommended: 50-200 reviews per day
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">
                Daily Study Time (minutes)
              </label>
              <Input
                type="number"
                value={goalInputs.dailyTimeMinutes}
                onChange={(e) =>
                  setGoalInputs((prev) => ({
                    ...prev,
                    dailyTimeMinutes: parseInt(e.target.value) || 0,
                  }))
                }
                min={5}
                max={300}
                className="w-full"
              />
              <p className="text-xs text-text-muted">
                Recommended: 15-60 minutes per day
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">
                Weekly Study Days Goal
              </label>
              <Input
                type="number"
                value={goalInputs.weeklyStreakDays}
                onChange={(e) =>
                  setGoalInputs((prev) => ({
                    ...prev,
                    weeklyStreakDays: parseInt(e.target.value) || 0,
                  }))
                }
                min={1}
                max={7}
                className="w-full"
              />
              <p className="text-xs text-text-muted">
                Recommended: 5-7 days per week
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const progress =
              goal.target_value > 0
                ? Math.min((goal.current_value / goal.target_value) * 100, 100)
                : 0;
            const isCompleted = goal.current_value >= goal.target_value;
            const isOverdue =
              goal.current_value < goal.target_value &&
              new Date(goal.period_end) < new Date();

            return (
              <Card
                key={goal.id}
                className="p-4 glass-surface border border-subtle"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isCompleted
                          ? "bg-status-success text-primary-foreground"
                          : isOverdue
                          ? "bg-status-error text-primary-foreground"
                          : "bg-brand-primary text-primary-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isOverdue ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        getGoalIcon(goal.goal_type)
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary">
                        {getGoalTitle(goal.goal_type)}
                      </h3>
                      <p className="text-sm text-text-muted">
                        {goal.current_value} / {goal.target_value}{" "}
                        {getGoalUnit(goal.goal_type)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCompleted && (
                      <Badge variant="default" className="bg-green-500">
                        <Trophy className="w-3 h-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resetGoal(goal.id)}
                      className="w-8 h-8 p-0"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">Progress</span>
                    <span className="font-medium text-primary">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />

                  {goal.goal_type.includes("daily") && (
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>Today</span>
                      <span>
                        {new Date(goal.period_start).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {goal.goal_type.includes("weekly") && (
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>This Week</span>
                      <span>
                        {new Date(goal.period_start).toLocaleDateString()} -{" "}
                        {new Date(goal.period_end).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Stats Summary */}
      <Card className="p-4 glass-surface border border-subtle">
        <h3 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-primary" />
          Today&apos;s Progress
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-brand-primary">
              {dailyStats.newCardsStudied}
            </div>
            <div className="text-sm text-text-muted">New Cards</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold brand-primary">
              {dailyStats.reviewsCompleted}
            </div>
            <div className="text-sm text-text-muted">Reviews</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-status-success">
              {Math.round(dailyStats.timeSpentSeconds / 60)}
            </div>
            <div className="text-sm text-text-muted">Minutes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold brand-secondary">
              {dailyStats.studyDays}
            </div>
            <div className="text-sm text-text-muted">Study Days (Week)</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
