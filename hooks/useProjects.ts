import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";

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
  step: number;
  is_suspended: boolean;
  is_leech: boolean;
}

export interface ProjectStats {
  totalCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  dueCards: number;
}

// Input types for creation
export interface CreateProjectData {
  name: string;
  description?: string;
}

export interface CreateFlashcardData {
  front: string;
  back: string;
  extra?: Record<string, any>;
}

// Store state interface
interface ProjectsState {
  // Data
  projects: Project[];
  projectStats: Record<string, ProjectStats>;
  
  // Loading states
  isLoadingProjects: boolean;
  isLoadingStats: Record<string, boolean>;
  error: string | null;

  // Actions
  loadProjects: () => Promise<void>;
  loadProjectStats: (projectId: string) => Promise<void>;
  
  // Project CRUD
  createProject: (data: CreateProjectData) => Promise<Project>;
  updateProject: (projectId: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;

  // Utility
  getProject: (projectId: string) => Project | null;
  getProjectStats: (projectId: string) => ProjectStats | null;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  // Initial state
  projects: [],
  projectStats: {},
  isLoadingProjects: false,
  isLoadingStats: {},
  error: null,

  // Load all projects
  loadProjects: async () => {
    set({ isLoadingProjects: true, error: null });

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }

      const { data: projects, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      set({ 
        projects: projects || [],
        isLoadingProjects: false 
      });
    } catch (error) {
      console.error("Error loading projects:", error);
      set({ 
        error: error instanceof Error ? error.message : "Failed to load projects",
        isLoadingProjects: false 
      });
    }
  },

  // Load project statistics
  loadProjectStats: async (projectId: string) => {
    set(state => ({ 
      isLoadingStats: { ...state.isLoadingStats, [projectId]: true }
    }));

    try {
      const supabase = createClient();
      
      // Get flashcard count
      const { count: totalCards } = await supabase
        .from("flashcards")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      // Get SRS states count by state
      const { data: srsStates } = await supabase
        .from("srs_states")
        .select("state, due")
        .eq("project_id", projectId);

      const now = new Date().toISOString();
      const stats: ProjectStats = {
        totalCards: totalCards || 0,
        newCards: srsStates?.filter(s => s.state === "new").length || 0,
        learningCards: srsStates?.filter(s => s.state === "learning").length || 0,
        reviewCards: srsStates?.filter(s => s.state === "review").length || 0,
        dueCards: srsStates?.filter(s => s.due <= now && s.state !== "new").length || 0,
      };

      set(state => ({
        projectStats: { ...state.projectStats, [projectId]: stats },
        isLoadingStats: { ...state.isLoadingStats, [projectId]: false }
      }));
    } catch (error) {
      console.error("Error loading project stats:", error);
      set(state => ({
        isLoadingStats: { ...state.isLoadingStats, [projectId]: false }
      }));
    }
  },

  // Create project
  createProject: async (data: CreateProjectData) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("Not authenticated");
    }

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        name: data.name,
        description: data.description || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Add to store
    set(state => ({
      projects: [project, ...state.projects]
    }));

    return project;
  },

  // Update project
  updateProject: async (projectId: string, updates: Partial<Project>) => {
    const supabase = createClient();
    
    const { error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", projectId);

    if (error) throw error;

    // Update in store
    set(state => ({
      projects: state.projects.map(p => 
        p.id === projectId ? { ...p, ...updates } : p
      )
    }));
  },

  // Delete project
  deleteProject: async (projectId: string) => {
    const supabase = createClient();
    
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) throw error;

    // Remove from store
    set(state => ({
      projects: state.projects.filter(p => p.id !== projectId),
      projectStats: Object.fromEntries(
        Object.entries(state.projectStats).filter(([id]) => id !== projectId)
      )
    }));
  },

  // Utility functions
  getProject: (projectId: string) => {
    return get().projects.find(p => p.id === projectId) || null;
  },

  getProjectStats: (projectId: string) => {
    return get().projectStats[projectId] || null;
  },
}));