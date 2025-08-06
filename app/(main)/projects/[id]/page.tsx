import { getProjectById } from "../actions";
import { notFound, redirect } from "next/navigation";
import StudyFlashcards from "../components/StudyFlashcards";
import { createClient } from "@/utils/supabase/server";
import { loadSRSStates } from "../components/SRSDBUtils";
import { getFlashcardsByProjectId } from "../actions/flashcard-actions";
import { convertNewToLegacy } from "../types/flashcard";
import { getDailyStudyStats } from "@/utils/supabase/dailyStudyStats";

export default async function ProjectStudyPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const project = await getProjectById(id);
  if (!project) return notFound();

  // Load flashcards separately
  const flashcardsData = await getFlashcardsByProjectId(id);
  const flashcards = flashcardsData
    .map(convertNewToLegacy)
    .map((card, index) => ({
      ...card,
      id: card.id || `temp-${index}`, // Ensure id is always defined
    }));

  // If no flashcards, redirect to edit page
  if (flashcards.length === 0) {
    redirect(`/projects/${id}/edit`);
  }

  // Load existing SRS states from database
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let existingSRSStates = undefined;
  if (user && flashcards.length > 0) {
    const cardIds = flashcards.map((card) => card.id).filter(Boolean);
    existingSRSStates = await loadSRSStates(supabase, user.id, id, cardIds);

    // Check if user has reached daily limits and no cards are available
    if (user) {
      const dailyStats = await getDailyStudyStats(user.id);
      const NEW_CARDS_PER_DAY = 20; // TODO: Get from user settings
      const MAX_REVIEWS_PER_DAY = 200; // TODO: Get from user settings

      // Count available cards
      const currentTime = Date.now();
      const cardStates = Object.values(existingSRSStates || {});

      const dueCards = cardStates.filter(
        (state) =>
          state.state === "review" &&
          state.due <= currentTime &&
          !state.isSuspended
      ).length;

      const newCards = flashcards.length - cardStates.length; // Cards without SRS state
      const availableNewCards = Math.max(
        0,
        Math.min(newCards, NEW_CARDS_PER_DAY - dailyStats.newCardsStudied)
      );

      const learningCards = cardStates.filter(
        (state) =>
          (state.state === "learning" || state.state === "relearning") &&
          state.due <= currentTime &&
          !state.isSuspended
      ).length;

      const hasCardsToStudy =
        dueCards > 0 || availableNewCards > 0 || learningCards > 0;

      // If no cards available for study, redirect back to projects
      if (!hasCardsToStudy) {
        redirect("/projects");
      }
    }
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
