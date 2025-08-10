import { ProjectCard } from "./ProjectCard";
import { useProjectsStore } from "../hooks/useProjects";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useUserId } from "@/hooks/useUserId";
import { loadSRSStates } from "./SRSDBUtils";
import {
  getSessionAwareStudyStats,
  initStudySessionWithFallback,
} from "./SRSSession";
import { useEnhancedSettings } from "@/components/CacheProvider";

export function ProjectList() {
  const { projects, deleteProjectById } = useProjectsStore();
  const userId = useUserId();
  const { srsSettings } = useEnhancedSettings();
  const [projectStats, setProjectStats] = useState<
    Record<
      string,
      {
        dueCards: number;
        newCards: number;
        learningCards: number;
        nextReviewDate?: Date | null;
      }
    >
  >({});

  // Fetch SRS statistics for all projects with session-aware calculations
  useEffect(() => {
    async function fetchProjectStats() {
      if (!userId || projects.length === 0) {
        console.log(
          `[ProjectList] fetchProjectStats - Skipping: userId=${!!userId}, projectCount=${
            projects.length
          }`
        );
        return;
      }

      console.log(
        `[ProjectList] fetchProjectStats - Starting for ${projects.length} projects`
      );
      const supabase = createClient();

      // Get current study session to calculate available new cards
      const currentSession = await initStudySessionWithFallback(userId);
      console.log(
        `[ProjectList] fetchProjectStats - Current session daily stats:`,
        {
          newCards: currentSession.newCardsStudied,
          reviews: currentSession.reviewsCompleted,
        }
      );

      const statsPromises = projects.map(async (project) => {
        console.log(
          `[ProjectList] fetchProjectStats - Processing project: ${project.name} (${project.id})`
        );

        // Get flashcards for this project
        const { data: flashcards } = await supabase
          .from("flashcards")
          .select("id")
          .eq("project_id", project.id);

        if (!flashcards || flashcards.length === 0) {
          console.log(
            `[ProjectList] fetchProjectStats - Project ${project.name} has no flashcards`
          );
          return {
            projectId: project.id,
            stats: {
              dueCards: 0,
              newCards: 0,
              learningCards: 0,
              nextReviewDate: null,
            },
          };
        }

        console.log(
          `[ProjectList] fetchProjectStats - Project ${project.name} has ${flashcards.length} flashcards`
        );
        const flashcardIds = flashcards.map((f) => f.id);

        // Load SRS states for this project
        const srsStates = await loadSRSStates(
          supabase,
          userId,
          project.id,
          flashcardIds
        );

        // Calculate session-aware stats (considers daily limits)
        const sessionStats = getSessionAwareStudyStats(
          srsStates,
          currentSession,
          srsSettings
        );

        console.log(
          `[ProjectList] fetchProjectStats - Project ${project.name} stats:`,
          {
            due: sessionStats.dueCards,
            new: sessionStats.availableNewCards,
            learning: sessionStats.totalLearningCards,
          }
        );

        // Calculate next review date
        let nextReviewDate: Date | null = null;
        const currentTime = Date.now();

        // Get all future due dates from SRS states
        const futureDueDates = Object.values(srsStates)
          .map((state) => state.due)
          .filter((due) => due > currentTime)
          .sort((a, b) => a - b);

        if (futureDueDates.length > 0) {
          nextReviewDate = new Date(futureDueDates[0]);
        }

        return {
          projectId: project.id,
          stats: {
            dueCards: sessionStats.dueCards,
            newCards: sessionStats.availableNewCards, // This respects daily limits
            learningCards: sessionStats.totalLearningCards,
            nextReviewDate,
          },
        };
      });

      const results = await Promise.all(statsPromises);
      const statsMap: Record<
        string,
        {
          dueCards: number;
          newCards: number;
          learningCards: number;
          nextReviewDate?: Date | null;
        }
      > = {};

      results.forEach(({ projectId, stats }) => {
        if (stats) {
          statsMap[projectId] = stats;
        }
      });

      setProjectStats(statsMap);
    }

    fetchProjectStats();
  }, [userId, projects, srsSettings]);

  return (
    <>
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={{
            ...project,
            formattedCreatedAt: project.formattedCreatedAt ?? "",
          }}
          flashcardCount={project.flashcardCount ?? 0}
          srsStats={projectStats[project.id]}
          onDelete={async (id: string) => {
            deleteProjectById(id);
            return Promise.resolve();
          }}
        />
      ))}
    </>
  );
}
