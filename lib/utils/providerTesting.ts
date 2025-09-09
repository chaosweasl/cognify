/**
 * Provider Testing and Connection Validation Utilities
 *
 * Tests AI provider connections with enhanced error detection
 * and fallback guidance for the BYO API key model.
 */

import { AIConfiguration } from "@/lib/ai/types";
import {
  enhanceAIError,
  getFallbackSuggestions,
  AIError,
  AIFallbackSuggestion,
} from "./aiErrorHandling";

export interface ProviderTestResult {
  success: boolean;
  provider: string;
  model: string;
  error?: string;
  aiError?: AIError;
  fallbackSuggestions?: AIFallbackSuggestion[];
  corsDetected?: boolean;
  responseTime?: number;
  capabilities?: {
    streaming?: boolean;
    tokenCounting?: boolean;
    customModels?: boolean;
  };
}

export interface ProviderCompatibility {
  provider: string;
  browserSupport: "full" | "limited" | "none";
  corsStatus: "allowed" | "blocked" | "variable";
  recommendedUsage: "direct" | "manual" | "both";
  notes: string[];
}

// Provider compatibility matrix for browser environments
export const PROVIDER_COMPATIBILITY: ProviderCompatibility[] = [
  {
    provider: "openai",
    browserSupport: "none",
    corsStatus: "blocked",
    recommendedUsage: "manual",
    notes: [
      "OpenAI API blocks CORS requests from browsers",
      "Use ChatGPT web interface for manual workflow",
      "Server-side proxy required for direct integration",
    ],
  },
  {
    provider: "anthropic",
    browserSupport: "none",
    corsStatus: "blocked",
    recommendedUsage: "manual",
    notes: [
      "Anthropic API blocks CORS requests from browsers",
      "Use Claude web interface for manual workflow",
      "Server-side proxy required for direct integration",
    ],
  },
  {
    provider: "deepseek",
    browserSupport: "none",
    corsStatus: "blocked",
    recommendedUsage: "manual",
    notes: [
      "DeepSeek API blocks CORS requests from browsers",
      "Use DeepSeek web interface for manual workflow",
      "Server-side proxy required for direct integration",
    ],
  },
  {
    provider: "ollama",
    browserSupport: "full",
    corsStatus: "allowed",
    recommendedUsage: "direct",
    notes: [
      "Local Ollama server allows CORS by default",
      "Requires Ollama running on localhost:11434",
      "Works great for offline and privacy-focused workflows",
    ],
  },
  {
    provider: "lmstudio",
    browserSupport: "full",
    corsStatus: "allowed",
    recommendedUsage: "direct",
    notes: [
      "LM Studio local server allows CORS by default",
      "Requires LM Studio running with API server enabled",
      "Excellent for local model testing and development",
    ],
  },
  {
    provider: "localhost-openai-compatible",
    browserSupport: "full",
    corsStatus: "variable",
    recommendedUsage: "both",
    notes: [
      "CORS support depends on server configuration",
      "Many local servers allow CORS by default",
      "Check server documentation for CORS settings",
    ],
  },
];

/**
 * Tests a provider connection with comprehensive error handling
 */
export async function testProviderConnection(
  config: AIConfiguration
): Promise<ProviderTestResult> {
  const startTime = Date.now();

  try {
    const response = await fetch("/api/ai/test-connection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ config }),
      // Set a reasonable timeout for connection testing
      signal: AbortSignal.timeout(30000), // 30 seconds
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        provider: config.provider,
        model:
          config.model === "custom"
            ? config.customModelName || "custom"
            : config.model,
        responseTime,
        capabilities: result.capabilities,
      };
    } else {
      const errorData = await response.json();
      const error = new Error(errorData.error || "Connection test failed");

      const aiError = enhanceAIError(error, config, "Connection test");
      const suggestions = getFallbackSuggestions(aiError, config);

      return {
        success: false,
        provider: config.provider,
        model:
          config.model === "custom"
            ? config.customModelName || "custom"
            : config.model,
        error: aiError.message,
        aiError,
        fallbackSuggestions: suggestions,
        corsDetected: aiError.isCORSError,
        responseTime,
      };
    }
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const aiError = enhanceAIError(error, config, "Connection test");
    const suggestions = getFallbackSuggestions(aiError, config);

    return {
      success: false,
      provider: config.provider,
      model:
        config.model === "custom"
          ? config.customModelName || "custom"
          : config.model,
      error: aiError.message,
      aiError,
      fallbackSuggestions: suggestions,
      corsDetected: aiError.isCORSError,
      responseTime,
    };
  }
}

/**
 * Gets compatibility information for a provider
 */
export function getProviderCompatibility(
  providerId: string
): ProviderCompatibility {
  const compatibility = PROVIDER_COMPATIBILITY.find(
    (p) => p.provider === providerId
  );

  if (compatibility) {
    return compatibility;
  }

  // Default compatibility for unknown providers
  return {
    provider: providerId,
    browserSupport: "limited",
    corsStatus: "variable",
    recommendedUsage: "both",
    notes: [
      "Compatibility unknown for this provider",
      "Try direct connection first, fall back to manual if needed",
      "Check provider documentation for CORS support",
    ],
  };
}

/**
 * Batch tests multiple provider configurations
 */
export async function testMultipleProviders(
  configs: AIConfiguration[]
): Promise<ProviderTestResult[]> {
  // Test providers in parallel but with some delay to avoid overwhelming
  const results = await Promise.allSettled(
    configs.map(async (config, index) => {
      // Add small delay between tests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, index * 500));
      return testProviderConnection(config);
    })
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      // Handle promise rejection
      const config = configs[index];
      const aiError = enhanceAIError(
        result.reason,
        config,
        "Batch connection test"
      );
      const suggestions = getFallbackSuggestions(aiError, config);

      return {
        success: false,
        provider: config.provider,
        model:
          config.model === "custom"
            ? config.customModelName || "custom"
            : config.model,
        error: aiError.message,
        aiError,
        fallbackSuggestions: suggestions,
        corsDetected: aiError.isCORSError,
      };
    }
  });
}

/**
 * Generates a provider recommendation based on user's setup
 */
export function getProviderRecommendation(
  hasLocalSetup: boolean,
  hasCloudApiKeys: boolean,
  prioritizePrivacy: boolean
): {
  recommended: string[];
  reasons: string[];
  fallbacks: string[];
} {
  const recommendations: string[] = [];
  const reasons: string[] = [];
  const fallbacks: string[] = [];

  if (hasLocalSetup) {
    recommendations.push("ollama", "lmstudio", "localhost-openai-compatible");
    reasons.push(
      "Local providers work directly in browser without CORS issues",
      "Better privacy and no API costs",
      "Works offline and with full control over models"
    );
  }

  if (hasCloudApiKeys && !prioritizePrivacy) {
    fallbacks.push("openai", "anthropic", "deepseek");
    reasons.push(
      "Cloud providers available via manual copy-paste workflow",
      "Access to latest and most capable models",
      "No local setup required"
    );
  }

  if (prioritizePrivacy) {
    recommendations.unshift("ollama", "lmstudio");
    reasons.push(
      "Local processing ensures complete privacy",
      "No data sent to third-party servers",
      "Full control over model and data handling"
    );
  }

  // If no local setup, recommend starting with manual workflow
  if (!hasLocalSetup) {
    fallbacks.unshift("openai", "anthropic");
    reasons.push(
      "Manual workflow provides reliable access to powerful models",
      "Good starting point before setting up local infrastructure"
    );
  }

  return {
    recommended: [...new Set(recommendations)], // Remove duplicates
    reasons: [...new Set(reasons)],
    fallbacks: [...new Set(fallbacks)],
  };
}

/**
 * Generates setup instructions for a provider
 */
export function getProviderSetupInstructions(providerId: string): {
  title: string;
  description: string;
  steps: string[];
  links: Array<{
    text: string;
    url: string;
    description: string;
  }>;
} {
  switch (providerId) {
    case "openai":
      return {
        title: "OpenAI API Setup",
        description:
          "Get access to GPT models via OpenAI API or ChatGPT web interface",
        steps: [
          "Sign up at platform.openai.com",
          "Navigate to API Keys section",
          "Create a new API key",
          "Copy the key (starts with sk-)",
          "Add billing information for API usage",
          "Or use ChatGPT web interface for manual workflow",
        ],
        links: [
          {
            text: "OpenAI Platform",
            url: "https://platform.openai.com",
            description: "Create API keys and manage billing",
          },
          {
            text: "ChatGPT",
            url: "https://chat.openai.com",
            description: "Web interface for manual workflow",
          },
          {
            text: "API Documentation",
            url: "https://platform.openai.com/docs",
            description: "Complete API reference",
          },
        ],
      };

    case "anthropic":
      return {
        title: "Anthropic Claude Setup",
        description:
          "Get access to Claude models via Anthropic API or web interface",
        steps: [
          "Sign up at console.anthropic.com",
          "Navigate to API Keys section",
          "Create a new API key",
          "Copy the key (starts with sk-ant-)",
          "Add billing information for API usage",
          "Or use Claude web interface for manual workflow",
        ],
        links: [
          {
            text: "Anthropic Console",
            url: "https://console.anthropic.com",
            description: "Create API keys and manage billing",
          },
          {
            text: "Claude",
            url: "https://claude.ai",
            description: "Web interface for manual workflow",
          },
          {
            text: "API Documentation",
            url: "https://docs.anthropic.com",
            description: "Complete API reference",
          },
        ],
      };

    case "ollama":
      return {
        title: "Ollama Local Setup",
        description: "Run AI models locally with Ollama",
        steps: [
          "Download Ollama from ollama.ai",
          "Install Ollama on your system",
          "Open terminal/command prompt",
          "Run: ollama pull llama3.1 (or your preferred model)",
          "Verify server is running on localhost:11434",
          "Test connection in Cognify",
        ],
        links: [
          {
            text: "Ollama Website",
            url: "https://ollama.ai",
            description: "Download and installation instructions",
          },
          {
            text: "Model Library",
            url: "https://ollama.ai/library",
            description: "Browse available models",
          },
          {
            text: "GitHub Repository",
            url: "https://github.com/ollama/ollama",
            description: "Source code and advanced configuration",
          },
        ],
      };

    case "lmstudio":
      return {
        title: "LM Studio Local Setup",
        description: "Run AI models locally with LM Studio GUI",
        steps: [
          "Download LM Studio from lmstudio.ai",
          "Install and launch LM Studio",
          "Browse and download a model from the model library",
          "Load the model in the chat interface",
          "Go to Server tab and start the local API server",
          "Verify server is running on localhost:1234",
        ],
        links: [
          {
            text: "LM Studio",
            url: "https://lmstudio.ai",
            description: "Download LM Studio application",
          },
          {
            text: "Model Guide",
            url: "https://lmstudio.ai/docs",
            description: "How to download and use models",
          },
        ],
      };

    default:
      return {
        title: `${providerId} Setup`,
        description: "Setup instructions for this provider",
        steps: [
          "Check the provider's official documentation",
          "Create an account if required",
          "Generate API keys if needed",
          "Configure any required settings",
          "Test the connection",
        ],
        links: [],
      };
  }
}
