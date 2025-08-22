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
  const { projects, isLoadingProjects: loading, error } = useProjectsStore();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  // track whether any project's dropdown is open
  const [menuOpen, setMenuOpen] = useState(false);

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
            "fixed top-1/2 -translate-y-1/2 z-50 transition-all duration-500",
            isOpen ? "left-64" : "left-0"
          )}
        >
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-12 h-16 rounded-r-2xl border-l-0 shadow-2xl group relative overflow-hidden",
              "bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700",
              "hover:from-blue-500/20 hover:to-violet-500/20 hover:border-blue-500/50",
              "transform hover:scale-105 hover:shadow-blue-500/25 transition-all duration-300"
            )}
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
              {isOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <ChevronRight className="w-5 h-5 text-white group-hover:text-blue-300" />
              )}
            </div>
          </Button>
        </div>
      )}

      {/* Enhanced Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main Sidebar with Glass Morphism */}
      <nav
        className={cn(
          "flex flex-col w-64 relative",
          "bg-gradient-to-b from-slate-900/95 via-slate-800/95 to-slate-900/95",
          "backdrop-blur-xl border-r border-slate-700/50 shadow-2xl",
          isMobile
            ? cn(
                "fixed top-0 left-0 h-screen z-40 transition-all duration-500",
                isOpen ? "translate-x-0" : "-translate-x-full"
              )
            : "fixed top-[64px] left-0 h-[calc(100vh-4rem)] hidden md:flex z-30"
        )}
      >
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div
            className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-br from-blue-500/10 to-transparent animate-pulse"
            style={{ animationDuration: "4s" }}
          />
          <div
            className="absolute bottom-0 right-0 w-full h-1/3 bg-gradient-to-tl from-violet-500/10 to-transparent animate-pulse"
            style={{ animationDuration: "6s", animationDelay: "2s" }}
          />
        </div>

        {/* Enhanced Header Section */}
        <div className="relative p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <FolderOpen className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/30 to-violet-500/30 rounded-xl blur opacity-0 group-hover:opacity-100 transition-all duration-300" />
              </div>
              <h2 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors duration-300">
                Projects
              </h2>
            </div>
            {/* Mobile Close Button */}
            {isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Enhanced Search Input */}
          <div className="relative group">
            <Search
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-all duration-300",
                isSearchFocused ? "text-blue-400 scale-110" : "text-slate-400"
              )}
            />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={cn(
                "pl-10 h-10 transition-all duration-300",
                "bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400",
                "focus:bg-slate-700/50 focus:border-blue-500/50 focus:shadow-lg focus:shadow-blue-500/10",
                "hover:bg-slate-700/30"
              )}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-slate-400 hover:text-white"
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
              "w-full justify-start gap-3 h-12 px-4 rounded-xl transition-all duration-300 group relative overflow-hidden",
              activeTab === "all"
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                : "text-slate-300 hover:text-white hover:bg-slate-700/50 border-slate-600/30"
            )}
            onClick={() => handleNavigation("all", "/projects")}
          >
            {activeTab === "all" && (
              <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
            )}
            <div className="relative z-10 flex items-center gap-3">
              <Layers
                className={cn(
                  "w-5 h-5 transition-all duration-300",
                  activeTab === "all"
                    ? "text-white"
                    : "text-slate-400 group-hover:text-blue-400"
                )}
              />
              <span className="font-semibold">All Projects</span>
              {projects.length > 0 && (
                <Badge
                  variant={activeTab === "all" ? "secondary" : "outline"}
                  className={cn(
                    "ml-auto text-xs px-2.5 py-0.5 transition-all duration-300",
                    activeTab === "all"
                      ? "bg-white/20 text-white border-white/30"
                      : "bg-slate-700 text-slate-300 border-slate-600"
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
              "w-full justify-start gap-3 h-12 px-4 rounded-xl transition-all duration-300 group relative overflow-hidden",
              activeTab === "create"
                ? "bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
                : "text-slate-300 hover:text-white hover:bg-slate-700/50 border-slate-600/30"
            )}
            onClick={() => handleNavigation("create", "/projects/create")}
          >
            {activeTab === "create" && (
              <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
            )}
            <div className="relative z-10 flex items-center gap-3">
              <Plus
                className={cn(
                  "w-5 h-5 transition-all duration-300",
                  activeTab === "create"
                    ? "text-white"
                    : "text-slate-400 group-hover:text-violet-400"
                )}
              />
              <span className="font-semibold">Create New</span>
            </div>
          </Button>
        </div>

        {/* Animated Divider */}
        <div className="mx-4 my-2 relative">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
          <div className="absolute inset-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent animate-pulse" />
        </div>

        {/* Enhanced Projects List Section */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          <div className="px-6 py-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Recent Projects
            </h3>
            {searchQuery && (
              <Badge
                variant="outline"
                className="text-xs bg-slate-700/50 text-slate-300 border-slate-600"
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
                  <div className="w-12 h-12 border-3 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
                  <div
                    className="absolute inset-0 w-12 h-12 border-3 border-transparent border-r-violet-500 rounded-full animate-spin"
                    style={{
                      animationDirection: "reverse",
                      animationDuration: "1.5s",
                    }}
                  />
                </div>
                <p className="text-slate-300 font-medium">
                  Loading projects...
                </p>
                <p className="text-slate-500 text-sm mt-1">
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
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center">
                      <FolderOpen className="w-8 h-8 text-slate-400" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center animate-bounce">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <p className="text-slate-200 font-semibold text-lg mb-2">
                    No projects yet
                  </p>
                  <p className="text-slate-400 text-sm mb-6 max-w-48 leading-relaxed">
                    Create your first project and start building your knowledge
                    base
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gradient-to-r from-blue-500/10 to-violet-500/10 border-blue-500/30 text-blue-300 hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-violet-500/20 hover:border-blue-500/50"
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
                  <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-200 font-medium">
                    No projects found
                  </p>
                  <p className="text-slate-400 text-sm mt-1">
                    Try a different search term
                  </p>
                </div>
              )}

            {/* Enhanced Project Items */}
            {filteredProjects.map((project, index) => (
              <div
                key={project.id}
                // switched to pointer events for more reliable cross-window behavior
                onPointerEnter={() => setHoveredProject(project.id)}
                onPointerLeave={() =>
                  setHoveredProject((prev) =>
                    prev === project.id ? null : prev
                  )
                }
                className={cn(
                  "group relative rounded-xl transition-all duration-300 transform",
                  "hover:bg-slate-700/30 hover:shadow-lg hover:scale-[1.02]",
                  "hover:shadow-blue-500/10",
                  hoveredProject === project.id &&
                    "bg-slate-700/20 scale-[1.01]"
                )}
                style={{
                  animation: `slideInLeft 0.5s ease-out ${index * 0.1}s both`,
                }}
              >
                {/* Hover glow effect */}
                <div
                  className={cn(
                    "absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-violet-500/20 rounded-xl blur opacity-0 transition-opacity duration-300",
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
                          "w-3 h-3 rounded-full transition-all duration-300",
                          index % 4 === 0
                            ? "bg-blue-500"
                            : index % 4 === 1
                            ? "bg-violet-500"
                            : index % 4 === 2
                            ? "bg-teal-500"
                            : "bg-pink-500",
                          hoveredProject === project.id
                            ? "scale-125 shadow-lg"
                            : "scale-100"
                        )}
                      />
                      {hoveredProject === project.id && (
                        <div
                          className={cn(
                            "absolute inset-0 w-3 h-3 rounded-full animate-ping",
                            index % 4 === 0
                              ? "bg-blue-500/40"
                              : index % 4 === 1
                              ? "bg-violet-500/40"
                              : index % 4 === 2
                              ? "bg-teal-500/40"
                              : "bg-pink-500/40"
                          )}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-semibold text-white/90 group-hover:text-white truncate transition-colors duration-300 mb-1">
                        {truncateTitle(project.name)}
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
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
                    "absolute right-3 top-1/2 -translate-y-1/2 opacity-0 transition-all duration-300 transform scale-95",
                    "group-hover:opacity-100 group-hover:scale-100"
                  )}
                >
                  {/* onOpenChange used to clear hovered state when the menu is opened. This fixes the issue where
                      the mouse can move into a portal-hosted dropdown content without firing a mouseleave on the original element
                      (which can happen when the window loses focus). */}
                  <DropdownMenu
                    onOpenChange={(open) => {
                      setMenuOpen(open);
                      if (open) setHoveredProject(null);
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 rounded-lg backdrop-blur-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-3 h-3 text-slate-300" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-44 bg-slate-800/95 backdrop-blur-xl border-slate-700"
                    >
                      <DropdownMenuItem className="text-slate-200 hover:text-white hover:bg-slate-700/50 focus-visible:text-white focus-visible:bg-slate-700/50">
                        Study Project
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-slate-200 hover:text-white hover:bg-slate-700/50 focus-visible:text-white focus-visible:bg-slate-700/50">
                        Edit Project
                      </DropdownMenuItem>
                      {/* <DropdownMenuItem className="text-slate-200 hover:text-white hover:bg-slate-700/50 focus-visible:text-white focus-visible:bg-slate-700/50">
                        Duplicate
                      </DropdownMenuItem> */}
                      <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus-visible:text-red-300 focus-visible:bg-red-500/10">
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
        <div className="relative p-4 border-t border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
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

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed);
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};
