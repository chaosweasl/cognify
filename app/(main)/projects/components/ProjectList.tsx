import { ProjectCard } from "./ProjectCard";
import {
  useCachedProjectsStore,
  setBatchStatsCacheInvalidator,
} from "@/hooks/useCachedProjects";
import { useState, useEffect } from "react";
import { useCachedUserProfileStore } from "@/hooks/useCachedUserProfile";
import { initStudySessionWithFallback } from "./SRSSession";
import { useEnhancedSettings } from "@/components/CacheProvider";
import { StudySession } from "./SRSSession";
import { SRSSettings } from "@/hooks/useSettings";

// TypeScript interfaces for batch stats and cached data
interface BatchStatsData {
  projectId: string;
  totalCards: number;
  newCards: number;
  cardsToReview: number;
  lastStudied: Date | null;
}

// Cache for batch stats to avoid repeated API calls
const BATCH_STATS_CACHE_KEY = "batch_stats_cache";
const BATCH_STATS_CACHE_TTL = 30000; // 30 seconds

// Function to get cache from sessionStorage
function getBatchStatsCache() {
  if (typeof window === "undefined") return null;

  try {
    const cached = sessionStorage.getItem(BATCH_STATS_CACHE_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached);
    return parsed;
  } catch {
    return null;
  }
}

// Function to set cache in sessionStorage
function setBatchStatsCache(data: BatchStatsData[], userId: string) {
  if (typeof window === "undefined") return;

  try {
    const cacheData = {
      data,
      timestamp: Date.now(),
      userId,
    };
    sessionStorage.setItem(BATCH_STATS_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn("[ProjectList] Failed to cache batch stats:", error);
  }
}

// Function to invalidate cache when projects change
export function invalidateBatchStatsCache() {
  console.log("[ProjectList] Invalidating batch stats cache");
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(BATCH_STATS_CACHE_KEY);
  }
}

export function ProjectList() {
  const { projects, deleteProject } = useCachedProjectsStore();
  const { userProfile } = useCachedUserProfileStore();
  const userId = userProfile?.id || null;
  const { srsSettings } = useEnhancedSettings();
  const [projectStats, setProjectStats] = useState<
    Record<
      string,
      {
        dueCards: number;
        newCards: number;
        learningCards: number;
        nextReviewDate?: Date | null;
      }
    >
  >({});

  console.log("[ProjectList] Rendering with projects:", projects.length);

  // Register cache invalidation function with the store
  useEffect(() => {
    setBatchStatsCacheInvalidator(invalidateBatchStatsCache);
  }, []);

  // Helper function to process stats data
  function processStatsData(
    batchStats: BatchStatsData[],
    currentSession: StudySession | null,
    srsSettings: SRSSettings
  ) {
    const statsMap: Record<
      string,
      {
        dueCards: number;
        newCards: number;
        learningCards: number;
        nextReviewDate?: Date | null;
      }
    > = {};

    batchStats.forEach((stats) => {
      // Apply session-aware limits (respects daily new card limits)
      const remainingNewCards = Math.max(
        0,
        srsSettings.NEW_CARDS_PER_DAY - (currentSession?.newCardsStudied || 0)
      );
      const availableNewCards = Math.min(stats.newCards, remainingNewCards);

      statsMap[stats.projectId] = {
        dueCards: stats.cardsToReview,
        newCards: availableNewCards,
        learningCards: 0, // Will be calculated from SRS states if needed
        nextReviewDate: null,
      };
    });

    return statsMap;
  }

  // Fetch SRS statistics for all projects with batch API + caching
  useEffect(() => {
    async function fetchProjectStats() {
      if (!userId || projects.length === 0) {
        console.log(
          `[ProjectList] fetchProjectStats - Skipping: userId=${!!userId}, projectCount=${
            projects.length
          }`
        );
        return;
      }

      // Check cache first
      const now = Date.now();
      const cachedData = getBatchStatsCache();

      if (
        cachedData &&
        cachedData.userId === userId &&
        now - cachedData.timestamp < BATCH_STATS_CACHE_TTL
      ) {
        console.log("[ProjectList] fetchProjectStats - Using cached data");
        const currentSession = await initStudySessionWithFallback(userId);
        const statsMap = processStatsData(
          cachedData.data,
          currentSession,
          srsSettings
        );
        setProjectStats(statsMap);
        return;
      }

      if (cachedData) {
        console.log("[ProjectList] Cache miss reason:", {
          hasCache: !!cachedData,
          userMatch: cachedData.userId === userId,
          ageMs: now - cachedData.timestamp,
          ttlMs: BATCH_STATS_CACHE_TTL,
          expired: now - cachedData.timestamp >= BATCH_STATS_CACHE_TTL,
        });
      } else {
        console.log("[ProjectList] No cache available");
      }

      console.log(
        `[ProjectList] fetchProjectStats - Starting batch fetch for ${projects.length} projects`
      );

      try {
        // Use batch API to get all project stats at once
        const response = await fetch("/api/projects/batch-stats");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const batchStats = await response.json();
        console.log(
          `[ProjectList] fetchProjectStats - Received batch stats:`,
          batchStats
        );

        // Cache the response
        setBatchStatsCache(batchStats, userId);

        // Get current study session for session-aware calculations
        const currentSession = await initStudySessionWithFallback(userId);
        console.log(
          `[ProjectList] fetchProjectStats - Current session daily stats:`,
          {
            newCards: currentSession.newCardsStudied,
            reviews: currentSession.reviewsCompleted,
          }
        );

        const statsMap = processStatsData(
          batchStats,
          currentSession,
          srsSettings
        );
        setProjectStats(statsMap);
      } catch (error) {
        console.error("[ProjectList] fetchProjectStats - Error:", error);
        // Fallback to empty stats on error
        setProjectStats({});
      }
    }

    fetchProjectStats();
  }, [userId, projects, srsSettings]);

  return (
    <>
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={{
            id: project.id,
            name: project.name,
            description: project.description || "",
            formattedCreatedAt: new Date(
              project.created_at
            ).toLocaleDateString(),
          }}
          flashcardCount={project.flashcards?.length ?? 0}
          srsStats={projectStats[project.id]}
          onDelete={async (id: string) => {
            deleteProject(id);
            return Promise.resolve();
          }}
        />
      ))}
    </>
  );
}
