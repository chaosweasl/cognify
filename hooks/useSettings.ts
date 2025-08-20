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

// User settings interface (updated to match schema)
export interface UserSettings {
  user_id: string;
  theme: "light" | "dark" | "system";
  notifications_enabled: boolean;
  daily_reminder: boolean;
  reminder_time: string;
  created_at: string;
  updated_at: string;
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
  user_id: "", // Will be set when creating
  theme: "system",
  notifications_enabled: true,
  daily_reminder: true,
  reminder_time: "09:00:00",
  created_at: "",
  updated_at: "",
};

// Simplified settings API
const settingsApi = {
  async loadUserSettings(): Promise<UserSettings> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("No authenticated user");

    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No settings found, create defaults
        const newSettings = {
          user_id: user.id,
          theme: defaultUserSettings.theme,
          notifications_enabled: defaultUserSettings.notifications_enabled,
          daily_reminder: defaultUserSettings.daily_reminder,
          reminder_time: defaultUserSettings.reminder_time,
        };
        await supabase.from("user_settings").insert(newSettings);
        return { ...newSettings, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      }
      throw error;
    }

    return data;
  },

  async updateUserSettings(updates: Partial<UserSettings>): Promise<void> {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) throw new Error("No authenticated user");

    const dbUpdates: Record<string, unknown> = {};

    // Map user settings to database columns
    if (updates.theme !== undefined) dbUpdates.theme = updates.theme;
    if (updates.notifications_enabled !== undefined)
      dbUpdates.notifications_enabled = updates.notifications_enabled;
    if (updates.daily_reminder !== undefined)
      dbUpdates.daily_reminder = updates.daily_reminder;
    if (updates.reminder_time !== undefined)
      dbUpdates.reminder_time = updates.reminder_time;

    const { error } = await supabase
      .from("user_settings")
      .update(dbUpdates)
      .eq("user_id", authUser.id);

    if (error) throw error;
  },
};

// Simplified Zustand store for user settings only
// SRS settings are now per-project and handled in Project components
interface SettingsState {
  userSettings: UserSettings | null;
  isLoading: boolean;
  error: string | null;

  loadUserSettings: () => Promise<void>;
  updateUserSettings: (updates: Partial<UserSettings>) => Promise<void>;
  reset: () => void; // Added reset method
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  userSettings: null,
  isLoading: false,
  error: null,

  loadUserSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const userSettings = await settingsApi.loadUserSettings();
      set({ userSettings, isLoading: false });
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Failed to load user settings",
        isLoading: false,
      });
    }
  },

  updateUserSettings: async (updates) => {
    const current = get().userSettings;
    if (!current) return;
    
    const newSettings = { ...current, ...updates };

    try {
      await settingsApi.updateUserSettings(updates);
      set({ userSettings: newSettings });
    } catch (error) {
      set({
        error:
          error instanceof Error
            ? error.message
            : "Failed to update user settings",
      });
    }
  },

  reset: () => {
    set({ 
      userSettings: null, 
      isLoading: false, 
      error: null 
    });
  },
}));

// Convenience hook
export const useSettings = () => {
  const { userSettings, isLoading, error, loadUserSettings, updateUserSettings, reset } = useSettingsStore();
  return { userSettings, isLoading, error, loadUserSettings, updateUserSettings, reset };
};
