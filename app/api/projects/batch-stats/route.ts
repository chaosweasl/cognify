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
    const { data: flashcards } = await supabase
      .from("flashcards")
      .select("project_id")
      .in("project_id", projectIds);

    // Get all SRS states for all projects in one query
    const { data: srsStates } = await supabase
      .from("srs_states")
      .select("project_id, state, due")
      .in("project_id", projectIds);

    // Calculate stats for each project
    const now = new Date().toISOString();
    const projectStats: Record<string, ProjectStats> = {};

    projects.forEach(project => {
      const projectFlashcards = flashcards?.filter(f => f.project_id === project.id) || [];
      const projectSrsStates = srsStates?.filter(s => s.project_id === project.id) || [];

      projectStats[project.id] = {
        totalCards: projectFlashcards.length,
        newCards: projectSrsStates.filter(s => s.state === "new").length,
        learningCards: projectSrsStates.filter(s => s.state === "learning").length,
        reviewCards: projectSrsStates.filter(s => s.state === "review").length,
        dueCards: projectSrsStates.filter(s => s.due <= now && s.state !== "new").length,
      };
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