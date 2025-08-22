"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProjectsStore } from "@/hooks/useProjects";
import {
  Layers,
  Plus,
  FolderOpen,
  ChevronRight,
  X,
  Search,
  MoreHorizontal,
  BookOpen,
  Sparkles,
  Brain,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  activeTab: "all" | "create";
  onTab: (tab: "all" | "create") => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ activeTab, onTab }) => {
  const {
    projects,
    isLoadingProjects: loading,
    error,
    deleteProject,
  } = useProjectsStore();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Handle client-side hydration and mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Clear hovered state on window blur / tab hide to avoid "stuck hover" when OS/browser steals focus
  useEffect(() => {
    const onBlur = () => setHoveredProject(null);
    const onVisibility = () => {
      if (document.hidden) setHoveredProject(null);
    };

    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Filter projects based on search
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to truncate project name
  const truncateTitle = (title: string, max: number = 22) =>
    title.length > max ? title.slice(0, max) + "..." : title;

  // Handle navigation with mobile close
  const handleNavigation = (tab: "all" | "create", path?: string) => {
    onTab(tab);
    if (path) {
      router.push(path);
    }
    if (isMobile) {
      setIsOpen(false);
    }
  };

  // Handle project click with mobile close
  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Floating Mobile Toggle with Glow Effect */}
      {isMobile && (
        <div
          className={cn(
            "fixed top-1/2 -translate-y-1/2 z-50 transition-all duration-slow",
            isOpen ? "left-64" : "left-0"
          )}
        >
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-12 h-16 rounded-r-2xl border-l-0 shadow-2xl group relative overflow-hidden",
              "bg-gradient-to-r from-surface-secondary to-surface-elevated border-subtle",
              "hover:bg-gradient-brand hover:border-brand",
              "transform hover:scale-105 hover:shadow-brand transition-all transition-normal"
            )}
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
          >
            <div className="absolute inset-0 bg-gradient-glass opacity-0 group-hover:opacity-100 transition-opacity transition-normal" />
            <div className="relative z-10 transform group-hover:scale-110 transition-transform transition-normal">
              {isOpen ? (
                <X className="w-5 h-5 text-primary" />
              ) : (
                <ChevronRight className="w-5 h-5 text-primary group-hover:brand-primary" />
              )}
            </div>
          </Button>
        </div>
      )}

      {/* Enhanced Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-all transition-normal"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Sidebar with Glass Morphism */}
      <nav
        className={cn(
          "flex flex-col w-64 relative",
          "glass-surface shadow-brand-lg",
          isMobile
            ? cn(
                "fixed top-0 left-0 h-screen z-40 transition-all duration-slow",
                isOpen ? "translate-x-0" : "-translate-x-full"
              )
            : "hidden md:flex"
        )}
      >
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div
            className="absolute top-0 left-0 w-full h-1/3 bg-gradient-glass animate-pulse"
            style={{ animationDuration: "4s" }}
          />
          <div
            className="absolute bottom-0 right-0 w-full h-1/3 bg-gradient-glass animate-pulse"
            style={{ animationDuration: "6s", animationDelay: "2s" }}
          />
        </div>

        {/* Enhanced Header Section */}
        <div className="relative p-6 border-b border-subtle">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all transition-normal shadow-brand">
                  <FolderOpen className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-glass rounded-xl blur opacity-0 group-hover:opacity-100 transition-all transition-normal" />
              </div>
              <h2 className="text-xl font-bold text-primary group-hover:brand-primary transition-colors transition-normal">
                Projects
              </h2>
            </div>
            {/* Mobile Close Button */}
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 text-muted hover:text-primary interactive-hover rounded-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Enhanced Search Input */}
          <div className="relative group">
            <Search
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-all transition-normal",
                isSearchFocused ? "brand-primary scale-110" : "text-muted"
              )}
            />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={cn(
                "pl-10 h-10 transition-all transition-normal",
                "surface-secondary border-secondary text-primary placeholder:text-muted",
                "focus:surface-elevated focus:border-brand focus:shadow-brand interactive-focus",
                "interactive-hover"
              )}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted hover:text-primary"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Enhanced Navigation Buttons */}
        <div className="relative p-4 space-y-2">
          {/* All Projects Button */}
          <Button
            variant={activeTab === "all" ? "default" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 h-12 px-4 rounded-xl transition-all transition-normal group relative overflow-hidden",
              activeTab === "all"
                ? "bg-gradient-brand text-white shadow-brand hover:shadow-brand-lg"
                : "text-secondary hover:text-primary interactive-hover border-secondary"
            )}
            onClick={() => handleNavigation("all", "/projects")}
          >
            {activeTab === "all" && (
              <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />
            )}
            <div className="relative z-10 flex items-center gap-3">
              <Layers
                className={cn(
                  "w-5 h-5 transition-all transition-normal",
                  activeTab === "all"
                    ? "text-white"
                    : "text-muted group-hover:brand-primary"
                )}
              />
              <span className="font-semibold">All Projects</span>
              {projects.length > 0 && (
                <Badge
                  variant={activeTab === "all" ? "secondary" : "outline"}
                  className={cn(
                    "ml-auto text-xs px-2.5 py-0.5 transition-all transition-normal",
                    activeTab === "all"
                      ? "bg-white/20 text-white border-white/30"
                      : "surface-elevated text-secondary border-secondary"
                  )}
                >
                  {projects.length}
                </Badge>
              )}
            </div>
          </Button>

          {/* Create New Button */}
          <Button
            variant={activeTab === "create" ? "default" : "ghost"}
            className={cn(
              "w-full justify-start gap-3 h-12 px-4 rounded-xl transition-all transition-normal group relative overflow-hidden",
              activeTab === "create"
                ? "bg-gradient-to-r from-brand-secondary to-brand-accent text-white shadow-brand hover:shadow-brand-lg"
                : "text-secondary hover:text-primary interactive-hover border-secondary"
            )}
            onClick={() => handleNavigation("create", "/projects/create")}
          >
            {activeTab === "create" && (
              <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />
            )}
            <div className="relative z-10 flex items-center gap-3">
              <Plus
                className={cn(
                  "w-5 h-5 transition-all transition-normal",
                  activeTab === "create"
                    ? "text-white"
                    : "text-muted group-hover:brand-secondary"
                )}
              />
              <span className="font-semibold">Create New</span>
            </div>
          </Button>
        </div>

        {/* Animated Divider */}
        <div className="mx-4 my-2 relative">
          <div className="h-px bg-gradient-to-r from-transparent via-border-primary to-transparent" />
          <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-brand-primary/30 to-transparent animate-pulse" />
        </div>

        {/* Enhanced Projects List Section */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          <div className="px-6 py-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Recent Projects
            </h3>
            {searchQuery && (
              <Badge
                variant="outline"
                className="text-xs surface-elevated text-secondary border-secondary"
              >
                {filteredProjects.length} found
              </Badge>
            )}
          </div>

          {/* Enhanced Scrollable Project List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 custom-scrollbar">
            {loading && projects.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="relative mb-6">
                  <div className="w-12 h-12 border-3 border-secondary border-t-brand-primary rounded-full animate-spin" />
                  <div
                    className="absolute inset-0 w-12 h-12 border-3 border-transparent border-r-brand-secondary rounded-full animate-spin"
                    style={{
                      animationDirection: "reverse",
                      animationDuration: "1.5s",
                    }}
                  />
                </div>
                <p className="text-secondary font-medium">
                  Loading projects...
                </p>
                <p className="text-muted text-sm mt-1">
                  Preparing your workspace
                </p>
              </div>
            )}

            {error && (
              <Card className="border-red-500/20 bg-red-500/5 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <p className="text-sm text-red-400 font-semibold">
                      Error loading projects
                    </p>
                  </div>
                  <p className="text-xs text-red-400/80">{error}</p>
                </CardContent>
              </Card>
            )}

            {!loading &&
              !error &&
              filteredProjects.length === 0 &&
              !searchQuery && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 surface-elevated rounded-2xl flex items-center justify-center">
                      <FolderOpen className="w-8 h-8 text-muted" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-brand rounded-full flex items-center justify-center animate-bounce">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <p className="text-primary font-semibold text-lg mb-2">
                    No projects yet
                  </p>
                  <p className="text-muted text-sm mb-6 max-w-48 leading-relaxed">
                    Create your first project and start building your knowledge
                    base
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gradient-glass border-brand text-brand-primary hover:bg-gradient-brand hover:border-brand hover:text-white"
                    onClick={() =>
                      handleNavigation("create", "/projects/create")
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                </div>
              )}

            {!loading &&
              !error &&
              filteredProjects.length === 0 &&
              searchQuery && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 surface-elevated rounded-2xl flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-muted" />
                  </div>
                  <p className="text-primary font-medium">No projects found</p>
                  <p className="text-muted text-sm mt-1">
                    Try a different search term
                  </p>
                </div>
              )}

            {/* Enhanced Project Items */}
            {filteredProjects.map((project, index) => (
              <div
                key={project.id}
                onPointerEnter={() => setHoveredProject(project.id)}
                onPointerLeave={() =>
                  setHoveredProject((prev) =>
                    prev === project.id ? null : prev
                  )
                }
                className={cn(
                  "group relative rounded-xl transition-all transition-normal transform",
                  "interactive-hover hover:shadow-brand hover:scale-[1.02]",
                  hoveredProject === project.id &&
                    "surface-elevated scale-[1.01]"
                )}
                style={{
                  animation: `slideInLeft 0.5s ease-out ${index * 0.1}s both`,
                }}
              >
                {/* Hover glow effect */}
                <div
                  className={cn(
                    "absolute -inset-0.5 bg-gradient-glass rounded-xl blur opacity-0 transition-opacity transition-normal",
                    hoveredProject === project.id && "opacity-100"
                  )}
                />

                <Button
                  variant="ghost"
                  className="relative w-full justify-start p-4 h-auto gap-4 hover:bg-transparent rounded-xl"
                  title={project.name}
                  onClick={() => handleProjectClick(project.id)}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Project indicator with pulse */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full transition-all transition-normal",
                          index % 4 === 0
                            ? "bg-brand-primary"
                            : index % 4 === 1
                            ? "bg-brand-secondary"
                            : index % 4 === 2
                            ? "bg-brand-tertiary"
                            : "bg-pink-500",
                          hoveredProject === project.id
                            ? "scale-125 shadow-brand"
                            : "scale-100"
                        )}
                      />
                      {hoveredProject === project.id && (
                        <div
                          className={cn(
                            "absolute inset-0 w-3 h-3 rounded-full animate-ping",
                            index % 4 === 0
                              ? "bg-brand-primary/40"
                              : index % 4 === 1
                              ? "bg-brand-secondary/40"
                              : index % 4 === 2
                              ? "bg-brand-tertiary/40"
                              : "bg-pink-500/40"
                          )}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-semibold text-primary group-hover:text-primary truncate transition-colors transition-normal mb-1">
                        {truncateTitle(project.name)}
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-muted group-hover:text-secondary transition-colors transition-normal">
                          <BookOpen className="w-3 h-3" />
                          <span>
                            {project.stats ? project.stats.totalFlashcards : 0}{" "}
                            cards
                          </span>
                        </div>
                        {project.stats &&
                          (project.stats.dueCards > 0 ||
                            project.stats.learningCards > 0 ||
                            project.stats.availableNewCards > 0) && (
                            <span
                              className="flex items-center"
                              title="Ready to Study"
                            >
                              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1 mt-[2px]" />
                              <span className="sr-only">Ready to Study</span>
                            </span>
                          )}
                      </div>
                    </div>
                  </div>
                </Button>

                {/* Enhanced Project Actions Dropdown */}
                <div
                  className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 opacity-0 transition-all transition-normal transform scale-95",
                    "group-hover:opacity-100 group-hover:scale-100"
                  )}
                >
                  <DropdownMenu
                    onOpenChange={(open) => {
                      if (open) setHoveredProject(null);
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 surface-secondary interactive-hover border border-subtle rounded-lg glass-surface"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-3 h-3 text-secondary" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-44 surface-overlay glass-surface border-subtle"
                    >
                      <DropdownMenuItem
                        className="text-primary hover:text-primary interactive-hover interactive-focus"
                        onSelect={() => router.push(`/projects/${project.id}`)}
                      >
                        Study Project
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-primary hover:text-primary interactive-hover interactive-focus"
                        onSelect={() =>
                          router.push(`/projects/${project.id}/edit`)
                        }
                      >
                        Edit Project
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus-visible:text-red-300 focus-visible:bg-red-500/10"
                        onSelect={async () => {
                          try {
                            await deleteProject(project.id);
                          } catch (err) {
                            console.error("Failed to delete project", err);
                          }
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Footer */}
        <div className="relative p-4 border-t border-subtle surface-secondary glass-surface">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-muted">
              <Brain className="w-4 h-4" />
              <span>
                {filteredProjects.length}{" "}
                {filteredProjects.length === 1 ? "project" : "projects"}
                {searchQuery && " (filtered)"}
              </span>
            </div>
            {projects.length > 0 && (
              <Badge
                variant="outline"
                className="text-xs bg-green-500/10 text-green-400 border-green-500/30 animate-pulse"
              >
                Active
              </Badge>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};
