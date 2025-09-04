import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import {
  AISettings,
  AIConfiguration,
  DEFAULT_AI_CONFIG,
  validateAIConfig,
  AI_PROVIDERS,
} from "@/lib/ai/types";

// Default AI settings
const defaultAISettings: AISettings = {
  aiEnabled: true,
  preferredComplexity: "intermediate",
  currentConfig: DEFAULT_AI_CONFIG,
  aiOnboardingCompleted: false,
};

interface AISettingsStore extends AISettings {
  // Configuration actions
  setConfig: (config: AIConfiguration) => void;
  updateConfig: (updates: Partial<AIConfiguration>) => void;
  resetConfig: () => void;
  isConfigValid: () => boolean;

  // General AI settings
  setAIEnabled: (enabled: boolean) => void;
  setComplexity: (complexity: "beginner" | "intermediate" | "advanced") => void;
  setOnboardingCompleted: (completed: boolean) => void;

  // Helper methods
  getSelectedProvider: () => any;
  getAvailableModels: () => any[];
  testConnection: () => Promise<{ success: boolean; error?: string }>;

  // Storage management
  clearAllData: () => void;
}

export const useAISettings = create<AISettingsStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        ...defaultAISettings,

        // Configuration actions
        setConfig: (config: AIConfiguration) => {
          set({ currentConfig: config });
        },

        updateConfig: (updates: Partial<AIConfiguration>) => {
          const current = get().currentConfig;
          const newConfig = { ...current, ...updates };
          set({ currentConfig: newConfig });
        },

        resetConfig: () => {
          set({ currentConfig: DEFAULT_AI_CONFIG });
        },

        isConfigValid: () => {
          const { currentConfig } = get();
          return validateAIConfig(currentConfig);
        },

        // General AI settings
        setAIEnabled: (enabled: boolean) => {
          set({ aiEnabled: enabled });
        },

        setComplexity: (
          complexity: "beginner" | "intermediate" | "advanced"
        ) => {
          set({ preferredComplexity: complexity });
        },

        setOnboardingCompleted: (completed: boolean) => {
          set({ aiOnboardingCompleted: completed });
        },

        // Helper methods
        getSelectedProvider: () => {
          const { currentConfig } = get();
          return AI_PROVIDERS.find((p) => p.id === currentConfig.provider);
        },

        getAvailableModels: () => {
          const provider = get().getSelectedProvider();
          return provider?.models || [];
        },

        testConnection: async () => {
          const { currentConfig, isConfigValid } = get();

          if (!isConfigValid()) {
            return {
              success: false,
              error:
                "Configuration is invalid. Please check all required fields.",
            };
          }

          try {
            // Test the AI configuration by making a simple request
            const response = await fetch("/api/ai/test-connection", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ config: currentConfig }),
            });

            if (!response.ok) {
              const error = await response.text();
              return { success: false, error };
            }

            return { success: true };
          } catch (error) {
            return {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Connection test failed",
            };
          }
        },

        // Storage management
        clearAllData: () => {
          set(defaultAISettings);
        },
      }),
      {
        name: "ai-settings",
        version: 1,
        // Only persist safe data - never persist API keys in this store
        partialize: (state) => ({
          aiEnabled: state.aiEnabled,
          preferredComplexity: state.preferredComplexity,
          currentConfig: {
            provider: state.currentConfig.provider,
            model: state.currentConfig.model,
            temperature: state.currentConfig.temperature,
            maxTokens: state.currentConfig.maxTokens,
            customModelName: state.currentConfig.customModelName,
            baseUrl: state.currentConfig.baseUrl,
            // NEVER persist API keys in Zustand - they should be in localStorage separately
          },
          aiOnboardingCompleted: state.aiOnboardingCompleted,
        }),
      }
    )
  )
);

// Separate secure storage for API keys (localStorage only)
export const aiKeyStorage = {
  setApiKey: (providerId: string, apiKey: string) => {
    if (typeof window !== "undefined") {
      const key = `ai-api-key-${providerId}`;
      if (apiKey) {
        localStorage.setItem(key, apiKey);
      } else {
        localStorage.removeItem(key);
      }
    }
  },

  getApiKey: (providerId: string): string | null => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`ai-api-key-${providerId}`);
    }
    return null;
  },

  removeApiKey: (providerId: string) => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`ai-api-key-${providerId}`);
    }
  },

  clearAllApiKeys: () => {
    if (typeof window !== "undefined") {
      // Remove all AI-related API keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("ai-api-key-")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    }
  },
};

// Hook to get full configuration including API keys
export const useAIConfig = () => {
  const store = useAISettings();
  const { currentConfig } = store;

  // Get API key from secure storage
  const apiKey = aiKeyStorage.getApiKey(currentConfig.provider);

  const fullConfig: AIConfiguration = {
    ...currentConfig,
    apiKey: apiKey || undefined,
  };

  const setFullConfig = (config: AIConfiguration) => {
    // Separate API key from other config
    const { apiKey: configApiKey, ...safeConfig } = config;

    // Store safe config in Zustand
    store.setConfig(safeConfig);

    // Store API key separately in localStorage
    if (configApiKey !== undefined) {
      if (configApiKey) {
        aiKeyStorage.setApiKey(config.provider, configApiKey);
      } else {
        aiKeyStorage.removeApiKey(config.provider);
      }
    }
  };

  return {
    ...store,
    currentConfig: fullConfig,
    setConfig: setFullConfig,
    isConfigValid: () => validateAIConfig(fullConfig),
  };
};

// Convenience hooks
export const useAIEnabled = () => {
  const aiEnabled = useAISettings((state) => state.aiEnabled);
  const setAIEnabled = useAISettings((state) => state.setAIEnabled);
  return { aiEnabled, setAIEnabled };
};

export const useAIComplexity = () => {
  const complexity = useAISettings((state) => state.preferredComplexity);
  const setComplexity = useAISettings((state) => state.setComplexity);
  return { complexity, setComplexity };
};

export const useAIOnboarding = () => {
  const completed = useAISettings((state) => state.aiOnboardingCompleted);
  const setCompleted = useAISettings((state) => state.setOnboardingCompleted);
  return { completed, setCompleted };
};
