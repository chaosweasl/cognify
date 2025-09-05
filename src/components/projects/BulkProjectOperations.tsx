"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Copy,
  Download,
  CheckSquare,
  Square,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  X,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { CacheInvalidation } from "@/hooks/useCache";

interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  flashcardCount?: number;
  stats?: {
    dueCards: number;
    newCards: number;
    learningCards: number;
    totalFlashcards: number;
  };
}

interface BulkProjectOperationsProps {
  projects: Project[];
  onProjectsChanged?: () => void;
  className?: string;
}

export function BulkProjectOperations({
  projects,
  onProjectsChanged,
  className = "",
}: BulkProjectOperationsProps) {
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(
    new Set()
  );
  const [isOperating, setIsOperating] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    action: string;
    projects: Project[];
  } | null>(null);

  const toggleProjectSelection = (projectId: string) => {
    const newSelection = new Set(selectedProjects);
    if (newSelection.has(projectId)) {
      newSelection.delete(projectId);
    } else {
      newSelection.add(projectId);
    }
    setSelectedProjects(newSelection);
  };

  const selectAllProjects = () => {
    if (selectedProjects.size === projects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(projects.map((p) => p.id)));
    }
  };

  const getSelectedProjects = () => {
    return projects.filter((p) => selectedProjects.has(p.id));
  };

  const bulkDeleteProjects = async () => {
    if (selectedProjects.size === 0) return;

    setIsOperating(true);
    const selectedProjectIds = Array.from(selectedProjects);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Delete projects one by one to handle individual errors
      for (const projectId of selectedProjectIds) {
        try {
          const res = await fetch(`/api/projects/${projectId}`, {
            method: "DELETE",
          });

          if (res.ok) {
            successCount++;
          } else {
            errorCount++;
            console.error(`Failed to delete project ${projectId}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error deleting project ${projectId}:`, error);
        }
      }

      // Invalidate cache
      CacheInvalidation.invalidate("user_projects");
      CacheInvalidation.invalidatePattern("project_stats_");

      if (successCount > 0) {
        toast.success(`Successfully deleted ${successCount} project(s)`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to delete ${errorCount} project(s)`);
      }

      setSelectedProjects(new Set());
      onProjectsChanged?.();
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("Failed to delete projects");
    } finally {
      setIsOperating(false);
      setConfirmAction(null);
    }
  };

  const bulkDuplicateProjects = async () => {
    if (selectedProjects.size === 0) return;

    setIsOperating(true);
    const selectedProjectList = getSelectedProjects();
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const project of selectedProjectList) {
        try {
          const duplicateData = {
            name: `${project.name} (Copy)`,
            description: project.description || "",
            // Copy other project settings as needed
            new_cards_per_day: 20,
            max_reviews_per_day: 100,
          };

          const res = await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(duplicateData),
          });

          if (res.ok) {
            successCount++;
          } else {
            errorCount++;
            console.error(`Failed to duplicate project ${project.name}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error duplicating project ${project.name}:`, error);
        }
      }

      // Invalidate cache
      CacheInvalidation.invalidate("user_projects");
      CacheInvalidation.invalidatePattern("project_stats_");

      if (successCount > 0) {
        toast.success(`Successfully duplicated ${successCount} project(s)`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to duplicate ${errorCount} project(s)`);
      }

      setSelectedProjects(new Set());
      onProjectsChanged?.();
    } catch (error) {
      console.error("Bulk duplicate error:", error);
      toast.error("Failed to duplicate projects");
    } finally {
      setIsOperating(false);
    }
  };

  const bulkExportProjects = async () => {
    if (selectedProjects.size === 0) return;

    setIsOperating(true);
    const selectedProjectList = getSelectedProjects();

    try {
      // Create export data
      const exportData = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        projects: selectedProjectList.map((project) => ({
          name: project.name,
          description: project.description,
          created_at: project.created_at,
          stats: project.stats,
        })),
      };

      // Create and download file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri =
        "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

      const exportFileDefaultName = `cognify-projects-export-${
        new Date().toISOString().split("T")[0]
      }.json`;

      const linkElement = document.createElement("a");
      linkElement.setAttribute("href", dataUri);
      linkElement.setAttribute("download", exportFileDefaultName);
      linkElement.click();

      toast.success(`Exported ${selectedProjectList.length} project(s)`);
      setSelectedProjects(new Set());
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export projects");
    } finally {
      setIsOperating(false);
    }
  };

  const bulkResetSRS = async () => {
    if (selectedProjects.size === 0) return;

    setIsOperating(true);
    const selectedProjectIds = Array.from(selectedProjects);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const projectId of selectedProjectIds) {
        try {
          const res = await fetch(`/api/projects/${projectId}/reset`, {
            method: "POST",
          });

          if (res.ok) {
            successCount++;
          } else {
            errorCount++;
            console.error(`Failed to reset SRS for project ${projectId}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error resetting SRS for project ${projectId}:`, error);
        }
      }

      // Invalidate cache
      CacheInvalidation.invalidatePattern("project_stats_");

      if (successCount > 0) {
        toast.success(`Reset SRS data for ${successCount} project(s)`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to reset ${errorCount} project(s)`);
      }

      setSelectedProjects(new Set());
      onProjectsChanged?.();
    } catch (error) {
      console.error("Bulk reset error:", error);
      toast.error("Failed to reset project data");
    } finally {
      setIsOperating(false);
      setConfirmAction(null);
    }
  };

  if (projects.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Bulk Actions Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBulkActions(!showBulkActions)}
          className="flex items-center gap-2"
        >
          <CheckSquare className="w-4 h-4" />
          Bulk Actions
        </Button>

        {showBulkActions && selectedProjects.size > 0 && (
          <Badge variant="secondary">{selectedProjects.size} selected</Badge>
        )}
      </div>

      {/* Bulk Actions Panel */}
      {showBulkActions && (
        <Card className="p-4 glass-surface border border-subtle">
          <div className="space-y-4">
            {/* Select All */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAllProjects}
                className="flex items-center gap-2"
              >
                {selectedProjects.size === projects.length ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                Select All ({projects.length})
              </Button>

              {selectedProjects.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProjects(new Set())}
                  className="flex items-center gap-2 text-text-muted"
                >
                  <X className="w-4 h-4" />
                  Clear Selection
                </Button>
              )}
            </div>

            {/* Project Selection List */}
            <div className="max-h-64 overflow-y-auto space-y-2">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center gap-3 p-2 surface-elevated rounded-lg"
                >
                  <Checkbox
                    checked={selectedProjects.has(project.id)}
                    onCheckedChange={() => toggleProjectSelection(project.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-primary truncate">
                      {project.name}
                    </div>
                    <div className="text-xs text-text-muted">
                      {project.stats?.totalFlashcards || 0} cards
                    </div>
                  </div>
                  {project.stats && (
                    <div className="flex gap-1">
                      {project.stats.dueCards > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {project.stats.dueCards} due
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Bulk Action Buttons */}
            {selectedProjects.size > 0 && (
              <div className="pt-3 border-t border-subtle">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={bulkDuplicateProjects}
                    disabled={isOperating}
                    className="flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={bulkExportProjects}
                    disabled={isOperating}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setConfirmAction({
                        action: "reset",
                        projects: getSelectedProjects(),
                      })
                    }
                    disabled={isOperating}
                    className="flex items-center gap-2 text-orange-600 hover:text-orange-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset SRS
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setConfirmAction({
                        action: "delete",
                        projects: getSelectedProjects(),
                      })
                    }
                    disabled={isOperating}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Confirmation Dialog */}
      {confirmAction && (
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800">
                  Confirm{" "}
                  {confirmAction.action === "delete" ? "Deletion" : "SRS Reset"}
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {confirmAction.action === "delete"
                    ? `This will permanently delete ${confirmAction.projects.length} project(s) and all their flashcards. This action cannot be undone.`
                    : `This will reset all SRS data for ${confirmAction.projects.length} project(s). All study progress will be lost.`}
                </p>

                <div className="mt-3 max-h-32 overflow-y-auto">
                  <div className="text-sm text-red-600 font-medium">
                    Projects to {confirmAction.action}:
                  </div>
                  <ul className="mt-1 space-y-1">
                    {confirmAction.projects.map((project) => (
                      <li key={project.id} className="text-sm text-red-700">
                        • {project.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={
                  confirmAction.action === "delete"
                    ? bulkDeleteProjects
                    : bulkResetSRS
                }
                disabled={isOperating}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isOperating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Confirm{" "}
                    {confirmAction.action === "delete" ? "Delete" : "Reset"}
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setConfirmAction(null)}
                disabled={isOperating}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions Info */}
      {!showBulkActions && (
        <Card className="p-4 glass-surface border border-subtle">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-brand-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <MoreHorizontal className="w-4 h-4 text-brand-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-primary">
                Bulk Operations
              </h3>
              <p className="text-xs text-text-muted mt-1">
                Select multiple projects to duplicate, export, reset, or delete
                them all at once. Perfect for managing large collections of
                learning materials.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
