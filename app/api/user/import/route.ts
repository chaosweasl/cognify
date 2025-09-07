import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const importData = await req.json();

    // Validate import data structure
    if (!importData.projects || !Array.isArray(importData.projects)) {
      return NextResponse.json(
        { error: "Invalid import data: missing projects array" },
        { status: 400 }
      );
    }

    let importedProjects = 0;
    let importedFlashcards = 0;

    // Import projects and flashcards
    for (const project of importData.projects) {
      // Check if project already exists by name
      const { data: existingProject } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", project.name)
        .single();

      let projectId: string;

      if (existingProject) {
        // Skip if project already exists
        continue;
      } else {
        // Create new project
        const { data: newProject, error: projectError } = await supabase
          .from("projects")
          .insert({
            user_id: user.id,
            name: project.name,
            description: project.description,
            color: project.color,
            srs_settings: project.srs_settings,
            is_public: project.is_public || false,
            tags: project.tags || [],
          })
          .select("id")
          .single();

        if (projectError) {
          console.error("Error creating project:", projectError);
          continue;
        }

        projectId = newProject.id;
        importedProjects++;
      }

      // Import flashcards for this project
      if (project.flashcards && Array.isArray(project.flashcards)) {
        for (const flashcard of project.flashcards) {
          // Check for existing flashcard by front/back content
          const { data: existingCard } = await supabase
            .from("flashcards")
            .select("id")
            .eq("project_id", projectId)
            .eq("front", flashcard.front)
            .eq("back", flashcard.back)
            .single();

          if (!existingCard) {
            const { error: flashcardError } = await supabase
              .from("flashcards")
              .insert({
                project_id: projectId,
                front: flashcard.front,
                back: flashcard.back,
                hint: flashcard.hint,
                tags: flashcard.tags || [],
                difficulty: flashcard.difficulty || "medium",
                // Reset SRS state for imported cards
                srs_due_date: new Date().toISOString(),
                srs_interval: 1,
                srs_ease_factor: 2.5,
                srs_review_count: 0,
                srs_lapses: 0,
              });

            if (!flashcardError) {
              importedFlashcards++;
            }
          }
        }
      }
    }

    // Import user settings if provided and not already exists
    if (importData.user_settings) {
      const { data: existingSettings } = await supabase
        .from("user_settings")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      if (!existingSettings) {
        await supabase.from("user_settings").insert({
          user_id: user.id,
          theme: importData.user_settings.theme || "system",
          notifications_enabled:
            importData.user_settings.notifications_enabled ?? true,
          daily_reminder: importData.user_settings.daily_reminder ?? true,
          reminder_time: importData.user_settings.reminder_time || "09:00:00",
        });
      }
    }

    return NextResponse.json({
      success: true,
      imported: {
        projects: importedProjects,
        flashcards: importedFlashcards,
      },
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import data" },
      { status: 500 }
    );
  }
}
