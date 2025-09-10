import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ProjectStats } from "@/src/types";
import { withApiSecurity } from "@/lib/utils/apiSecurity";

async function handleGetProjects() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json([], { status: 401 });

  // Get all projects with their settings
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select(
      `
      id, name, description, created_at, updated_at, 
      new_cards_per_day, max_reviews_per_day,
      learning_steps, relearning_steps, graduating_interval, easy_interval,
      starting_ease, minimum_ease, easy_bonus, hard_interval_factor,
      easy_interval_factor, lapse_recovery_factor, leech_threshold,
      leech_action, new_card_order, review_ahead, bury_siblings,
      max_interval, lapse_ease_penalty, category
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (projectsError || !projects) return NextResponse.json([]);

  if (projects.length === 0) {
    return NextResponse.json([]);
  }

  const projectIds = projects.map((p) => p.id);

  // Get all flashcards for all projects in one query
  const { data: flashcards } = await supabase
    .from("flashcards")
    .select("project_id")
    .in("project_id", projectIds);

  // Get all SRS states for all projects in one query
  const { data: srsStates } = await supabase
    .from("srs_states")
    .select("project_id, state, due")
    .in("project_id", projectIds);

  // Get daily study stats for today
  const today = new Date().toISOString().split("T")[0];
  const { data: dailyStats } = await supabase
    .from("daily_study_stats")
    .select("project_id, new_cards_studied, reviews_completed")
    .eq("user_id", user.id)
    .eq("study_date", today)
    .in("project_id", projectIds);

  // Calculate stats for each project
  const now = new Date().toISOString();

  const projectsWithStats = projects.map((project) => {
    const projectFlashcards =
      flashcards?.filter((f) => f.project_id === project.id) || [];
    const projectSrsStates =
      srsStates?.filter((s) => s.project_id === project.id) || [];
    const projectDailyStats = dailyStats?.find(
      (ds) => ds.project_id === project.id
    );

    const newCardsStudiedToday = projectDailyStats?.new_cards_studied || 0;
    const reviewsCompletedToday = projectDailyStats?.reviews_completed || 0;

    // Calculate stats
    const totalFlashcards = projectFlashcards.length;
    const totalNewCards = projectSrsStates.filter(
      (s) => s.state === "new"
    ).length;
    const learningCards = projectSrsStates.filter(
      (s) => s.state === "learning"
    ).length;
    const dueReviewCards = projectSrsStates.filter(
      (s) => s.due <= now && s.state !== "new"
    ).length;

    // Calculate remaining cards for today
    const remainingNewCardsToday = Math.max(
      0,
      project.new_cards_per_day - newCardsStudiedToday
    );
    const availableNewCards = Math.min(totalNewCards, remainingNewCardsToday);

    const remainingReviewsToday =
      project.max_reviews_per_day <= 0
        ? Infinity
        : Math.max(0, project.max_reviews_per_day - reviewsCompletedToday);
    const availableDueCards =
      project.max_reviews_per_day <= 0
        ? dueReviewCards
        : Math.min(dueReviewCards, remainingReviewsToday);

    const stats: ProjectStats = {
      totalFlashcards,
      totalNewCards,
      availableNewCards,
      learningCards,
      dueCards: availableDueCards,
      reviewCards: availableDueCards, // Same as dueCards for user clarity
      newCardsStudiedToday,
      reviewsCompletedToday,
    };

    return {
      ...project,
      project_type: project.category || "flashcards", // Map category to project_type with default
      flashcardCount: totalFlashcards, // Keep for backward compatibility
      stats,
    };
  });

  return NextResponse.json(projectsWithStats);
}

async function handleCreateProject(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (
      !data.name ||
      typeof data.name !== "string" ||
      data.name.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Validate project type
    const validProjectTypes = ["flashcards", "quiz", "cheatsheet"];
    if (!data.project_type || !validProjectTypes.includes(data.project_type)) {
      return NextResponse.json(
        { error: "Valid project type is required" },
        { status: 400 }
      );
    }

    // Create the project with SRS settings
    const { data: project, error } = await supabase
      .from("projects")
      .insert([
        {
          user_id: user.id,
          name: data.name.trim(),
          description: data.description?.trim() || null,
          category: data.project_type, // Using category field for project type
          // SRS settings with defaults
          new_cards_per_day: data.new_cards_per_day || 20,
          max_reviews_per_day: data.max_reviews_per_day || 100,
          learning_steps: data.learning_steps || [1, 10],
          relearning_steps: data.relearning_steps || [10],
          graduating_interval: data.graduating_interval || 1,
          easy_interval: data.easy_interval || 4,
          starting_ease: data.starting_ease || 2.5,
          minimum_ease: data.minimum_ease || 1.3,
          easy_bonus: data.easy_bonus || 1.3,
          hard_interval_factor: data.hard_interval_factor || 1.2,
          easy_interval_factor: data.easy_interval_factor || 1.3,
          lapse_recovery_factor: data.lapse_recovery_factor || 0.5,
          leech_threshold: data.leech_threshold || 8,
          leech_action: data.leech_action || "suspend",
          new_card_order: data.new_card_order || "random",
          review_ahead: data.review_ahead || false,
          bury_siblings: data.bury_siblings || false,
          max_interval: data.max_interval || 36500,
          lapse_ease_penalty: data.lapse_ease_penalty || 0.2,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Database error creating project:", error);
      return NextResponse.json(
        { error: "Failed to create project" },
        { status: 500 }
      );
    }

    // Invalidate cache for project lists and stats after creation
    try {
      // Dynamically import cache invalidation utility (only on server)
      const { CacheInvalidation } = await import("@/hooks/useCache");
      // The projects list cache key is 'user_projects' (see hooks/useProjects.ts)
      CacheInvalidation.invalidate("user_projects");
      CacheInvalidation.invalidatePattern("project_stats_");
    } catch (e) {
      // Log but don't block creation if cache invalidation fails
      console.warn("[API] Cache invalidation failed after project creation", e);
    }
    return NextResponse.json({
      id: project.id,
      name: project.name,
      message: "Project created successfully",
    });
  } catch (error) {
    console.error("API Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

// Apply security middleware to all endpoints
export const GET = withApiSecurity(
  async () => {
    return handleGetProjects();
  },
  {
    requireAuth: true,
    rateLimit: { requests: 60, window: 60 },
    allowedMethods: ["GET"],
  }
);

export const POST = withApiSecurity(
  async (request: NextRequest) => {
    return handleCreateProject(request);
  },
  {
    requireAuth: true,
    rateLimit: { requests: 30, window: 60 },
    allowedMethods: ["POST"],
    validateInput: "project",
  }
);
