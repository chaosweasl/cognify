"use client";

import { useCachedProjectsStore } from "@/hooks/useCachedProjects";
import { ProjectList } from "./components/ProjectList";
import { EmptyState } from "./components/EmptyState";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function ProjectsPage() {
  const { projects, isLoadingProjects, error, loadProjects, lastFetch } =
    useCachedProjectsStore();

  // Auto-load projects when component mounts or if cache is stale
  useEffect(() => {
    const now = Date.now();
    const projectsLastFetch = lastFetch.projects || 0;
    const cacheAge = now - projectsLastFetch;
    const cacheExpiry = 10000; // 10 seconds for projects - much more responsive

    const shouldRefresh = !projectsLastFetch || cacheAge > cacheExpiry;

    console.log("[ProjectsPage] Cache check:", {
      projectsCount: projects.length,
      cacheAge: Math.round(cacheAge / 1000),
      shouldRefresh,
      isLoading: isLoadingProjects,
    });

    if (shouldRefresh && !isLoadingProjects) {
      console.log("[ProjectsPage] Loading fresh projects");
      loadProjects(true); // Force refresh
    }
  }, [projects.length, lastFetch.projects, isLoadingProjects, loadProjects]);

  if (error) {
    console.error("[ProjectsPage] Error loading projects:", error);
  }

  return (
    <>
      <div className="flex">
        {/* Sidebar: hidden on xs, shown ≥640px */}

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto px-2 py-6 md:px-10 md:py-10 transition-all">
          {isLoadingProjects ? (
            <div className="flex items-center gap-2 h-40 justify-center">
              <Loader2 className="animate-spin w-5 h-5 text-primary" />{" "}
              Loading...
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh]">
              <EmptyState />
            </div>
          ) : (
            <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 ">
              <ProjectList />
            </div>
          )}

          {error && (
            <p className="text-error mt-4 text-center text-lg font-semibold">
              {error}
            </p>
          )}
        </main>
      </div>
    </>
  );
}
