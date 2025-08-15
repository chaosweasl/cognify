import { getProjectById } from "../actions";
import { notFound, redirect } from "next/navigation";
import StudyFlashcards from "@/src/components/study/StudyFlashcards";
import { createClient } from "@/lib/supabase/server";
import { loadSRSStates } from "@/lib/srs/SRSDBUtils";
import { getFlashcardsByProjectId } from "../actions/flashcard-actions";
import { getDailyStudyStats } from "@/lib/supabase/dailyStudyStats";
import { canAccessDebugSync } from "@/lib/utils/admin";
import SRSDebugPanel from "@/tests/debug/SRSDebugPanel";

import DebugSRS from "@/tests/DebugSRS";

export default async function ProjectStudyPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  console.log(`[StudyPage] Loading study page for project: ${id}`);

  const project = await getProjectById(id);
  if (!project) {
    console.log(`[StudyPage] Project not found: ${id}`);
    return notFound();
  }

  console.log(`[StudyPage] Project found: ${project.name}`);

  // Load flashcards directly without conversion
  const flashcards = await getFlashcardsByProjectId(id);

  console.log(`[StudyPage] Loaded ${flashcards.length} flashcards`);

  // If no flashcards, redirect to edit page
  if (flashcards.length === 0) {
    console.log(`[StudyPage] No flashcards found, redirecting to edit page`);
    redirect(`/projects/${id}/edit`);
  }

  // Load existing SRS states from database
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let existingSRSStates = undefined;
  if (user && flashcards.length > 0) {
    console.log(`[StudyPage] Loading SRS states for user: ${user.id}`);
    const cardIds = flashcards.map((card) => card.id).filter(Boolean);
    existingSRSStates = await loadSRSStates(supabase, user.id, id, cardIds);

    // Check if user has reached daily limits and no cards are available
    if (user) {
      console.log(`[StudyPage] Checking daily limits and card availability`);
      const dailyStats = await getDailyStudyStats(user.id);
      const NEW_CARDS_PER_DAY = project.new_cards_per_day ?? 20; // TODO: Get from user settings
      const MAX_REVIEWS_PER_DAY = project.max_reviews_per_day ?? 200; // TODO: Get from user settings

      console.log(`[StudyPage] Daily stats:`, {
        newCardsStudied: dailyStats.newCardsStudied,
        reviewsCompleted: dailyStats.reviewsCompleted,
        limits: { NEW_CARDS_PER_DAY, MAX_REVIEWS_PER_DAY },
      });

      // Count available cards
      const currentTime = Date.now();
      const cardStates = Object.values(existingSRSStates || {});

      const dueCards = cardStates.filter(
        (state) =>
          state.state === "review" &&
          state.due <= currentTime &&
          !state.isSuspended
      ).length;

      const newCards = cardStates.filter(
        (state) => state.state === "new"
      ).length; // Cards in "new" state
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

      console.log(`[StudyPage] Card availability:`, {
        dueCards,
        newCards,
        availableNewCards,
        learningCards,
        totalStates: cardStates.length,
      });

      const hasCardsToStudy =
        dueCards > 0 || availableNewCards > 0 || learningCards > 0;

      console.log(`[StudyPage] Cards available for study: ${hasCardsToStudy}`);

      if (!hasCardsToStudy) {
        console.log(
          `[StudyPage] No cards available for study, redirecting to projects list`
        );
        redirect("/projects");
      }
    }
  }

  console.log(
    `[StudyPage] Starting study session for project: ${project.name}`
  );

  return (
    <main className="flex-1 min-h-screen bg-base-200 px-4 md:px-12 py-4 md:py-8 overflow-auto">
      {/* Debug component - only visible to admins and in debug mode */}
      {canAccessDebugSync(user) && <DebugSRS projectId={project.id} />}
      <StudyFlashcards
        flashcards={flashcards}
        projectName={project.name}
        projectId={project.id}
        newCardsPerDay={project.new_cards_per_day ?? 20}
        maxReviewsPerDay={project.max_reviews_per_day ?? 100}
        existingSRSStates={existingSRSStates}
      />
      {/* Floating Debug Panel - only visible to admins and in debug mode */}
      {canAccessDebugSync(user) && user && (
        <SRSDebugPanel
          userId={user.id}
          projectId={project.id}
          srsStates={existingSRSStates}
        />
      )}
    </main>
  );
}
