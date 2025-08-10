"use client";

import { useEnhancedProjects } from "@/components/CacheProvider";
import { ProjectList } from "./components/ProjectList";
import { EmptyState } from "./components/EmptyState";
import { Loader2 } from "lucide-react";

export default function ProjectsPage() {
  const { projects, isLoadingProjects, error } = useEnhancedProjects();

  console.log("[ProjectsPage] Projects loaded:", projects.length);

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
