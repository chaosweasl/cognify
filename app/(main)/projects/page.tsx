"use client";

import { useProjectsStore } from "@/hooks/useProjects";
import { ProjectList } from "@/src/components/projects/ProjectList";
import { BookOpen } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { Loading } from "@/src/components/ui/Loading";

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
      <div className="flex h-64 items-center justify-center">
        <Loading size="lg" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="flex h-full flex-1 flex-col items-center justify-center py-24 text-center">
          <BookOpen
            size={90}
            className="mx-auto mb-8 text-primary/90 drop-shadow-xl dark:text-primary"
          />
          <div className="mb-2 text-3xl font-extrabold tracking-tight">
            No projects yet
          </div>
          <div className="mb-8 max-w-md text-lg text-muted-foreground">
            Start by creating your first flashcard project. Organize your
            learning and track your progress with beautiful, interactive cards.
          </div>
        </div>
        {error && (
          <p className="mt-4 text-center text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex">
      <main className="flex-1 overflow-y-auto px-2 py-6 transition-all md:px-10 md:py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          <ProjectList />
        </div>
        {error && (
          <p className="mt-4 text-center text-sm text-destructive">{error}</p>
        )}
      </main>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<Loading size="lg" />}>
      <ProjectsPageContent />
    </Suspense>
  );
}
