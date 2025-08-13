import { ProjectCard } from "./ProjectCard";
import { useProjectsStore } from "@/hooks/useProjects";
import { ProjectStats } from "@/src/types";
import { useState, useEffect } from "react";

export function ProjectList() {
  const { 
    projects, 
    deleteProject, 
    loadProjects, 
    loadProjectStats, 
  } = useProjectsStore();
  
  const [projectStats, setProjectStats] = useState<Record<string, ProjectStats>>({});
  const [loadingStats, setLoadingStats] = useState<Record<string, boolean>>({});

  console.log("[ProjectList] Rendering with projects:", projects.length);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Load stats for each project
  useEffect(() => {
    projects.forEach(async (project) => {
      if (!projectStats[project.id] && !loadingStats[project.id]) {
        setLoadingStats(prev => ({ ...prev, [project.id]: true }));
        try {
          const stats = await loadProjectStats(project.id);
          setProjectStats(prev => ({ ...prev, [project.id]: stats }));
        } catch (error) {
          console.error(`Error loading stats for project ${project.id}:`, error);
        } finally {
          setLoadingStats(prev => ({ ...prev, [project.id]: false }));
        }
      }
    });
  }, [projects, loadProjectStats, loadingStats, projectStats]);

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