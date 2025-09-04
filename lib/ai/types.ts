// AI Provider Types and Configuration

export interface AIModel {
  id: string;
  name: string;
  description: string;
}

export interface AIConfigField {
  key: string;
  label: string;
  type: "text" | "password" | "url" | "number";
  placeholder?: string;
  required: boolean;
  description?: string;
}

export interface AIProvider {
  id: string;
  name: string;
  description: string;
  website: string;
  requiresApiKey: boolean;
  models: AIModel[];
  configFields: AIConfigField[];
}

export interface AIConfiguration {
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  customModelName?: string;
}

export interface AISettings {
  aiEnabled: boolean;
  preferredComplexity: "beginner" | "intermediate" | "advanced";
  currentConfig: AIConfiguration;
  aiOnboardingCompleted: boolean;
}

// Default AI configuration
export const DEFAULT_AI_CONFIG: AIConfiguration = {
  provider: "openai",
  model: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 2000,
  customModelName: "",
};

// AI Providers Configuration
export const AI_PROVIDERS: AIProvider[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "Industry-leading AI models including GPT-4 and GPT-3.5",
    website: "https://openai.com",
    requiresApiKey: true,
    models: [
      {
        id: "gpt-4o",
        name: "GPT-4o",
        description: "Most advanced OpenAI model with superior reasoning",
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        description: "Fast and efficient for most tasks",
      },
      {
        id: "gpt-4-turbo",
        name: "GPT-4 Turbo",
        description: "High-performance model with 128k context window",
      },
      {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        description: "Cost-effective model for simpler tasks",
      },
      {
        id: "custom",
        name: "Custom Model",
        description: "Enter any OpenAI model name (e.g., gpt-5, o1-preview)",
      },
    ],
    configFields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        placeholder: "sk-...",
        required: true,
        description: "Get your API key from OpenAI Dashboard",
      },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    description: "Advanced AI assistant with strong reasoning capabilities",
    website: "https://anthropic.com",
    requiresApiKey: true,
    models: [
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet (Latest)",
        description: "Most capable Claude model with enhanced reasoning",
      },
      {
        id: "claude-3-5-haiku-20241022",
        name: "Claude 3.5 Haiku",
        description: "Fast and efficient with improved capabilities",
      },
      {
        id: "claude-3-opus-20240229",
        name: "Claude 3 Opus",
        description: "Most powerful Claude model for complex tasks",
      },
      {
        id: "custom",
        name: "Custom Model",
        description:
          "Enter any Claude model name (e.g., claude-4-opus-20241120)",
      },
    ],
    configFields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        placeholder: "sk-ant-...",
        required: true,
        description: "Get your API key from Anthropic Console",
      },
    ],
  },
  {
    id: "ollama",
    name: "Ollama",
    description: "Run AI models locally on your computer",
    website: "https://ollama.ai",
    requiresApiKey: false,
    models: [
      {
        id: "llama3.1",
        name: "Llama 3.1",
        description: "Meta's powerful open-source model",
      },
      {
        id: "mistral",
        name: "Mistral 7B",
        description: "Fast and efficient open-source model",
      },
      {
        id: "qwen2.5",
        name: "Qwen 2.5",
        description: "Alibaba's high-performance multilingual model",
      },
      {
        id: "codellama",
        name: "Code Llama",
        description: "Specialized model for code generation",
      },
      {
        id: "custom",
        name: "Custom Model",
        description: "Enter any Ollama model name (e.g., codellama, qwen2.5)",
      },
    ],
    configFields: [
      {
        key: "baseUrl",
        label: "Ollama Server URL",
        type: "url",
        placeholder: "http://localhost:11434",
        required: true,
        description: "URL where Ollama is running",
      },
    ],
  },
  {
    id: "lmstudio",
    name: "LM Studio",
    description: "Local AI model server with OpenAI-compatible API",
    website: "https://lmstudio.ai",
    requiresApiKey: false,
    models: [
      {
        id: "local-model",
        name: "Local Model",
        description: "Whatever model you have loaded in LM Studio",
      },
      {
        id: "custom",
        name: "Custom Model",
        description: "Enter any custom model name from your LM Studio setup",
      },
    ],
    configFields: [
      {
        key: "baseUrl",
        label: "LM Studio Server URL",
        type: "url",
        placeholder: "http://localhost:1234/v1",
        required: true,
        description: "LM Studio local server endpoint",
      },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "High-performance AI models with competitive pricing",
    website: "https://deepseek.com",
    requiresApiKey: true,
    models: [
      {
        id: "deepseek-chat",
        name: "DeepSeek Chat",
        description: "Conversational AI model optimized for dialogue",
      },
      {
        id: "deepseek-coder",
        name: "DeepSeek Coder",
        description: "Specialized model for code generation and analysis",
      },
      {
        id: "custom",
        name: "Custom Model",
        description: "Enter any DeepSeek model name (e.g., deepseek-coder)",
      },
    ],
    configFields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        placeholder: "sk-...",
        required: true,
        description: "Get your API key from DeepSeek Console",
      },
    ],
  },
];

// Validation functions
export function validateAIConfig(config: AIConfiguration): boolean {
  if (!config.provider || !config.model) {
    return false;
  }

  const provider = AI_PROVIDERS.find((p) => p.id === config.provider);
  if (!provider) {
    return false;
  }

  // Check if API key is required and provided
  if (provider.requiresApiKey && !config.apiKey?.trim()) {
    return false;
  }

  // Check if base URL is required and provided
  const baseUrlField = provider.configFields.find(
    (f) => f.key === "baseUrl" && f.required
  );
  if (baseUrlField && !config.baseUrl?.trim()) {
    return false;
  }

  // Check if custom model name is required
  if (config.model === "custom" && !config.customModelName?.trim()) {
    return false;
  }

  return true;
}

export function getProviderById(id: string): AIProvider | undefined {
  return AI_PROVIDERS.find((p) => p.id === id);
}

export function getModelById(
  providerId: string,
  modelId: string
): AIModel | undefined {
  const provider = getProviderById(providerId);
  if (!provider) return undefined;
  return provider.models.find((m) => m.id === modelId);
}
