"use client";

import { useProjectsStore } from "@/hooks/useProjects";
import { ProjectList } from "@/src/components/projects/ProjectList";
import { ProjectGridSkeleton } from "@/src/components/ui/skeleton-layouts";
import { MobileButton } from "@/src/components/ui/mobile-components";
import { EmptyState } from "@/src/components/ui/onboarding";
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
  FileText,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState, useRef, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Head from "next/head";

function ProjectsPageContent() {
  const { projects, loadProjects, reset } = useProjectsStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const router = useRouter();

  // SEO and page metadata
  useEffect(() => {
    document.title = "Your Projects - Cognify";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute(
        "content",
        "Manage your learning projects and AI-generated flashcards. Create, organize, and study with intelligent spaced repetition."
      );
    }
  }, []);

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

  // Error state - something went wrong loading projects
  if (error && projects.length === 0) {
    return (
      <div className="min-h-screen surface-primary relative flex items-center justify-center">
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-primary mb-4">
              Oops! Something went wrong
            </h2>
            <p className="text-secondary mb-6">
              We couldn't load your projects right now. This might be a
              temporary connection issue.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => window.location.reload()}
                className="bg-gradient-brand hover:bg-gradient-brand-hover text-white"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
              </Button>
            </div>
            {error && (
              <details className="mt-6 p-4 bg-surface-elevated rounded-lg border border-subtle text-left">
                <summary className="text-sm font-medium text-secondary cursor-pointer">
                  Technical Details
                </summary>
                <p className="text-xs text-muted mt-2 font-mono">{error}</p>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Enhanced empty state (no projects)
  if (projects.length === 0 && !error) {
    return (
      <div className="min-h-screen surface-primary relative flex items-center justify-center">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-brand rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-brand-secondary/30 to-brand-accent/30 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
        </div>

        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-24 h-24 bg-gradient-brand rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-brand-lg">
              <Brain className="w-12 h-12 text-white" />
            </div>

            <h1 className="text-4xl font-bold text-primary mb-4">
              Start Your Learning Journey
            </h1>

            <p className="text-xl text-secondary mb-8">
              Create your first project to transform PDFs into smart flashcards
              or build custom study sets.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                onClick={() => router.push("/projects/create")}
                className="bg-gradient-brand hover:bg-gradient-brand-hover text-white text-lg px-8 py-4 h-auto shadow-brand-lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Project
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  // Could open a demo or tutorial
                  router.push("/dashboard");
                }}
                className="text-lg px-8 py-4 h-auto"
              >
                <Lightbulb className="mr-2 h-5 w-5" />
                See How It Works
              </Button>
            </div>

            {/* Quick feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="glass-surface rounded-xl p-6 border border-subtle">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="font-semibold text-primary mb-2">Upload PDFs</h3>
                <p className="text-sm text-secondary">
                  Turn any PDF into interactive flashcards with AI
                </p>
              </div>

              <div className="glass-surface rounded-xl p-6 border border-subtle">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-purple-500" />
                </div>
                <h3 className="font-semibold text-primary mb-2">
                  Smart Learning
                </h3>
                <p className="text-sm text-secondary">
                  Spaced repetition algorithm adapts to your progress
                </p>
              </div>

              <div className="glass-surface rounded-xl p-6 border border-subtle">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-semibold text-primary mb-2">
                  Track Progress
                </h3>
                <p className="text-sm text-secondary">
                  Monitor your learning with detailed analytics
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main projects view with ProjectList
  return (
    <div className="relative overflow-y-auto min-h-screen">
      {/* Show loading skeleton while projects are loading */}
      {loading && <ProjectGridSkeleton />}

      {!loading && (
        <>
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
        </>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense>
      <ProjectsPageContent />
    </Suspense>
  );
}
