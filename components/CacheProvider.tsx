"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { useCachedSettingsStore } from "@/hooks/useCachedSettings";
import { useCachedUserProfileStore } from "@/hooks/useCachedUserProfile";
import { useCachedProjectsStore, type CreateFlashcardData, type Project } from "@/hooks/useCachedProjects";
import { useCachedDailyStatsStore } from "@/hooks/useCachedDailyStats";
import { useCacheStore, useCacheStats } from "@/hooks/useCache";

interface CacheProviderContextType {
  cacheStats: ReturnType<typeof useCacheStats>;
  refreshAll: () => Promise<void>;
  clearAll: () => void;
}

const CacheProviderContext = createContext<CacheProviderContextType | null>(
  null
);

interface CacheProviderProps {
  children: ReactNode;
  enableAutoLoad?: boolean;
  enableDebugLogs?: boolean;
}

export function CacheProvider({
  children,
  enableAutoLoad = true,
  enableDebugLogs = false,
}: CacheProviderProps) {
  const cacheStats = useCacheStats();
  const { clear: clearCache } = useCacheStore();

  // Store references
  const settingsStore = useCachedSettingsStore();
  const profileStore = useCachedUserProfileStore();
  const projectsStore = useCachedProjectsStore();
  const dailyStatsStore = useCachedDailyStatsStore();

  // Use ref to prevent multiple auto-loads
  const hasAutoLoaded = React.useRef(false);

  // Auto-load data on mount if enabled (only once)
  useEffect(() => {
    if (enableAutoLoad && !hasAutoLoaded.current) {
      hasAutoLoaded.current = true;
      console.log("[CacheProvider] Auto-loading initial data");

      // Create a promise chain to ensure proper sequencing
      const loadData = async () => {
        try {
          // Load user profile first (needed for other operations)
          await profileStore.fetchUserProfile();
          console.log(
            "[CacheProvider] Profile loaded, loading settings and projects"
          );

          // Load settings and projects in parallel
          await Promise.all([
            settingsStore.loadSettings(),
            projectsStore.loadProjects(),
          ]);

          console.log("[CacheProvider] Initial data load completed");

          // Load today's stats
          const today = new Date().toISOString().split("T")[0];
          await dailyStatsStore.loadDailyStats(today);
        } catch (error) {
          console.error("[CacheProvider] Error during auto-load:", error);
        }
      };

      loadData();
    }
  }, [enableAutoLoad, settingsStore, profileStore, projectsStore, dailyStatsStore]);

  // Debug logging
  useEffect(() => {
    if (enableDebugLogs) {
      const interval = setInterval(() => {
        console.log("[CacheProvider] Cache Stats:", cacheStats);
      }, 30000); // Log every 30 seconds

      return () => clearInterval(interval);
    }
  }, [enableDebugLogs, cacheStats]);

  // Refresh all cached data
  const refreshAll = React.useCallback(async () => {
    console.log("[CacheProvider] Refreshing all cached data");

    try {
      // Refresh in order of dependency
      await profileStore.fetchUserProfile(true);

      await Promise.all([
        settingsStore.loadSettings(true),
        projectsStore.loadProjects(true),
      ]);

      const today = new Date().toISOString().split("T")[0];
      await dailyStatsStore.loadDailyStats(today, true);

      console.log("[CacheProvider] All data refreshed successfully");
    } catch (error) {
      console.error("[CacheProvider] Error refreshing data:", error);
      throw error;
    }
  }, [profileStore, settingsStore, projectsStore, dailyStatsStore]);

  // Clear all cached data
  const clearAll = React.useCallback(() => {
    console.log("[CacheProvider] Clearing all cached data");
    clearCache();

    // Reset store states to defaults
    profileStore.setUserProfile(null);

    console.log("[CacheProvider] All cached data cleared");
  }, [clearCache, profileStore]);

  const contextValue: CacheProviderContextType = useMemo(
    () => ({
      cacheStats,
      refreshAll,
      clearAll,
    }),
    [cacheStats, refreshAll, clearAll]
  );

  return (
    <CacheProviderContext.Provider value={contextValue}>
      {children}
    </CacheProviderContext.Provider>
  );
}

// Hook to use cache provider context
export function useCacheProvider() {
  const context = useContext(CacheProviderContext);
  if (!context) {
    throw new Error("useCacheProvider must be used within a CacheProvider");
  }
  return context;
}

// Enhanced hooks that use the cache provider
export function useEnhancedSettings() {
  const store = useCachedSettingsStore();
  const { loadSettings, ...restStore } = store;
  const [hasLoaded, setHasLoaded] = React.useState(false);

  const stableLoadSettings = React.useCallback(loadSettings, [loadSettings]);

  useEffect(() => {
    if (!hasLoaded && !restStore.lastFetch) {
      setHasLoaded(true);
      stableLoadSettings();
    }
  }, [stableLoadSettings, restStore.lastFetch, hasLoaded]);

  return restStore;
}

export function useEnhancedUserProfile() {
  const store = useCachedUserProfileStore();
  const { fetchUserProfile, ...restStore } = store;
  const [hasLoaded, setHasLoaded] = React.useState(false);

  const stableFetchUserProfile = React.useCallback(fetchUserProfile, [fetchUserProfile]);

  useEffect(() => {
    if (!hasLoaded && !restStore.userProfile && !restStore.lastFetch) {
      setHasLoaded(true);
      stableFetchUserProfile();
    }
  }, [stableFetchUserProfile, restStore.userProfile, restStore.lastFetch, hasLoaded]);

  return restStore;
}

export function useEnhancedProjects() {
  const store = useCachedProjectsStore();
  const { loadProjects, ...restStore } = store;
  const [hasLoaded, setHasLoaded] = React.useState(false);

  const stableLoadProjects = React.useCallback(loadProjects, [loadProjects]);

  useEffect(() => {
    if (
      !hasLoaded &&
      restStore.projects.length === 0 &&
      !restStore.lastFetch.projects
    ) {
      setHasLoaded(true);
      stableLoadProjects();
    }
  }, [
    stableLoadProjects,
    restStore.projects.length,
    restStore.lastFetch.projects,
    hasLoaded,
  ]);

  return restStore;
}

// Hook for project with all its data
export function useEnhancedProject(projectId: string) {
  const store = useCachedProjectsStore();

  const project = store.getProject(projectId);
  const flashcards = store.getFlashcards(projectId);
  const srsStates = store.getSRSStates(projectId);
  const stats = store.getProjectStats(projectId);

  const stableLoadProject = React.useCallback(
    (id: string, force?: boolean) => store.loadProject(id, force),
    [store]
  );
  const stableLoadFlashcards = React.useCallback(
    (id: string, force?: boolean) => store.loadFlashcards(id, force),
    [store]
  );
  const stableLoadSRSStates = React.useCallback(
    (id: string, force?: boolean) => store.loadSRSStates(id, force),
    [store]
  );
  const stableLoadProjectStats = React.useCallback(
    (id: string, force?: boolean) => store.loadProjectStats(id, force),
    [store]
  );

  useEffect(() => {
    const loadData = async () => {
      if (!project) {
        await stableLoadProject(projectId);
      }

      // Load related data in parallel
      const promises = [];

      if (flashcards.length === 0) {
        promises.push(stableLoadFlashcards(projectId));
      }

      if (srsStates.length === 0) {
        promises.push(stableLoadSRSStates(projectId));
      }

      if (!stats) {
        promises.push(stableLoadProjectStats(projectId));
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }
    };

    loadData().catch(console.error);
  }, [
    projectId, 
    project, 
    flashcards.length, 
    srsStates.length, 
    stats, 
    stableLoadProject,
    stableLoadFlashcards,
    stableLoadSRSStates,
    stableLoadProjectStats
  ]);

  return {
    project,
    flashcards,
    srsStates,
    stats,
    isLoadingFlashcards: store.isLoadingFlashcards[projectId] || false,
    isLoadingSRS: store.isLoadingSRS[projectId] || false,
    // Store actions
    createFlashcard: (data: CreateFlashcardData) => store.createFlashcard(projectId, data),
    updateProject: (updates: Partial<Project>) => store.updateProject(projectId, updates),
    deleteProject: () => store.deleteProject(projectId),
    refreshProject: () => {
      store.loadProject(projectId, true);
      store.loadFlashcards(projectId, true);
      store.loadSRSStates(projectId, true);
      store.loadProjectStats(projectId, true);
    },
  };
}

// Debug component for cache stats
export function CacheDebugInfo() {
  const { cacheStats } = useCacheProvider();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-base-200 p-4 rounded-lg shadow-lg text-xs opacity-75 hover:opacity-100 transition-opacity">
      <h4 className="font-bold text-base-content mb-2">Cache Stats</h4>
      <div className="space-y-1 text-base-content/70">
        <div>Entries: {cacheStats.totalEntries}</div>
        <div>Expired: {cacheStats.expiredEntries}</div>
        <div>Hit Rate: {(cacheStats.cacheHitRate * 100).toFixed(1)}%</div>
        <div>Size: {(cacheStats.totalSize / 1024).toFixed(1)} KB</div>
      </div>
    </div>
  );
}
