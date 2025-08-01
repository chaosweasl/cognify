import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";

// SRS Settings interface matching our database schema
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
  LEECH_THRESHOLD: number;
  LEECH_ACTION: "suspend" | "tag";
}

// User settings interface
export interface UserSettings {
  theme: "light" | "dark" | "system";
  notificationsEnabled: boolean;
  dailyReminder: boolean;
  reminderTime: string;
}

// Database row interface
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
  RELEARNING_STEPS: [10],
  GRADUATING_INTERVAL: 1,
  EASY_INTERVAL: 4,
  STARTING_EASE: 2.5,
  MINIMUM_EASE: 1.3,
  EASY_BONUS: 1.3,
  HARD_INTERVAL_FACTOR: 1.2,
  EASY_INTERVAL_FACTOR: 1.3,
  LAPSE_RECOVERY_FACTOR: 0.2,
  LEECH_THRESHOLD: 8,
  LEECH_ACTION: "suspend",
};

const defaultUserSettings: UserSettings = {
  theme: "system",
  notificationsEnabled: true,
  dailyReminder: true,
  reminderTime: "09:00",
};

// Helper functions to convert between database and app formats
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
      LEECH_THRESHOLD: row.leech_threshold,
      LEECH_ACTION: row.leech_action as "suspend" | "tag",
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
) {
  const update: any = {};

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

interface SettingsState {
  srsSettings: SRSSettings;
  userSettings: UserSettings;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadSettings: () => Promise<void>;
  updateSRSSettings: (updates: Partial<SRSSettings>) => Promise<void>;
  updateUserSettings: (updates: Partial<UserSettings>) => Promise<void>;
  resetSRSSettings: () => Promise<void>;
  resetUserSettings: () => Promise<void>;
  resetAllSettings: () => Promise<void>;

  // Validation
  validateSRSSettings: (settings: Partial<SRSSettings>) => string[];
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  srsSettings: defaultSRSSettings,
  userSettings: defaultUserSettings,
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("No authenticated user");
      }

      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();
      console.log(`[Supabase] getUserSettings for user_id: ${user.id}`);

      if (error) {
        if (error.code === "PGRST116") {
          // No settings found, create default settings
          console.log(
            `[Supabase] insert default user_settings for user_id: ${user.id}`
          );
          const { error: insertError } = await supabase
            .from("user_settings")
            .insert({ user_id: user.id });
          if (insertError) throw insertError;

          set({
            srsSettings: defaultSRSSettings,
            userSettings: defaultUserSettings,
            isLoading: false,
          });
        } else {
          throw error;
        }
      } else {
        const { srs, user: userSettings } = dbRowToSettings(data);
        set({
          srsSettings: srs,
          userSettings: userSettings,
          isLoading: false,
        });
      }
    } catch (error) {
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

    // Validate settings
    const errors = get().validateSRSSettings(newSettings);
    if (errors.length > 0) {
      set({ error: `Invalid settings: ${errors.join(", ")}` });
      return;
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
        `[Supabase] update SRS settings for user_id: ${user.id}`,
        updateData
      );

      if (error) throw error;

      set({ srsSettings: newSettings, isLoading: false });
    } catch (error) {
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
        `[Supabase] update user settings for user_id: ${user.id}`,
        updateData
      );

      if (error) throw error;

      set({ userSettings: newSettings, isLoading: false });
    } catch (error) {
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
        `[Supabase] reset settings for user_id: ${user.id}`,
        updateData
      );

      if (error) throw error;

      set({
        srsSettings: defaultSRSSettings,
        userSettings: defaultUserSettings,
        isLoading: false,
      });
    } catch (error) {
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
      settings.NEW_CARDS_PER_DAY < 0
    ) {
      errors.push("New cards per day must be non-negative");
    }

    if (
      settings.MAX_REVIEWS_PER_DAY !== undefined &&
      settings.MAX_REVIEWS_PER_DAY < 0
    ) {
      errors.push("Max reviews per day must be non-negative");
    }

    if (settings.LEARNING_STEPS && settings.LEARNING_STEPS.length === 0) {
      errors.push("Learning steps cannot be empty");
    }

    if (
      settings.LEARNING_STEPS &&
      settings.LEARNING_STEPS.some((step: number) => step <= 0)
    ) {
      errors.push("Learning steps must be positive");
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
      settings.GRADUATING_INTERVAL !== undefined &&
      settings.GRADUATING_INTERVAL < 1
    ) {
      errors.push("Graduating interval must be at least 1 day");
    }

    if (settings.EASY_INTERVAL !== undefined && settings.EASY_INTERVAL < 1) {
      errors.push("Easy interval must be at least 1 day");
    }

    if (
      settings.LEECH_THRESHOLD !== undefined &&
      (settings.LEECH_THRESHOLD < 1 || settings.LEECH_THRESHOLD > 20)
    ) {
      errors.push("Leech threshold must be between 1 and 20");
    }

    return errors;
  },
}));
