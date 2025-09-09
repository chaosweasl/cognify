import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateAIConfig, AIConfiguration } from "@/lib/ai/types";
import { withApiSecurity } from "@/lib/utils/apiSecurity";
import { validateAndSanitizeText } from "@/lib/utils/security";
import {
  enhanceAIError,
  getFallbackSuggestions,
  executeAIOperation,
  detectCORSError,
  detectRateLimitError,
  detectAuthError,
} from "@/lib/utils/aiErrorHandling";
import {
  rateLimiter,
  optimizeTextChunking,
  sanitizeAIRequest,
  sanitizeAIResponse,
  optimizePromptForTokens,
  adaptiveDelayManager,
  performanceMonitor,
  getMaxTokensForModel,
} from "@/lib/utils/performanceOptimization";
import { v4 as uuidv4 } from "uuid";

interface FlashcardGenerationRequest {
  text: string;
  projectId: string;
  fileName: string;
  config: AIConfiguration;
  options?: {
    maxCards?: number;
    difficulty?: "beginner" | "intermediate" | "advanced";
    focusAreas?: string[];
  };
}

interface GeneratedFlashcard {
  front: string;
  back: string;
  tags?: string[];
}

const DEFAULT_MAX_CARDS = 20;
const MAX_TEXT_CHUNK_SIZE = 4000; // Characters per chunk for AI processing
const MAX_TEXT_LENGTH = 50000; // Maximum total text length for security
const MAX_FILE_NAME_LENGTH = 255; // Maximum file name length

async function handleGenerateFlashcards(request: NextRequest) {
  let config: AIConfiguration | undefined;
  const operationId = uuidv4();

  try {
    // Verify authentication
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

    const body: FlashcardGenerationRequest = await request.json();
    const {
      text,
      projectId,
      fileName,
      config: requestConfig,
      options = {},
    } = body;
    config = requestConfig;

    // Start performance monitoring
    performanceMonitor.startOperation(
      operationId,
      config.provider,
      config.model === "custom"
        ? config.customModelName || "unknown"
        : config.model
    );

    // Rate limiting check
    const rateLimitResult = await rateLimiter.checkRateLimit(
      user.id,
      config.provider
    );
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded for ${config.provider}. Try again in ${rateLimitResult.retryAfter} seconds.`,
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.retryAfter?.toString() || "60",
          },
        }
      );
    }

    // Input validation and sanitization
    if (!text || !projectId || !config) {
      return NextResponse.json(
        { error: "Missing required fields: text, projectId, config" },
        { status: 400 }
      );
    }

    // Enhanced sanitization with token optimization
    const sanitizationResult = sanitizeAIRequest(text, MAX_TEXT_LENGTH);
    if (!sanitizationResult.isValid) {
      return NextResponse.json(
        { error: "Invalid or potentially unsafe content provided" },
        { status: 400 }
      );
    }

    // Sanitize file name
    const fileNameValidation = validateAndSanitizeText(
      fileName || "Unknown",
      MAX_FILE_NAME_LENGTH,
      "File name"
    );
    if (!fileNameValidation.isValid) {
      return NextResponse.json(
        { error: fileNameValidation.error },
        { status: 400 }
      );
    }

    const sanitizedText = sanitizationResult.content;
    const sanitizedFileName = fileNameValidation.sanitized;

    // Validate AI configuration
    if (!validateAIConfig(config)) {
      return NextResponse.json(
        { error: "Invalid AI configuration" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id, name, srs_settings")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Enhanced text chunking with optimization
    const textChunks = optimizeTextChunking(sanitizedText, {
      maxChunkSize: MAX_TEXT_CHUNK_SIZE,
      overlapSize: 200, // Add context overlap between chunks
      preserveContext: true,
      balanceChunks: true, // Distribute content more evenly
    });

    const maxCards = Math.min(options.maxCards || DEFAULT_MAX_CARDS, 50);
    const cardsPerChunk = Math.ceil(maxCards / textChunks.length);

    let allGeneratedCards: GeneratedFlashcard[] = [];
    let totalTokensUsed = 0;
    let lastError: any = null;
    let corsErrorDetected = false;
    let consecutiveErrors = 0;

    // Process chunks with adaptive delays and error handling
    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];

      try {
        // Apply adaptive delay based on provider performance and error history
        if (i > 0) {
          await adaptiveDelayManager.delay(config.provider, consecutiveErrors);
        }

        const result = await generateFlashcardsForChunk({
          text: chunk,
          config,
          maxCards: cardsPerChunk,
          difficulty: options.difficulty || "intermediate",
          focusAreas: options.focusAreas,
          fileName: sanitizedFileName,
        });

        if (result.error) {
          lastError = result.error;
          consecutiveErrors++;
          performanceMonitor.recordError(operationId);

          if (result.error.isCORSError) {
            corsErrorDetected = true;
          }
          console.error(
            `Error processing chunk ${i + 1}/${textChunks.length}:`,
            result.error
          );
        } else {
          allGeneratedCards = [...allGeneratedCards, ...result.flashcards];
          totalTokensUsed += result.tokensUsed || 0;
          consecutiveErrors = 0; // Reset error counter on success

          performanceMonitor.recordTokenUsage(
            operationId,
            result.tokensUsed || 0
          );
        }

        performanceMonitor.recordChunkProcessed(operationId);
      } catch (chunkError) {
        console.error(`Unexpected error in chunk ${i + 1}:`, chunkError);
        consecutiveErrors++;
        performanceMonitor.recordError(operationId);
        lastError = chunkError;
      }
    }

    // If all chunks failed, return enhanced error
    if (allGeneratedCards.length === 0 && lastError) {
      const suggestions = getFallbackSuggestions(lastError, config);

      return NextResponse.json(
        {
          error: lastError.message,
          aiError: lastError,
          fallbackSuggestions: suggestions,
          corsDetected: corsErrorDetected,
        },
        { status: 400 }
      );
    }

    if (allGeneratedCards.length === 0) {
      return NextResponse.json(
        {
          error: "Failed to generate any flashcards from the provided content",
        },
        { status: 400 }
      );
    }

    // Limit to requested number of cards
    if (allGeneratedCards.length > maxCards) {
      allGeneratedCards = allGeneratedCards.slice(0, maxCards);
    }

    // Format flashcards for database insertion
    const flashcards = allGeneratedCards.map((card) => ({
      id: uuidv4(),
      project_id: projectId,
      front: card.front?.trim() || "",
      back: card.back?.trim() || "",
      tags: card.tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    // Filter out invalid flashcards
    const validFlashcards = flashcards.filter(
      (card) =>
        card.front && card.back && card.front.length > 0 && card.back.length > 0
    );

    if (validFlashcards.length === 0) {
      return NextResponse.json(
        { error: "No valid flashcards could be generated from the content" },
        { status: 400 }
      );
    }

    // Sanitize response data
    const { sanitized: sanitizedCards, warnings: sanitizationWarnings } =
      sanitizeAIResponse(validFlashcards);

    // Finish performance monitoring
    const performanceMetrics = performanceMonitor.finishOperation(operationId);

    return NextResponse.json({
      flashcards: sanitizedCards,
      metadata: {
        totalGenerated: validFlashcards.length,
        totalRequested: maxCards,
        fileName: sanitizedFileName,
        tokensUsed: totalTokensUsed,
        chunksProcessed: textChunks.length,
        generatedAt: new Date().toISOString(),
        provider: config.provider,
        model:
          config.model === "custom" ? config.customModelName : config.model,
        performance: performanceMetrics
          ? {
              duration: performanceMetrics.duration,
              tokensPerSecond:
                performanceMetrics.tokensUsed && performanceMetrics.duration
                  ? Math.round(
                      (performanceMetrics.tokensUsed /
                        performanceMetrics.duration) *
                        1000
                    )
                  : undefined,
              errorsEncountered: performanceMetrics.errorsEncountered,
            }
          : undefined,
        warnings: sanitizationResult.warnings.concat(sanitizationWarnings),
        optimizations: {
          chunksBalanced: true,
          contextPreserved: true,
          adaptiveDelaysUsed: textChunks.length > 1,
        },
      },
    });
  } catch (error) {
    console.error("Flashcard generation error:", error);

    // Enhanced error handling with fallback suggestions
    if (config) {
      const enhancedError = enhanceAIError(
        error,
        config,
        "Flashcard generation"
      );
      const suggestions = getFallbackSuggestions(enhancedError, config);

      return NextResponse.json(
        {
          error: enhancedError.message,
          aiError: enhancedError,
          fallbackSuggestions: suggestions,
          corsDetected: enhancedError.isCORSError,
        },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: "Failed to generate flashcards" },
        { status: 500 }
      );
    }
  }
}

function chunkText(text: string, maxChunkSize: number): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\s*\n/);

  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length + 2 <= maxChunkSize) {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }

      if (paragraph.length <= maxChunkSize) {
        currentChunk = paragraph;
      } else {
        // Split long paragraphs by sentences
        const sentences = paragraph.split(/[.!?]+/).filter((s) => s.trim());
        currentChunk = "";

        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length + 1 <= maxChunkSize) {
            currentChunk += (currentChunk ? ". " : "") + sentence.trim();
          } else {
            if (currentChunk) {
              chunks.push(currentChunk.trim() + ".");
            }
            currentChunk = sentence.trim();
          }
        }
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

interface ChunkGenerationParams {
  text: string;
  config: AIConfiguration;
  maxCards: number;
  difficulty: string;
  focusAreas?: string[];
  fileName: string;
}

async function generateFlashcardsForChunk({
  text,
  config,
  maxCards,
  difficulty,
  focusAreas,
  fileName,
}: ChunkGenerationParams): Promise<{
  flashcards: GeneratedFlashcard[];
  tokensUsed?: number;
  error?: any;
}> {
  // Create and optimize prompt for token efficiency
  let prompt = createFlashcardPrompt({
    text,
    maxCards,
    difficulty,
    focusAreas,
    fileName,
  });

  // Optimize prompt for token limits if needed
  const maxTokensForModel = getMaxTokensForModel(config.provider, config.model);
  if (maxTokensForModel) {
    const optimization = optimizePromptForTokens(prompt, {
      provider: config.provider,
      model: config.model,
      maxTokens: maxTokensForModel,
      reserveTokens: 1000, // Reserve tokens for response
    });

    prompt = optimization.optimizedPrompt;

    // Log if significant compression was applied
    if (optimization.compressionRatio < 0.8) {
      console.log(
        `Prompt compressed by ${Math.round(
          (1 - optimization.compressionRatio) * 100
        )}% for ${config.provider}`
      );
    }
  }

  const operation = async () => {
    switch (config.provider) {
      case "openai":
        return generateWithOpenAI(config, prompt);
      case "anthropic":
        return generateWithAnthropic(config, prompt);
      case "ollama":
      case "localhost-ollama":
        return generateWithOllama(config, prompt);
      case "lmstudio":
      case "localhost-lmstudio":
        return generateWithLMStudio(config, prompt);
      case "localhost-openai-compatible":
        return generateWithLocalOpenAICompatible(config, prompt);
      case "deepseek":
        return generateWithDeepSeek(config, prompt);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  };

  // Use enhanced AI operation wrapper
  const { result, error } = await executeAIOperation(
    operation,
    config,
    `Generating flashcards for chunk (${Math.min(text.length, 100)}... chars)`
  );

  if (error) {
    return {
      flashcards: [],
      tokensUsed: 0,
      error,
    };
  }

  return result!;
}

function createFlashcardPrompt({
  text,
  maxCards,
  difficulty,
  focusAreas,
  fileName,
}: {
  text: string;
  maxCards: number;
  difficulty: string;
  focusAreas?: string[];
  fileName: string;
}): string {
  const focusInstruction =
    focusAreas && focusAreas.length > 0
      ? `Focus particularly on these areas: ${focusAreas.join(", ")}. `
      : "";

  return `You are an expert educational content creator. Your task is to create high-quality flashcards from the provided text content.

**Instructions:**
- Generate exactly ${maxCards} flashcards from the content below
- Make flashcards appropriate for ${difficulty} level learners
- ${focusInstruction}
- Create clear, concise questions that test understanding, not memorization
- Provide accurate, complete answers
- Include relevant tags for categorization
- Avoid duplicate or very similar questions
- Focus on the most important concepts and facts

**Content from "${fileName}":**
${text}

**Required JSON Format:**
Return ONLY a valid JSON array with this exact structure:
[
  {
    "front": "Question or prompt text",
    "back": "Answer or explanation text",
    "tags": ["tag1", "tag2"]
  }
]

**Important Guidelines:**
- Front: Should be a clear question or fill-in-the-blank prompt
- Back: Should be a complete, accurate answer or explanation
- Tags: 1-3 relevant keywords or concepts (lowercase, no spaces)
- Make sure all strings are properly escaped for JSON
- Return ONLY the JSON array, no additional text or formatting`;
}

async function generateWithOpenAI(config: AIConfiguration, prompt: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model === "custom" ? config.customModelName : config.model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful educational assistant that creates flashcards. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "OpenAI API request failed");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content?.trim() || "";

  return {
    flashcards: parseFlashcardJSON(content),
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

async function generateWithAnthropic(config: AIConfiguration, prompt: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": config.apiKey!,
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model === "custom" ? config.customModelName : config.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: config.maxTokens || 2000,
      temperature: config.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Anthropic API request failed");
  }

  const data = await response.json();
  const content = data.content[0]?.text?.trim() || "";

  return {
    flashcards: parseFlashcardJSON(content),
    tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 0,
  };
}

async function generateWithOllama(config: AIConfiguration, prompt: string) {
  const baseUrl =
    config.baseUrl?.replace(/\/$/, "") || "http://localhost:11434";
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model === "custom" ? config.customModelName : config.model,
      prompt,
      stream: false,
      options: {
        temperature: config.temperature || 0.7,
        num_predict: config.maxTokens || 2000,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Ollama API request failed");
  }

  const data = await response.json();
  const content = data.response?.trim() || "";

  return {
    flashcards: parseFlashcardJSON(content),
  };
}

async function generateWithLMStudio(config: AIConfiguration, prompt: string) {
  const baseUrl =
    config.baseUrl?.replace(/\/$/, "") || "http://localhost:1234/v1";
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model === "custom" ? config.customModelName : config.model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful educational assistant that creates flashcards. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 2000,
    }),
  });

  if (!response.ok) {
    throw new Error("LM Studio API request failed");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content?.trim() || "";

  return {
    flashcards: parseFlashcardJSON(content),
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

async function generateWithDeepSeek(config: AIConfiguration, prompt: string) {
  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model === "custom" ? config.customModelName : config.model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful educational assistant that creates flashcards. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "DeepSeek API request failed");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content?.trim() || "";

  return {
    flashcards: parseFlashcardJSON(content),
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

async function generateWithLocalOpenAICompatible(
  config: AIConfiguration,
  prompt: string
) {
  const baseUrl =
    config.baseUrl?.replace(/\/$/, "") || "http://localhost:8080/v1";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.apiKey?.trim()) {
    headers["Authorization"] = `Bearer ${config.apiKey}`;
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: config.model === "custom" ? config.customModelName : config.model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful educational assistant that creates flashcards. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 2000,
    }),
  });

  if (!response.ok) {
    throw new Error("Local OpenAI-compatible API request failed");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content?.trim() || "";

  return {
    flashcards: parseFlashcardJSON(content),
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

function parseFlashcardJSON(content: string): GeneratedFlashcard[] {
  try {
    // Try to extract JSON from the response
    let jsonStr = content;

    // Remove code block markers if present
    if (content.includes("```")) {
      const match = content.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
      if (match) {
        jsonStr = match[1];
      }
    }

    // Find JSON array in the text
    const arrayMatch = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (arrayMatch) {
      jsonStr = arrayMatch[0];
    }

    const parsed = JSON.parse(jsonStr);

    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item) =>
          item &&
          typeof item === "object" &&
          typeof item.front === "string" &&
          typeof item.back === "string" &&
          item.front.trim() &&
          item.back.trim()
      );
    }

    return [];
  } catch (error) {
    console.error(
      "Failed to parse flashcard JSON:",
      error,
      "Content:",
      content
    );
    return [];
  }
}

// Apply security middleware with AI-specific configuration
export const POST = withApiSecurity(
  async (request: NextRequest) => {
    return handleGenerateFlashcards(request);
  },
  {
    requireAuth: true,
    rateLimit: { requests: 20, window: 60 }, // 20 AI requests per minute
    allowedMethods: ["POST"],
    // Note: Not using validateInput here as AI config validation is custom
  }
);
