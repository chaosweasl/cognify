import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateAIConfig, AIConfiguration } from "@/lib/ai/types";
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

export async function POST(request: NextRequest) {
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
    const { text, projectId, fileName, config, options = {} } = body;

    if (!text || !projectId || !config) {
      return NextResponse.json(
        { error: "Missing required fields: text, projectId, config" },
        { status: 400 }
      );
    }

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

    // Chunk text if it's too large
    const textChunks = chunkText(text, MAX_TEXT_CHUNK_SIZE);
    const maxCards = options.maxCards || DEFAULT_MAX_CARDS;
    const cardsPerChunk = Math.ceil(maxCards / textChunks.length);

    let allGeneratedCards: GeneratedFlashcard[] = [];
    let totalTokensUsed = 0;

    for (const chunk of textChunks) {
      try {
        const result = await generateFlashcardsForChunk({
          text: chunk,
          config,
          maxCards: cardsPerChunk,
          difficulty: options.difficulty || "intermediate",
          focusAreas: options.focusAreas,
          fileName,
        });

        allGeneratedCards = [...allGeneratedCards, ...result.flashcards];
        totalTokensUsed += result.tokensUsed || 0;

        // Small delay between chunks to avoid rate limiting
        if (textChunks.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (chunkError) {
        console.error("Error processing chunk:", chunkError);
        // Continue with other chunks even if one fails
      }
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

    return NextResponse.json({
      flashcards: validFlashcards,
      metadata: {
        totalGenerated: validFlashcards.length,
        totalRequested: maxCards,
        fileName,
        tokensUsed: totalTokensUsed,
        chunksProcessed: textChunks.length,
        generatedAt: new Date().toISOString(),
        provider: config.provider,
        model:
          config.model === "custom" ? config.customModelName : config.model,
      },
    });
  } catch (error) {
    console.error("Flashcard generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate flashcards" },
      { status: 500 }
    );
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
}> {
  const prompt = createFlashcardPrompt({
    text,
    maxCards,
    difficulty,
    focusAreas,
    fileName,
  });

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
