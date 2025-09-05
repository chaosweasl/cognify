import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateAIConfig, AIConfiguration } from "@/lib/ai/types";
import {
  isDeveloperOnlyProvider,
  testDeveloperConnection,
} from "@/lib/ai/developer";

interface TestResult {
  success: boolean;
  error?: string;
  model?: string;
  provider?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { config } = await request.json();

    if (!config || !validateAIConfig(config)) {
      return NextResponse.json(
        { error: "Invalid AI configuration" },
        { status: 400 }
      );
    }

    // Create supabase client to verify user authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Test the AI connection based on provider
    let testResult;

    // Handle developer-only providers first
    if (isDeveloperOnlyProvider(config.provider)) {
      testResult = await testDeveloperConnection(config);
    } else {
      // Handle production providers
      switch (config.provider) {
        case "openai":
          testResult = await testOpenAI(config);
          break;
        case "anthropic":
          testResult = await testAnthropic(config);
          break;
        case "ollama":
          testResult = await testOllama(config);
          break;
        case "lmstudio":
          testResult = await testLMStudio(config);
          break;
        case "deepseek":
          testResult = await testDeepSeek(config);
          break;
        default:
          return NextResponse.json(
            { error: "Unsupported AI provider" },
            { status: 400 }
          );
      }
    }

    if (testResult.success) {
      return NextResponse.json({
        ...testResult,
        success: true,
      });
    } else {
      return NextResponse.json(
        { error: (testResult as TestResult).error || "Connection failed" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("AI connection test error:", error);
    return NextResponse.json(
      { error: "Connection test failed" },
      { status: 500 }
    );
  }
}

async function testOpenAI(config: AIConfiguration): Promise<TestResult> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model:
          config.model === "custom" ? config.customModelName : config.model,
        messages: [{ role: "user", content: "Test connection" }],
        max_tokens: 10,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, model: data.model };
    } else {
      const error = await response.json();
      return {
        success: false,
        error: error.error?.message || "OpenAI connection failed",
      };
    }
  } catch (error) {
    return { success: false, error: "Failed to connect to OpenAI" };
  }
}

async function testAnthropic(config: AIConfiguration): Promise<TestResult> {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": config.apiKey || "",
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:
          config.model === "custom" ? config.customModelName : config.model,
        messages: [{ role: "user", content: "Test connection" }],
        max_tokens: 10,
      }),
    });

    if (response.ok) {
      return { success: true, model: config.model };
    } else {
      const error = await response.json();
      return {
        success: false,
        error: error.error?.message || "Anthropic connection failed",
      };
    }
  } catch (error) {
    return { success: false, error: "Failed to connect to Anthropic" };
  }
}

async function testOllama(config: AIConfiguration): Promise<TestResult> {
  try {
    const baseUrl =
      config.baseUrl?.replace(/\/$/, "") || "http://localhost:11434";
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model:
          config.model === "custom" ? config.customModelName : config.model,
        prompt: "Test connection",
        stream: false,
        options: {
          num_predict: 10,
        },
      }),
    });

    if (response.ok) {
      return { success: true, model: config.model };
    } else {
      const error = await response.text();
      return { success: false, error: error || "Ollama connection failed" };
    }
  } catch {
    return {
      success: false,
      error: "Failed to connect to Ollama. Make sure Ollama is running.",
    };
  }
}

async function testLMStudio(config: AIConfiguration): Promise<TestResult> {
  try {
    const baseUrl =
      config.baseUrl?.replace(/\/$/, "") || "http://localhost:1234/v1";
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model:
          config.model === "custom" ? config.customModelName : config.model,
        messages: [{ role: "user", content: "Test connection" }],
        max_tokens: 10,
      }),
    });

    if (response.ok) {
      return { success: true, model: config.model };
    } else {
      const error = await response.json();
      return {
        success: false,
        error: error.error?.message || "LM Studio connection failed",
      };
    }
  } catch {
    return {
      success: false,
      error:
        "Failed to connect to LM Studio. Make sure LM Studio server is running.",
    };
  }
}

async function testDeepSeek(config: AIConfiguration): Promise<TestResult> {
  try {
    const response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model:
            config.model === "custom" ? config.customModelName : config.model,
          messages: [{ role: "user", content: "Test connection" }],
          max_tokens: 10,
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, model: data.model };
    } else {
      const error = await response.json();
      return {
        success: false,
        error: error.error?.message || "DeepSeek connection failed",
      };
    }
  } catch {
    return { success: false, error: "Failed to connect to DeepSeek" };
  }
}
