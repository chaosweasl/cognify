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
        const project = await createProject({
          name: "Untitled Project",
          description: "",
        });
        if (project?.id) {
          router.push(`/projects/${project.id}/edit`);
        }
      } catch (error) {
        console.error("Failed to create project:", error);
        // Fallback to projects page
        router.push("/projects");
      }
    }
    createAndRedirect();
  }, [router, createProject]);

  return null;
}
