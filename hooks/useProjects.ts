import { Project, ProjectStats, CreateProjectData } from "@/src/types";
import { useCallback } from "react";
import { cachedFetch, CacheInvalidation } from "@/hooks/useCache";
import { ErrorHandling, Validators } from "@/lib/utils/errorHandling";
import { logger, useRenderMonitor } from "@/lib/utils/devUtils";

// Simple Zustand store for global project state only
import { create } from "zustand";

interface ProjectsGlobalState {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  removeProject: (projectId: string) => void;
  reset: () => void; // Added reset method
}

// Keep minimal global state for project list
const useProjectsGlobalStore = create<ProjectsGlobalState>((set) => ({
  projects: [],
  setProjects: (projects) => set({ projects }),
  addProject: (project) =>
    set((state) => ({
      projects: [project, ...state.projects],
    })),
  updateProject: (projectId, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, ...updates } : p
      ),
    })),
  removeProject: (projectId) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
    })),
  reset: () => set({ projects: [] }),
}));

// Simplified project management functions with cache-first approach
export const projectApi = {
  async loadProjects(): Promise<Project[]> {
    logger.debug("Loading projects with stats via API");

    return await cachedFetch(
      "user_projects",
      async () => {
        // Use the enhanced projects API that includes stats
        const response = await fetch("/api/projects");
        if (!response.ok) {
          throw new Error(`Failed to load projects: ${response.status}`);
        }

        const projects = await response.json();
        logger.debug(`Loaded ${projects?.length || 0} projects from API`);
        return projects || [];
      },
      { ttl: 5 * 60 * 1000 } // 5 minute cache
    );
  },

  async createProject(data: CreateProjectData): Promise<Project> {
    logger.debug("Creating project:", data);
    // Validate input data
    const validation = Validators.project(data);
    if (!validation.isValid) {
      throw validation.errors[0];
    }
    return await ErrorHandling.wrapAsync(async () => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create project");
      CacheInvalidation.invalidatePattern("user_projects");
      logger.info(`Created project: ${result.name} (${result.id})`);
      return result;
    }, "createProject")();
  },

  async updateProject(
    projectId: string,
    updates: Partial<Project>
  ): Promise<void> {
    logger.debug("Updating project:", projectId, updates);
    // Validate updates
    if (updates.name !== undefined || updates.description !== undefined) {
      const validation = Validators.project({
        ...updates,
        name: updates.name || "temp",
      });
      if (!validation.isValid) {
        throw validation.errors[0];
      }
    }
    return await ErrorHandling.wrapAsync(async () => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to update project");
      }
      CacheInvalidation.invalidatePattern("user_projects");
      CacheInvalidation.invalidatePattern(`project_${projectId}`);
      logger.info(`Updated project: ${projectId}`);
    }, "updateProject")();
  },

  async deleteProject(projectId: string): Promise<void> {
    logger.debug("Deleting project:", projectId);
    return await ErrorHandling.wrapAsync(async () => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to delete project");
      }
      CacheInvalidation.invalidatePattern("user_projects");
      CacheInvalidation.invalidatePattern(`project_${projectId}`);
      logger.info(`Deleted project: ${projectId}`);
    }, "deleteProject")();
  },

  async getProjectStats(projectId: string): Promise<ProjectStats> {
    logger.debug("Getting project stats:", projectId);

    return await cachedFetch(
      `project_stats_${projectId}`,
      async () => {
        // Use the individual project stats API endpoint
        const response = await fetch(`/api/projects/${projectId}/stats`);
        if (!response.ok) {
          throw new Error(`Failed to load project stats: ${response.status}`);
        }

        const data = await response.json();
        return data.stats;
      },
      { ttl: 2 * 60 * 1000 } // 2 minute cache for stats
    );
  },
};

// Main hook for components - simplified interface with performance monitoring
export const useProjectsStore = () => {
  // Track component renders for performance monitoring
  useRenderMonitor("useProjectsStore");

  const {
    projects,
    setProjects,
    addProject,
    updateProject,
    removeProject,
    reset,
  } = useProjectsGlobalStore();

  // Create stable function references using useCallback with proper dependencies
  const loadProjects = useCallback(async () => {
    try {
      logger.debug("useProjectsStore.loadProjects called");
      const projects = await projectApi.loadProjects();
      setProjects(projects);
      logger.info(`Loaded ${projects.length} projects in store`);
    } catch (error) {
      logger.error("Error loading projects:", error);
      throw error; // Re-throw for component error handling
    }
  }, [setProjects]);

  const createProject = useCallback(
    async (data: CreateProjectData) => {
      try {
        logger.debug("useProjectsStore.createProject called:", data);
        const project = await projectApi.createProject(data);
        addProject(project);
        logger.info(`Created and added project: ${project.name}`);
        return project;
      } catch (error) {
        logger.error("Error creating project:", error);
        throw error;
      }
    },
    [addProject]
  );

  const updateProjectById = useCallback(
    async (projectId: string, updates: Partial<Project>) => {
      try {
        logger.debug(
          "useProjectsStore.updateProject called:",
          projectId,
          updates
        );
        await projectApi.updateProject(projectId, updates);
        updateProject(projectId, updates);
        logger.info(`Updated project: ${projectId}`);
      } catch (error) {
        logger.error("Error updating project:", error);
        throw error;
      }
    },
    [updateProject]
  );

  const deleteProject = useCallback(
    async (projectId: string) => {
      try {
        logger.debug("useProjectsStore.deleteProject called:", projectId);
        await projectApi.deleteProject(projectId);
        removeProject(projectId);
        logger.info(`Deleted project: ${projectId}`);
      } catch (error) {
        logger.error("Error deleting project:", error);
        throw error;
      }
    },
    [removeProject]
  );

  const getProject = useCallback(
    (projectId: string) => {
      return projects.find((p) => p.id === projectId) || null;
    },
    [projects]
  );

  const loadProjectStats = useCallback(async (projectId: string) => {
    try {
      logger.debug("useProjectsStore.loadProjectStats called:", projectId);
      const stats = await projectApi.getProjectStats(projectId);
      logger.debug(`Loaded stats for project ${projectId}:`, stats);
      return stats;
    } catch (error) {
      logger.error("Error loading project stats:", error);
      throw error;
    }
  }, []);

  // Invalidate cache when needed
  const invalidateCache = useCallback(() => {
    CacheInvalidation.invalidatePattern("user_projects");
    CacheInvalidation.invalidatePattern("project_stats_");
    logger.info("Invalidated projects cache");
  }, []);

  return {
    projects,
    isLoadingProjects: false, // Simplified - no complex loading states
    error: null,

    // Cache-optimized actions
    loadProjects,
    createProject,
    updateProjectById,
    deleteProject,

    // Utility functions
    getProject,
    loadProjectStats,

    // Cache management
    invalidateCache,

    // Store reset
    reset,
  };
};
