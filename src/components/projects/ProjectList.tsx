import { ProjectCard } from "./ProjectCard";
import { useProjectsStore } from "@/hooks/useProjects";
import { useEffect } from "react";

export function ProjectList() {
  const { 
    projects, 
    deleteProject, 
    loadProjects, 
  } = useProjectsStore();

  console.log("[ProjectList] Rendering with projects:", projects.length);

  // Load projects with stats
  useEffect(() => {
    loadProjects().catch((error) => {
      console.error("[ProjectList] Error loading projects:", error);
    });
  }, [loadProjects]);

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4">No projects yet</h2>
        <p className="text-gray-600 mb-6">Create your first project to get started with flashcards!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
      {projects.map((project) => {
        return (
          <ProjectCard
            key={project.id}
            project={{
              id: project.id,
              name: project.name,
              description: project.description || "",
              formattedCreatedAt: project.created_at
            }}
            flashcardCount={project.flashcardCount || project.stats?.totalFlashcards || 0}
            srsStats={{
              dueCards: project.stats?.dueCards || 0,
              newCards: project.stats?.totalNewCards || 0,
              learningCards: project.stats?.learningCards || 0,
            }}
            onDelete={() => deleteProject(project.id)}
          />
        );
      })}
    </div>
  );
}