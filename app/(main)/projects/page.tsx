"use client";

import { useProjectsStore } from "@/hooks/useProjects";
import { ProjectList } from "@/src/components/projects/ProjectList";
import { BookOpen, Sparkles, Brain, Zap } from "lucide-react";
import { useEffect, useState, useRef, Suspense } from "react";

function ProjectsPageContent() {
  const { projects, loadProjects, reset } = useProjectsStore();
  const loading = true;
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Always reload projects on mount, and reset store to avoid stale state
  useEffect(() => {
    mountedRef.current = true;
    reset();

    setError(null);

    loadProjects()
      .then(() => {
        if (!mountedRef.current) return;
      })
      .catch((err) => {
        if (!mountedRef.current) return;
        setError(err?.message || "Failed to load projects");
      });

    return () => {
      mountedRef.current = false;
    };
  }, [loadProjects, reset]);

  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-glass rounded-full blur-3xl animate-pulse opacity-30" />
          <div
            className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-gradient-to-r from-brand-secondary/20 to-brand-accent/20 rounded-full blur-2xl animate-pulse opacity-40"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute top-1/2 right-1/2 w-16 h-16 bg-brand-primary/10 rounded-full blur-xl animate-pulse opacity-50"
            style={{ animationDelay: "4s" }}
          />
        </div>

        <div className="surface-elevated glass-surface border border-subtle rounded-2xl p-8 relative z-10 shadow-brand-lg">
          <div className="flex flex-col items-center space-y-6">
            {/* Multi-layered loading animation */}
            <div className="relative">
              {/* Outer ring */}
              <div className="w-16 h-16 border-4 border-secondary/20 border-t-brand-primary rounded-full animate-spin" />
              {/* Middle ring */}
              <div
                className="absolute inset-2 w-12 h-12 border-3 border-transparent border-r-brand-secondary rounded-full animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1.5s",
                }}
              />
              {/* Inner glow */}
              <div className="absolute inset-4 w-8 h-8 bg-gradient-brand rounded-full animate-pulse opacity-60" />
              {/* Center icon */}
              <div className="absolute inset-6 w-4 h-4 flex items-center justify-center">
                <Brain className="w-3 h-3 text-white animate-pulse" />
              </div>
            </div>

            <div className="text-center space-y-3">
              <h2 className="text-xl font-bold text-primary">
                Loading Projects
              </h2>
              <div className="flex items-center justify-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-brand-secondary rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-brand-accent rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-sm text-secondary ml-3 animate-pulse">
                  Preparing your workspace...
                </span>
              </div>
            </div>

            {/* Progress indicators */}
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-xs text-muted">
                <span>Initializing</span>
                <span>100%</span>
              </div>
              <div className="w-full bg-surface-secondary rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-brand rounded-full animate-pulse"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (projects.length === 0 && !error) {
    return (
      <div className="flex flex-col items-center justify-center relative overflow-hidden">
        {/* Animated background grid */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-border-subtle) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-glass rounded-full blur-3xl animate-pulse opacity-40" />
          <div
            className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-gradient-to-r from-brand-secondary/30 to-brand-accent/30 rounded-full blur-2xl animate-pulse opacity-50"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute top-1/2 right-1/3 w-16 h-16 bg-brand-primary/20 rounded-full blur-xl animate-pulse opacity-60"
            style={{ animationDelay: "4s" }}
          />
          <div
            className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-gradient-to-r from-brand-tertiary/20 to-brand-primary/20 rounded-full blur-2xl animate-pulse opacity-40"
            style={{ animationDelay: "6s" }}
          />
        </div>

        <div className="surface-elevated glass-surface border border-subtle interactive-hover transition-all duration-slower shadow-brand-lg rounded-3xl p-12 sm:p-16 text-center max-w-2xl mx-auto relative z-10 transform hover:scale-[1.01]">
          {/* Decorative corner elements */}
          <div className="absolute -top-2 -left-2 w-6 h-6 border-t-3 border-l-3 border-brand-primary rounded-tl-xl opacity-60" />
          <div className="absolute -top-2 -right-2 w-6 h-6 border-t-3 border-r-3 border-brand-secondary rounded-tr-xl opacity-60" />
          <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-3 border-l-3 border-brand-accent rounded-bl-xl opacity-60" />
          <div className="absolute -bottom-2 -right-2 w-6 h-6 border-b-3 border-r-3 border-brand-primary rounded-br-xl opacity-60" />

          <div className="flex flex-col items-center justify-center text-center">
            {/* Enhanced icon section */}
            <div className="relative mb-10">
              {/* Main icon container */}
              <div className="relative w-24 h-24 bg-gradient-brand rounded-3xl flex items-center justify-center shadow-brand-lg transform hover:scale-110 hover:rotate-6 transition-all duration-slower group cursor-pointer">
                <BookOpen
                  size={48}
                  className="text-white group-hover:scale-110 transition-transform duration-slower"
                />

                {/* Glow effect */}
                <div className="absolute -inset-3 bg-gradient-glass rounded-3xl blur-xl opacity-60 animate-pulse" />

                {/* Floating sparkles */}
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-brand-secondary to-brand-accent rounded-full flex items-center justify-center animate-bounce shadow-brand">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>

                {/* Additional floating elements */}
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-brand-tertiary/80 rounded-full animate-pulse" />
                <div className="absolute -top-1 left-8 w-4 h-4 bg-brand-accent/60 rounded-full animate-ping" />
              </div>

              {/* Orbiting elements */}
              <div
                className="absolute inset-0 animate-spin"
                style={{ animationDuration: "20s" }}
              >
                <div className="absolute -top-6 left-1/2 w-3 h-3 bg-brand-primary/40 rounded-full blur-sm" />
              </div>
              <div
                className="absolute inset-0 animate-spin"
                style={{
                  animationDuration: "15s",
                  animationDirection: "reverse",
                }}
              >
                <div className="absolute -bottom-6 left-1/4 w-2 h-2 bg-brand-secondary/50 rounded-full blur-sm" />
              </div>
            </div>

            {/* Enhanced content */}
            <div className="space-y-8 max-w-lg">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent">
                    No projects yet
                  </span>
                </h1>
                <p className="text-lg text-secondary leading-relaxed">
                  Start your learning journey by creating your first flashcard
                  project. Organize your knowledge, track your progress, and
                  master new topics with beautiful, interactive study sessions.
                </p>
              </div>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-brand-accent/20 to-brand-accent/10 rounded-xl flex items-center justify-center mx-auto">
                    <Sparkles className="w-5 h-5 brand-accent" />
                  </div>
                  <p className="text-sm font-medium text-secondary">
                    Beautiful UI
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-brand-primary/20 to-brand-primary/10 rounded-xl flex items-center justify-center mx-auto">
                    <Brain className="w-5 h-5 brand-primary" />
                  </div>
                  <p className="text-sm font-medium text-secondary">
                    Smart Learning
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="w-10 h-10 bg-gradient-to-r from-brand-secondary/20 to-brand-secondary/10 rounded-xl flex items-center justify-center mx-auto">
                    <Zap className="w-5 h-5 brand-secondary" />
                  </div>
                  <p className="text-sm font-medium text-secondary">
                    Fast Progress
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-8 max-w-md mx-auto relative z-10">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 glass-surface">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <p className="text-red-400 font-medium">
                  Failed to load projects
                </p>
              </div>
              <p className="text-red-400/80 text-sm mt-1 ml-5">{error}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
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

      {/* Subtle grid pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, var(--color-border-subtle) 1px, transparent 0)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Main content */}
      <main className="relative z-10 flex-1 px-4 sm:px-6 lg:px-8 py-8 md:py-12 transition-all">
        <div className="max-w-7xl mx-auto">
          <ProjectList />
        </div>

        {/* Error display for loaded state */}
        {error && projects.length > 0 && (
          <div className="fixed bottom-8 right-8 max-w-sm z-50">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 glass-surface shadow-brand animate-slideInRight">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <div className="flex-1">
                  <p className="text-red-400 font-medium text-sm">
                    Error occurred
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

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen relative">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-glass rounded-full blur-3xl animate-pulse opacity-30" />
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-gradient-to-r from-brand-secondary/20 to-brand-accent/20 rounded-full blur-2xl animate-pulse opacity-40" />
      </div>

      <div className="surface-elevated glass-surface border border-subtle rounded-2xl p-8 relative z-10 shadow-brand">
        <div className="flex flex-col items-center space-y-6">
          {/* Enhanced loading animation */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-secondary/20 border-t-brand-primary rounded-full animate-spin" />
            <div
              className="absolute inset-2 w-12 h-12 border-3 border-transparent border-r-brand-secondary rounded-full animate-spin"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            />
            <div className="absolute inset-4 w-8 h-8 bg-gradient-brand rounded-full animate-pulse opacity-60" />
          </div>

          <div className="text-center space-y-2">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-brand-primary rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-brand-secondary rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-brand-accent rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
              <span className="text-sm text-secondary animate-pulse">
                Loading...
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProjectsPageContent />
    </Suspense>
  );
}
