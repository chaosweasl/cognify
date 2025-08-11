import { create } from "zustand";
import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { cachedFetch, CacheInvalidation } from "./useCache";
import type { CacheKey } from "./useCache";

// Import cache invalidation from ProjectList
let invalidateBatchStatsCacheRef: (() => void) | null = null;

export function setBatchStatsCacheInvalidator(fn: () => void) {
  invalidateBatchStatsCacheRef = fn;
}

function invalidateBatchStatsCache() {
  if (invalidateBatchStatsCacheRef) {
    invalidateBatchStatsCacheRef();
  }
}

// Define interfaces based on the schema
export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  flashcards?: Flashcard[];
}

export interface Flashcard {
  id: string;
  project_id: string;
  front: string;
  back: string;
  extra: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SRSState {
  id: string;
  user_id: string;
  project_id: string;
  card_id: string;
  interval: number;
  ease: number;
  due: string;
  last_reviewed: string;
  repetitions: number;
  state: "new" | "learning" | "review" | "relearning";
  lapses: number;
  learning_step: number;
  is_leech: boolean;
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProjectStats {
  dueCards: number;
  newCards: number;
  learningCards: number;
  nextReviewDate: string | null;
}

export interface CreateFlashcardData {
  front: string;
  back: string;
  extra?: Record<string, any>;
}

export interface CreateProjectData {
  name: string;
  description?: string;
}

interface CachedProjectsState {
  // Data
  projects: Project[];
  projectsById: Record<string, Project>;
  flashcardsByProject: Record<string, Flashcard[]>;
  srsStatesByProject: Record<string, SRSState[]>;
  projectStats: Record<string, ProjectStats>;

  // Loading states
  isLoadingProjects: boolean;
  isLoadingFlashcards: Record<string, boolean>;
  isLoadingSRS: Record<string, boolean>;
  error: string | null;
  lastFetch: Record<string, number>;

  // Actions
  loadProjects: (forceRefresh?: boolean) => Promise<void>;
  loadProject: (projectId: string, forceRefresh?: boolean) => Promise<void>;
  loadFlashcards: (projectId: string, forceRefresh?: boolean) => Promise<void>;
  loadSRSStates: (projectId: string, forceRefresh?: boolean) => Promise<void>;
  loadProjectStats: (
    projectId: string,
    forceRefresh?: boolean
  ) => Promise<void>;

  // Project CRUD
  createProject: (data: CreateProjectData) => Promise<Project>;
  updateProject: (
    projectId: string,
    updates: Partial<Project>
  ) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;

  // Flashcard CRUD
  createFlashcard: (
    projectId: string,
    data: CreateFlashcardData
  ) => Promise<Flashcard>;
  updateFlashcard: (
    flashcardId: string,
    updates: Partial<Flashcard>
  ) => Promise<void>;
  deleteFlashcard: (flashcardId: string) => Promise<void>;

  // Utility
  getProject: (projectId: string) => Project | null;
  getFlashcards: (projectId: string) => Flashcard[];
  getSRSStates: (projectId: string) => SRSState[];
  getProjectStats: (projectId: string) => ProjectStats | null;
}

export const useCachedProjectsStore = create<CachedProjectsState>(
  (set, get) => ({
    // Initial state
    projects: [],
    projectsById: {},
    flashcardsByProject: {},
    srsStatesByProject: {},
    projectStats: {},
    isLoadingProjects: false,
    isLoadingFlashcards: {},
    isLoadingSRS: {},
    error: null,
    lastFetch: {},

    // Load all projects
    loadProjects: async (forceRefresh = false) => {
      set({ isLoadingProjects: true, error: null });

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        const projects = await cachedFetch(
          "projects",
          async () => {
            console.log(
              `[Projects] Fetching projects from database for user: ${user.id}`
            );
            const { data, error } = await supabase
              .from("projects")
              .select("id, name, description, created_at")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false });

            if (error) throw error;
            return (data || []).map((project) => ({
              ...project,
              user_id: user.id,
            }));
          },
          {
            forceRefresh,
            onCacheHit: () =>
              console.log(
                `[Projects] Using cached projects for user: ${user.id}`
              ),
            onCacheMiss: () =>
              console.log(
                `[Projects] Cache miss, fetching projects from database`
              ),
          }
        );

        const projectsById = projects.reduce((acc, project) => {
          acc[project.id] = project;
          return acc;
        }, {} as Record<string, Project>);

        set({
          projects,
          projectsById,
          isLoadingProjects: false,
          lastFetch: { ...get().lastFetch, projects: Date.now() },
        });
      } catch (error) {
        console.error("[Projects] Error loading projects:", error);
        set({
          error:
            error instanceof Error ? error.message : "Failed to load projects",
          isLoadingProjects: false,
        });
      }
    },

    // Load specific project
    loadProject: async (projectId: string, forceRefresh = false) => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        const cacheKey: CacheKey = `project:${projectId}`;

        const project = await cachedFetch(
          cacheKey,
          async () => {
            console.log(
              `[Projects] Fetching project ${projectId} from database`
            );
            const { data, error } = await supabase
              .from("projects")
              .select("id, name, description, created_at")
              .eq("id", projectId)
              .eq("user_id", user.id)
              .single();

            if (error) throw error;
            return { ...data, user_id: user.id };
          },
          {
            forceRefresh,
            onCacheHit: () =>
              console.log(`[Projects] Using cached project: ${projectId}`),
            onCacheMiss: () =>
              console.log(`[Projects] Cache miss for project: ${projectId}`),
          }
        );

        set((state) => ({
          projectsById: { ...state.projectsById, [projectId]: project },
          lastFetch: {
            ...state.lastFetch,
            [`project:${projectId}`]: Date.now(),
          },
        }));
      } catch (error) {
        console.error(`[Projects] Error loading project ${projectId}:`, error);
        set({
          error:
            error instanceof Error ? error.message : "Failed to load project",
        });
      }
    },

    // Load flashcards for a project
    loadFlashcards: async (projectId: string, forceRefresh = false) => {
      set((state) => ({
        isLoadingFlashcards: {
          ...state.isLoadingFlashcards,
          [projectId]: true,
        },
        error: null,
      }));

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        // Verify project ownership first
        const project = get().projectsById[projectId];
        if (!project) {
          await get().loadProject(projectId);
        }

        const cacheKey: CacheKey = `flashcards:${projectId}`;

        const flashcards = await cachedFetch(
          cacheKey,
          async () => {
            console.log(
              `[Projects] Fetching flashcards for project: ${projectId}`
            );
            const { data, error } = await supabase
              .from("flashcards")
              .select("*")
              .eq("project_id", projectId)
              .order("created_at", { ascending: true });

            if (error) throw error;
            return data || [];
          },
          {
            forceRefresh,
            onCacheHit: () =>
              console.log(
                `[Projects] Using cached flashcards for project: ${projectId}`
              ),
            onCacheMiss: () =>
              console.log(`[Projects] Cache miss for flashcards: ${projectId}`),
          }
        );

        set((state) => ({
          flashcardsByProject: {
            ...state.flashcardsByProject,
            [projectId]: flashcards,
          },
          isLoadingFlashcards: {
            ...state.isLoadingFlashcards,
            [projectId]: false,
          },
          lastFetch: {
            ...state.lastFetch,
            [`flashcards:${projectId}`]: Date.now(),
          },
        }));
      } catch (error) {
        console.error(
          `[Projects] Error loading flashcards for project ${projectId}:`,
          error
        );
        set((state) => ({
          error:
            error instanceof Error
              ? error.message
              : "Failed to load flashcards",
          isLoadingFlashcards: {
            ...state.isLoadingFlashcards,
            [projectId]: false,
          },
        }));
      }
    },

    // Load SRS states for a project
    loadSRSStates: async (projectId: string, forceRefresh = false) => {
      set((state) => ({
        isLoadingSRS: { ...state.isLoadingSRS, [projectId]: true },
        error: null,
      }));

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        const cacheKey: CacheKey = `srs_states:${projectId}`;

        const srsStates = await cachedFetch(
          cacheKey,
          async () => {
            console.log(
              `[Projects] Fetching SRS states for project: ${projectId}`
            );
            const { data, error } = await supabase
              .from("srs_states")
              .select("*")
              .eq("project_id", projectId)
              .eq("user_id", user.id);

            if (error) throw error;
            return data || [];
          },
          {
            forceRefresh,
            ttl: 2 * 60 * 1000, // SRS states change more frequently - 2 minutes cache
            onCacheHit: () =>
              console.log(
                `[Projects] Using cached SRS states for project: ${projectId}`
              ),
            onCacheMiss: () =>
              console.log(`[Projects] Cache miss for SRS states: ${projectId}`),
          }
        );

        set((state) => ({
          srsStatesByProject: {
            ...state.srsStatesByProject,
            [projectId]: srsStates,
          },
          isLoadingSRS: { ...state.isLoadingSRS, [projectId]: false },
          lastFetch: {
            ...state.lastFetch,
            [`srs_states:${projectId}`]: Date.now(),
          },
        }));
      } catch (error) {
        console.error(
          `[Projects] Error loading SRS states for project ${projectId}:`,
          error
        );
        set((state) => ({
          error:
            error instanceof Error
              ? error.message
              : "Failed to load SRS states",
          isLoadingSRS: { ...state.isLoadingSRS, [projectId]: false },
        }));
      }
    },

    // Load project stats
    loadProjectStats: async (projectId: string, forceRefresh = false) => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        const cacheKey: CacheKey = `study_stats:${user.id}:${projectId}`;

        const stats = await cachedFetch(
          cacheKey,
          async () => {
            console.log(`[Projects] Fetching project stats for: ${projectId}`);

            // First get flashcard IDs for this project
            const { data: flashcards } = await supabase
              .from("flashcards")
              .select("id")
              .eq("project_id", projectId);

            if (!flashcards || flashcards.length === 0) {
              return {
                dueCards: 0,
                newCards: 0,
                learningCards: 0,
                nextReviewDate: null,
              };
            }

            const flashcardIds = flashcards.map((f) => f.id);

            // Get SRS states for these flashcards
            const { data: states } = await supabase
              .from("srs_states")
              .select("state, due, is_suspended")
              .eq("user_id", user.id)
              .in("card_id", flashcardIds);

            if (!states) {
              return {
                dueCards: 0,
                newCards: 0,
                learningCards: 0,
                nextReviewDate: null,
              };
            }

            const now = new Date();
            const activeStates = states.filter((s) => !s.is_suspended);

            const dueCards = activeStates.filter(
              (s) =>
                new Date(s.due) <= now &&
                (s.state === "review" || s.state === "relearning")
            ).length;

            const newCards = activeStates.filter(
              (s) => s.state === "new"
            ).length;
            const learningCards = activeStates.filter(
              (s) => s.state === "learning"
            ).length;

            // Find next review date
            const futureDue = activeStates
              .filter((s) => new Date(s.due) > now)
              .map((s) => new Date(s.due))
              .sort((a, b) => a.getTime() - b.getTime());

            const nextReviewDate =
              futureDue.length > 0 ? futureDue[0].toISOString() : null;

            return {
              dueCards,
              newCards,
              learningCards,
              nextReviewDate,
            };
          },
          {
            forceRefresh,
            ttl: 5 * 60 * 1000, // 5 minutes cache for stats
            onCacheHit: () =>
              console.log(
                `[Projects] Using cached stats for project: ${projectId}`
              ),
            onCacheMiss: () =>
              console.log(
                `[Projects] Cache miss for project stats: ${projectId}`
              ),
          }
        );

        set((state) => ({
          projectStats: { ...state.projectStats, [projectId]: stats },
          lastFetch: { ...state.lastFetch, [`stats:${projectId}`]: Date.now() },
        }));
      } catch (error) {
        console.error(
          `[Projects] Error loading project stats for ${projectId}:`,
          error
        );
        set({
          error:
            error instanceof Error
              ? error.message
              : "Failed to load project stats",
        });
      }
    },

    // Create new project
    createProject: async (data: CreateProjectData) => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        console.log(
          `[Projects] Creating new project for user: ${user.id}`,
          data
        );

        const { data: project, error } = await supabase
          .from("projects")
          .insert([{ ...data, user_id: user.id }])
          .select()
          .single();

        if (error) throw error;

        const newProject = { ...project, user_id: user.id };

        // Update state optimistically
        set((state) => ({
          projects: [newProject, ...state.projects],
          projectsById: { ...state.projectsById, [newProject.id]: newProject },
          flashcardsByProject: {
            ...state.flashcardsByProject,
            [newProject.id]: [],
          },
          srsStatesByProject: {
            ...state.srsStatesByProject,
            [newProject.id]: [],
          },
          // Update lastFetch to prevent immediate cache reload
          lastFetch: { ...state.lastFetch, projects: Date.now() },
        }));

        // Invalidate projects cache to ensure fresh data on next access
        CacheInvalidation.onProjectUpdate(newProject.id);

        // Invalidate batch stats cache since project list changed
        invalidateBatchStatsCache();

        console.log(
          `[Projects] Created project successfully: ${newProject.id}`
        );
        return newProject;
      } catch (error) {
        console.error("[Projects] Error creating project:", error);
        set({
          error:
            error instanceof Error ? error.message : "Failed to create project",
        });
        throw error;
      }
    },

    // Update project
    updateProject: async (projectId: string, updates: Partial<Project>) => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        console.log(`[Projects] Updating project: ${projectId}`, updates);

        const { data, error } = await supabase
          .from("projects")
          .update(updates)
          .eq("id", projectId)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;

        const updatedProject = { ...data, user_id: user.id };

        // Update state
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? updatedProject : p
          ),
          projectsById: { ...state.projectsById, [projectId]: updatedProject },
        }));

        // Invalidate cache
        CacheInvalidation.onProjectUpdate(projectId);

        // Invalidate batch stats cache since project data changed
        invalidateBatchStatsCache();

        console.log(`[Projects] Updated project successfully: ${projectId}`);
      } catch (error) {
        console.error(`[Projects] Error updating project ${projectId}:`, error);
        set({
          error:
            error instanceof Error ? error.message : "Failed to update project",
        });
        throw error;
      }
    },

    // Delete project
    deleteProject: async (projectId: string) => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        console.log(`[Projects] Deleting project: ${projectId}`);

        const { error } = await supabase
          .from("projects")
          .delete()
          .eq("id", projectId)
          .eq("user_id", user.id);

        if (error) throw error;

        // Update state
        set((state) => {
          const newProjectsById = { ...state.projectsById };
          delete newProjectsById[projectId];

          const newFlashcardsByProject = { ...state.flashcardsByProject };
          delete newFlashcardsByProject[projectId];

          const newSrsStatesByProject = { ...state.srsStatesByProject };
          delete newSrsStatesByProject[projectId];

          const newProjectStats = { ...state.projectStats };
          delete newProjectStats[projectId];

          return {
            projects: state.projects.filter((p) => p.id !== projectId),
            projectsById: newProjectsById,
            flashcardsByProject: newFlashcardsByProject,
            srsStatesByProject: newSrsStatesByProject,
            projectStats: newProjectStats,
          };
        });

        // Invalidate cache
        CacheInvalidation.onProjectDelete(projectId);

        // Invalidate batch stats cache since project list changed
        invalidateBatchStatsCache();

        console.log(`[Projects] Deleted project successfully: ${projectId}`);
      } catch (error) {
        console.error(`[Projects] Error deleting project ${projectId}:`, error);
        set({
          error:
            error instanceof Error ? error.message : "Failed to delete project",
        });
        throw error;
      }
    },

    // Create flashcard
    createFlashcard: async (projectId: string, data: CreateFlashcardData) => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        console.log(
          `[Projects] Creating flashcard for project: ${projectId}`,
          data
        );

        const { data: flashcard, error } = await supabase
          .from("flashcards")
          .insert([{ ...data, project_id: projectId }])
          .select()
          .single();

        if (error) throw error;

        // Create initial SRS state
        const now = new Date().toISOString();
        const { error: srsError } = await supabase.from("srs_states").insert([
          {
            user_id: user.id,
            project_id: projectId,
            card_id: flashcard.id,
            interval: 1,
            ease: 2.5,
            due: now,
            last_reviewed: now,
            repetitions: 0,
            state: "new",
            lapses: 0,
            learning_step: 0,
            is_leech: false,
            is_suspended: false,
          },
        ]);

        if (srsError) {
          console.error("[Projects] Error creating SRS state:", srsError);
        }

        // Update state
        set((state) => ({
          flashcardsByProject: {
            ...state.flashcardsByProject,
            [projectId]: [
              ...(state.flashcardsByProject[projectId] || []),
              flashcard,
            ],
          },
        }));

        // Invalidate cache
        CacheInvalidation.onFlashcardUpdate(projectId);

        console.log(
          `[Projects] Created flashcard successfully: ${flashcard.id}`
        );
        return flashcard;
      } catch (error) {
        console.error(
          `[Projects] Error creating flashcard for project ${projectId}:`,
          error
        );
        set({
          error:
            error instanceof Error
              ? error.message
              : "Failed to create flashcard",
        });
        throw error;
      }
    },

    // Update flashcard
    updateFlashcard: async (
      flashcardId: string,
      updates: Partial<Flashcard>
    ) => {
      try {
        const supabase = createClient();

        console.log(`[Projects] Updating flashcard: ${flashcardId}`, updates);

        const { data, error } = await supabase
          .from("flashcards")
          .update(updates)
          .eq("id", flashcardId)
          .select()
          .single();

        if (error) throw error;

        // Update state
        set((state) => {
          const newFlashcardsByProject = { ...state.flashcardsByProject };
          Object.keys(newFlashcardsByProject).forEach((projectId) => {
            newFlashcardsByProject[projectId] = newFlashcardsByProject[
              projectId
            ].map((f) => (f.id === flashcardId ? data : f));
          });
          return { flashcardsByProject: newFlashcardsByProject };
        });

        // Invalidate cache
        CacheInvalidation.onFlashcardUpdate(data.project_id);

        console.log(
          `[Projects] Updated flashcard successfully: ${flashcardId}`
        );
      } catch (error) {
        console.error(
          `[Projects] Error updating flashcard ${flashcardId}:`,
          error
        );
        set({
          error:
            error instanceof Error
              ? error.message
              : "Failed to update flashcard",
        });
        throw error;
      }
    },

    // Delete flashcard
    deleteFlashcard: async (flashcardId: string) => {
      try {
        const supabase = createClient();

        // Get the flashcard to know which project it belongs to
        const state = get();
        let projectId = "";
        Object.entries(state.flashcardsByProject).forEach(
          ([pid, flashcards]) => {
            if (flashcards.some((f) => f.id === flashcardId)) {
              projectId = pid;
            }
          }
        );

        console.log(`[Projects] Deleting flashcard: ${flashcardId}`);

        const { error } = await supabase
          .from("flashcards")
          .delete()
          .eq("id", flashcardId);

        if (error) throw error;

        // Update state
        set((state) => {
          const newFlashcardsByProject = { ...state.flashcardsByProject };
          Object.keys(newFlashcardsByProject).forEach((pid) => {
            newFlashcardsByProject[pid] = newFlashcardsByProject[pid].filter(
              (f) => f.id !== flashcardId
            );
          });
          return { flashcardsByProject: newFlashcardsByProject };
        });

        // Invalidate cache
        if (projectId) {
          CacheInvalidation.onFlashcardUpdate(projectId);
        }

        console.log(
          `[Projects] Deleted flashcard successfully: ${flashcardId}`
        );
      } catch (error) {
        console.error(
          `[Projects] Error deleting flashcard ${flashcardId}:`,
          error
        );
        set({
          error:
            error instanceof Error
              ? error.message
              : "Failed to delete flashcard",
        });
        throw error;
      }
    },

    // Utility methods
    getProject: (projectId: string) => {
      return get().projectsById[projectId] || null;
    },

    getFlashcards: (projectId: string) => {
      return get().flashcardsByProject[projectId] || [];
    },

    getSRSStates: (projectId: string) => {
      return get().srsStatesByProject[projectId] || [];
    },

    getProjectStats: (projectId: string) => {
      return get().projectStats[projectId] || null;
    },
  })
);

// Hook for automatic project loading
export function useAutoLoadProjects() {
  const { loadProjects, lastFetch, projects } = useCachedProjectsStore();

  useEffect(() => {
    if (projects.length === 0 && !lastFetch.projects) {
      loadProjects();
    }
  }, [loadProjects, lastFetch.projects, projects.length]);
}

// Hook for loading specific project data
export function useProjectData(projectId: string) {
  const {
    loadProject,
    loadFlashcards,
    loadSRSStates,
    loadProjectStats,
    getProject,
    getFlashcards,
    getSRSStates,
    getProjectStats,
    isLoadingFlashcards,
    isLoadingSRS,
  } = useCachedProjectsStore();

  const project = getProject(projectId);
  const flashcards = getFlashcards(projectId);
  const srsStates = getSRSStates(projectId);
  const stats = getProjectStats(projectId);

  useEffect(() => {
    if (!project) {
      loadProject(projectId);
    }
    if (flashcards.length === 0) {
      loadFlashcards(projectId);
    }
    if (srsStates.length === 0) {
      loadSRSStates(projectId);
    }
    if (!stats) {
      loadProjectStats(projectId);
    }
  }, [
    projectId,
    project,
    flashcards.length,
    srsStates.length,
    stats,
    loadProject,
    loadFlashcards,
    loadSRSStates,
    loadProjectStats,
  ]);

  return {
    project,
    flashcards,
    srsStates,
    stats,
    isLoadingFlashcards: isLoadingFlashcards[projectId] || false,
    isLoadingSRS: isLoadingSRS[projectId] || false,
  };
}
