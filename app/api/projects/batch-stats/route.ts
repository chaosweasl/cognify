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

    // Get all projects for the user
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, name, description, created_at, user_id")
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

    // Calculate stats for each project
    const now = new Date().toISOString();
    const projectStats: Record<string, ProjectStats> = {};

    projects.forEach(project => {
      const projectFlashcards = flashcards?.filter(f => f.project_id === project.id) || [];
      const projectSrsStates = srsStates?.filter(s => s.project_id === project.id) || [];

      // Calculate new cards (cards that haven't been studied yet)
      const newCardsCount = projectSrsStates.filter(s => s.state === "new").length;
      
      // Calculate learning cards (cards currently in learning phase)
      const learningCardsCount = projectSrsStates.filter(s => s.state === "learning").length;
      
      // Calculate due cards (ALL cards that need to be reviewed now, including new cards)
      const dueCardsCount = projectSrsStates.filter(s => s.due <= now).length;
      
      projectStats[project.id] = {
        totalCards: projectFlashcards.length,
        newCards: newCardsCount,
        learningCards: learningCardsCount,
        reviewCards: dueCardsCount, // For user clarity: review cards = due cards (includes new cards)
        dueCards: dueCardsCount,
      };
      
      console.log(`[API] batch-stats - Project ${project.id} (${project.name}):`, {
        flashcards: projectFlashcards.length,
        srsStates: projectSrsStates.length,
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