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
    <div className="relative p-6">
      {/* Enhanced Header Section with Glass Morphism */}
      <div className="relative mb-10">
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div
            className="absolute top-0 left-1/4 w-40 h-40 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: "8s" }}
          />
          <div
            className="absolute bottom-0 right-1/4 w-32 h-32 bg-gradient-to-r from-brand-secondary/20 to-brand-tertiary/20 rounded-full blur-2xl animate-pulse"
            style={{ animationDuration: "12s", animationDelay: "4s" }}
          />
        </div>

        <div className="relative z-10 glass-surface border-2 border-brand-primary/20 rounded-3xl p-8 shadow-brand-lg bg-gradient-to-br from-brand-primary/5 to-transparent">
          {/* Enhanced Title and Stats Row */}
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8 mb-8">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-16 h-16 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-3xl flex items-center justify-center shadow-brand-lg group-hover:shadow-brand-xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <FolderOpen className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary/50 to-brand-secondary/50 rounded-3xl blur opacity-60 animate-pulse" />
              </div>

              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent flex items-center gap-4">
                  My Projects
                  {projects.length > 0 && (
                    <Badge className="bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 border-brand-primary/30 text-brand-primary px-4 py-2 text-base font-bold rounded-full">
                      {projects.length} total
                    </Badge>
                  )}
                </h1>
                <p className="text-text-muted mt-2 text-lg">
                  Organize your knowledge and track your learning progress
                </p>
              </div>
            </div>

            {/* Enhanced Quick Stats */}
            <div className="flex gap-6">
              <div className="text-center px-6 py-4 glass-surface border border-green-200/50 rounded-2xl hover:border-green-300/70 transition-all duration-300 group">
                <div className="text-3xl font-bold text-green-600 group-hover:scale-110 transition-transform">
                  {filterCounts.active}
                </div>
                <div className="text-sm text-text-muted font-medium">
                  Ready to Study
                </div>
              </div>
              <div className="text-center px-6 py-4 glass-surface border border-blue-200/50 rounded-2xl hover:border-blue-300/70 transition-all duration-300 group">
                <div className="text-3xl font-bold text-blue-600 group-hover:scale-110 transition-transform">
                  {filterCounts.completed}
                </div>
                <div className="text-sm text-text-muted font-medium">
                  Completed
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Controls Row */}
          <div className="flex flex-col xl:flex-row gap-6 items-stretch xl:items-center">
            {/* Enhanced Search Input with Glass Morphism */}
            <div className="relative flex-1 max-w-lg group">
              <Search
                className={cn(
                  "absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 transition-all duration-500",
                  isSearchFocused
                    ? "text-brand-primary scale-110 rotate-12"
                    : "text-text-muted"
                )}
              />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={cn(
                  "pl-14 pr-4 h-14 transition-all duration-500 rounded-2xl text-lg",
                  "glass-surface border-brand-primary/30 text-text-primary placeholder:text-text-muted",
                  "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:shadow-brand-md",
                  "hover:border-brand-primary/50"
                )}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-text-muted hover:text-brand-primary hover:bg-brand-primary/10 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
            </div>

            {/* Enhanced Control Buttons */}
            <div className="flex gap-3 items-center">
              {/* Enhanced Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-14 px-6 gap-3 rounded-2xl transition-all duration-500 group",
                      "glass-surface border-brand-primary/30 hover:border-brand-primary/50",
                      "hover:shadow-brand-md hover:bg-brand-primary/5"
                    )}
                  >
                    <Filter className="w-5 h-5 text-text-muted group-hover:text-brand-primary transition-colors duration-300" />
                    <span className="text-text-secondary group-hover:text-text-primary transition-colors duration-300 font-medium">
                      {getFilterLabel()}
                    </span>
                    {filterBy !== "all" && (
                      <Badge className="bg-brand-primary/10 text-brand-primary border-brand-primary/30 text-sm px-2 py-1">
                        {filterCounts[filterBy]}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 glass-surface border-brand-primary/20 shadow-brand-lg p-2">
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center gap-4 py-4 px-4 rounded-xl transition-all duration-300 cursor-pointer",
                      "text-text-primary hover:bg-surface-muted/50 focus:bg-surface-muted/50",
                      filterBy === "all" &&
                        "bg-brand-primary/10 text-brand-primary"
                    )}
                    onSelect={() => setFilterBy("all")}
                  >
                    <FolderOpen className="w-5 h-5 text-current" />
                    <span className="flex-1 font-semibold">All Projects</span>
                    <Badge variant="outline" className="text-sm border-current">
                      {filterCounts.all}
                    </Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center gap-4 py-4 px-4 rounded-xl transition-all duration-300 cursor-pointer",
                      "text-text-primary hover:bg-green-50 focus:bg-green-50",
                      filterBy === "active" &&
                        "bg-green-100 text-green-700 border border-green-200"
                    )}
                    onSelect={() => setFilterBy("active")}
                  >
                    <Brain className="w-5 h-5 text-green-600" />
                    <span className="flex-1 font-semibold">Ready to Study</span>
                    <Badge
                      variant="outline"
                      className="text-sm text-green-600 border-green-300"
                    >
                      {filterCounts.active}
                    </Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center gap-4 py-4 px-4 rounded-xl transition-all duration-300 cursor-pointer",
                      "text-text-primary hover:bg-blue-50 focus:bg-blue-50",
                      filterBy === "completed" &&
                        "bg-blue-100 text-blue-700 border border-blue-200"
                    )}
                    onSelect={() => setFilterBy("completed")}
                  >
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span className="flex-1 font-semibold">Completed</span>
                    <Badge
                      variant="outline"
                      className="text-sm text-blue-600 border-blue-300"
                    >
                      {filterCounts.completed}
                    </Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center gap-4 py-4 px-4 rounded-xl transition-all duration-300 cursor-pointer",
                      "text-text-primary hover:bg-gray-50 focus:bg-gray-50",
                      filterBy === "empty" &&
                        "bg-gray-100 text-gray-700 border border-gray-200"
                    )}
                    onSelect={() => setFilterBy("empty")}
                  >
                    <Plus className="w-5 h-5 text-gray-600" />
                    <span className="flex-1 font-semibold">Empty</span>
                    <Badge
                      variant="outline"
                      className="text-sm text-gray-600 border-gray-300"
                    >
                      {filterCounts.empty}
                    </Badge>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Enhanced Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "h-14 px-6 gap-3 rounded-2xl transition-all duration-500 group",
                      "glass-surface border-brand-primary/30 hover:border-brand-primary/50",
                      "hover:shadow-brand-md hover:bg-brand-primary/5"
                    )}
                  >
                    {getSortIcon()}
                    {sortDirection === "desc" ? (
                      <SortDesc className="w-5 h-5 text-text-muted group-hover:text-brand-primary transition-colors duration-300" />
                    ) : (
                      <SortAsc className="w-5 h-5 text-text-muted group-hover:text-brand-primary transition-colors duration-300" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 glass-surface border-brand-primary/20 shadow-brand-lg p-2">
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center gap-4 py-4 px-4 rounded-xl transition-all duration-300 cursor-pointer",
                      "text-text-primary hover:bg-surface-muted/50 focus:bg-surface-muted/50 font-semibold",
                      sortBy === "name" &&
                        "bg-brand-primary/10 text-brand-primary"
                    )}
                    onSelect={() => setSortBy("name")}
                  >
                    <SortAsc className="w-5 h-5" />
                    Sort by Name
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center gap-4 py-4 px-4 rounded-xl transition-all duration-300 cursor-pointer",
                      "text-text-primary hover:bg-surface-muted/50 focus:bg-surface-muted/50 font-semibold",
                      sortBy === "created" &&
                        "bg-brand-primary/10 text-brand-primary"
                    )}
                    onSelect={() => setSortBy("created")}
                  >
                    <Calendar className="w-5 h-5" />
                    Sort by Date
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center gap-4 py-4 px-4 rounded-xl transition-all duration-300 cursor-pointer",
                      "text-text-primary hover:bg-surface-muted/50 focus:bg-surface-muted/50 font-semibold",
                      sortBy === "cards" &&
                        "bg-brand-primary/10 text-brand-primary"
                    )}
                    onSelect={() => setSortBy("cards")}
                  >
                    <BookOpen className="w-5 h-5" />
                    Sort by Cards
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center gap-4 py-4 px-4 rounded-xl transition-all duration-300 cursor-pointer",
                      "text-text-primary hover:bg-surface-muted/50 focus:bg-surface-muted/50 font-semibold",
                      sortBy === "activity" &&
                        "bg-brand-primary/10 text-brand-primary"
                    )}
                    onSelect={() => setSortBy("activity")}
                  >
                    <TrendingUp className="w-5 h-5" />
                    Sort by Activity
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="border-brand-primary/20 my-2" />
                  <DropdownMenuItem
                    className="flex items-center gap-4 py-4 px-4 rounded-xl transition-all duration-300 cursor-pointer text-text-primary hover:bg-surface-muted/50 focus:bg-surface-muted/50 font-semibold"
                    onSelect={() =>
                      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                    }
                  >
                    {sortDirection === "desc" ? (
                      <>
                        <SortAsc className="w-5 h-5" />
                        Ascending
                      </>
                    ) : (
                      <>
                        <SortDesc className="w-5 h-5" />
                        Descending
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Enhanced View Mode Toggle */}
              <div className="flex border-2 border-brand-primary/30 rounded-2xl overflow-hidden glass-surface">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-14 px-6 rounded-none border-r border-brand-primary/30 transition-all duration-300",
                    viewMode === "grid"
                      ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white hover:from-brand-primary hover:to-brand-secondary shadow-brand"
                      : "text-text-muted hover:text-brand-primary hover:bg-brand-primary/10"
                  )}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-14 px-6 rounded-none transition-all duration-300",
                    viewMode === "list"
                      ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white hover:from-brand-primary hover:to-brand-secondary shadow-brand"
                      : "text-text-muted hover:text-brand-primary hover:bg-brand-primary/10"
                  )}
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Enhanced Results Summary */}
          {(searchQuery || filterBy !== "all") && (
            <div className="mt-6 flex items-center gap-3 text-base">
              <span className="text-text-muted font-medium">
                Showing {filteredAndSortedProjects.length} of {projects.length}{" "}
                projects
              </span>
              {searchQuery && (
                <Badge
                  variant="outline"
                  className="text-sm px-3 py-1 bg-blue-50 text-blue-700 border-blue-300"
                >
                  Search: "{searchQuery}"
                </Badge>
              )}
              {filterBy !== "all" && (
                <Badge
                  variant="outline"
                  className="text-sm px-3 py-1 bg-green-50 text-green-700 border-green-300"
                >
                  Filter: {getFilterLabel()}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Project Grid/List */}
      {filteredAndSortedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center relative">
          {/* Enhanced animated background */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <div
              className="absolute top-1/4 left-1/4 w-40 h-40 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 rounded-full blur-3xl animate-pulse"
              style={{ animationDuration: "6s" }}
            />
            <div
              className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-r from-brand-secondary/20 to-brand-tertiary/20 rounded-full blur-2xl animate-pulse"
              style={{ animationDuration: "8s", animationDelay: "3s" }}
            />
          </div>

          <div className="relative z-10 glass-surface border-2 border-brand-primary/20 rounded-3xl p-16 max-w-2xl shadow-brand-lg bg-gradient-to-br from-brand-primary/5 to-transparent">
            <div className="w-20 h-20 bg-gradient-to-r from-brand-primary/20 to-brand-secondary/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
              {searchQuery || filterBy !== "all" ? (
                <Search className="w-10 h-10 text-text-muted" />
              ) : (
                <FolderOpen className="w-10 h-10 text-text-muted" />
              )}
            </div>

            <h3 className="text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent mb-4">
              {searchQuery || filterBy !== "all"
                ? "No projects found"
                : "No projects yet"}
            </h3>

            <p className="text-text-muted mb-10 leading-relaxed text-lg max-w-lg">
              {searchQuery || filterBy !== "all"
                ? "Try adjusting your search or filter criteria to find what you're looking for"
                : "Create your first project and start your learning journey with our intelligent spaced repetition system"}
            </p>

            {searchQuery || filterBy !== "all" ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setFilterBy("all");
                }}
                className="h-14 px-8 rounded-2xl bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10 border-brand-primary/30 text-brand-primary hover:bg-gradient-to-r hover:from-brand-primary hover:to-brand-secondary hover:text-white transition-all duration-500 shadow-brand-md hover:shadow-brand-lg"
              >
                <X className="w-5 h-5 mr-3" />
                Clear All Filters
              </Button>
            ) : (
              <Button
                onClick={() => router.push("/projects/create")}
                className="h-16 px-10 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-secondary hover:from-brand-primary hover:to-brand-secondary text-white shadow-brand-lg hover:shadow-brand-xl transform hover:scale-105 transition-all duration-500 text-lg font-semibold"
              >
                <Plus className="w-6 h-6 mr-3" />
                Create Your First Project
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "transition-all duration-500",
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
              : "space-y-6"
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
