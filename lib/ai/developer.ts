import { isDevelopment } from "@/lib/utils/env-config";
import type { AIConfiguration } from "@/lib/ai/types";

// Developer-only AI providers for testing with localhost
export const DEVELOPER_AI_PROVIDERS = [
  {
    id: "localhost-ollama",
    name: "Local Ollama (Dev)",
    description: "Development: Local Ollama instance for testing",
    website: "https://ollama.ai",
    requiresApiKey: false,
    isDeveloperOnly: true,
    models: [
      {
        id: "llama3.1:8b",
        name: "Llama 3.1 8B (Local)",
        description: "Local Llama model for development testing",
      },
      {
        id: "llama3.1:70b",
        name: "Llama 3.1 70B (Local)",
        description: "Large local model for complex testing",
      },
      {
        id: "mistral:7b",
        name: "Mistral 7B (Local)",
        description: "Fast local model for quick testing",
      },
      {
        id: "qwen2.5:7b",
        name: "Qwen 2.5 7B (Local)",
        description: "Multilingual local model",
      },
      {
        id: "custom",
        name: "Custom Local Model",
        description: "Any model available in your local Ollama setup",
      },
    ],
    configFields: [
      {
        key: "baseUrl",
        label: "Ollama Server URL",
        type: "url" as const,
        placeholder: "http://localhost:11434",
        required: true,
        description: "Local Ollama server endpoint",
      },
    ],
  },
  {
    id: "localhost-lmstudio",
    name: "Local LM Studio (Dev)",
    description: "Development: Local LM Studio server for testing",
    website: "https://lmstudio.ai",
    requiresApiKey: false,
    isDeveloperOnly: true,
    models: [
      {
        id: "local-model",
        name: "Loaded Model",
        description: "Whatever model you have loaded in LM Studio",
      },
      {
        id: "custom",
        name: "Custom Local Model",
        description: "Any model name from your LM Studio setup",
      },
    ],
    configFields: [
      {
        key: "baseUrl",
        label: "LM Studio Server URL",
        type: "url" as const,
        placeholder: "http://localhost:1234/v1",
        required: true,
        description: "Local LM Studio server endpoint",
      },
    ],
  },
  {
    id: "localhost-openai-compatible",
    name: "Local OpenAI API (Dev)",
    description: "Development: Any local OpenAI-compatible server",
    website:
      "https://github.com/ggerganov/llama.cpp/tree/master/examples/server",
    requiresApiKey: false,
    isDeveloperOnly: true,
    models: [
      {
        id: "local-model",
        name: "Local Model",
        description: "Model served by your local OpenAI-compatible server",
      },
      {
        id: "custom",
        name: "Custom Model Name",
        description: "Specify the exact model name your server expects",
      },
    ],
    configFields: [
      {
        key: "baseUrl",
        label: "Server URL",
        type: "url" as const,
        placeholder: "http://localhost:8080/v1",
        required: true,
        description: "Your local OpenAI-compatible server endpoint",
      },
      {
        key: "apiKey",
        label: "API Key (Optional)",
        type: "password" as const,
        placeholder: "leave empty if no auth required",
        required: false,
        description: "Only needed if your local server requires authentication",
      },
    ],
  },
];

// Function to get all available providers based on environment
export function getAvailableAIProviders() {
  // Import the main providers - this needs to be done dynamically to avoid circular imports
  // Using require here is intentional for dynamic loading
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { AI_PROVIDERS } = require("@/lib/ai/types");

  if (isDevelopment) {
    return [...AI_PROVIDERS, ...DEVELOPER_AI_PROVIDERS];
  }

  return AI_PROVIDERS;
}

// Function to check if a provider is developer-only
export function isDeveloperOnlyProvider(providerId: string): boolean {
  return DEVELOPER_AI_PROVIDERS.some((provider) => provider.id === providerId);
}

// Enhanced validation that includes developer providers
export function validateDeveloperAIConfig(config: AIConfiguration): boolean {
  const allProviders = getAvailableAIProviders();
  const provider = allProviders.find(
    (p: unknown) => (p as { id: string }).id === config.provider
  );

  if (!provider) {
    return false;
  }

  // For developer-only providers, we're more lenient with validation
  if (isDeveloperOnlyProvider(config.provider)) {
    // Only require baseUrl for localhost providers
    const baseUrlField = (
      provider as { configFields: { key: string; required: boolean }[] }
    )?.configFields.find((f) => f.key === "baseUrl" && f.required);
    if (baseUrlField && !config.baseUrl?.trim()) {
      return false;
    }

    return true;
  }

  // Use regular validation for production providers
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { validateAIConfig } = require("@/lib/ai/types");
  return validateAIConfig(config);
}

// Test connection for developer providers
export async function testDeveloperConnection(config: AIConfiguration) {
  if (!isDeveloperOnlyProvider(config.provider)) {
    throw new Error("Not a developer provider");
  }

  const baseUrl = config.baseUrl?.replace(/\/$/, "");
  if (!baseUrl) {
    throw new Error("Base URL is required for developer providers");
  }

  switch (config.provider) {
    case "localhost-ollama":
      return await testLocalOllama(config, baseUrl);
    case "localhost-lmstudio":
      return await testLocalLMStudio(config, baseUrl);
    case "localhost-openai-compatible":
      return await testLocalOpenAICompatible(config, baseUrl);
    default:
      throw new Error("Unknown developer provider");
  }
}

async function testLocalOllama(config: AIConfiguration, baseUrl: string) {
  try {
    // First, try to list available models
    const modelsResponse = await fetch(
      `${baseUrl || "http://localhost:11434"}/api/tags`,
      {
        method: "GET",
      }
    );

    if (!modelsResponse.ok) {
      throw new Error("Cannot connect to Ollama. Make sure Ollama is running.");
    }

    const modelsData = await modelsResponse.json();
    const availableModels = modelsData.models || [];

    if (availableModels.length === 0) {
      return {
        success: true,
        message:
          "Connected to Ollama, but no models are installed. Please pull a model first.",
        models: [],
      };
    }

    // Test with the first available model or the configured one
    let testModel = config.model;
    if (testModel === "custom") {
      testModel = config.customModelName || "";
    }

    if (
      !testModel ||
      !availableModels.some((m: { name: string }) => m.name.includes(testModel))
    ) {
      testModel = availableModels[0]?.name || "default";
    }

    const testResponse = await fetch(
      `${baseUrl || "http://localhost:11434"}/api/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: testModel,
          prompt: "Hello, world!",
          stream: false,
          options: { num_predict: 5 },
        }),
      }
    );

    if (testResponse.ok) {
      return {
        success: true,
        message: `Successfully connected to Ollama with model: ${testModel}`,
        models: availableModels.map((m: { name: string }) => m.name),
      };
    } else {
      throw new Error("Failed to generate response from Ollama");
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to connect to local Ollama",
    };
  }
}

async function testLocalLMStudio(config: AIConfiguration, baseUrl: string) {
  try {
    const testResponse = await fetch(
      `${baseUrl || "http://localhost:1234/v1"}/chat/completions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model:
            config.model === "custom"
              ? config.customModelName || "local-model"
              : "local-model",
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 5,
        }),
      }
    );

    if (testResponse.ok) {
      return {
        success: true,
        message: "Successfully connected to LM Studio",
      };
    } else {
      throw new Error("Failed to connect to LM Studio server");
    }
  } catch {
    return {
      success: false,
      error:
        "Cannot connect to LM Studio. Make sure the server is running on the configured port.",
    };
  }
}

async function testLocalOpenAICompatible(
  config: AIConfiguration,
  baseUrl: string
) {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (config.apiKey?.trim()) {
      headers["Authorization"] = `Bearer ${config.apiKey}`;
    }

    const testResponse = await fetch(
      `${baseUrl || "http://localhost:8080/v1"}/chat/completions`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          model:
            config.model === "custom"
              ? config.customModelName || "local-model"
              : "local-model",
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 5,
        }),
      }
    );

    if (testResponse.ok) {
      return {
        success: true,
        message: "Successfully connected to local OpenAI-compatible server",
      };
    } else {
      throw new Error("Failed to connect to local server");
    }
  } catch {
    return {
      success: false,
      error:
        "Cannot connect to local OpenAI-compatible server. Check if it's running and the URL is correct.",
    };
  }
}
