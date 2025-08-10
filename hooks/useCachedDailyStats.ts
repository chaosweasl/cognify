import { create } from "zustand";
import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { cachedFetch, CacheInvalidation } from "./useCache";
import type { CacheKey } from "./useCache";

export interface DailyStats {
  id: string;
  user_id: string;
  study_date: string; // YYYY-MM-DD format
  new_cards_studied: number;
  reviews_completed: number;
  time_spent_seconds: number;
  cards_learned: number;
  cards_lapsed: number;
  created_at: string;
  updated_at: string;
}

export interface DailyStatsUpdate {
  new_cards_studied?: number;
  reviews_completed?: number;
  time_spent_seconds?: number;
  cards_learned?: number;
  cards_lapsed?: number;
}

interface CachedDailyStatsState {
  statsByDate: Record<string, DailyStats>; // date -> stats
  isLoading: Record<string, boolean>; // date -> loading state
  error: string | null;
  lastFetch: Record<string, number>; // date -> timestamp

  // Actions
  loadDailyStats: (date: string, forceRefresh?: boolean) => Promise<void>;
  loadDateRange: (
    startDate: string,
    endDate: string,
    forceRefresh?: boolean
  ) => Promise<void>;
  updateDailyStats: (date: string, updates: DailyStatsUpdate) => Promise<void>;
  incrementStats: (date: string, updates: DailyStatsUpdate) => Promise<void>;

  // Utility
  getStatsForDate: (date: string) => DailyStats | null;
  getStatsForDateRange: (startDate: string, endDate: string) => DailyStats[];
  getTotalStats: (startDate: string, endDate: string) => DailyStatsUpdate;
}

export const useCachedDailyStatsStore = create<CachedDailyStatsState>(
  (set, get) => ({
    statsByDate: {},
    isLoading: {},
    error: null,
    lastFetch: {},

    // Load daily stats for a specific date
    loadDailyStats: async (date: string, forceRefresh = false) => {
      set((state) => ({
        isLoading: { ...state.isLoading, [date]: true },
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

        const cacheKey: CacheKey = `daily_stats:${user.id}:${date}`;

        const stats = await cachedFetch(
          cacheKey,
          async () => {
            console.log(
              `[DailyStats] Fetching stats for date: ${date}, user: ${user.id}`
            );
            const { data, error } = await supabase
              .from("daily_study_stats")
              .select("*")
              .eq("user_id", user.id)
              .eq("study_date", date)
              .single();

            if (error) {
              if (error.code === "PGRST116") {
                // No stats found for this date - return default stats
                const defaultStats: DailyStats = {
                  id: "", // Will be set when first update happens
                  user_id: user.id,
                  study_date: date,
                  new_cards_studied: 0,
                  reviews_completed: 0,
                  time_spent_seconds: 0,
                  cards_learned: 0,
                  cards_lapsed: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                };
                console.log(
                  `[DailyStats] No stats found for ${date}, returning defaults`
                );
                return defaultStats;
              } else {
                throw error;
              }
            }

            return data;
          },
          {
            forceRefresh,
            ttl: 60 * 60 * 1000, // 1 hour cache for daily stats
            onCacheHit: () =>
              console.log(`[DailyStats] Using cached stats for date: ${date}`),
            onCacheMiss: () =>
              console.log(`[DailyStats] Cache miss for daily stats: ${date}`),
          }
        );

        set((state) => ({
          statsByDate: { ...state.statsByDate, [date]: stats },
          isLoading: { ...state.isLoading, [date]: false },
          lastFetch: { ...state.lastFetch, [date]: Date.now() },
        }));
      } catch (error) {
        console.error(
          `[DailyStats] Error loading stats for date ${date}:`,
          error
        );
        set((state) => ({
          error:
            error instanceof Error
              ? error.message
              : "Failed to load daily stats",
          isLoading: { ...state.isLoading, [date]: false },
        }));
      }
    },

    // Load stats for a date range
    loadDateRange: async (
      startDate: string,
      endDate: string,
      forceRefresh = false
    ) => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        const cacheKey: CacheKey = `daily_stats:${user.id}:${startDate}_${endDate}`;

        const statsArray = await cachedFetch(
          cacheKey,
          async () => {
            console.log(
              `[DailyStats] Fetching stats range: ${startDate} to ${endDate}, user: ${user.id}`
            );
            const { data, error } = await supabase
              .from("daily_study_stats")
              .select("*")
              .eq("user_id", user.id)
              .gte("study_date", startDate)
              .lte("study_date", endDate)
              .order("study_date", { ascending: true });

            if (error) throw error;
            return data || [];
          },
          {
            forceRefresh,
            ttl: 30 * 60 * 1000, // 30 minutes cache for date ranges
            onCacheHit: () =>
              console.log(
                `[DailyStats] Using cached stats range: ${startDate} to ${endDate}`
              ),
            onCacheMiss: () =>
              console.log(
                `[DailyStats] Cache miss for stats range: ${startDate} to ${endDate}`
              ),
          }
        );

        // Update state with all stats from the range
        const statsByDate = statsArray.reduce((acc, stats) => {
          acc[stats.study_date] = stats;
          return acc;
        }, {} as Record<string, DailyStats>);

        set((state) => ({
          statsByDate: { ...state.statsByDate, ...statsByDate },
          lastFetch: {
            ...state.lastFetch,
            [`range:${startDate}_${endDate}`]: Date.now(),
          },
        }));
      } catch (error) {
        console.error(
          `[DailyStats] Error loading stats range ${startDate} to ${endDate}:`,
          error
        );
        set({
          error:
            error instanceof Error
              ? error.message
              : "Failed to load daily stats range",
        });
      }
    },

    // Update daily stats for a specific date
    updateDailyStats: async (date: string, updates: DailyStatsUpdate) => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        console.log(`[DailyStats] Updating stats for date: ${date}`, updates);

        // Check if stats exist for this date
        const existingStats = get().statsByDate[date];

        if (existingStats && existingStats.id) {
          // Update existing stats
          const { data, error } = await supabase
            .from("daily_study_stats")
            .update(updates)
            .eq("id", existingStats.id)
            .select()
            .single();

          if (error) throw error;

          set((state) => ({
            statsByDate: { ...state.statsByDate, [date]: data },
            lastFetch: { ...state.lastFetch, [date]: Date.now() },
          }));
        } else {
          // Create new stats entry
          const { data, error } = await supabase
            .from("daily_study_stats")
            .insert([
              {
                user_id: user.id,
                study_date: date,
                new_cards_studied: 0,
                reviews_completed: 0,
                time_spent_seconds: 0,
                cards_learned: 0,
                cards_lapsed: 0,
                ...updates,
              },
            ])
            .select()
            .single();

          if (error) throw error;

          set((state) => ({
            statsByDate: { ...state.statsByDate, [date]: data },
            lastFetch: { ...state.lastFetch, [date]: Date.now() },
          }));
        }

        // Invalidate cache
        CacheInvalidation.onSRSUpdate("", user.id); // This affects daily stats

        console.log(
          `[DailyStats] Updated stats successfully for date: ${date}`
        );
      } catch (error) {
        console.error(
          `[DailyStats] Error updating stats for date ${date}:`,
          error
        );
        set({
          error:
            error instanceof Error
              ? error.message
              : "Failed to update daily stats",
        });
        throw error;
      }
    },

    // Increment daily stats (useful for study sessions)
    incrementStats: async (date: string, updates: DailyStatsUpdate) => {
      try {
        const existingStats = get().statsByDate[date];

        if (!existingStats) {
          // Load existing stats first
          await get().loadDailyStats(date);
        }

        const currentStats = get().statsByDate[date] || {
          new_cards_studied: 0,
          reviews_completed: 0,
          time_spent_seconds: 0,
          cards_learned: 0,
          cards_lapsed: 0,
        };

        const incrementedUpdates: DailyStatsUpdate = {
          new_cards_studied:
            (currentStats.new_cards_studied || 0) +
            (updates.new_cards_studied || 0),
          reviews_completed:
            (currentStats.reviews_completed || 0) +
            (updates.reviews_completed || 0),
          time_spent_seconds:
            (currentStats.time_spent_seconds || 0) +
            (updates.time_spent_seconds || 0),
          cards_learned:
            (currentStats.cards_learned || 0) + (updates.cards_learned || 0),
          cards_lapsed:
            (currentStats.cards_lapsed || 0) + (updates.cards_lapsed || 0),
        };

        await get().updateDailyStats(date, incrementedUpdates);

        console.log(
          `[DailyStats] Incremented stats for date: ${date}`,
          updates
        );
      } catch (error) {
        console.error(
          `[DailyStats] Error incrementing stats for date ${date}:`,
          error
        );
        throw error;
      }
    },

    // Utility methods
    getStatsForDate: (date: string) => {
      return get().statsByDate[date] || null;
    },

    getStatsForDateRange: (startDate: string, endDate: string) => {
      const statsByDate = get().statsByDate;
      const stats: DailyStats[] = [];

      const start = new Date(startDate);
      const end = new Date(endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        const dayStats = statsByDate[dateStr];
        if (dayStats) {
          stats.push(dayStats);
        }
      }

      return stats.sort((a, b) => a.study_date.localeCompare(b.study_date));
    },

    getTotalStats: (startDate: string, endDate: string) => {
      const rangeStats = get().getStatsForDateRange(startDate, endDate);

      return rangeStats.reduce(
        (total, dayStats) => ({
          new_cards_studied:
            (total.new_cards_studied || 0) + dayStats.new_cards_studied,
          reviews_completed:
            (total.reviews_completed || 0) + dayStats.reviews_completed,
          time_spent_seconds:
            (total.time_spent_seconds || 0) + dayStats.time_spent_seconds,
          cards_learned: (total.cards_learned || 0) + dayStats.cards_learned,
          cards_lapsed: (total.cards_lapsed || 0) + dayStats.cards_lapsed,
        }),
        {
          new_cards_studied: 0,
          reviews_completed: 0,
          time_spent_seconds: 0,
          cards_learned: 0,
          cards_lapsed: 0,
        }
      );
    },
  })
);

// Hook for today's stats
export function useTodayStats() {
  const today = new Date().toISOString().split("T")[0];
  const { loadDailyStats, getStatsForDate, isLoading } =
    useCachedDailyStatsStore();

  const stats = getStatsForDate(today);
  const loading = isLoading[today] || false;

  useEffect(() => {
    if (!stats) {
      loadDailyStats(today);
    }
  }, [loadDailyStats, today, stats]);

  return { stats, loading, date: today };
}

// Hook for weekly stats
export function useWeeklyStats() {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)

  const endDate = today.toISOString().split("T")[0];
  const startDate = startOfWeek.toISOString().split("T")[0];

  const { loadDateRange, getStatsForDateRange, getTotalStats } =
    useCachedDailyStatsStore();

  const rangeStats = getStatsForDateRange(startDate, endDate);
  const totalStats = getTotalStats(startDate, endDate);

  useEffect(() => {
    loadDateRange(startDate, endDate);
  }, [loadDateRange, startDate, endDate]);

  return {
    rangeStats,
    totalStats,
    startDate,
    endDate,
    weekDays: 7,
  };
}

// Hook for monthly stats
export function useMonthlyStats(year?: number, month?: number) {
  const today = new Date();
  const targetYear = year || today.getFullYear();
  const targetMonth = month || today.getMonth();

  const startDate = new Date(targetYear, targetMonth, 1)
    .toISOString()
    .split("T")[0];
  const endDate = new Date(targetYear, targetMonth + 1, 0)
    .toISOString()
    .split("T")[0];

  const { loadDateRange, getStatsForDateRange, getTotalStats } =
    useCachedDailyStatsStore();

  const rangeStats = getStatsForDateRange(startDate, endDate);
  const totalStats = getTotalStats(startDate, endDate);

  useEffect(() => {
    loadDateRange(startDate, endDate);
  }, [loadDateRange, startDate, endDate]);

  return {
    rangeStats,
    totalStats,
    startDate,
    endDate,
    month: targetMonth,
    year: targetYear,
  };
}
