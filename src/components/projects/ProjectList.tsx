import { ProjectCard } from "./ProjectCard";
import { useProjectsStore } from "@/hooks/useProjects";
import { ProjectStats } from "@/src/types";
import { useState, useEffect, useCallback, useRef } from "react";

interface ProjectWithStats {
  id: string;
  name: string;
  description: string;
  created_at: string;
  stats?: ProjectStats;
}

export function ProjectList() {
  const { 
    projects, 
    deleteProject, 
    loadProjects, 
  } = useProjectsStore();
  
  const [projectStats, setProjectStats] = useState<Record<string, ProjectStats>>({});
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedRef = useRef(false);

  console.log("[ProjectList] Rendering with projects:", projects.length);

  // Load projects and their stats using batch API
  const loadProjectsAndStats = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoading || hasLoadedRef.current) {
      console.log("[ProjectList] Skipping load - already loading or loaded");
      return;
    }

    console.log("[ProjectList] Loading projects and stats...");
    setIsLoading(true);
    hasLoadedRef.current = true;
    
    try {
      // First load basic projects
      await loadProjects();
      
      // Then load all stats in one batch call
      const response = await fetch("/api/projects/batch-stats");
      if (response.ok) {
        const data = await response.json();
        const statsMap: Record<string, ProjectStats> = {};
        
        data.projects.forEach((project: ProjectWithStats) => {
          if (project.stats) {
            statsMap[project.id] = project.stats;
          }
        });
        
        setProjectStats(statsMap);
        console.log("[ProjectList] Successfully loaded batch stats for", Object.keys(statsMap).length, "projects");
      } else {
        console.error("[ProjectList] Failed to load batch stats:", response.status);
        // Fallback: could implement individual loading here if needed
      }
    } catch (error) {
      console.error("[ProjectList] Error loading projects and stats:", error);
      // Reset hasLoadedRef on error so we can retry
      hasLoadedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [loadProjects, isLoading]);

  useEffect(() => {
    loadProjectsAndStats();
  }, [loadProjectsAndStats]);

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      // Remove stats from local state
      setProjectStats(prev => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [projectId]: _removed, ...rest } = prev;
        return rest;
      });
      console.log(`[ProjectList] Deleted project: ${projectId}`);
    } catch (error) {
      console.error("[ProjectList] Error deleting project:", error);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">No projects yet</h2>
        <p className="text-gray-600 mb-6">Create your first project to get started with flashcards!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => {
        const stats = projectStats[project.id];
        return (
          <ProjectCard
            key={project.id}
            project={{
              id: project.id,
              name: project.name,
              description: project.description || "",
              formattedCreatedAt: project.created_at
            }}
            flashcardCount={stats?.totalCards || 0}
            srsStats={{
              dueCards: stats?.dueCards || 0,
              newCards: stats?.newCards || 0,
              learningCards: stats?.learningCards || 0,
            }}
            onDelete={() => handleDeleteProject(project.id)}
          />
        );
      })}
    </div>
  );
}