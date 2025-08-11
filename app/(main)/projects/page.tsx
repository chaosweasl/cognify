"use client";

import { useCachedProjectsStore } from "@/hooks/useCachedProjects";
import { ProjectList } from "./components/ProjectList";
import { EmptyState } from "./components/EmptyState";
import { Loader2 } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ProjectsPageContent() {
  const { projects, isLoadingProjects, error, loadProjects } =
    useCachedProjectsStore();
  const searchParams = useSearchParams();
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [loadingTimeoutReached, setLoadingTimeoutReached] = useState(false);

  // Single unified loading effect
  useEffect(() => {
    const shouldForceRefresh = searchParams.get("refresh") === "1";
    const shouldInitialLoad =
      !initialLoadDone && projects.length === 0 && !isLoadingProjects;

    console.log("[ProjectsPage] Loading check:", {
      shouldForceRefresh,
      shouldInitialLoad,
      projectsCount: projects.length,
      isLoading: isLoadingProjects,
      initialLoadDone,
    });

    if (shouldForceRefresh || shouldInitialLoad) {
      console.log("[ProjectsPage] Loading projects...");
      loadProjects(shouldForceRefresh);

      if (shouldForceRefresh) {
        // Remove the refresh param from the URL
        const url = new URL(window.location.href);
        url.searchParams.delete("refresh");
        window.history.replaceState(
          {},
          document.title,
          url.pathname + url.search
        );
      }

      if (!initialLoadDone) {
        setInitialLoadDone(true);
      }
    }
  }, [
    searchParams,
    projects.length,
    isLoadingProjects,
    loadProjects,
    initialLoadDone,
  ]);

  // Failsafe: if loading takes more than 3 seconds, show empty/error state
  useEffect(() => {
    if (isLoadingProjects && !loadingTimeoutReached) {
      const timeout = setTimeout(() => {
        console.log(
          "[ProjectsPage] Loading timeout reached - showing fallback UI"
        );
        setLoadingTimeoutReached(true);
      }, 3000);
      return () => clearTimeout(timeout);
    } else if (!isLoadingProjects && loadingTimeoutReached) {
      setLoadingTimeoutReached(false);
    }
  }, [isLoadingProjects, loadingTimeoutReached]);

  if (error) {
    console.error("[ProjectsPage] Error loading projects:", error);
  }

  // Determine what to show
  const showLoading = isLoadingProjects && !loadingTimeoutReached && !error;
  const showEmpty =
    (!isLoadingProjects || loadingTimeoutReached) && projects.length === 0;
  const showProjects = !isLoadingProjects && projects.length > 0;

  console.log("[ProjectsPage] Render state:", {
    projects: projects.length,
    isLoading: isLoadingProjects,
    error: !!error,
    timeoutReached: loadingTimeoutReached,
    showLoading,
    showEmpty,
    showProjects,
  });

  return (
    <>
      <div className="flex">
        {/* Sidebar: hidden on xs, shown ≥640px */}

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto px-2 py-6 md:px-10 md:py-10 transition-all">
          {showLoading ? (
            <div className="flex items-center gap-2 h-40 justify-center">
              <Loader2 className="animate-spin w-5 h-5 text-primary" />
              Loading projects...
            </div>
          ) : showEmpty ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
              <EmptyState />
              {error && (
                <p className="text-error mt-4 text-center text-sm">{error}</p>
              )}
              {loadingTimeoutReached && !error && (
                <p className="text-warning mt-4 text-center text-sm">
                  Loading timed out. Try refreshing the page.
                </p>
              )}
            </div>
          ) : showProjects ? (
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
              <ProjectList />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
              <EmptyState />
              <p className="text-warning mt-4 text-center text-sm">
                Unknown state. Try refreshing the page.
              </p>
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
