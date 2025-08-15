import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ProjectStats } from "@/src/types";

// GET /api/projects/batch-stats
// Returns stats for all user's projects in a single API call
export async function GET() {
  console.log("[API] /api/projects/batch-stats called");
  
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log("[API] batch-stats - User not authenticated:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`[API] batch-stats - Fetching stats for user: ${user.id}`);

    // Get all projects for the user (including per-project daily limits)
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, name, description, created_at, user_id, new_cards_per_day, max_reviews_per_day")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (projectsError || !projects) {
      console.log("[API] batch-stats - Error fetching projects:", projectsError);
      return NextResponse.json(
        { error: "Failed to fetch projects" },
        { status: 500 }
      );
    }

    // Get all flashcards for all projects in one query
    const projectIds = projects.map(p => p.id);
    console.log(`[API] batch-stats - Fetching flashcards for project IDs:`, projectIds);
    
    const { data: flashcards } = await supabase
      .from("flashcards")
      .select("project_id")
      .in("project_id", projectIds);
      
    console.log(`[API] batch-stats - Found ${flashcards?.length || 0} flashcards total`);

    // Get all SRS states for all projects in one query
    const { data: srsStates } = await supabase
      .from("srs_states")
      .select("project_id, state, due")
      .in("project_id", projectIds);
      
    console.log(`[API] batch-stats - Found ${srsStates?.length || 0} SRS states total`);

    // Get per-project daily study stats for today
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    const { data: dailyStats } = await supabase
      .from("daily_study_stats")
      .select("project_id, new_cards_studied, reviews_completed")
      .eq("user_id", user.id)
      .eq("study_date", today)
      .in("project_id", projectIds);
      
    console.log(`[API] batch-stats - Found ${dailyStats?.length || 0} daily stats records for today`);

    // Calculate stats for each project with per-project daily limits
    const now = new Date().toISOString();
    const projectStats: Record<string, ProjectStats> = {};

    projects.forEach(project => {
      const projectFlashcards = flashcards?.filter(f => f.project_id === project.id) || [];
      const projectSrsStates = srsStates?.filter(s => s.project_id === project.id) || [];
      
      // Get today's study stats for this project
      const projectDailyStats = dailyStats?.find(ds => ds.project_id === project.id);
      const newCardsStudiedToday = projectDailyStats?.new_cards_studied || 0;
      const reviewsCompletedToday = projectDailyStats?.reviews_completed || 0;

      // Calculate new cards (cards that haven't been studied yet)
      const totalNewCards = projectSrsStates.filter(s => s.state === "new").length;
      
      // Calculate remaining new cards available today based on per-project limit
      const remainingNewCardsToday = Math.max(0, project.new_cards_per_day - newCardsStudiedToday);
      const availableNewCards = Math.min(totalNewCards, remainingNewCardsToday);
      
      // Calculate learning cards (cards currently in learning phase)
      const learningCardsCount = projectSrsStates.filter(s => s.state === "learning").length;
      
      // Calculate due review cards (cards that need to be reviewed now, excluding new cards)
      const totalDueReviewCards = projectSrsStates.filter(s => s.due <= now && s.state !== "new").length;
      
      // Calculate remaining review cards available today based on per-project limit
      const remainingReviewsToday = project.max_reviews_per_day <= 0 
        ? Infinity 
        : Math.max(0, project.max_reviews_per_day - reviewsCompletedToday);
      const availableDueCards = project.max_reviews_per_day <= 0 
        ? totalDueReviewCards 
        : Math.min(totalDueReviewCards, remainingReviewsToday);
      
      projectStats[project.id] = {
        totalCards: projectFlashcards.length,
        newCards: availableNewCards, // Show available new cards, not total
        learningCards: learningCardsCount,
        dueCards: availableDueCards, // Show available due cards, not total
        // Additional metadata for debugging
        _metadata: {
          totalNewCards,
          totalDueReviewCards,
          newCardsStudiedToday,
          reviewsCompletedToday,
          newCardsPerDay: project.new_cards_per_day,
          maxReviewsPerDay: project.max_reviews_per_day,
        }
      };
      
      console.log(`[API] batch-stats - Project ${project.id} (${project.name}):`, {
        flashcards: projectFlashcards.length,
        srsStates: projectSrsStates.length,
        dailyLimits: {
          newCardsPerDay: project.new_cards_per_day,
          maxReviewsPerDay: project.max_reviews_per_day,
          studiedToday: { newCards: newCardsStudiedToday, reviews: reviewsCompletedToday }
        },
        stats: projectStats[project.id]
      });
    });

    console.log(`[API] batch-stats - Successfully calculated stats for ${projects.length} projects`);

    return NextResponse.json({
      projects: projects.map(project => ({
        ...project,
        stats: projectStats[project.id]
      }))
    });

  } catch (error) {
    console.error("[API] batch-stats - Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}