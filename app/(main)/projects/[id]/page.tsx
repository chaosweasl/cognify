import { getProjectById } from "../actions";
import { normalizeProject } from "../utils/normalizeProject";
import { notFound } from "next/navigation";
import StudyFlashcards from "../components/StudyFlashcards";
import { createClient } from "@/utils/supabase/server";
import { loadSRSStates } from "../components/SRSDBUtils";

export default async function ProjectStudyPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const project = await getProjectById(id);
  if (!project) return notFound();
  const normalized = normalizeProject(project);

  // Load existing SRS states from database
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let existingSRSStates = undefined;
  if (user && normalized.flashcards.length > 0) {
    const cardIds = normalized.flashcards.map((card) => card.id);
    existingSRSStates = await loadSRSStates(supabase, user.id, id, cardIds);
  }

  return (
    <main className="flex-1 min-h-screen bg-base-200 px-4 md:px-12 py-4 md:py-8 overflow-auto">
      <StudyFlashcards
        flashcards={normalized.flashcards}
        projectName={normalized.name}
        projectId={normalized.id}
        existingSRSStates={existingSRSStates}
      />
    </main>
  );
}
