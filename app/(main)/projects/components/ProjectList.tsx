import { ProjectCard } from "./ProjectCard";

import { useProjectsStore } from "../hooks/useProjects";

export function ProjectList() {
  const { projects, deleteProjectById } = useProjectsStore();
  console.log("[ProjectList] Rendering ProjectList with projects:", projects);
  return (
    <>
      {projects.map((project) => {
        console.log(
          "[ProjectList] Rendering ProjectCard for project:",
          project
        );
        return (
          <ProjectCard
            key={project.id}
            project={{
              ...project,
              formattedCreatedAt: project.formattedCreatedAt ?? "",
            }}
            onDelete={async (id: string) => {
              deleteProjectById(id);
              return Promise.resolve();
            }}
          />
        );
      })}
    </>
  );
}
