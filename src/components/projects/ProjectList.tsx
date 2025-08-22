import { ProjectCard } from "./ProjectCard";
import { useProjectsStore } from "@/hooks/useProjects";
import { useEffect } from "react";

export function ProjectList() {
  const { projects, deleteProject, loadProjects } = useProjectsStore();

  console.log("[ProjectList] Rendering with projects:", projects.length);

  useEffect(() => {
    loadProjects().catch((error) => {
      console.error("[ProjectList] Error loading projects:", error);
    });
  }, [loadProjects]);

  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-4 text-primary">
          No projects yet
        </h2>
        <p className="text-secondary mb-6">
          Create your first project to get started with flashcards!
        </p>
      </div>
    );
  }

  return (
    <div>
      {projects.map((project) => {
        return (
          <ProjectCard
            key={project.id}
            project={{
              id: project.id,
              name: project.name,
              description: project.description || "",
              formattedCreatedAt: project.created_at,
            }}
            flashcardCount={
              project.flashcardCount || project.stats?.totalFlashcards || 0
            }
            srsStats={{
              dueCards: project.stats?.dueCards || 0,
              newCards: project.stats?.availableNewCards || 0,
              learningCards: project.stats?.learningCards || 0,
            }}
            onDelete={() => deleteProject(project.id)}
          />
        );
      })}
    </div>
  );
}
