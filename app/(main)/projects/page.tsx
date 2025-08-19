"use client";

import { useProjectsStore } from "@/hooks/useProjects";
import { ProjectList } from "@/src/components/projects/ProjectList";
import { BookOpen } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ProjectsPageContent() {
  const { projects, loadProjects } = useProjectsStore();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load projects on mount or when refresh param is present
  useEffect(() => {
    const shouldForceRefresh = searchParams.get("refresh") === "1";
    const shouldInitialLoad = projects.length === 0;

    if (shouldForceRefresh || shouldInitialLoad) {
      setLoading(true);
      setError(null);
      
      loadProjects()
        .then(() => setLoading(false))
        .catch((err) => {
          setError(err.message || "Failed to load projects");
          setLoading(false);
        });

      if (shouldForceRefresh) {
        // Remove the refresh param from the URL
        const url = new URL(window.location.href);
        url.searchParams.delete("refresh");
        window.history.replaceState({}, document.title, url.pathname + url.search);
      }
    }
  }, [searchParams, loadProjects, projects.length]);

  // IMPROVEMENT: Refresh projects when page regains focus (user comes back from editing)
  // This helps ensure they see their latest changes without manual refresh
  useEffect(() => {
    const handleFocus = () => {
      console.log("[ProjectsPage] Page regained focus, refreshing projects");
      setLoading(true);
      setError(null);
      
      loadProjects()
        .then(() => setLoading(false))
        .catch((err) => {
          setError(err.message || "Failed to load projects");
          setLoading(false);
        });
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadProjects]);

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center h-64"
        role="status"
        aria-label="Loading projects"
      >
        <div className="loading loading-spinner loading-lg"></div>
        <span className="sr-only">Loading your projects...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="flex flex-col items-center justify-center h-full min-h-[60vh] px-4"
        role="alert"
        aria-live="assertive"
      >
        <div className="alert alert-error max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold">Unable to load projects</h3>
            <div className="text-xs">{error}</div>
          </div>
        </div>
        <button 
          className="btn btn-primary mt-4"
          onClick={() => {
            setLoading(true);
            setError(null);
            loadProjects()
              .then(() => setLoading(false))
              .catch((err) => {
                setError(err.message || "Failed to load projects");
                setLoading(false);
              });
          }}
          aria-label="Retry loading projects"
        >
          Try Again
        </button>
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
            aria-hidden="true"
          />
          <div className="text-3xl font-extrabold mb-2 tracking-tight text-base-content">
            No projects yet
          </div>
          <div className="mb-8 text-lg text-base-content/80 max-w-md">
            Start by creating your first flashcard project. Organize your learning and
            track your progress with beautiful, interactive cards.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <main 
        className="flex-1 overflow-y-auto px-2 py-6 md:px-10 md:py-10 transition-all"
        role="main"
        aria-label="Projects dashboard"
      >
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          <ProjectList />
        </div>
        {error && (
          <div 
            className="alert alert-warning mt-6 max-w-2xl mx-auto"
            role="alert"
            aria-live="polite"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.667-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="font-bold">Warning</h3>
              <div className="text-xs">{error}</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="loading loading-spinner loading-lg"></div>}>
      <ProjectsPageContent />
    </Suspense>
  );
}
