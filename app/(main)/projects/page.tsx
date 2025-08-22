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
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
          <div
            className="w-3 h-3 bg-violet-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <span className="text-sm text-slate-300 ml-2">Loading projects...</span>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] relative">
        <div className="bg-slate-800/40 border border-slate-600 backdrop-blur-sm hover:bg-slate-800/50 transition-all duration-500 shadow-2xl rounded-lg p-8 sm:p-12 text-center max-w-md mx-auto">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-xl flex items-center justify-center mb-6 border border-blue-500/30">
              <BookOpen
                size={32}
                className="text-blue-400"
              />
            </div>
            <div className="text-2xl sm:text-3xl font-bold mb-3 text-white">
              No projects yet
            </div>
            <div className="mb-6 text-sm sm:text-base text-slate-300 leading-relaxed">
              Start by creating your first flashcard project. Organize your
              learning and track your progress with beautiful, interactive cards.
            </div>
          </div>
        </div>
        {error && (
          <p className="text-red-400 mt-4 text-center text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex relative">
      <main className="flex-1 overflow-y-auto px-2 py-6 md:px-10 md:py-10 transition-all relative z-10">
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          <ProjectList />
        </div>
        {error && (
          <p className="text-red-400 mt-4 text-center text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 max-w-md mx-auto">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
            <div
              className="w-3 h-3 bg-violet-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <span className="text-sm text-slate-300 ml-2">Loading...</span>
          </div>
        </div>
      }
    >
      <ProjectsPageContent />
    </Suspense>
  );
}
