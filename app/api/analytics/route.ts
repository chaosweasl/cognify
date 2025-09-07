/**
 * Analytics API Routes
 * General analytics endpoint for various data queries
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withApiSecurity } from "@/lib/utils/apiSecurity";

async function handleGetUsageStats(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get("days") || "30");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user's study statistics
    const { data: dailyStats } = await supabase
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
        projects(name)
      `
      )
      .eq("user_id", user.id)
      .gte("study_date", startDate.toISOString().split("T")[0])
      .order("study_date", { ascending: true });

    // Get user's projects with stats
    const { data: projects } = await supabase
      .from("projects")
      .select(
        `
        id,
        name,
        created_at,
        updated_at,
        flashcards(count),
        srs_states(state, ease_factor)
      `
      )
      .eq("user_id", user.id);

    // Calculate aggregated statistics
    const totalTimeStudied =
      dailyStats?.reduce((sum, stat) => sum + stat.time_spent_seconds, 0) || 0;
    const totalCardsStudied =
      dailyStats?.reduce(
        (sum, stat) => sum + stat.new_cards_studied + stat.reviews_completed,
        0
      ) || 0;
    const totalCardsLearned =
      dailyStats?.reduce((sum, stat) => sum + stat.cards_learned, 0) || 0;
    const totalCardsLapsed =
      dailyStats?.reduce((sum, stat) => sum + stat.cards_lapsed, 0) || 0;

    const retentionRate =
      totalCardsLearned + totalCardsLapsed > 0
        ? (totalCardsLearned / (totalCardsLearned + totalCardsLapsed)) * 100
        : 100;

    const studyStreak = calculateStudyStreak(dailyStats || []);

    return NextResponse.json({
      summary: {
        totalTimeStudied: Math.round(totalTimeStudied / 60), // Convert to minutes
        totalCardsStudied,
        totalCardsLearned,
        retentionRate: Math.round(retentionRate * 100) / 100,
        studyStreak,
        activeProjects: projects?.length || 0,
      },
      dailyStats: dailyStats || [],
      projects: projects || [],
      timeframe: `${days} days`,
    });
  } catch (error) {
    console.error("Failed to get usage stats:", error);
    return NextResponse.json(
      { error: "Failed to retrieve usage statistics" },
      { status: 500 }
    );
  }
}

async function handleGetPerformanceMetrics() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get SRS performance data
    const { data: srsStates } = await supabase
      .from("srs_states")
      .select(
        `
        state,
        card_interval,
        ease,
        repetitions,
        lapses,
        is_leech,
        projects(name)
      `
      )
      .eq("user_id", user.id);

    // Calculate performance metrics
    const avgEase =
      srsStates && srsStates.length > 0
        ? srsStates.reduce((sum, state) => sum + state.ease, 0) /
          srsStates.length
        : 2.5;

    const leechCards = srsStates?.filter((state) => state.is_leech).length || 0;
    const matureCards =
      srsStates?.filter((state) => state.card_interval >= 21).length || 0;
    const youngCards =
      srsStates?.filter(
        (state) => state.card_interval >= 1 && state.card_interval < 21
      ).length || 0;
    const learningCards =
      srsStates?.filter((state) => state.state === "learning").length || 0;

    const totalLapses =
      srsStates?.reduce((sum, state) => sum + state.lapses, 0) || 0;
    const totalRepetitions =
      srsStates?.reduce((sum, state) => sum + state.repetitions, 0) || 0;

    const successRate =
      totalRepetitions > 0
        ? ((totalRepetitions - totalLapses) / totalRepetitions) * 100
        : 100;

    return NextResponse.json({
      cardDistribution: {
        new: srsStates?.filter((state) => state.state === "new").length || 0,
        learning: learningCards,
        young: youngCards,
        mature: matureCards,
        suspended:
          srsStates?.filter((state) => state.state === "suspended").length || 0,
      },
      performance: {
        averageEase: Math.round(avgEase * 100) / 100,
        successRate: Math.round(successRate * 100) / 100,
        leechCards,
        totalLapses,
        totalRepetitions,
      },
    });
  } catch (error) {
    console.error("Failed to get performance metrics:", error);
    return NextResponse.json(
      { error: "Failed to retrieve performance metrics" },
      { status: 500 }
    );
  }
}

function calculateStudyStreak(
  dailyStats: Array<{
    study_date: string;
    new_cards_studied: number;
    reviews_completed: number;
  }>
): number {
  if (!dailyStats || dailyStats.length === 0) return 0;

  const sortedStats = dailyStats
    .sort(
      (a, b) =>
        new Date(b.study_date).getTime() - new Date(a.study_date).getTime()
    )
    .filter((stat) => stat.new_cards_studied > 0 || stat.reviews_completed > 0);

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const stat of sortedStats) {
    const statDate = new Date(stat.study_date);
    statDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - streak);

    if (statDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Route handlers with security
export const GET = withApiSecurity(
  async (request: NextRequest) => {
    const url = new URL(request.url);
    const type = url.searchParams.get("type");

    switch (type) {
      case "usage":
        return handleGetUsageStats(request);
      case "performance":
        return handleGetPerformanceMetrics();
      default:
        return NextResponse.json(
          { error: "Invalid analytics type" },
          { status: 400 }
        );
    }
  },
  {
    requireAuth: true,
    rateLimit: { requests: 30, window: 60 },
    allowedMethods: ["GET"],
  }
);
