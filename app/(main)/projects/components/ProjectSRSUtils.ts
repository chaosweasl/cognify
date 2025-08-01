// Utility to get SRS statistics for projects
import { createClient } from "@/utils/supabase/client";
import { getStudyStats } from "./SRSScheduler";
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
    const stats = getStudyStats(srsStates);

    return {
      projectId,
      ...stats,
    };
  } catch (error) {
    console.error(`Error loading SRS stats for project ${projectId}:`, error);
    return {
      projectId,
      newCards: cardIds.length, // Fallback: treat all as new
      learningCards: 0,
      reviewCards: 0,
      dueCards: cardIds.length,
      totalCards: cardIds.length,
    };
  }
}
