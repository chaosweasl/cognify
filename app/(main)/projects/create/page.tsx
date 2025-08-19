"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "../actions";
import { CacheInvalidation } from "@/hooks/useCache";

export default function CreateProjectPage() {
  const router = useRouter();

  useEffect(() => {
    async function createAndRedirect() {
      try {
        console.log("[CreateProject] Creating new project...");
        const projectId = await createProject({
          name: "Untitled Project",
          description: "",
        });

        if (projectId) {
          console.log(
            "[CreateProject] Project created, redirecting to edit:",
            projectId
          );
          
          // CRITICAL FIX: Invalidate cache after creating project
          // This ensures when user navigates back to projects page, they see the new project
          CacheInvalidation.invalidatePattern('user_projects');
          console.log("[CreateProject] Cache invalidated for user projects");
          
          // Navigate to edit page immediately
          router.push(`/projects/${projectId}/edit`);
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
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center gap-2">
        <div className="loading loading-spinner loading-md"></div>
        <span>Creating project...</span>
      </div>
    </div>
  );
}
