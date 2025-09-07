"use client";

import { useProjectsStore } from "@/hooks/useProjects";
import { ProjectList } from "@/src/components/projects/ProjectList";
import { LoadingState } from "@/components/ui/loading-states";
import {
  Sparkles,
  Brain,
  Loader2,
  FolderOpen,
  Plus,
  Coffee,
  Lightbulb,
  TrendingUp,
  Star,
  Clock,
} from "lucide-react";
import { useEffect, useState, useRef, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

function ProjectsPageContent() {
  const { projects, loadProjects, reset } = useProjectsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const router = useRouter();

  // Always reload projects on mount, and reset store to avoid stale state
  useEffect(() => {
    mountedRef.current = true;
    reset();

    setLoading(true);
    setError(null);

    loadProjects()
      .then(() => {
        if (!mountedRef.current) return;
        setLoading(false);
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        setError(err?.message || "Failed to load projects");
        setLoading(false);
      });

    return () => {
      mountedRef.current = false;
    };
  }, [loadProjects, reset]);

  // Enhanced loading state
  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 left-1/4 w-40 h-40 bg-gradient-glass rounded-full blur-3xl animate-pulse opacity-40"
            style={{ animationDuration: "3s" }}
          />
          <div
            className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-gradient-to-r from-brand-secondary/20 to-brand-accent/20 rounded-full blur-2xl animate-pulse opacity-50"
            style={{ animationDuration: "4s", animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 right-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-brand-primary/15 rounded-full blur-xl animate-pulse opacity-60"
            style={{ animationDuration: "5s", animationDelay: "2s" }}
          />
          <div
            className="absolute top-3/4 left-1/3 w-20 h-20 bg-gradient-to-r from-brand-tertiary/15 to-brand-primary/15 rounded-full blur-2xl animate-pulse opacity-40"
            style={{ animationDuration: "6s", animationDelay: "3s" }}
          />
        </div>

        {/* Subtle animated grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div
            className="absolute inset-0 animate-pulse"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, var(--color-brand-primary) 1px, transparent 0)`,
              backgroundSize: "60px 60px",
              animationDuration: "8s",
            }}
          />
        </div>

        <div className="surface-elevated glass-surface border border-subtle rounded-3xl p-12 max-w-2xl w-full mx-4 relative z-10 shadow-brand-lg">
          <div className="flex flex-col items-center space-y-8">
            {/* Enhanced multi-layered loading animation */}
            <div className="relative mb-6">
              {/* Outer spinning ring */}
              <div className="w-32 h-32 border-4 border-secondary/20 border-t-brand-primary rounded-full animate-spin" />

              {/* Middle counter-spinning ring */}
              <div
                className="absolute inset-4 w-24 h-24 border-3 border-transparent border-r-brand-secondary rounded-full animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "2s",
                }}
              />

              {/* Inner pulsing core */}
              <div className="absolute inset-8 w-16 h-16 bg-gradient-brand rounded-full animate-pulse opacity-80" />

              {/* Center brain icon */}
              <div className="absolute inset-12 w-8 h-8 flex items-center justify-center">
                <Brain className="w-8 h-8 text-white animate-pulse drop-shadow-sm" />
              </div>

              {/* Orbiting dots */}
              <div
                className="absolute inset-0 animate-spin"
                style={{ animationDuration: "12s" }}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-brand-accent rounded-full animate-pulse" />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-brand-secondary rounded-full animate-pulse" />
              </div>
            </div>

            <div className="text-center space-y-6">
              <h2 className="text-4xl font-bold text-primary">
                Loading Your Projects
              </h2>

              <div className="flex items-center justify-center space-x-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-brand-primary rounded-full animate-bounce"></div>
                  <div
                    className="w-3 h-3 bg-brand-secondary rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-3 h-3 bg-brand-accent rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-3 h-3 bg-brand-tertiary rounded-full animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  ></div>
                </div>
                <div className="flex items-center gap-2 text-lg text-secondary animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Preparing your workspace...</span>
                </div>
              </div>
            </div>

            {/* Enhanced progress indicators */}
            <div className="w-full max-w-lg space-y-4">
              <div className="flex justify-between text-sm text-muted">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Initializing
                </span>
                <span className="font-mono">100%</span>
              </div>
              <div className="w-full bg-surface-secondary rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-brand rounded-full animate-pulse shadow-brand"
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* Loading tips */}
            <div className="text-center space-y-2 max-w-md">
              <p className="text-sm text-secondary leading-relaxed">
                <strong className="brand-primary">Pro Tip:</strong> Create
                projects to organize different subjects, then let our AI
                generate smart flashcards from your notes!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced empty state (no projects)
  if (projects.length === 0 && !error) {
    return (
      <div className="flex flex-col items-center justify-center relative overflow-hidden min-h-[80vh]">
        {/* Enhanced animated background grid */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div
            className="absolute inset-0 animate-pulse"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, var(--color-border-subtle) 1px, transparent 0)`,
              backgroundSize: "50px 50px",
              animationDuration: "10s",
            }}
          />
        </div>

        {/* Enhanced floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-gradient-glass rounded-full blur-3xl animate-pulse opacity-30" />
          <div
            className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-gradient-to-r from-brand-secondary/25 to-brand-accent/25 rounded-full blur-2xl animate-pulse opacity-40"
            style={{ animationDelay: "2s", animationDuration: "8s" }}
          />
          <div
            className="absolute top-1/2 right-1/3 w-24 h-24 bg-brand-primary/20 rounded-full blur-xl animate-pulse opacity-50"
            style={{ animationDelay: "4s", animationDuration: "6s" }}
          />
          <div
            className="absolute bottom-1/4 left-1/3 w-28 h-28 bg-gradient-to-r from-brand-tertiary/20 to-brand-primary/20 rounded-full blur-2xl animate-pulse opacity-35"
            style={{ animationDelay: "6s", animationDuration: "12s" }}
          />
          <div
            className="absolute top-1/6 right-1/6 w-16 h-16 bg-brand-accent/15 rounded-full blur-lg animate-pulse opacity-45"
            style={{ animationDelay: "8s", animationDuration: "4s" }}
          />
        </div>

        <div className="surface-elevated glass-surface border border-subtle interactive-hover transition-all duration-slower shadow-brand-lg rounded-3xl p-16 text-center max-w-3xl mx-4 relative z-10 transform hover:scale-[1.02]">
          {/* Enhanced decorative corner elements */}
          <div className="absolute -top-3 -left-3 w-8 h-8 border-t-4 border-l-4 border-brand-primary rounded-tl-2xl opacity-70" />
          <div className="absolute -top-3 -right-3 w-8 h-8 border-t-4 border-r-4 border-brand-secondary rounded-tr-2xl opacity-70" />
          <div className="absolute -bottom-3 -left-3 w-8 h-8 border-b-4 border-l-4 border-brand-accent rounded-bl-2xl opacity-70" />
          <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b-4 border-r-4 border-brand-primary rounded-br-2xl opacity-70" />

          <div className="flex flex-col items-center justify-center text-center">
            {/* Enhanced main icon section */}
            <div className="relative mb-12">
              {/* Main icon container */}
              <div className="relative w-32 h-32 bg-gradient-brand rounded-3xl flex items-center justify-center shadow-brand-lg transform hover:scale-110 hover:rotate-3 transition-all duration-slower group cursor-pointer">
                <FolderOpen
                  size={64}
                  className="text-white group-hover:scale-110 transition-transform duration-slower drop-shadow-lg"
                />

                {/* Enhanced glow effect */}
                <div className="absolute -inset-4 bg-gradient-glass rounded-3xl blur-2xl opacity-60 animate-pulse" />

                {/* Floating sparkles */}
                <div className="absolute -top-4 -right-4 w-10 h-10 bg-gradient-to-r from-brand-secondary to-brand-accent rounded-full flex items-center justify-center animate-bounce shadow-brand">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>

                {/* Additional floating elements */}
                <div className="absolute -bottom-3 -left-3 w-8 h-8 bg-brand-tertiary/80 rounded-full animate-pulse shadow-lg" />
                <div className="absolute -top-2 left-10 w-5 h-5 bg-brand-accent/60 rounded-full animate-ping" />
                <div className="absolute -bottom-1 right-8 w-3 h-3 bg-brand-primary/70 rounded-full animate-bounce" />
              </div>

              {/* Enhanced orbiting elements */}
              <div
                className="absolute inset-0 animate-spin pointer-events-none"
                style={{ animationDuration: "20s" }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-4 h-4 bg-brand-primary/40 rounded-full blur-sm" />
                <div className="absolute top-1/2 -right-8 -translate-y-1/2 w-3 h-3 bg-brand-secondary/50 rounded-full blur-sm" />
              </div>
              <div
                className="absolute inset-0 animate-spin pointer-events-none"
                style={{
                  animationDuration: "15s",
                  animationDirection: "reverse",
                }}
              >
                <div className="absolute -bottom-8 left-1/4 w-3 h-3 bg-brand-accent/50 rounded-full blur-sm" />
                <div className="absolute top-1/4 -left-8 w-2 h-2 bg-brand-tertiary/60 rounded-full blur-sm" />
              </div>
            </div>

            {/* Enhanced content section */}
            <div className="space-y-10 max-w-2xl">
              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent">
                    Welcome to Cognify
                  </span>
                </h1>
                <p className="text-xl text-secondary leading-relaxed">
                  Ready to supercharge your learning? Create your first project
                  and discover how AI-powered flashcards can transform the way
                  you study and retain knowledge.
                </p>
              </div>

              {/* Enhanced feature highlights grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                <div className="space-y-3 p-4 surface-secondary rounded-2xl border border-subtle hover:border-brand transition-all duration-slower group">
                  <div className="w-14 h-14 bg-gradient-to-r from-brand-accent/20 to-brand-accent/10 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-slower">
                    <Sparkles className="w-7 h-7 brand-accent" />
                  </div>
                  <h3 className="font-bold text-primary">AI-Powered</h3>
                  <p className="text-sm text-secondary leading-relaxed">
                    Smart flashcard generation from your notes and documents
                  </p>
                </div>

                <div className="space-y-3 p-4 surface-secondary rounded-2xl border border-subtle hover:border-brand transition-all duration-slower group">
                  <div className="w-14 h-14 bg-gradient-to-r from-brand-primary/20 to-brand-primary/10 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-slower">
                    <Brain className="w-7 h-7 brand-primary" />
                  </div>
                  <h3 className="font-bold text-primary">Spaced Repetition</h3>
                  <p className="text-sm text-secondary leading-relaxed">
                    Scientifically proven method to maximize long-term retention
                  </p>
                </div>

                <div className="space-y-3 p-4 surface-secondary rounded-2xl border border-subtle hover:border-brand transition-all duration-slower group">
                  <div className="w-14 h-14 bg-gradient-to-r from-brand-secondary/20 to-brand-secondary/10 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-slower">
                    <TrendingUp className="w-7 h-7 brand-secondary" />
                  </div>
                  <h3 className="font-bold text-primary">Progress Tracking</h3>
                  <p className="text-sm text-secondary leading-relaxed">
                    Detailed analytics to monitor your learning journey
                  </p>
                </div>
              </div>

              {/* Enhanced call-to-action */}
              <div className="space-y-6">
                <Button
                  onClick={() => router.push("/projects/create")}
                  className="bg-gradient-brand hover:bg-gradient-brand-hover text-white shadow-brand-lg hover:shadow-brand px-8 py-4 rounded-2xl text-lg font-bold transform hover:scale-105 transition-all duration-slower group relative overflow-hidden"
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <div className="relative z-10 flex items-center gap-3">
                    <Plus className="w-6 h-6" />
                    <span>Create Your First Project</span>
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                </Button>

                <div className="flex items-center justify-center gap-6 text-sm text-muted">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4" />
                    <span>Takes 2 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    <span>No setup required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    <span>Free to start</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced error display for empty state */}
        {error && (
          <div className="mt-10 max-w-md mx-auto relative z-10">
            <div className="bg-red-500/10 border-2 border-red-500/20 rounded-2xl p-6 glass-surface shadow-brand">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <div className="flex-1">
                  <p className="text-red-400 font-semibold text-lg">
                    Unable to Load Projects
                  </p>
                  <p className="text-red-400/80 text-sm mt-2 leading-relaxed">
                    {error}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full mt-4 border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all duration-slower"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Main projects view with ProjectList
  return (
    <div className="relative overflow-y-auto min-h-screen">
      {/* Enhanced animated background elements for main view */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-15">
        <div
          className="absolute top-0 right-0 w-96 h-96 bg-gradient-glass rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-r from-brand-secondary/30 to-brand-accent/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "12s", animationDelay: "4s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-primary/20 rounded-full blur-2xl animate-pulse"
          style={{ animationDuration: "10s", animationDelay: "2s" }}
        />
      </div>

      {/* Enhanced subtle grid pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-8">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, var(--color-border-subtle) 1px, transparent 0)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Main content with enhanced styling */}
      <main className="relative z-10 flex-1 px-4 sm:px-6 lg:px-8 py-8 md:py-12 transition-all">
        <div className="max-w-7xl mx-auto">
          <ProjectList />
        </div>

        {/* Enhanced error display for loaded state */}
        {error && projects.length > 0 && (
          <div className="fixed bottom-8 right-8 max-w-sm z-50">
            <div className="bg-red-500/10 border-2 border-red-500/20 rounded-2xl p-4 glass-surface shadow-brand animate-slideInRight">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <div className="flex-1">
                  <p className="text-red-400 font-semibold text-sm">
                    Something went wrong
                  </p>
                  <p className="text-red-400/80 text-xs mt-1">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ProjectsPageContent />
    </Suspense>
  );
}
