"use client";

import { useProjectsStore } from "@/hooks/useProjects";
import { ProjectList } from "./components/ProjectList";
import { Loader2, BookOpen } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ProjectsPageContent() {
  const { projects, isLoadingProjects, error, loadProjects } = useProjectsStore();
  const searchParams = useSearchParams();
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load projects on mount or when refresh param is present
  useEffect(() => {
    const shouldForceRefresh = searchParams.get("refresh") === "1";
    const shouldInitialLoad = !initialLoadDone && projects.length === 0 && !isLoadingProjects;

    console.log("[ProjectsPage] Loading check:", {
      shouldForceRefresh,
      shouldInitialLoad,
      projectsCount: projects.length,
      isLoading: isLoadingProjects,
      initialLoadDone,
    });

    if (shouldForceRefresh || shouldInitialLoad) {
      console.log("[ProjectsPage] Loading projects...");
      loadProjects();

      if (shouldForceRefresh) {
        // Remove the refresh param from the URL
        const url = new URL(window.location.href);
        url.searchParams.delete("refresh");
        window.history.replaceState({}, document.title, url.pathname + url.search);
      }

      if (!initialLoadDone) {
        setInitialLoadDone(true);
      }
    }
  }, [searchParams, projects.length, isLoadingProjects, loadProjects, initialLoadDone]);

  if (error) {
    console.error("[ProjectsPage] Error loading projects:", error);
  }

  console.log("[ProjectsPage] Render state:", {
    projects: projects.length,
    isLoading: isLoadingProjects,
    error: !!error,
  });

  return (
    <>
      <div className="flex">
        {/* Main content area */}
        <main className="flex-1 overflow-y-auto px-2 py-6 md:px-10 md:py-10 transition-all">
          {isLoadingProjects ? (
            <div className="flex items-center gap-2 h-40 justify-center">
              <Loader2 className="animate-spin w-5 h-5 text-primary" />
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
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
                  Start by creating your first flashcard project. Organize your learning and
                  track your progress with beautiful, interactive cards.
                </div>
              </div>
              {error && (
                <p className="text-error mt-4 text-center text-sm">{error}</p>
              )}
            </div>
          ) : (
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              <ProjectList />
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 h-40 justify-center">
          <Loader2 className="animate-spin w-5 h-5 text-primary" />
          Loading...
        </div>
      }
    >
      <ProjectsPageContent />
    </Suspense>
  );
}
