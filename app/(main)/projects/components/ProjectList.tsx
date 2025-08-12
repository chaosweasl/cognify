import { ProjectCard } from "./ProjectCard";
import { useProjectsStore } from "@/hooks/useProjects";
import { useState, useEffect } from "react";

// TypeScript interfaces for project stats
interface ProjectStatsSummary {
  dueCards: number;
  newCards: number;
  learningCards: number;
  totalCards: number;
}

export function ProjectList() {
  const { 
    projects, 
    deleteProject, 
    loadProjects, 
    loadProjectStats, 
    getProjectStats,
    isLoadingProjects 
  } = useProjectsStore();
  const [projectStats, setProjectStats] = useState<Record<string, ProjectStatsSummary>>({});

  console.log("[ProjectList] Rendering with projects:", projects.length);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Load stats for each project
  useEffect(() => {
    if (projects.length > 0) {
      projects.forEach(project => {
        loadProjectStats(project.id);
      });
    }
  }, [projects, loadProjectStats]);

  // Update local stats when store stats change
  useEffect(() => {
    const stats: Record<string, ProjectStatsSummary> = {};
    
    projects.forEach(project => {
      const projectStat = getProjectStats(project.id);
      if (projectStat) {
        stats[project.id] = {
          dueCards: projectStat.dueCards,
          newCards: projectStat.newCards,
          learningCards: projectStat.learningCards,
          totalCards: projectStat.totalCards,
        };
      }
    });
    
    setProjectStats(stats);
  }, [projects, getProjectStats]);

  const handleDeleteProject = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      console.log(`[ProjectList] Deleted project: ${projectId}`);
    } catch (error) {
      console.error("[ProjectList] Error deleting project:", error);
    }
  };

  if (isLoadingProjects) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

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
            id={project.id}
            name={project.name}
            description={project.description}
            createdAt={project.created_at}
            dueCards={stats?.dueCards || 0}
            newCards={stats?.newCards || 0}
            learningCards={stats?.learningCards || 0}
            totalCards={stats?.totalCards || 0}
            onDelete={() => handleDeleteProject(project.id)}
          />
        );
      })}
    </div>
  );
}