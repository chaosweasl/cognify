import { ProjectCard } from "./ProjectCard";
import { useProjectsStore } from "../hooks/useProjects";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useUserId } from "@/hooks/useUserId";
import { getProjectStudyStats } from "./SRSDBUtils";

export function ProjectList() {
  const { projects, deleteProjectById } = useProjectsStore();
  const userId = useUserId();
  const [projectStats, setProjectStats] = useState<Record<string, {
    dueCards: number;
    newCards: number;
    learningCards: number;
  }>>({});

  // Fetch SRS statistics for all projects
  useEffect(() => {
    async function fetchProjectStats() {
      if (!userId || projects.length === 0) return;

      const supabase = createClient();
      const statsPromises = projects.map(async (project) => {
        const stats = await getProjectStudyStats(supabase, userId, project.id);
        return { projectId: project.id, stats };
      });

      const results = await Promise.all(statsPromises);
      const statsMap: Record<string, any> = {};
      
      results.forEach(({ projectId, stats }) => {
        if (stats) {
          statsMap[projectId] = stats;
        }
      });

      setProjectStats(statsMap);
    }

    fetchProjectStats();
  }, [userId, projects]);

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
