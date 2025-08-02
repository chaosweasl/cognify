import { ProjectCard } from "./ProjectCard";

import { useProjectsStore } from "../hooks/useProjects";

export function ProjectList() {
  const { projects, deleteProjectById } = useProjectsStore();
  // Projects now include flashcardCount from API.
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
          onDelete={async (id: string) => {
            deleteProjectById(id);
            return Promise.resolve();
          }}
        />
      ))}
    </>
  );
}
