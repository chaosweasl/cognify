"use client";
import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useCachedSettingsStore } from "@/hooks/useCachedSettings";
import { useCachedUserProfileStore } from "@/hooks/useCachedUserProfile";
import { useCachedProjectsStore } from "@/hooks/useCachedProjects";
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

  // Auto-load data on mount if enabled
  useEffect(() => {
    if (enableAutoLoad) {
      console.log("[CacheProvider] Auto-loading initial data");

      // Load user profile first (needed for other operations)
      profileStore
        .fetchUserProfile()
        .then(() => {
          console.log(
            "[CacheProvider] Profile loaded, loading settings and projects"
          );
          // Load settings and projects in parallel
          return Promise.all([
            settingsStore.loadSettings(),
            projectsStore.loadProjects(),
          ]);
        })
        .then(() => {
          console.log("[CacheProvider] Initial data load completed");
          // Load today's stats
          const today = new Date().toISOString().split("T")[0];
          return dailyStatsStore.loadDailyStats(today);
        })
        .catch((error) => {
          console.error("[CacheProvider] Error during auto-load:", error);
        });
    }
  }, [
    enableAutoLoad,
    profileStore,
    settingsStore,
    projectsStore,
    dailyStatsStore,
  ]);

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
  const refreshAll = async () => {
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
  };

  // Clear all cached data
  const clearAll = () => {
    console.log("[CacheProvider] Clearing all cached data");
    clearCache();

    // Reset store states to defaults
    profileStore.setUserProfile(null);

    console.log("[CacheProvider] All cached data cleared");
  };

  const contextValue: CacheProviderContextType = {
    cacheStats,
    refreshAll,
    clearAll,
  };

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
  const { loadSettings, ...store } = useCachedSettingsStore();

  useEffect(() => {
    if (!store.lastFetch) {
      loadSettings();
    }
  }, [loadSettings, store.lastFetch]);

  return store;
}

export function useEnhancedUserProfile() {
  const { fetchUserProfile, ...store } = useCachedUserProfileStore();

  useEffect(() => {
    if (!store.userProfile && !store.lastFetch) {
      fetchUserProfile();
    }
  }, [fetchUserProfile, store.userProfile, store.lastFetch]);

  return store;
}

export function useEnhancedProjects() {
  const { loadProjects, ...store } = useCachedProjectsStore();

  useEffect(() => {
    if (store.projects.length === 0 && !store.lastFetch.projects) {
      loadProjects();
    }
  }, [loadProjects, store.projects.length, store.lastFetch.projects]);

  return store;
}

// Hook for project with all its data
export function useEnhancedProject(projectId: string) {
  const store = useCachedProjectsStore();

  const project = store.getProject(projectId);
  const flashcards = store.getFlashcards(projectId);
  const srsStates = store.getSRSStates(projectId);
  const stats = store.getProjectStats(projectId);

  useEffect(() => {
    const loadData = async () => {
      if (!project) {
        await store.loadProject(projectId);
      }

      // Load related data in parallel
      const promises = [];

      if (flashcards.length === 0) {
        promises.push(store.loadFlashcards(projectId));
      }

      if (srsStates.length === 0) {
        promises.push(store.loadSRSStates(projectId));
      }

      if (!stats) {
        promises.push(store.loadProjectStats(projectId));
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }
    };

    loadData().catch(console.error);
  }, [projectId, project, flashcards.length, srsStates.length, stats, store]);

  return {
    project,
    flashcards,
    srsStates,
    stats,
    isLoadingFlashcards: store.isLoadingFlashcards[projectId] || false,
    isLoadingSRS: store.isLoadingSRS[projectId] || false,
    // Store actions
    createFlashcard: (data: any) => store.createFlashcard(projectId, data),
    updateProject: (updates: any) => store.updateProject(projectId, updates),
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
