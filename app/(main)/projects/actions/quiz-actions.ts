"use server";

import { createClient } from "@/lib/supabase/server";
import { CacheInvalidation } from "@/hooks/useCache";
import { validateUUID, validateAndSanitizeText } from "@/lib/utils/security";

// Types based on database schema
interface QuizQuestion {
  id: string;
  type: "multiple-choice" | "true-false" | "short-answer" | "fill-blank";
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  difficulty: string;
}

interface Quiz {
  id: string;
  project_id: string;
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
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  answers: Record<string, any>;
  score: number;
  total_questions: number;
  time_spent_seconds?: number;
  completed_at: string;
}

interface CreateQuizData {
  title: string;
  questions: QuizQuestion[];
  settings: Quiz["settings"];
  tags?: string[];
}

interface UpdateQuizData extends CreateQuizData {
  id: string;
}

// Get all quizzes for a project
export async function getQuizzesByProjectId(
  projectId: string
): Promise<Quiz[]> {
  console.log(
    `[Quizzes] getQuizzesByProjectId called for project: ${projectId}`
  );

  const projectIdValidation = validateUUID(projectId);
  if (!projectIdValidation.isValid) {
    console.log(
      `[Quizzes] getQuizzesByProjectId - Invalid project ID format: ${projectId}`
    );
    return [];
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.log(
      `[Quizzes] getQuizzesByProjectId - User not authenticated:`,
      userError
    );
    return [];
  }

  // Verify project ownership
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) {
    console.log(
      `[Quizzes] getQuizzesByProjectId - Project not found or unauthorized:`,
      projectError
    );
    return [];
  }

  const { data: quizzes, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "[Quizzes] getQuizzesByProjectId - Error fetching quizzes:",
      error
    );
    return [];
  }

  console.log(
    `[Quizzes] getQuizzesByProjectId - Found ${quizzes?.length || 0} quizzes`
  );
  return quizzes || [];
}

// Create a new quiz
export async function createQuiz(
  projectId: string,
  quizData: CreateQuizData
): Promise<Quiz> {
  console.log(`[Quizzes] createQuiz called for project: ${projectId}`);

  const projectIdValidation = validateUUID(projectId);
  if (!projectIdValidation.isValid) {
    throw new Error("Invalid project ID format");
  }

  // Validate title
  const titleValidation = validateAndSanitizeText(quizData.title, 255, "Title");
  if (!titleValidation.isValid) {
    throw new Error(titleValidation.error || "Invalid title");
  }

  // Validate questions
  if (!Array.isArray(quizData.questions) || quizData.questions.length === 0) {
    throw new Error("Quiz must have at least one question");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  // Verify project ownership
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (projectError || !project) {
    throw new Error("Project not found or unauthorized");
  }

  const { data, error } = await supabase
    .from("quizzes")
    .insert([
      {
        project_id: projectId,
        title: titleValidation.sanitized,
        questions: quizData.questions,
        settings: quizData.settings,
        tags: quizData.tags || [],
      },
    ])
    .select("*")
    .single();

  if (error) {
    console.error("[Quizzes] createQuiz - Error creating quiz:", error);
    throw error;
  }

  console.log(
    `[Quizzes] createQuiz - Successfully created quiz with ID: ${data.id}`
  );

  // Invalidate cache
  CacheInvalidation.invalidate(`quizzes_${projectId}`);

  return data;
}

// Update an existing quiz
export async function updateQuiz(quizData: UpdateQuizData): Promise<Quiz> {
  console.log(`[Quizzes] updateQuiz called for ID: ${quizData.id}`);

  const idValidation = validateUUID(quizData.id);
  if (!idValidation.isValid) {
    throw new Error("Invalid quiz ID format");
  }

  const titleValidation = validateAndSanitizeText(quizData.title, 255, "Title");
  if (!titleValidation.isValid) {
    throw new Error(titleValidation.error || "Invalid title");
  }

  if (!Array.isArray(quizData.questions) || quizData.questions.length === 0) {
    throw new Error("Quiz must have at least one question");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  // Verify ownership via project relationship
  const { data: existing, error: existingError } = await supabase
    .from("quizzes")
    .select("*, projects!inner(user_id)")
    .eq("id", quizData.id)
    .eq("projects.user_id", user.id)
    .single();

  if (existingError || !existing) {
    throw new Error("Quiz not found or unauthorized");
  }

  const { data, error } = await supabase
    .from("quizzes")
    .update({
      title: titleValidation.sanitized,
      questions: quizData.questions,
      settings: quizData.settings,
      tags: quizData.tags || [],
    })
    .eq("id", quizData.id)
    .select("*")
    .single();

  if (error) {
    console.error("[Quizzes] updateQuiz - Error updating quiz:", error);
    throw error;
  }

  console.log(`[Quizzes] updateQuiz - Successfully updated quiz: ${data.id}`);

  // Invalidate cache
  CacheInvalidation.invalidate(`quizzes_${existing.project_id}`);

  return data;
}

// Delete a quiz
export async function deleteQuiz(quizId: string): Promise<void> {
  console.log(`[Quizzes] deleteQuiz called for ID: ${quizId}`);

  const idValidation = validateUUID(quizId);
  if (!idValidation.isValid) {
    throw new Error("Invalid quiz ID format");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  // Get quiz to verify ownership and get project_id for cache invalidation
  const { data: quiz, error: fetchError } = await supabase
    .from("quizzes")
    .select("id, project_id, projects!inner(user_id)")
    .eq("id", quizId)
    .eq("projects.user_id", user.id)
    .single();

  if (fetchError || !quiz) {
    throw new Error("Quiz not found or unauthorized");
  }

  const { error } = await supabase.from("quizzes").delete().eq("id", quizId);

  if (error) {
    console.error("[Quizzes] deleteQuiz - Error deleting quiz:", error);
    throw error;
  }

  console.log(`[Quizzes] deleteQuiz - Successfully deleted quiz: ${quizId}`);

  // Invalidate cache
  CacheInvalidation.invalidate(`quizzes_${quiz.project_id}`);
}

// Get quiz by ID
export async function getQuizById(quizId: string): Promise<Quiz | null> {
  console.log(`[Quizzes] getQuizById called for ID: ${quizId}`);

  const idValidation = validateUUID(quizId);
  if (!idValidation.isValid) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("quizzes")
    .select("*, projects!inner(user_id)")
    .eq("id", quizId)
    .eq("projects.user_id", user.id)
    .single();

  if (error || !data) {
    console.error("[Quizzes] getQuizById - Error or not found:", error);
    return null;
  }

  return data;
}

// Submit a quiz attempt
export async function submitQuizAttempt(
  quizId: string,
  answers: Record<string, any>,
  timeSpentSeconds?: number
): Promise<QuizAttempt> {
  console.log(`[Quizzes] submitQuizAttempt called for quiz: ${quizId}`);

  const idValidation = validateUUID(quizId);
  if (!idValidation.isValid) {
    throw new Error("Invalid quiz ID format");
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Not authenticated");
  }

  // Get the quiz and verify access
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("*, projects!inner(user_id)")
    .eq("id", quizId)
    .eq("projects.user_id", user.id)
    .single();

  if (quizError || !quiz) {
    throw new Error("Quiz not found or unauthorized");
  }

  // Calculate score
  const questions = quiz.questions as QuizQuestion[];
  let score = 0;
  let totalPoints = 0;

  questions.forEach((question: QuizQuestion) => {
    const userAnswer = answers[question.id];
    const correctAnswer = question.correctAnswer;
    totalPoints += question.points;

    // Check if answer is correct based on question type
    let isCorrect = false;

    if (question.type === "multiple-choice" || question.type === "true-false") {
      isCorrect = userAnswer === correctAnswer;
    } else if (
      question.type === "short-answer" ||
      question.type === "fill-blank"
    ) {
      // For short answer, do a case-insensitive comparison
      const userAnswerStr = String(userAnswer || "")
        .toLowerCase()
        .trim();
      const correctAnswerStr = String(correctAnswer || "")
        .toLowerCase()
        .trim();
      isCorrect = userAnswerStr === correctAnswerStr;
    }

    if (isCorrect) {
      score += question.points;
    }
  });

  // Create quiz attempt record
  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .insert([
      {
        quiz_id: quizId,
        user_id: user.id,
        answers,
        score,
        total_questions: questions.length,
        time_spent_seconds: timeSpentSeconds,
      },
    ])
    .select("*")
    .single();

  if (attemptError) {
    console.error(
      "[Quizzes] submitQuizAttempt - Error creating attempt:",
      attemptError
    );
    throw attemptError;
  }

  console.log(
    `[Quizzes] submitQuizAttempt - Successfully created attempt with score: ${score}/${totalPoints}`
  );

  return attempt;
}

// Get quiz attempts for a user
export async function getQuizAttemptsByUserId(
  quizId: string
): Promise<QuizAttempt[]> {
  console.log(`[Quizzes] getQuizAttemptsByUserId called for quiz: ${quizId}`);

  const idValidation = validateUUID(quizId);
  if (!idValidation.isValid) {
    return [];
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return [];
  }

  const { data: attempts, error } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("quiz_id", quizId)
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false });

  if (error) {
    console.error(
      "[Quizzes] getQuizAttemptsByUserId - Error fetching attempts:",
      error
    );
    return [];
  }

  return attempts || [];
}
