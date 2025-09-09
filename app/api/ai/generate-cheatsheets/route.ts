import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateAIConfig, AIConfiguration } from "@/lib/ai/types";
import { withApiSecurity } from "@/lib/utils/apiSecurity";
import { validateAndSanitizeText } from "@/lib/utils/security";

interface CheatsheetSection {
  id: string;
  title: string;
  content: string;
  keyPoints: string[];
  examples?: string[];
}

interface CheatsheetGenerationRequest {
  text: string;
  projectId: string;
  fileName: string;
  config: AIConfiguration;
  options?: {
    sections?: number;
    style?: "bullet-points" | "detailed" | "visual";
    focusAreas?: string[];
  };
}

interface GeneratedCheatsheet {
  title: string;
  content: {
    sections: Array<{
      id: string;
      title: string;
      content: string;
      keyPoints: string[];
      examples?: string[];
    }>;
    summary?: string;
    metadata?: {
      sourceFile?: string;
      generatedAt: string;
      style: string;
    };
  };
  tags?: string[];
}

const DEFAULT_SECTIONS = 5;
const MAX_TEXT_CHUNK_SIZE = 4000; // Characters per chunk for AI processing
const MAX_TEXT_LENGTH = 50000; // Maximum total text length for security
const MAX_FILE_NAME_LENGTH = 255; // Maximum file name length

async function handleGenerateCheatsheets(request: NextRequest) {
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

    const body: CheatsheetGenerationRequest = await request.json();
    const { text, projectId, fileName, config, options = {} } = body;

    // Input validation and sanitization
    if (!text || !projectId || !config) {
      return NextResponse.json(
        { error: "Missing required fields: text, projectId, config" },
        { status: 400 }
      );
    }

    // Sanitize and validate text input
    const textValidation = validateAndSanitizeText(
      text,
      MAX_TEXT_LENGTH,
      "PDF text content"
    );
    if (!textValidation.isValid) {
      return NextResponse.json(
        { error: textValidation.error },
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

    const sanitizedText = textValidation.sanitized;
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
      .select("id, name")
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
    const textChunks = chunkText(sanitizedText, MAX_TEXT_CHUNK_SIZE);
    const sectionsPerChunk = Math.ceil(
      (options.sections || DEFAULT_SECTIONS) / textChunks.length
    );

    let allSections: CheatsheetSection[] = [];
    let totalTokensUsed = 0;

    for (const chunk of textChunks) {
      try {
        const result = await generateCheatsheetForChunk({
          text: chunk,
          config,
          sections: sectionsPerChunk,
          style: options.style || "bullet-points",
          focusAreas: options.focusAreas,
          fileName: sanitizedFileName,
        });

        allSections = [...allSections, ...result.sections];
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

    if (allSections.length === 0) {
      return NextResponse.json(
        {
          error:
            "Failed to generate any cheatsheet sections from the provided content",
        },
        { status: 400 }
      );
    }

    // Create the final cheatsheet structure
    const cheatsheet: GeneratedCheatsheet = {
      title: `Cheatsheet from ${sanitizedFileName}`,
      content: {
        sections: allSections.slice(0, options.sections || DEFAULT_SECTIONS),
        summary: generateSummary(allSections),
        metadata: {
          sourceFile: sanitizedFileName,
          generatedAt: new Date().toISOString(),
          style: options.style || "bullet-points",
        },
      },
      tags: extractTags(allSections, options.focusAreas),
    };

    return NextResponse.json({
      cheatsheet,
      metadata: {
        provider: config.provider,
        model: config.model,
        tokensUsed: totalTokensUsed,
        chunksProcessed: textChunks.length,
        sectionsGenerated: allSections.length,
      },
    });
  } catch (error) {
    console.error("Cheatsheet generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate cheatsheet",
      },
      { status: 500 }
    );
  }
}

async function generateCheatsheetForChunk({
  text,
  config,
  sections = DEFAULT_SECTIONS,
  style = "bullet-points",
  focusAreas,
  fileName,
}: {
  text: string;
  config: AIConfiguration;
  sections: number;
  style: string;
  focusAreas?: string[];
  fileName: string;
}): Promise<{ sections: CheatsheetSection[]; tokensUsed: number }> {
  const styleInstructions = {
    "bullet-points": "Use concise bullet points and brief explanations",
    detailed: "Provide detailed explanations with examples and context",
    visual: "Structure content with visual hierarchy and clear formatting",
  };

  const focusAreasText = focusAreas?.length
    ? `Focus particularly on these areas: ${focusAreas.join(", ")}.`
    : "";

  const systemPrompt = `You are an expert at creating educational cheatsheets from academic and technical content.

Your task is to analyze the provided text and create structured cheatsheet sections that help students and professionals quickly understand and reference key concepts.

Guidelines:
1. Create ${sections} distinct sections covering different topics from the text
2. ${styleInstructions[style as keyof typeof styleInstructions]}
3. Each section should have:
   - A clear, descriptive title
   - Main content (formatted according to the style)
   - 3-5 key points that summarize the most important information
   - Optional: practical examples where relevant
4. ${focusAreasText}
5. Make the content scannable and easy to reference quickly
6. Use clear, professional language suitable for study materials

Respond with valid JSON only in this exact format:
{
  "sections": [
    {
      "id": "unique-section-id",
      "title": "Section Title",
      "content": "Main section content",
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
      "examples": ["Example 1", "Example 2"] // optional
    }
  ]
}`;

  const userPrompt = `Create a cheatsheet from this content (Source: ${fileName}):

${text}

Generate ${sections} sections that capture the most important concepts and information.`;

  try {
    const response = await generateWithProvider(
      config,
      `${systemPrompt}\n\n${userPrompt}`
    );
    return {
      sections: response.sections || [],
      tokensUsed: response.tokensUsed || 0,
    };
  } catch (error) {
    console.error("AI provider error:", error);
    throw new Error("Failed to generate cheatsheet with AI provider");
  }
}

// Helper functions (similar to flashcard generation)
function chunkText(text: string, maxChunkSize: number): string[] {
  if (text.length <= maxChunkSize) return [text];

  const chunks: string[] = [];
  let currentChunk = "";
  const sentences = text.split(/[.!?]+/);

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    if (currentChunk.length + trimmedSentence.length + 1 > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }
    }
    currentChunk += (currentChunk ? " " : "") + trimmedSentence + ".";
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text.substring(0, maxChunkSize)];
}

function generateSummary(sections: CheatsheetSection[]): string {
  if (sections.length === 0) return "";

  const topics = sections.map((s) => s.title).join(", ");
  return `This cheatsheet covers ${sections.length} main topics: ${topics}`;
}

function extractTags(
  sections: CheatsheetSection[],
  focusAreas?: string[]
): string[] {
  const tags = new Set<string>();

  // Add focus areas as tags
  focusAreas?.forEach((area: string) => tags.add(area.toLowerCase()));

  // Extract tags from section titles
  sections.forEach((section: CheatsheetSection) => {
    const words = section.title.toLowerCase().split(/\s+/);
    words.forEach((word: string) => {
      if (word.length > 3) {
        tags.add(word);
      }
    });
  });

  return Array.from(tags).slice(0, 10); // Limit to 10 tags
}

async function generateWithProvider(
  config: AIConfiguration,
  prompt: string
): Promise<{ sections: CheatsheetSection[]; tokensUsed: number }> {
  switch (config.provider) {
    case "openai":
      return generateCheatsheetWithOpenAI(config, prompt);
    case "anthropic":
      return generateCheatsheetWithAnthropic(config, prompt);
    case "ollama":
    case "localhost-ollama":
      return generateCheatsheetWithOllama(config, prompt);
    case "lmstudio":
    case "localhost-lmstudio":
      return generateCheatsheetWithLMStudio(config, prompt);
    case "localhost-openai-compatible":
      return generateCheatsheetWithLocalOpenAICompatible(config, prompt);
    case "deepseek":
      return generateCheatsheetWithDeepSeek(config, prompt);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

async function generateCheatsheetWithOpenAI(
  config: AIConfiguration,
  prompt: string
) {
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
            "You are a helpful educational assistant that creates cheatsheets. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 3000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "OpenAI API request failed");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content?.trim() || "";

  return {
    sections: parseCheatsheetJSON(content),
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

async function generateCheatsheetWithAnthropic(
  config: AIConfiguration,
  prompt: string
) {
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
      max_tokens: config.maxTokens || 3000,
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
    sections: parseCheatsheetJSON(content),
    tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 0,
  };
}

async function generateCheatsheetWithOllama(
  config: AIConfiguration,
  prompt: string
) {
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
        num_predict: config.maxTokens || 3000,
      },
    }),
  });

  if (!response.ok) {
    throw new Error("Ollama API request failed");
  }

  const data = await response.json();
  const content = data.response?.trim() || "";

  return {
    sections: parseCheatsheetJSON(content),
    tokensUsed: 0, // Ollama doesn't provide token count
  };
}

async function generateCheatsheetWithLMStudio(
  config: AIConfiguration,
  prompt: string
) {
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
            "You are a helpful educational assistant that creates cheatsheets. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 3000,
    }),
  });

  if (!response.ok) {
    throw new Error("LM Studio API request failed");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content?.trim() || "";

  return {
    sections: parseCheatsheetJSON(content),
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

async function generateCheatsheetWithLocalOpenAICompatible(
  config: AIConfiguration,
  prompt: string
) {
  const baseUrl =
    config.baseUrl?.replace(/\/$/, "") || "http://localhost:8000/v1";

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
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
            "You are a helpful educational assistant that creates cheatsheets. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 3000,
    }),
  });

  if (!response.ok) {
    throw new Error("Local OpenAI-compatible API request failed");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content?.trim() || "";

  return {
    sections: parseCheatsheetJSON(content),
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

async function generateCheatsheetWithDeepSeek(
  config: AIConfiguration,
  prompt: string
) {
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
            "You are a helpful educational assistant that creates cheatsheets. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 3000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "DeepSeek API request failed");
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content?.trim() || "";

  return {
    sections: parseCheatsheetJSON(content),
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

function parseCheatsheetJSON(content: string): CheatsheetSection[] {
  try {
    // Remove any markdown formatting
    let cleanContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "");

    // Try to find JSON in the content
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanContent = jsonMatch[0];
    }

    const parsed = JSON.parse(cleanContent);
    return parsed.sections || [];
  } catch (error) {
    console.error("Failed to parse cheatsheet JSON:", error);
    console.error("Content:", content);
    return [];
  }
}

export const POST = withApiSecurity(handleGenerateCheatsheets);
