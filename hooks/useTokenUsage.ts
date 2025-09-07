import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TokenUsage {
  provider: string;
  model: string;
  tokensUsed: number;
  timestamp: string;
  cost?: number; // Optional cost estimation
}

interface TokenUsageStore {
  usageHistory: TokenUsage[];
  totalTokensToday: number;
  totalTokensThisMonth: number;
  dailyLimit: number;
  monthlyLimit: number;

  // Actions
  addUsage: (usage: Omit<TokenUsage, "timestamp">) => void;
  getTodaysUsage: () => number;
  getThisMonthsUsage: () => number;
  setDailyLimit: (limit: number) => void;
  setMonthlyLimit: (limit: number) => void;
  clearUsageHistory: () => void;

  // Helper methods
  isOverDailyLimit: () => boolean;
  isOverMonthlyLimit: () => boolean;
  getRemainingDailyTokens: () => number;
  getRemainingMonthlyTokens: () => number;
}

const DEFAULT_DAILY_LIMIT = 50000; // 50k tokens per day
const DEFAULT_MONTHLY_LIMIT = 500000; // 500k tokens per month

export const useTokenUsage = create<TokenUsageStore>()(
  persist(
    (set, get) => ({
      usageHistory: [],
      totalTokensToday: 0,
      totalTokensThisMonth: 0,
      dailyLimit: DEFAULT_DAILY_LIMIT,
      monthlyLimit: DEFAULT_MONTHLY_LIMIT,

      addUsage: (usage) => {
        const timestamp = new Date().toISOString();
        const newUsage: TokenUsage = {
          ...usage,
          timestamp,
        };

        set((state) => ({
          usageHistory: [newUsage, ...state.usageHistory],
          totalTokensToday: state.getTodaysUsage() + usage.tokensUsed,
          totalTokensThisMonth: state.getThisMonthsUsage() + usage.tokensUsed,
        }));
      },

      getTodaysUsage: () => {
        const today = new Date().toDateString();
        return get()
          .usageHistory.filter(
            (usage) => new Date(usage.timestamp).toDateString() === today
          )
          .reduce((sum, usage) => sum + usage.tokensUsed, 0);
      },

      getThisMonthsUsage: () => {
        const now = new Date();
        const thisMonth = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}`;
        return get()
          .usageHistory.filter((usage) => {
            const usageMonth = usage.timestamp.substring(0, 7); // YYYY-MM format
            return usageMonth === thisMonth;
          })
          .reduce((sum, usage) => sum + usage.tokensUsed, 0);
      },

      setDailyLimit: (limit) => set({ dailyLimit: limit }),
      setMonthlyLimit: (limit) => set({ monthlyLimit: limit }),

      clearUsageHistory: () =>
        set({
          usageHistory: [],
          totalTokensToday: 0,
          totalTokensThisMonth: 0,
        }),

      isOverDailyLimit: () => {
        const { getTodaysUsage, dailyLimit } = get();
        return getTodaysUsage() >= dailyLimit;
      },

      isOverMonthlyLimit: () => {
        const { getThisMonthsUsage, monthlyLimit } = get();
        return getThisMonthsUsage() >= monthlyLimit;
      },

      getRemainingDailyTokens: () => {
        const { getTodaysUsage, dailyLimit } = get();
        return Math.max(0, dailyLimit - getTodaysUsage());
      },

      getRemainingMonthlyTokens: () => {
        const { getThisMonthsUsage, monthlyLimit } = get();
        return Math.max(0, monthlyLimit - getThisMonthsUsage());
      },
    }),
    {
      name: "token-usage-storage",
      // Only persist the essential data
      partialize: (state) => ({
        usageHistory: state.usageHistory,
        dailyLimit: state.dailyLimit,
        monthlyLimit: state.monthlyLimit,
      }),
    }
  )
);

// Utility functions for cost estimation (approximate)
export const estimateTokenCost = (
  tokens: number,
  provider: string,
  model: string
): number => {
  // These are rough estimates - actual costs may vary
  const costPerToken: Record<string, Record<string, number>> = {
    openai: {
      "gpt-4o": 0.000005, // $5/1M tokens
      "gpt-4o-mini": 0.00000015, // $0.15/1M tokens
      "gpt-4-turbo": 0.00001, // $10/1M tokens
      "gpt-3.5-turbo": 0.000001, // $1/1M tokens
    },
    anthropic: {
      "claude-3-5-sonnet-20241022": 0.000003, // $3/1M tokens
      "claude-3-5-haiku-20241022": 0.00000025, // $0.25/1M tokens
      "claude-3-opus-20240229": 0.000015, // $15/1M tokens
    },
    deepseek: {
      "deepseek-chat": 0.00000014, // $0.14/1M tokens
      "deepseek-coder": 0.00000014, // $0.14/1M tokens
    },
  };

  const providerCosts = costPerToken[provider.toLowerCase()];
  if (!providerCosts) return 0;

  const modelCost = providerCosts[model.toLowerCase()];
  if (!modelCost) {
    // Use average cost for the provider
    const avgCost =
      Object.values(providerCosts).reduce((a, b) => a + b, 0) /
      Object.values(providerCosts).length;
    return tokens * avgCost;
  }

  return tokens * modelCost;
};

// Format tokens for display
export const formatTokenCount = (tokens: number): string => {
  if (tokens < 1000) return tokens.toString();
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1000000).toFixed(2)}M`;
};

// Format cost for display
export const formatCost = (cost: number): string => {
  if (cost < 0.01) return `$${(cost * 100).toFixed(2)}¢`;
  return `$${cost.toFixed(4)}`;
};
