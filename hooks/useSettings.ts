import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

// SRS Settings interface - keep the same for compatibility
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

// User settings interface
export interface UserSettings {
  theme: "light" | "dark" | "system";
  notificationsEnabled: boolean;
  dailyReminder: boolean;
  reminderTime: string;
}

// Default settings - same as before for compatibility
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
  HARD_INTERVAL_FACTOR: 1.2,
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

// Simplified settings API
const settingsApi = {
  async loadSettings() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error("No authenticated user");

    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No settings found, create defaults
        await supabase.from("user_settings").insert({ user_id: user.id });
        return { srs: defaultSRSSettings, user: defaultUserSettings };
      }
      throw error;
    }

    // Simple transformation - remove complex validation
    return {
      srs: {
        NEW_CARDS_PER_DAY: data.new_cards_per_day,
        MAX_REVIEWS_PER_DAY: data.max_reviews_per_day,
        LEARNING_STEPS: data.learning_steps,
        RELEARNING_STEPS: data.relearning_steps,
        GRADUATING_INTERVAL: data.graduating_interval,
        EASY_INTERVAL: data.easy_interval,
        STARTING_EASE: data.starting_ease,
        MINIMUM_EASE: data.minimum_ease,
        EASY_BONUS: data.easy_bonus,
        HARD_INTERVAL_FACTOR: data.hard_interval_factor,
        EASY_INTERVAL_FACTOR: data.easy_interval_factor,
        LAPSE_RECOVERY_FACTOR: data.lapse_recovery_factor,
        LAPSE_EASE_PENALTY: 0.2,
        INTERVAL_MODIFIER: 1.0,
        LEECH_THRESHOLD: data.leech_threshold,
        LEECH_ACTION: data.leech_action as "suspend" | "tag",
        NEW_CARD_ORDER: "random" as const,
        REVIEW_AHEAD: false,
        BURY_SIBLINGS: false,
        MAX_INTERVAL: 36500,
      },
      user: {
        theme: data.theme as "light" | "dark" | "system",
        notificationsEnabled: data.notifications_enabled,
        dailyReminder: data.daily_reminder,
        reminderTime: data.reminder_time,
      },
    };
  },

  async updateSettings(srs?: Partial<SRSSettings>, user?: Partial<UserSettings>) {
    const supabase = createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser) throw new Error("No authenticated user");

    const updates: Record<string, unknown> = {};

    // Simple mapping without complex validation
    if (srs?.NEW_CARDS_PER_DAY !== undefined) updates.new_cards_per_day = srs.NEW_CARDS_PER_DAY;
    if (srs?.MAX_REVIEWS_PER_DAY !== undefined) updates.max_reviews_per_day = srs.MAX_REVIEWS_PER_DAY;
    if (srs?.LEARNING_STEPS !== undefined) updates.learning_steps = srs.LEARNING_STEPS;
    if (srs?.RELEARNING_STEPS !== undefined) updates.relearning_steps = srs.RELEARNING_STEPS;
    if (srs?.GRADUATING_INTERVAL !== undefined) updates.graduating_interval = srs.GRADUATING_INTERVAL;
    if (srs?.EASY_INTERVAL !== undefined) updates.easy_interval = srs.EASY_INTERVAL;
    if (srs?.STARTING_EASE !== undefined) updates.starting_ease = srs.STARTING_EASE;
    if (srs?.MINIMUM_EASE !== undefined) updates.minimum_ease = srs.MINIMUM_EASE;
    if (srs?.EASY_BONUS !== undefined) updates.easy_bonus = srs.EASY_BONUS;
    if (srs?.HARD_INTERVAL_FACTOR !== undefined) updates.hard_interval_factor = srs.HARD_INTERVAL_FACTOR;
    if (srs?.EASY_INTERVAL_FACTOR !== undefined) updates.easy_interval_factor = srs.EASY_INTERVAL_FACTOR;
    if (srs?.LAPSE_RECOVERY_FACTOR !== undefined) updates.lapse_recovery_factor = srs.LAPSE_RECOVERY_FACTOR;
    if (srs?.LEECH_THRESHOLD !== undefined) updates.leech_threshold = srs.LEECH_THRESHOLD;
    if (srs?.LEECH_ACTION !== undefined) updates.leech_action = srs.LEECH_ACTION;

    if (user?.theme !== undefined) updates.theme = user.theme;
    if (user?.notificationsEnabled !== undefined) updates.notifications_enabled = user.notificationsEnabled;
    if (user?.dailyReminder !== undefined) updates.daily_reminder = user.dailyReminder;
    if (user?.reminderTime !== undefined) updates.reminder_time = user.reminderTime;

    const { error } = await supabase
      .from("user_settings")
      .update(updates)
      .eq("user_id", authUser.id);

    if (error) throw error;
  }
};

// Simplified Zustand store
interface SettingsState {
  srsSettings: SRSSettings;
  userSettings: UserSettings;
  isLoading: boolean;
  error: string | null;

  loadSettings: () => Promise<void>;
  updateSRSSettings: (updates: Partial<SRSSettings>) => Promise<void>;
  updateUserSettings: (updates: Partial<UserSettings>) => Promise<void>;
  resetSRSSettings: () => Promise<void>;
  resetAllSettings: () => Promise<void>;
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
      const { srs, user } = await settingsApi.loadSettings();
      set({ srsSettings: srs, userSettings: user, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to load settings",
        isLoading: false,
      });
    }
  },

  updateSRSSettings: async (updates) => {
    const current = get().srsSettings;
    const newSettings = { ...current, ...updates };
    
    try {
      await settingsApi.updateSettings(updates);
      set({ srsSettings: newSettings });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to update SRS settings" });
    }
  },

  updateUserSettings: async (updates) => {
    const current = get().userSettings;
    const newSettings = { ...current, ...updates };
    
    try {
      await settingsApi.updateSettings(undefined, updates);
      set({ userSettings: newSettings });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to update user settings" });
    }
  },

  resetSRSSettings: async () => {
    try {
      await settingsApi.updateSettings(defaultSRSSettings);
      set({ srsSettings: defaultSRSSettings });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to reset SRS settings" });
    }
  },

  resetAllSettings: async () => {
    try {
      await settingsApi.updateSettings(defaultSRSSettings, defaultUserSettings);
      set({ srsSettings: defaultSRSSettings, userSettings: defaultUserSettings });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Failed to reset settings" });
    }
  },

  // Simplified validation - basic checks only
  validateSRSSettings: (settings) => {
    const errors: string[] = [];
    
    if (settings.NEW_CARDS_PER_DAY !== undefined && settings.NEW_CARDS_PER_DAY < 0) {
      errors.push("New cards per day must be non-negative");
    }
    if (settings.MAX_REVIEWS_PER_DAY !== undefined && settings.MAX_REVIEWS_PER_DAY < 0) {
      errors.push("Max reviews per day must be non-negative");
    }
    if (settings.LEARNING_STEPS && settings.LEARNING_STEPS.length === 0) {
      errors.push("Learning steps cannot be empty");
    }
    if (settings.STARTING_EASE !== undefined && (settings.STARTING_EASE < 1.3 || settings.STARTING_EASE > 5.0)) {
      errors.push("Starting ease must be between 1.3 and 5.0");
    }
    if (settings.MINIMUM_EASE !== undefined && (settings.MINIMUM_EASE < 1.0 || settings.MINIMUM_EASE > 3.0)) {
      errors.push("Minimum ease must be between 1.0 and 3.0");
    }
    
    return errors;
  },
}));
