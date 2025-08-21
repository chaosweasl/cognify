"use client";

import { useProjectsStore } from "@/hooks/useProjects";
import { ProjectList } from "@/src/components/projects/ProjectList";
import { BookOpen } from "lucide-react";
import { useEffect, useState, Suspense } from "react";

function ProjectsPageContent() {
  const { projects, loadProjects, reset } = useProjectsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Always reload projects on mount, and reset store to avoid stale state
  useEffect(() => {
    reset();
    setLoading(true);
    setError(null);
    loadProjects()
      .then(() => setLoading(false))
      .catch((err) => {
        setError(err.message || "Failed to load projects");
        setLoading(false);
      });
  }, [loadProjects, reset]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center justify-center flex-1 h-full text-center text-base-content/80 py-24">
          <BookOpen
            size={90}
            className="mx-auto mb-8 text-primary/90 dark:text-primary drop-shadow-xl"
          />
          <div className="text-3xl font-extrabold mb-2 tracking-tight text-base-content">
            No projects yet
          </div>
          <div className="mb-8 text-lg text-base-content/80 max-w-md">
            Start by creating your first flashcard project. Organize your
            learning and track your progress with beautiful, interactive cards.
          </div>
        </div>
        {error && (
          <p className="text-error mt-4 text-center text-sm">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex">
      <main className="flex-1 overflow-y-auto px-2 py-6 md:px-10 md:py-10 transition-all">
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          <ProjectList />
        </div>
        {error && (
          <p className="text-error mt-4 text-center text-sm">{error}</p>
        )}
      </main>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={<div className="loading loading-spinner loading-lg"></div>}
    >
      <ProjectsPageContent />
    </Suspense>
  );
}
