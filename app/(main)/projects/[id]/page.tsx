import { getProjectById } from "../actions";
import { notFound } from "next/navigation";
import StudyFlashcards from "../components/StudyFlashcards";
import { createClient } from "@/utils/supabase/server";
import { loadSRSStates } from "../components/SRSDBUtils";
import { getFlashcardsByProjectId } from "../actions/flashcard-actions";
import { convertNewToLegacy } from "../types/flashcard";

export default async function ProjectStudyPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const project = await getProjectById(id);
  if (!project) return notFound();

  // Load flashcards separately
  const flashcardsData = await getFlashcardsByProjectId(id);
  const flashcards = flashcardsData.map(convertNewToLegacy).map((card, index) => ({
    ...card,
    id: card.id || `temp-${index}` // Ensure id is always defined
  }));

  // Load existing SRS states from database
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let existingSRSStates = undefined;
  if (user && flashcards.length > 0) {
    const cardIds = flashcards.map((card) => card.id).filter(Boolean);
    existingSRSStates = await loadSRSStates(supabase, user.id, id, cardIds);
  }

  return (
    <main className="flex-1 min-h-screen bg-base-200 px-4 md:px-12 py-4 md:py-8 overflow-auto">
      <StudyFlashcards
        flashcards={flashcards}
        projectName={project.name}
        projectId={project.id}
        existingSRSStates={existingSRSStates}
      />
    </main>
  );
}
