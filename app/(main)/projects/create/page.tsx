"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProjectsStore } from "@/hooks/useProjects";

export default function CreateProjectPage() {
  const router = useRouter();
  const { createProject } = useProjectsStore();

  useEffect(() => {
    async function createAndRedirect() {
      try {
        console.log("[CreateProject] Creating new project...");
        const project = await createProject({
          name: "Untitled Project",
          description: "",
        });

        if (project?.id) {
          console.log(
            "[CreateProject] Project created, redirecting to edit:",
            project.id
          );
          // Navigate to edit page immediately
          router.push(`/projects/${project.id}/edit`);
        } else {
          throw new Error("Project creation returned no ID");
        }
      } catch (error) {
        console.error("[CreateProject] Failed to create project:", error);
        // Go back to projects page
        router.push("/projects");
      }
    }
    createAndRedirect();
  }, [router, createProject]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center gap-2">
        <div className="loading loading-spinner loading-md"></div>
        <span>Creating project...</span>
      </div>
    </div>
  );
}
