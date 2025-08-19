import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ProjectStats } from "@/src/types";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json([]);

  // Get all projects with their settings
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select(`
      id, name, description, created_at, updated_at, 
      new_cards_per_day, max_reviews_per_day,
      learning_steps, relearning_steps, graduating_interval, easy_interval,
      starting_ease, minimum_ease, easy_bonus, hard_interval_factor,
      easy_interval_factor, lapse_recovery_factor, leech_threshold,
      leech_action, new_card_order, review_ahead, bury_siblings,
      max_interval, lapse_ease_penalty
    `)
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
    const projectFlashcards = flashcards?.filter(f => f.project_id === project.id) || [];
    const projectSrsStates = srsStates?.filter(s => s.project_id === project.id) || [];
    const projectDailyStats = dailyStats?.find(ds => ds.project_id === project.id);
    
    const newCardsStudiedToday = projectDailyStats?.new_cards_studied || 0;
    const reviewsCompletedToday = projectDailyStats?.reviews_completed || 0;

    // Calculate stats
    const totalFlashcards = projectFlashcards.length;
    const totalNewCards = projectSrsStates.filter(s => s.state === "new").length;
    const learningCards = projectSrsStates.filter(s => s.state === "learning").length;
    const dueReviewCards = projectSrsStates.filter(s => s.due <= now && s.state !== "new").length;
    
    // Calculate remaining cards for today
    const remainingNewCardsToday = Math.max(0, project.new_cards_per_day - newCardsStudiedToday);
    const availableNewCards = Math.min(totalNewCards, remainingNewCardsToday);
    
    const remainingReviewsToday = project.max_reviews_per_day <= 0 
      ? Infinity 
      : Math.max(0, project.max_reviews_per_day - reviewsCompletedToday);
    const availableDueCards = project.max_reviews_per_day <= 0 
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
      flashcardCount: totalFlashcards, // Keep for backward compatibility
      stats,
    };
  });

  return NextResponse.json(projectsWithStats);
}
