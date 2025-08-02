import { create } from "zustand";
import { createProject, updateProject, deleteProject } from "../actions";
import {
  normalizeProject,
  Project,
  RawProject,
} from "../utils/normalizeProject";
import { formatDate } from "../utils/formatDate";

interface ProjectsState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  addProject: (
    project: Omit<Project, "id" | "created_at" | "formattedCreatedAt">
  ) => Promise<void>;
  updateProjectById: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProjectById: (id: string) => void;
  undoDelete: () => void;
  setError: (error: string | null) => void;
}

let undoRef: null | (() => void) = null;
let isFetching = false;

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  loading: true,
  error: null,
  fetchProjects: async () => {
    console.log(
      "[useProjects] fetchProjects called: fetching projects from DB..."
    );
    if (isFetching || get().loading) {
      set({ loading: false });
      return;
    }
    isFetching = true;
    set({ loading: true, error: null });
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data: RawProject[] = await res.json();
      const normalized = data.map((p) => ({
        ...normalizeProject(p),
        formattedCreatedAt: formatDate(p.created_at),
      }));
      set({ projects: normalized });
    } catch {
      set({ error: "Failed to load projects" });
    } finally {
      set({ loading: false });
      isFetching = false;
    }
  },
  addProject: async (project) => {
    set({ loading: true });
    try {
      const tempId = "temp-" + Date.now();
      const optimistic: Project = {
        id: tempId,
        ...project,
        created_at: new Date().toISOString(),
        formattedCreatedAt: formatDate(new Date()),
      };
      set((state) => ({ projects: [optimistic, ...state.projects] }));
      await createProject(project);
      console.log("[useProjects] Refetching projects after create...");
      await get().fetchProjects();
    } catch {
      set({ error: "Failed to create project" });
    } finally {
      set({ loading: false });
    }
  },
  updateProjectById: async (id, updates) => {
    set({ loading: true });
    try {
      set((state) => ({
        projects: state.projects.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      }));
      const current = get().projects.find((p) => p.id === id);
      if (!current) throw new Error("Project not found");
      await updateProject({
        id,
        name: updates.name ?? current.name,
        description: updates.description ?? current.description,
      });
      console.log("[useProjects] Refetching projects after update...");
      await get().fetchProjects();
    } catch {
      set({ error: "Failed to update project" });
    } finally {
      set({ loading: false });
    }
  },
  deleteProjectById: (id) => {
    const deleted = get().projects.find((p) => p.id === id);
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }));
    let undo = false;
    undoRef = () => {
      undo = true;
      set((state) => ({ projects: [deleted!, ...state.projects] }));
    };
    setTimeout(async () => {
      if (!undo) {
        set({ loading: true });
        try {
          await deleteProject(id);
          console.log("[useProjects] Refetching projects after delete...");
          await get().fetchProjects();
        } catch {
          set({ error: "Failed to delete project" });
        } finally {
          set({ loading: false });
        }
      }
    }, 5000);
  },
  undoDelete: () => {
    if (undoRef) {
      undoRef();
      undoRef = null;
    }
  },
  setError: (error) => set({ error }),
}));
