import { create } from "zustand";
import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { cachedFetch, CacheInvalidation } from "./useCache";
import type { CacheKey } from "./useCache";

// Re-export interfaces from original useSettings
export interface SRSSettings {
  NEW_CARDS_PER_DAY: number;
  MAX_REVIEWS_PER_DAY: number;
  LEARNING_STEPS: number[];
  RELEARNING_STEPS: number[];
  GRADUATING_INTERVAL: number;
  EASY_INTERVAL: number;
  STARTING_EASE: number;
  MINIMUM_EASE: number;
  EASY_BONUS: number;
  HARD_INTERVAL_FACTOR: number;
  EASY_INTERVAL_FACTOR: number;
  LAPSE_RECOVERY_FACTOR: number;
  LAPSE_EASE_PENALTY: number;
  INTERVAL_MODIFIER: number;
  LEECH_THRESHOLD: number;
  LEECH_ACTION: "suspend" | "tag";
  NEW_CARD_ORDER: "random" | "fifo";
  REVIEW_AHEAD: boolean;
  BURY_SIBLINGS: boolean;
  MAX_INTERVAL: number;
}

export interface UserSettings {
  theme: "light" | "dark" | "system";
  notificationsEnabled: boolean;
  dailyReminder: boolean;
  reminderTime: string;
}

interface UserSettingsRow {
  id: string;
  user_id: string;
  theme: string;
  notifications_enabled: boolean;
  daily_reminder: boolean;
  reminder_time: string;
  new_cards_per_day: number;
  max_reviews_per_day: number;
  learning_steps: number[];
  relearning_steps: number[];
  graduating_interval: number;
  easy_interval: number;
  starting_ease: number;
  minimum_ease: number;
  easy_bonus: number;
  hard_interval_factor: number;
  easy_interval_factor: number;
  lapse_recovery_factor: number;
  leech_threshold: number;
  leech_action: string;
  created_at: string;
  updated_at: string;
}

// Default settings
const defaultSRSSettings: SRSSettings = {
  NEW_CARDS_PER_DAY: 20,
  MAX_REVIEWS_PER_DAY: 100,
  LEARNING_STEPS: [1, 10, 1440],
  RELEARNING_STEPS: [10, 1440],
  GRADUATING_INTERVAL: 1,
  EASY_INTERVAL: 4,
  STARTING_EASE: 2.5,
  MINIMUM_EASE: 1.3,
  EASY_BONUS: 1.3,
  HARD_INTERVAL_FACTOR: 0.8, // Must be between 0.1 and 1.0 per DB constraint
  EASY_INTERVAL_FACTOR: 1.3,
  LAPSE_RECOVERY_FACTOR: 0.2,
  LAPSE_EASE_PENALTY: 0.2,
  INTERVAL_MODIFIER: 1.0,
  LEECH_THRESHOLD: 8,
  LEECH_ACTION: "suspend",
  NEW_CARD_ORDER: "random",
  REVIEW_AHEAD: false,
  BURY_SIBLINGS: false,
  MAX_INTERVAL: 36500,
};

const defaultUserSettings: UserSettings = {
  theme: "system",
  notificationsEnabled: true,
  dailyReminder: true,
  reminderTime: "09:00",
};

// Helper functions
function dbRowToSettings(row: UserSettingsRow): {
  srs: SRSSettings;
  user: UserSettings;
} {
  return {
    srs: {
      NEW_CARDS_PER_DAY: row.new_cards_per_day,
      MAX_REVIEWS_PER_DAY: row.max_reviews_per_day,
      LEARNING_STEPS: row.learning_steps,
      RELEARNING_STEPS: row.relearning_steps,
      GRADUATING_INTERVAL: row.graduating_interval,
      EASY_INTERVAL: row.easy_interval,
      STARTING_EASE: row.starting_ease,
      MINIMUM_EASE: row.minimum_ease,
      EASY_BONUS: row.easy_bonus,
      HARD_INTERVAL_FACTOR: row.hard_interval_factor,
      EASY_INTERVAL_FACTOR: row.easy_interval_factor,
      LAPSE_RECOVERY_FACTOR: row.lapse_recovery_factor,
      LAPSE_EASE_PENALTY: 0.2,
      INTERVAL_MODIFIER: 1.0,
      LEECH_THRESHOLD: row.leech_threshold,
      LEECH_ACTION: row.leech_action as "suspend" | "tag",
      NEW_CARD_ORDER: "random",
      REVIEW_AHEAD: false,
      BURY_SIBLINGS: false,
      MAX_INTERVAL: 36500,
    },
    user: {
      theme: row.theme as "light" | "dark" | "system",
      notificationsEnabled: row.notifications_enabled,
      dailyReminder: row.daily_reminder,
      reminderTime: row.reminder_time,
    },
  };
}

function settingsToDbUpdate(
  srs: Partial<SRSSettings>,
  user: Partial<UserSettings>
): Record<string, unknown> {
  const update: Record<string, unknown> = {};

  // SRS settings
  if (srs.NEW_CARDS_PER_DAY !== undefined)
    update.new_cards_per_day = srs.NEW_CARDS_PER_DAY;
  if (srs.MAX_REVIEWS_PER_DAY !== undefined)
    update.max_reviews_per_day = srs.MAX_REVIEWS_PER_DAY;
  if (srs.LEARNING_STEPS !== undefined)
    update.learning_steps = srs.LEARNING_STEPS;
  if (srs.RELEARNING_STEPS !== undefined)
    update.relearning_steps = srs.RELEARNING_STEPS;
  if (srs.GRADUATING_INTERVAL !== undefined)
    update.graduating_interval = srs.GRADUATING_INTERVAL;
  if (srs.EASY_INTERVAL !== undefined) update.easy_interval = srs.EASY_INTERVAL;
  if (srs.STARTING_EASE !== undefined) update.starting_ease = srs.STARTING_EASE;
  if (srs.MINIMUM_EASE !== undefined) update.minimum_ease = srs.MINIMUM_EASE;
  if (srs.EASY_BONUS !== undefined) update.easy_bonus = srs.EASY_BONUS;
  if (srs.HARD_INTERVAL_FACTOR !== undefined)
    update.hard_interval_factor = srs.HARD_INTERVAL_FACTOR;
  if (srs.EASY_INTERVAL_FACTOR !== undefined)
    update.easy_interval_factor = srs.EASY_INTERVAL_FACTOR;
  if (srs.LAPSE_RECOVERY_FACTOR !== undefined)
    update.lapse_recovery_factor = srs.LAPSE_RECOVERY_FACTOR;
  if (srs.LEECH_THRESHOLD !== undefined)
    update.leech_threshold = srs.LEECH_THRESHOLD;
  if (srs.LEECH_ACTION !== undefined) update.leech_action = srs.LEECH_ACTION;

  // User settings
  if (user.theme !== undefined) update.theme = user.theme;
  if (user.notificationsEnabled !== undefined)
    update.notifications_enabled = user.notificationsEnabled;
  if (user.dailyReminder !== undefined)
    update.daily_reminder = user.dailyReminder;
  if (user.reminderTime !== undefined) update.reminder_time = user.reminderTime;

  return update;
}

interface CachedSettingsState {
  srsSettings: SRSSettings;
  userSettings: UserSettings;
  isLoading: boolean;
  error: string | null;
  lastFetch: number | null;

  // Actions with cache integration
  loadSettings: (forceRefresh?: boolean) => Promise<void>;
  updateSRSSettings: (updates: Partial<SRSSettings>) => Promise<void>;
  updateUserSettings: (updates: Partial<UserSettings>) => Promise<void>;
  resetSRSSettings: () => Promise<void>;
  resetUserSettings: () => Promise<void>;
  resetAllSettings: () => Promise<void>;

  // Validation
  validateSRSSettings: (settings: Partial<SRSSettings>) => string[];
}

export const useCachedSettingsStore = create<CachedSettingsState>(
  (set, get) => ({
    srsSettings: defaultSRSSettings,
    userSettings: defaultUserSettings,
    isLoading: false,
    error: null,
    lastFetch: null,

    loadSettings: async (forceRefresh = false) => {
      set({ isLoading: true, error: null });

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("No authenticated user");
        }

        const cacheKey: CacheKey = `user_settings:${user.id}`;

        const data = await cachedFetch(
          cacheKey,
          async () => {
            console.log(
              `[Settings] Fetching settings from database for user: ${user.id}`
            );
            
            // Verify user is still authenticated
            const { data: currentUser } = await supabase.auth.getUser();
            if (!currentUser.user || currentUser.user.id !== user.id) {
              throw new Error("Authentication state changed during request");
            }
            
            const { data, error } = await supabase
              .from("user_settings")
              .select("*")
              .eq("user_id", user.id)
              .single();

            if (error) {
              console.error(`[Settings] Database error details:`, {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
              });
              
              if (error.code === "PGRST116") {
                // No settings found, create default settings
                console.log(
                  `[Settings] Creating default settings for user: ${user.id}`
                );

                // Insert with all default values to avoid constraint violations
                const defaultRow = {
                  user_id: user.id,
                  ...settingsToDbUpdate(
                    defaultSRSSettings,
                    defaultUserSettings
                  ),
                };

                console.log(`[Settings] Inserting default row:`, defaultRow);

                const { error: insertError } = await supabase
                  .from("user_settings")
                  .insert([defaultRow]);

                if (insertError) {
                  console.error(`[Settings] Insert error details:`, {
                    code: insertError.code,
                    message: insertError.message,
                    details: insertError.details,
                    hint: insertError.hint
                  });
                  throw insertError;
                }

                return {
                  srs: defaultSRSSettings,
                  user: defaultUserSettings,
                };
              } else {
                throw error;
              }
            }

            return dbRowToSettings(data);
          },
          {
            forceRefresh,
            onCacheHit: (cachedData) => {
              console.log(
                `[Settings] Using cached settings for user: ${user.id}`
              );
            },
            onCacheMiss: () => {
              console.log(
                `[Settings] Cache miss, fetching from database for user: ${user.id}`
              );
            },
          }
        );

        set({
          srsSettings: data.srs,
          userSettings: data.user,
          isLoading: false,
          lastFetch: Date.now(),
        });
      } catch (error) {
        console.error("[Settings] Error loading settings:", error);
        set({
          error:
            error instanceof Error ? error.message : "Failed to load settings",
          isLoading: false,
        });
      }
    },

    updateSRSSettings: async (updates) => {
      const currentSettings = get().srsSettings;
      const newSettings = { ...currentSettings, ...updates };

      // Validate settings before updating
      const validationErrors = get().validateSRSSettings(updates);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid settings: ${validationErrors.join(", ")}`);
      }

      set({ isLoading: true, error: null });

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("No authenticated user");
        }

        const updateData = settingsToDbUpdate(updates, {});

        const { error } = await supabase
          .from("user_settings")
          .update(updateData)
          .eq("user_id", user.id);

        console.log(
          `[Settings] Updated SRS settings for user: ${user.id}`,
          updateData
        );

        if (error) throw error;

        set({
          srsSettings: newSettings,
          isLoading: false,
          lastFetch: Date.now(),
        });

        // Invalidate cache
        CacheInvalidation.onSettingsUpdate(user.id);
      } catch (error) {
        console.error("[Settings] Error updating SRS settings:", error);
        set({
          error:
            error instanceof Error
              ? error.message
              : "Failed to update SRS settings",
          isLoading: false,
        });
      }
    },

    updateUserSettings: async (updates) => {
      const currentSettings = get().userSettings;
      const newSettings = { ...currentSettings, ...updates };

      set({ isLoading: true, error: null });

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("No authenticated user");
        }

        const updateData = settingsToDbUpdate({}, updates);

        const { error } = await supabase
          .from("user_settings")
          .update(updateData)
          .eq("user_id", user.id);

        console.log(
          `[Settings] Updated user settings for user: ${user.id}`,
          updateData
        );

        if (error) throw error;

        set({
          userSettings: newSettings,
          isLoading: false,
          lastFetch: Date.now(),
        });

        // Invalidate cache
        CacheInvalidation.onSettingsUpdate(user.id);
      } catch (error) {
        console.error("[Settings] Error updating user settings:", error);
        set({
          error:
            error instanceof Error
              ? error.message
              : "Failed to update user settings",
          isLoading: false,
        });
      }
    },

    resetSRSSettings: async () => {
      await get().updateSRSSettings(defaultSRSSettings);
    },

    resetUserSettings: async () => {
      await get().updateUserSettings(defaultUserSettings);
    },

    resetAllSettings: async () => {
      set({ isLoading: true, error: null });

      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("No authenticated user");
        }

        const updateData = settingsToDbUpdate(
          defaultSRSSettings,
          defaultUserSettings
        );

        const { error } = await supabase
          .from("user_settings")
          .update(updateData)
          .eq("user_id", user.id);

        console.log(
          `[Settings] Reset all settings for user: ${user.id}`,
          updateData
        );

        if (error) throw error;

        set({
          srsSettings: defaultSRSSettings,
          userSettings: defaultUserSettings,
          isLoading: false,
          lastFetch: Date.now(),
        });

        // Invalidate cache
        CacheInvalidation.onSettingsUpdate(user.id);
      } catch (error) {
        console.error("[Settings] Error resetting settings:", error);
        set({
          error:
            error instanceof Error ? error.message : "Failed to reset settings",
          isLoading: false,
        });
      }
    },

    validateSRSSettings: (settings) => {
      const errors: string[] = [];

      if (
        settings.NEW_CARDS_PER_DAY !== undefined &&
        (settings.NEW_CARDS_PER_DAY < 0 || settings.NEW_CARDS_PER_DAY > 9999)
      ) {
        errors.push("New cards per day must be between 0 and 9999");
      }

      if (
        settings.MAX_REVIEWS_PER_DAY !== undefined &&
        (settings.MAX_REVIEWS_PER_DAY < 0 ||
          settings.MAX_REVIEWS_PER_DAY > 9999)
      ) {
        errors.push("Max reviews per day must be between 0 and 9999");
      }

      if (
        settings.STARTING_EASE !== undefined &&
        (settings.STARTING_EASE < 1.3 || settings.STARTING_EASE > 5.0)
      ) {
        errors.push("Starting ease must be between 1.3 and 5.0");
      }

      if (
        settings.MINIMUM_EASE !== undefined &&
        (settings.MINIMUM_EASE < 1.0 || settings.MINIMUM_EASE > 3.0)
      ) {
        errors.push("Minimum ease must be between 1.0 and 3.0");
      }

      if (
        settings.HARD_INTERVAL_FACTOR !== undefined &&
        (settings.HARD_INTERVAL_FACTOR < 0.1 || settings.HARD_INTERVAL_FACTOR > 1.0)
      ) {
        errors.push("Hard interval factor must be between 0.1 and 1.0");
      }

      if (
        settings.LEECH_THRESHOLD !== undefined &&
        (settings.LEECH_THRESHOLD < 1 || settings.LEECH_THRESHOLD > 20)
      ) {
        errors.push("Leech threshold must be between 1 and 20");
      }

      return errors;
    },
  })
);

// Hook for automatic settings loading
export function useAutoLoadSettings() {
  const { loadSettings, lastFetch } = useCachedSettingsStore();

  useEffect(() => {
    if (!lastFetch) {
      loadSettings();
    }
  }, [loadSettings, lastFetch]);
}
