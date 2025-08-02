// Utility to get SRS statistics for projects
import { createClient } from "@/utils/supabase/client";
import { DEFAULT_SRS_SETTINGS } from "./SRSScheduler";
import { getSessionAwareStudyStats, initStudySession } from "./SRSSession";
import { loadSRSStates } from "./SRSDBUtils";

export interface ProjectSRSInfo {
  projectId: string;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  dueCards: number;
  totalCards: number;
}

export async function getProjectSRSStats(
  userId: string,
  projectId: string,
  cardIds: string[]
): Promise<ProjectSRSInfo> {
  if (cardIds.length === 0) {
    return {
      projectId,
      newCards: 0,
      learningCards: 0,
      reviewCards: 0,
      dueCards: 0,
      totalCards: 0,
    };
  }

  try {
    const supabase = createClient();
    const srsStates = await loadSRSStates(supabase, userId, projectId, cardIds);

    // Use session-aware stats to respect daily limits
    const freshSession = initStudySession();
    const stats = getSessionAwareStudyStats(
      srsStates,
      freshSession,
      DEFAULT_SRS_SETTINGS
    );

    return {
      projectId,
      newCards: stats.availableNewCards,
      learningCards: stats.dueLearningCards,
      reviewCards: stats.dueReviewCards,
      dueCards: stats.dueCards,
      totalCards: stats.totalCards,
    };
  } catch (error) {
    console.error(`Error loading SRS stats for project ${projectId}:`, error);
    return {
      projectId,
      newCards: Math.min(
        cardIds.length,
        DEFAULT_SRS_SETTINGS.NEW_CARDS_PER_DAY
      ), // Cap at daily limit
      learningCards: 0,
      reviewCards: 0,
      dueCards: Math.min(
        cardIds.length,
        DEFAULT_SRS_SETTINGS.NEW_CARDS_PER_DAY
      ),
      totalCards: cardIds.length,
    };
  }
}
