"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProjectsStore } from "@/hooks/useProjects";
import { Layers, Plus, FolderOpen, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SidebarNavProps {
  activeTab: "all" | "create";
  onTab: (tab: "all" | "create") => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ activeTab, onTab }) => {
  const {
    projects,
    isLoadingProjects: loading,
    error,
  } = useProjectsStore();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle client-side hydration and mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(false); // Close mobile sidebar on desktop
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Helper to truncate project name
  const truncateTitle = (title: string, max: number = 18) =>
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
      {/* Mobile Toggle Button - Only show after mount and on mobile */}
      {isMobile && (
        <button
          className={`fixed top-1/2 -translate-y-1/2 z-50 transition-all duration-300 ${
            isOpen ? "left-64" : "left-0"
          } w-10 h-12 flex items-center justify-center bg-base-200/80 rounded-r-full border-none`}
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
        >
          <span className="flex items-center justify-center w-full h-full">
            {isOpen ? (
              <X className="w-8 h-8 text-base-content" />
            ) : (
              <ChevronRight className="w-8 h-8 text-base-content" />
            )}
          </span>
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar with CSS-first responsive approach */}
      <nav
        className={`
          flex flex-col w-64 bg-base-200/50 border-r border-base-300/60 backdrop-blur-sm
          ${
            isMobile
              ? `fixed top-0 left-0 h-screen z-40 transition-transform duration-300 ${
                  isOpen ? "translate-x-0" : "-translate-x-full"
                }`
              : "fixed top-[64px] left-0 h-[calc(100vh-4rem)] hidden md:flex z-30"
          }
        `}
      >
        {/* Header Section */}
        <div className="p-4 border-b border-base-300/60">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-base-content/90 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              Projects
            </h2>
            {/* Mobile Close Button in Header */}
            {isMobile && (
              <button
                className="btn btn-ghost btn-sm p-1"
                onClick={() => setIsOpen(false)}
                type="button"
                aria-label="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="p-3 space-y-1">
          {/* All Projects Button */}
          <button
            className={`btn btn-ghost w-full justify-start gap-3 h-11 px-4 rounded-lg transition-all duration-200 ${
              activeTab === "all"
                ? "bg-primary text-primary-content shadow-sm"
                : "hover:bg-base-300/70 text-base-content/80 hover:text-base-content"
            }`}
            onClick={() => handleNavigation("all", "/projects")}
            type="button"
          >
            <Layers className="w-4 h-4" />
            <span className="font-medium">All Projects</span>
          </button>

          {/* Create New Button */}
          <button
            className={`btn btn-ghost w-full justify-start gap-3 h-11 px-4 rounded-lg transition-all duration-200 ${
              activeTab === "create"
                ? "bg-secondary text-secondary-content shadow-sm"
                : "hover:bg-base-300/70 text-base-content/80 hover:text-base-content"
            }`}
            onClick={() => handleNavigation("create", "/projects/create")}
            type="button"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Create New</span>
          </button>
        </div>

        {/* Divider */}
        <div className="mx-3 border-t border-base-300/60"></div>

        {/* Projects List Section */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-4 py-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Recent Projects
            </h3>
          </div>

          {/* Scrollable Project List */}
          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {loading && projects.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading projects...
                </span>
              </div>
            )}

            {error && (
              <Card className="mx-3 border-destructive/20 bg-destructive/10">
                <CardContent className="p-3">
                  <p className="text-sm text-destructive font-medium">
                    Error loading projects
                  </p>
                  <p className="text-xs text-destructive/80 mt-1">{error}</p>
                </CardContent>
              </Card>
            )}

            {!loading && !error && projects.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                  <FolderOpen className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No projects yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Create your first project to get started
                </p>
              </div>
            )}

            <div className="space-y-1">
              {projects.map((project) => (
                <Button
                  key={project.id}
                  variant="ghost"
                  className="w-full justify-start p-3 h-auto gap-3"
                  title={project.name}
                  onClick={() => handleProjectClick(project.id)}
                  type="button"
                >
                  <div className="w-2 h-2 bg-accent rounded-full opacity-60 group-hover:opacity-100 transition-opacity"></div>
                  <span className="font-medium text-sm truncate">
                    {truncateTitle(project.name)}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-muted/30">
          <div className="text-xs text-muted-foreground text-center">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </div>
        </div>
      </nav>
    </>
  );
};
