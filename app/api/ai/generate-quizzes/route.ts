import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateAIConfig, AIConfiguration } from "@/lib/ai/types";
import { withApiSecurity } from "@/lib/utils/apiSecurity";
import { validateAndSanitizeText } from "@/lib/utils/security";
import { v4 as uuidv4 } from "uuid";

interface QuizGenerationRequest {
  text: string;
  projectId: string;
  fileName: string;
  config: AIConfiguration;
  options?: {
    questionCount?: number;
    questionTypes?: (
      | "multiple-choice"
      | "true-false"
      | "short-answer"
      | "fill-blank"
    )[];
    difficulty?: "beginner" | "intermediate" | "advanced";
    focusAreas?: string[];
    timeLimit?: number; // in minutes
  };
}

interface QuizQuestion {
  id: string;
  type: "multiple-choice" | "true-false" | "short-answer" | "fill-blank";
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer: string | string[]; // String for single answer, array for multiple answers
  explanation?: string;
  points: number;
  difficulty: string;
}

interface GeneratedQuiz {
  title: string;
  questions: QuizQuestion[];
  settings: {
    timeLimit?: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    passingScore: number;
    allowRetakes: boolean;
    showCorrectAnswers: boolean;
    metadata: {
      sourceFile: string;
      generatedAt: string;
      totalPoints: number;
      questionTypes: string[];
    };
  };
  tags?: string[];
}

const DEFAULT_QUESTION_COUNT = 10;
const MAX_TEXT_CHUNK_SIZE = 4000;
const MAX_TEXT_LENGTH = 50000;
const MAX_FILE_NAME_LENGTH = 255;

async function handleGenerateQuizzes(request: NextRequest) {
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

    const body: QuizGenerationRequest = await request.json();
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
    const questionsPerChunk = Math.ceil(
      (options.questionCount || DEFAULT_QUESTION_COUNT) / textChunks.length
    );

    let allQuestions: QuizQuestion[] = [];
    let totalTokensUsed = 0;

    for (const chunk of textChunks) {
      try {
        const result = await generateQuizForChunk({
          text: chunk,
          config,
          questionCount: questionsPerChunk,
          questionTypes: options.questionTypes || [
            "multiple-choice",
            "true-false",
          ],
          difficulty: options.difficulty || "intermediate",
          focusAreas: options.focusAreas,
          fileName: sanitizedFileName,
        });

        allQuestions = [...allQuestions, ...result.questions];
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

    if (allQuestions.length === 0) {
      return NextResponse.json(
        {
          error:
            "Failed to generate any quiz questions from the provided content",
        },
        { status: 400 }
      );
    }

    // Create the final quiz structure
    const totalPoints = allQuestions.reduce((sum, q) => sum + q.points, 0);
    const questionTypes = [...new Set(allQuestions.map((q) => q.type))];

    const quiz: GeneratedQuiz = {
      title: `Quiz from ${sanitizedFileName}`,
      questions: allQuestions.slice(
        0,
        options.questionCount || DEFAULT_QUESTION_COUNT
      ),
      settings: {
        timeLimit: options.timeLimit,
        shuffleQuestions: true,
        shuffleOptions: true,
        passingScore: 70, // Default 70% passing score
        allowRetakes: true,
        showCorrectAnswers: true,
        metadata: {
          sourceFile: sanitizedFileName,
          generatedAt: new Date().toISOString(),
          totalPoints,
          questionTypes,
        },
      },
      tags: extractTags(allQuestions, options.focusAreas),
    };

    return NextResponse.json({
      quiz,
      metadata: {
        provider: config.provider,
        model: config.model,
        tokensUsed: totalTokensUsed,
        chunksProcessed: textChunks.length,
        questionsGenerated: allQuestions.length,
        totalPoints,
      },
    });
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate quiz",
      },
      { status: 500 }
    );
  }
}

async function generateQuizForChunk({
  text,
  config,
  questionCount = DEFAULT_QUESTION_COUNT,
  questionTypes = ["multiple-choice", "true-false"],
  difficulty = "intermediate",
  focusAreas,
  fileName,
}: {
  text: string;
  config: AIConfiguration;
  questionCount: number;
  questionTypes: string[];
  difficulty: string;
  focusAreas?: string[];
  fileName: string;
}): Promise<{ questions: QuizQuestion[]; tokensUsed: number }> {
  const focusAreasText = focusAreas?.length
    ? `Focus particularly on these areas: ${focusAreas.join(", ")}.`
    : "";

  const questionTypeInstructions = {
    "multiple-choice":
      "Multiple choice questions with 4 options where exactly one is correct",
    "true-false": "True/False questions with clear factual statements",
    "short-answer": "Short answer questions requiring 1-3 sentence responses",
    "fill-blank":
      "Fill-in-the-blank questions with missing key terms or concepts",
  };

  const typesList = questionTypes
    .map(
      (type) =>
        questionTypeInstructions[type as keyof typeof questionTypeInstructions]
    )
    .join(", ");

  const systemPrompt = `You are an expert quiz creator for educational content. Your task is to analyze the provided text and create high-quality quiz questions that test comprehension, analysis, and application of the material.

Guidelines:
1. Generate exactly ${questionCount} questions from the content
2. Use these question types: ${typesList}
3. Make questions appropriate for ${difficulty} level learners
4. ${focusAreasText}
5. Each question should:
   - Test genuine understanding, not just memorization
   - Be clearly worded and unambiguous
   - Have definitive correct answers based on the content
   - Include brief explanations for the correct answers
   - Be assigned appropriate point values (1-5 points based on complexity)

Question Type Guidelines:
- Multiple Choice: One correct answer, three plausible distractors
- True/False: Clear factual statements that are definitively true or false
- Short Answer: Require specific information from the text (2-3 sentences max)
- Fill-in-blank: Focus on key terms, concepts, or specific facts

Respond with valid JSON only in this exact format:
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Brief explanation of why this is correct",
      "points": 2,
      "difficulty": "intermediate"
    },
    {
      "id": "q2", 
      "type": "true-false",
      "question": "Statement to evaluate",
      "correctAnswer": "true",
      "explanation": "Brief explanation",
      "points": 1,
      "difficulty": "intermediate"
    }
  ]
}`;

  const userPrompt = `Create quiz questions from this content (Source: ${fileName}):

${text}

Generate ${questionCount} questions using the specified question types, ensuring good coverage of the main concepts and facts presented in the material.`;

  try {
    const response = await generateWithProvider(
      config,
      `${systemPrompt}\n\n${userPrompt}`
    );
    return {
      questions: response.questions || [],
      tokensUsed: response.tokensUsed || 0,
    };
  } catch (error) {
    console.error("AI provider error:", error);
    throw new Error("Failed to generate quiz with AI provider");
  }
}

// Helper functions
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

function extractTags(
  questions: QuizQuestion[],
  focusAreas?: string[]
): string[] {
  const tags = new Set<string>();

  // Add focus areas as tags
  focusAreas?.forEach((area: string) => tags.add(area.toLowerCase()));

  // Add question types as tags
  questions.forEach((question: QuizQuestion) => {
    tags.add(question.type);
    tags.add(question.difficulty);
  });

  return Array.from(tags).slice(0, 10);
}

async function generateWithProvider(
  config: AIConfiguration,
  prompt: string
): Promise<{ questions: QuizQuestion[]; tokensUsed: number }> {
  switch (config.provider) {
    case "openai":
      return generateQuizWithOpenAI(config, prompt);
    case "anthropic":
      return generateQuizWithAnthropic(config, prompt);
    case "ollama":
    case "localhost-ollama":
      return generateQuizWithOllama(config, prompt);
    case "lmstudio":
    case "localhost-lmstudio":
      return generateQuizWithLMStudio(config, prompt);
    case "localhost-openai-compatible":
      return generateQuizWithLocalOpenAICompatible(config, prompt);
    case "deepseek":
      return generateQuizWithDeepSeek(config, prompt);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

async function generateQuizWithOpenAI(config: AIConfiguration, prompt: string) {
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
            "You are a helpful educational assistant that creates quizzes. Always respond with valid JSON only.",
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
    questions: parseQuizJSON(content),
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

async function generateQuizWithAnthropic(
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
    questions: parseQuizJSON(content),
    tokensUsed: data.usage?.input_tokens + data.usage?.output_tokens || 0,
  };
}

async function generateQuizWithOllama(config: AIConfiguration, prompt: string) {
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
    questions: parseQuizJSON(content),
    tokensUsed: 0, // Ollama doesn't provide token count
  };
}

async function generateQuizWithLMStudio(
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
            "You are a helpful educational assistant that creates quizzes. Always respond with valid JSON only.",
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
    questions: parseQuizJSON(content),
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

async function generateQuizWithLocalOpenAICompatible(
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
            "You are a helpful educational assistant that creates quizzes. Always respond with valid JSON only.",
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
    questions: parseQuizJSON(content),
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

async function generateQuizWithDeepSeek(
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
            "You are a helpful educational assistant that creates quizzes. Always respond with valid JSON only.",
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
    questions: parseQuizJSON(content),
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

function parseQuizJSON(content: string): QuizQuestion[] {
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
    const questions = parsed.questions || [];

    // Validate and enrich question data
    return questions.map((q: any, index: number) => ({
      id: q.id || `q${index + 1}`,
      type: q.type || "multiple-choice",
      question: q.question || "",
      options: q.options || [],
      correctAnswer: q.correctAnswer || "",
      explanation: q.explanation || "",
      points: q.points || 1,
      difficulty: q.difficulty || "intermediate",
    }));
  } catch (error) {
    console.error("Failed to parse quiz JSON:", error);
    console.error("Content:", content);
    return [];
  }
}

export const POST = withApiSecurity(handleGenerateQuizzes);
