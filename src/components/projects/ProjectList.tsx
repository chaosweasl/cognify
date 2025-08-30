"use client";

import React, { useState, useEffect } from "react";
import { ProjectCard } from "./ProjectCard";
import { useProjectsStore } from "@/hooks/useProjects";
import {
  Grid3X3,
  List,
  Search,
  SortAsc,
  SortDesc,
  Calendar,
  BookOpen,
  TrendingUp,
  Filter,
  Plus,
  Brain,
  X,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type ViewMode = "grid" | "list";
type SortOption = "name" | "created" | "cards" | "activity";
type SortDirection = "asc" | "desc";
type FilterOption = "all" | "active" | "completed" | "empty";

export function ProjectList() {
  const { projects, deleteProject, loadProjects } = useProjectsStore();
  const router = useRouter();

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("created");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  console.log("[ProjectList] Rendering with projects:", projects.length);

  useEffect(() => {
    loadProjects().catch((error) => {
      console.error("[ProjectList] Error loading projects:", error);
    });
  }, [loadProjects]);

  // Filter and sort projects
  const filteredAndSortedProjects = React.useMemo(() => {
    const filtered = projects.filter((project) => {
      // Search filter
      if (
        searchQuery &&
        !project.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Category filter
      const totalActiveCards =
        (project.stats?.dueCards || 0) +
        (project.stats?.learningCards || 0) +
        (project.stats?.availableNewCards || 0);

      const totalCards =
        project.stats?.totalFlashcards || project.flashcardCount || 0;

      switch (filterBy) {
        case "active":
          return totalActiveCards > 0;
        case "completed":
          return totalCards > 0 && totalActiveCards === 0;
        case "empty":
          return totalCards === 0;
        default:
          return true;
      }
    });

    // Sort projects
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "created":
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "cards":
          const aCards = a.stats?.totalFlashcards || a.flashcardCount || 0;
          const bCards = b.stats?.totalFlashcards || b.flashcardCount || 0;
          comparison = aCards - bCards;
          break;
        case "activity":
          const aActivity =
            (a.stats?.dueCards || 0) +
            (a.stats?.learningCards || 0) +
            (a.stats?.availableNewCards || 0);
          const bActivity =
            (b.stats?.dueCards || 0) +
            (b.stats?.learningCards || 0) +
            (b.stats?.availableNewCards || 0);
          comparison = aActivity - bActivity;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [projects, searchQuery, sortBy, sortDirection, filterBy]);

  // Get filter counts
  const filterCounts = React.useMemo(() => {
    const counts = { all: 0, active: 0, completed: 0, empty: 0 };

    projects.forEach((project) => {
      counts.all++;

      const totalActiveCards =
        (project.stats?.dueCards || 0) +
        (project.stats?.learningCards || 0) +
        (project.stats?.availableNewCards || 0);

      const totalCards =
        project.stats?.totalFlashcards || project.flashcardCount || 0;

      if (totalActiveCards > 0) {
        counts.active++;
      } else if (totalCards > 0) {
        counts.completed++;
      } else {
        counts.empty++;
      }
    });

    return counts;
  }, [projects]);

  const getSortIcon = () => {
    switch (sortBy) {
      case "name":
        return <SortAsc className="w-4 h-4" />;
      case "created":
        return <Calendar className="w-4 h-4" />;
      case "cards":
        return <BookOpen className="w-4 h-4" />;
      case "activity":
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getFilterLabel = () => {
    switch (filterBy) {
      case "active":
        return "Ready to Study";
      case "completed":
        return "Completed";
      case "empty":
        return "Empty";
      default:
        return "All Projects";
    }
  };

  return (
    <div className="relative">
      {/* Enhanced Header Section with Glass Morphism */}
      <div className="relative mb-8">
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div
            className="absolute top-0 left-1/4 w-32 h-32 bg-gradient-glass rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: "8s" }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-24 h-24 bg-gradient-to-r from-brand-secondary/30 to-brand-accent/30 rounded-full blur-2xl animate-pulse"
            style={{ animationDuration: "12s", animationDelay: "4s" }}
          />
        </div>

        <div className="relative z-10 surface-elevated glass-surface border border-subtle rounded-3xl p-6 shadow-brand">
          {/* Title and Stats Row */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-brand transform hover:scale-110 hover:rotate-3 transition-all duration-slower">
                  <FolderOpen className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-glass rounded-2xl blur opacity-60 animate-pulse" />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
                  My Projects
                  {projects.length > 0 && (
                    <Badge className="bg-gradient-glass border-brand text-brand-primary px-3 py-1 text-sm font-semibold">
                      {projects.length} total
                    </Badge>
                  )}
                </h1>
                <p className="text-secondary mt-1">
                  Organize your knowledge and track your learning progress
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="text-center px-4 py-2 surface-secondary rounded-xl border border-subtle glass-surface">
                <div className="text-2xl font-bold brand-primary">
                  {filterCounts.active}
                </div>
                <div className="text-xs text-secondary">Ready to Study</div>
              </div>
              <div className="text-center px-4 py-2 surface-secondary rounded-xl border border-subtle glass-surface">
                <div className="text-2xl font-bold brand-secondary">
                  {filterCounts.completed}
                </div>
                <div className="text-xs text-secondary">Completed</div>
              </div>
            </div>
          </div>

          {/* Enhanced Controls Row */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            {/* Search Input with Enhanced Styling */}
            <div className="relative flex-1 max-w-md group">
              <Search
                className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all duration-slower",
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
                  "pl-12 pr-4 h-12 transition-all duration-slower rounded-xl",
                  "surface-secondary border-secondary text-primary placeholder:text-muted",
                  "focus:surface-elevated focus:border-brand focus:shadow-brand interactive-focus",
                  "interactive-hover glass-surface"
                )}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted hover:text-primary interactive-hover rounded-lg"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Control Buttons */}
            <div className="flex gap-2 items-center">
              {/* Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-12 px-4 gap-2 rounded-xl transition-all duration-slower group",
                      "surface-secondary border-secondary interactive-hover glass-surface",
                      "hover:border-brand hover:shadow-brand"
                    )}
                  >
                    <Filter className="w-4 h-4 text-muted group-hover:brand-primary transition-colors duration-slower" />
                    <span className="text-secondary group-hover:text-primary transition-colors duration-slower">
                      {getFilterLabel()}
                    </span>
                    {filterBy !== "all" && (
                      <Badge className="bg-brand-primary/10 text-brand-primary border-brand-primary/30 text-xs">
                        {filterCounts[filterBy]}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 surface-elevated glass-surface border border-secondary shadow-lg p-1">
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center gap-3 py-3 px-3 rounded-lg transition-all duration-fast cursor-pointer",
                      "text-primary hover:bg-interactive-hover focus:bg-interactive-hover",
                      filterBy === "all" &&
                        "bg-brand-primary/10 text-brand-primary"
                    )}
                    onSelect={() => setFilterBy("all")}
                  >
                    <FolderOpen className="w-4 h-4 text-current" />
                    <span className="flex-1 font-medium">All Projects</span>
                    <Badge variant="outline" className="text-xs border-current">
                      {filterCounts.all}
                    </Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center gap-3 py-3 px-3 rounded-lg transition-all duration-fast cursor-pointer",
                      "text-primary hover:bg-green-500/10 focus:bg-green-500/10",
                      filterBy === "active" &&
                        "bg-green-500/15 text-green-600 dark:text-green-400"
                    )}
                    onSelect={() => setFilterBy("active")}
                  >
                    <Brain className="w-4 h-4 text-green-500" />
                    <span className="flex-1 font-medium">Ready to Study</span>
                    <Badge
                      variant="outline"
                      className="text-xs text-green-500 border-green-500/40"
                    >
                      {filterCounts.active}
                    </Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center gap-3 py-3 px-3 rounded-lg transition-all duration-fast cursor-pointer",
                      "text-primary hover:bg-blue-500/10 focus:bg-blue-500/10",
                      filterBy === "completed" &&
                        "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                    )}
                    onSelect={() => setFilterBy("completed")}
                  >
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    <span className="flex-1 font-medium">Completed</span>
                    <Badge
                      variant="outline"
                      className="text-xs text-blue-500 border-blue-500/40"
                    >
                      {filterCounts.completed}
                    </Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center gap-3 py-3 px-3 rounded-lg transition-all duration-fast cursor-pointer",
                      "text-primary hover:bg-gray-500/10 focus:bg-gray-500/10",
                      filterBy === "empty" &&
                        "bg-gray-500/15 text-gray-600 dark:text-gray-400"
                    )}
                    onSelect={() => setFilterBy("empty")}
                  >
                    <Plus className="w-4 h-4 text-gray-500" />
                    <span className="flex-1 font-medium">Empty</span>
                    <Badge
                      variant="outline"
                      className="text-xs text-gray-500 border-gray-500/40"
                    >
                      {filterCounts.empty}
                    </Badge>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-12 px-4 gap-2 rounded-xl transition-all duration-slower group",
                      "surface-secondary border-secondary interactive-hover glass-surface",
                      "hover:border-brand hover:shadow-brand"
                    )}
                  >
                    {getSortIcon()}
                    {sortDirection === "desc" ? (
                      <SortDesc className="w-4 h-4 text-muted group-hover:brand-primary transition-colors duration-slower" />
                    ) : (
                      <SortAsc className="w-4 h-4 text-muted group-hover:brand-primary transition-colors duration-slower" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 surface-elevated glass-surface border border-secondary shadow-lg p-1">
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center gap-3 py-3 px-3 rounded-lg transition-all duration-fast cursor-pointer",
                      "text-primary hover:bg-interactive-hover focus:bg-interactive-hover font-medium",
                      sortBy === "name" &&
                        "bg-brand-primary/10 text-brand-primary"
                    )}
                    onSelect={() => setSortBy("name")}
                  >
                    <SortAsc className="w-4 h-4" />
                    Sort by Name
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center gap-3 py-3 px-3 rounded-lg transition-all duration-fast cursor-pointer",
                      "text-primary hover:bg-interactive-hover focus:bg-interactive-hover font-medium",
                      sortBy === "created" &&
                        "bg-brand-primary/10 text-brand-primary"
                    )}
                    onSelect={() => setSortBy("created")}
                  >
                    <Calendar className="w-4 h-4" />
                    Sort by Date
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center gap-3 py-3 px-3 rounded-lg transition-all duration-fast cursor-pointer",
                      "text-primary hover:bg-interactive-hover focus:bg-interactive-hover font-medium",
                      sortBy === "cards" &&
                        "bg-brand-primary/10 text-brand-primary"
                    )}
                    onSelect={() => setSortBy("cards")}
                  >
                    <BookOpen className="w-4 h-4" />
                    Sort by Cards
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center gap-3 py-3 px-3 rounded-lg transition-all duration-fast cursor-pointer",
                      "text-primary hover:bg-interactive-hover focus:bg-interactive-hover font-medium",
                      sortBy === "activity" &&
                        "bg-brand-primary/10 text-brand-primary"
                    )}
                    onSelect={() => setSortBy("activity")}
                  >
                    <TrendingUp className="w-4 h-4" />
                    Sort by Activity
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="border-secondary my-1" />
                  <DropdownMenuItem
                    className="flex items-center gap-3 py-3 px-3 rounded-lg transition-all duration-fast cursor-pointer text-primary hover:bg-interactive-hover focus:bg-interactive-hover font-medium"
                    onSelect={() =>
                      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                    }
                  >
                    {sortDirection === "desc" ? (
                      <>
                        <SortAsc className="w-4 h-4" />
                        Ascending
                      </>
                    ) : (
                      <>
                        <SortDesc className="w-4 h-4" />
                        Descending
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View Mode Toggle */}
              <div className="flex border border-secondary rounded-xl overflow-hidden glass-surface">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-12 px-4 rounded-none border-r border-secondary transition-all duration-slower",
                    viewMode === "grid"
                      ? "bg-gradient-brand text-white hover:bg-gradient-brand-hover"
                      : "text-secondary hover:text-primary interactive-hover"
                  )}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-12 px-4 rounded-none transition-all duration-slower",
                    viewMode === "list"
                      ? "bg-gradient-brand text-white hover:bg-gradient-brand-hover"
                      : "text-secondary hover:text-primary interactive-hover"
                  )}
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          {(searchQuery || filterBy !== "all") && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <span className="text-secondary">
                Showing {filteredAndSortedProjects.length} of {projects.length}{" "}
                projects
              </span>
              {searchQuery && (
                <Badge variant="outline" className="text-xs">
                  Search: &ldquo;{searchQuery}&rdquo;
                </Badge>
              )}
              {filterBy !== "all" && (
                <Badge variant="outline" className="text-xs">
                  Filter: {getFilterLabel()}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Project Grid/List */}
      {filteredAndSortedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center relative">
          {/* Animated background */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div
              className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-glass rounded-full blur-3xl animate-pulse"
              style={{ animationDuration: "6s" }}
            />
            <div
              className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-to-r from-brand-secondary/30 to-brand-accent/30 rounded-full blur-2xl animate-pulse"
              style={{ animationDuration: "8s", animationDelay: "3s" }}
            />
          </div>

          <div className="relative z-10 surface-elevated glass-surface border border-subtle rounded-3xl p-12 max-w-lg shadow-brand">
            <div className="w-16 h-16 bg-gradient-glass rounded-2xl flex items-center justify-center mx-auto mb-6">
              {searchQuery || filterBy !== "all" ? (
                <Search className="w-8 h-8 text-muted" />
              ) : (
                <FolderOpen className="w-8 h-8 text-muted" />
              )}
            </div>

            <h3 className="text-xl font-bold text-primary mb-3">
              {searchQuery || filterBy !== "all"
                ? "No projects found"
                : "No projects yet"}
            </h3>

            <p className="text-secondary mb-6 leading-relaxed">
              {searchQuery || filterBy !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Create your first project and start your learning journey"}
            </p>

            {searchQuery || filterBy !== "all" ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setFilterBy("all");
                }}
                className="bg-gradient-glass border-brand text-brand-primary hover:bg-gradient-brand hover:text-white transition-all duration-slower"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            ) : (
              <Button
                onClick={() => router.push("/projects/create")}
                className="bg-gradient-brand hover:bg-gradient-brand-hover text-white shadow-brand hover:shadow-brand-lg transform hover:scale-105 transition-all duration-slower"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Project
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "transition-all duration-slower",
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          )}
        >
          {filteredAndSortedProjects.map((project, index) => (
            <div
              key={project.id}
              style={{
                animation: `slideInUp 0.6s ease-out ${index * 0.1}s both`,
              }}
            >
              <ProjectCard
                project={{
                  id: project.id,
                  name: project.name,
                  description: project.description || "",
                  formattedCreatedAt: project.created_at,
                }}
                flashcardCount={
                  project.flashcardCount || project.stats?.totalFlashcards || 0
                }
                srsStats={{
                  dueCards: project.stats?.dueCards || 0,
                  newCards: project.stats?.availableNewCards || 0,
                  learningCards: project.stats?.learningCards || 0,
                }}
                onDelete={() => deleteProject(project.id)}
                viewMode={viewMode}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
