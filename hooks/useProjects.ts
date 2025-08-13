import { createClient } from "@/lib/supabase/client";
import { 
  Project, 
  ProjectStats, 
  CreateProjectData 
} from "@/src/types";

// Simple Zustand store for global project state only
import { create } from "zustand";

interface ProjectsGlobalState {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  removeProject: (projectId: string) => void;
}

// Keep minimal global state for project list
const useProjectsGlobalStore = create<ProjectsGlobalState>((set) => ({
  projects: [],
  setProjects: (projects) => set({ projects }),
  addProject: (project) => set(state => ({ 
    projects: [project, ...state.projects] 
  })),
  updateProject: (projectId, updates) => set(state => ({
    projects: state.projects.map(p => 
      p.id === projectId ? { ...p, ...updates } : p
    )
  })),
  removeProject: (projectId) => set(state => ({
    projects: state.projects.filter(p => p.id !== projectId)
  })),
}));

// Simplified project management functions
export const projectApi = {
  async loadProjects(): Promise<Project[]> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Not authenticated");

    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return projects || [];
  },

  async createProject(data: CreateProjectData): Promise<Project> {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("Not authenticated");

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
    return project;
  },

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from("projects")
      .update(updates)
      .eq("id", projectId);

    if (error) throw error;
  },

  async deleteProject(projectId: string): Promise<void> {
    const supabase = createClient();
    
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) throw error;
  },

  async getProjectStats(projectId: string): Promise<ProjectStats> {
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
    return {
      totalCards: totalCards || 0,
      newCards: srsStates?.filter(s => s.state === "new").length || 0,
      learningCards: srsStates?.filter(s => s.state === "learning").length || 0,
      reviewCards: srsStates?.filter(s => s.state === "review").length || 0,
      dueCards: srsStates?.filter(s => s.due <= now && s.state !== "new").length || 0,
    };
  }
};

// Main hook for components - simplified interface
export const useProjectsStore = () => {
  const { 
    projects, 
    setProjects, 
    addProject, 
    updateProject, 
    removeProject 
  } = useProjectsGlobalStore();

  return {
    projects,
    isLoadingProjects: false, // Simplified - no complex loading states
    error: null,
    
    // Simplified actions that use the API
    loadProjects: async () => {
      try {
        const projects = await projectApi.loadProjects();
        setProjects(projects);
      } catch (error) {
        console.error("Error loading projects:", error);
      }
    },
    
    createProject: async (data: CreateProjectData) => {
      const project = await projectApi.createProject(data);
      addProject(project);
      return project;
    },
    
    updateProjectById: async (projectId: string, updates: Partial<Project>) => {
      await projectApi.updateProject(projectId, updates);
      updateProject(projectId, updates);
    },
    
    deleteProject: async (projectId: string) => {
      await projectApi.deleteProject(projectId);
      removeProject(projectId);
    },

    // Utility functions
    getProject: (projectId: string) => {
      return projects.find(p => p.id === projectId) || null;
    },

    // Remove complex stats caching - just fetch when needed
    loadProjectStats: async (projectId: string) => {
      return await projectApi.getProjectStats(projectId);
    },
  };
};