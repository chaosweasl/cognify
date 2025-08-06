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
import { useSettingsStore } from "@/hooks/useSettings";

export function ProjectList() {
  const { projects, deleteProjectById } = useProjectsStore();
  const userId = useUserId();
  const { srsSettings } = useSettingsStore();
  const [projectStats, setProjectStats] = useState<
    Record<
      string,
      {
        dueCards: number;
        newCards: number;
        learningCards: number;
      }
    >
  >({});

  // Fetch SRS statistics for all projects with session-aware calculations
  useEffect(() => {
    async function fetchProjectStats() {
      if (!userId || projects.length === 0) return;

      const supabase = createClient();

      // Get current study session to calculate available new cards
      const currentSession = await initStudySessionWithFallback(userId);

      const statsPromises = projects.map(async (project) => {
        // Get flashcards for this project
        const { data: flashcards } = await supabase
          .from("flashcards")
          .select("id")
          .eq("project_id", project.id);

        if (!flashcards || flashcards.length === 0) {
          return {
            projectId: project.id,
            stats: { dueCards: 0, newCards: 0, learningCards: 0 },
          };
        }

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

        return {
          projectId: project.id,
          stats: {
            dueCards: sessionStats.dueCards,
            newCards: sessionStats.availableNewCards, // This respects daily limits
            learningCards: sessionStats.totalLearningCards,
          },
        };
      });

      const results = await Promise.all(statsPromises);
      const statsMap: Record<
        string,
        { dueCards: number; newCards: number; learningCards: number }
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
