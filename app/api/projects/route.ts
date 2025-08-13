import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json([]);

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name, description, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (projectsError || !projects) return NextResponse.json([]);

  // Fetch flashcard counts for each project
  const projectIds = projects.map((p) => p.id);
  let flashcardCounts: Record<string, number> = {};
  if (projectIds.length > 0) {
    const { data: flashcards, error: flashcardsError } = await supabase
      .from("flashcards")
      .select("project_id, id");
    if (!flashcardsError && flashcards) {
      flashcardCounts = flashcards.reduce((acc, card) => {
        acc[card.project_id] = (acc[card.project_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    }
  }

  // Attach flashcard count to each project
  const projectsWithCounts = projects.map((project) => ({
    ...project,
    flashcardCount: flashcardCounts[project.id] || 0,
  }));
  return NextResponse.json(projectsWithCounts);
}
