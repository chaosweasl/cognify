import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Types for SRS states from database
interface SRSState {
  card_id: string;
  state: string;
  due: string;
  is_suspended: boolean;
}

// GET /api/projects/batch-stats - Get stats for all user's projects in one request
export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[BatchStats] Getting batch stats for user:", user.id);

    // Get all projects for this user
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, name")
      .eq("user_id", user.id);

    if (projectsError) {
      console.error("[BatchStats] Error fetching projects:", projectsError);
      return NextResponse.json(
        { error: "Failed to fetch projects" },
        { status: 500 }
      );
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({});
    }

    const projectIds = projects.map((p) => p.id);
    console.log(`[BatchStats] Processing ${projectIds.length} projects`);

    // Get all flashcards for all projects in one query
    const { data: allFlashcards, error: flashcardsError } = await supabase
      .from("flashcards")
      .select("id, project_id")
      .in("project_id", projectIds);

    if (flashcardsError) {
      console.error("[BatchStats] Error fetching flashcards:", flashcardsError);
      return NextResponse.json(
        { error: "Failed to fetch flashcards" },
        { status: 500 }
      );
    }

    // Group flashcards by project
    const flashcardsByProject: Record<string, string[]> = {};
    const allFlashcardIds: string[] = [];

    if (allFlashcards) {
      allFlashcards.forEach((flashcard) => {
        if (!flashcardsByProject[flashcard.project_id]) {
          flashcardsByProject[flashcard.project_id] = [];
        }
        flashcardsByProject[flashcard.project_id].push(flashcard.id);
        allFlashcardIds.push(flashcard.id);
      });
    }

    // Get all SRS states for all flashcards in one query
    let allSrsStates: SRSState[] = [];
    if (allFlashcardIds.length > 0) {
      const { data: srsStates, error: srsError } = await supabase
        .from("srs_states")
        .select("card_id, state, due, is_suspended")
        .eq("user_id", user.id)
        .in("card_id", allFlashcardIds);

      if (srsError) {
        console.error("[BatchStats] Error fetching SRS states:", srsError);
        return NextResponse.json(
          { error: "Failed to fetch SRS states" },
          { status: 500 }
        );
      }

      allSrsStates = srsStates || [];
    }

    // Group SRS states by project
    const srsStatesByProject: Record<string, SRSState[]> = {};
    allSrsStates.forEach((state) => {
      // Find which project this flashcard belongs to
      const projectId = Object.keys(flashcardsByProject).find((pid) =>
        flashcardsByProject[pid].includes(state.card_id)
      );

      if (projectId) {
        if (!srsStatesByProject[projectId]) {
          srsStatesByProject[projectId] = [];
        }
        srsStatesByProject[projectId].push(state);
      }
    });

    // Calculate stats for each project
    const now = new Date();
    const statsMap: Record<
      string,
      {
        dueCards: number;
        newCards: number;
        learningCards: number;
        totalCards: number;
      }
    > = {};

    projects.forEach((project) => {
      const projectId = project.id;
      const flashcardIds = flashcardsByProject[projectId] || [];
      const srsStates = srsStatesByProject[projectId] || [];

      let dueCards = 0;
      let newCards = 0;
      let learningCards = 0;

      if (flashcardIds.length === 0) {
        // No flashcards for this project
        statsMap[projectId] = {
          dueCards: 0,
          newCards: 0,
          learningCards: 0,
          totalCards: 0,
        };
        return;
      }

      // Count cards with no SRS state as new
      const cardsWithStates = new Set(srsStates.map((s) => s.card_id));
      const newCardsCount = flashcardIds.filter(
        (id) => !cardsWithStates.has(id)
      ).length;
      newCards += newCardsCount;

      // Process existing SRS states
      srsStates.forEach((state) => {
        if (state.is_suspended) return;

        const dueDate = new Date(state.due);

        if (state.state === "new") {
          newCards++;
        } else if (state.state === "learning" || state.state === "relearning") {
          learningCards++;
          if (dueDate <= now) {
            dueCards++;
          }
        } else if (state.state === "review" && dueDate <= now) {
          dueCards++;
        }
      });

      statsMap[projectId] = {
        dueCards,
        newCards,
        learningCards,
        totalCards: flashcardIds.length,
      };
    });

    console.log(
      `[BatchStats] Processed stats for ${
        Object.keys(statsMap).length
      } projects`
    );
    return NextResponse.json(statsMap);
  } catch (error) {
    console.error("[BatchStats] Error in batch stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
