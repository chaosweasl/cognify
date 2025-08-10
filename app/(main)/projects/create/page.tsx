"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCachedProjectsStore } from "@/hooks/useCachedProjects";

export default function CreateProjectPage() {
  const router = useRouter();
  const { createProject } = useCachedProjectsStore();

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
          // Navigate to edit page immediately - store already has the project
          router.push(`/projects/${project.id}/edit`);
        } else {
          throw new Error("Project creation returned no ID");
        }
      } catch (error) {
        console.error("[CreateProject] Failed to create project:", error);
        // Go back to projects page (no refresh param needed - store handles the state)
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
