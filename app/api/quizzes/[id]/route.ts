import { NextRequest, NextResponse } from "next/server";
import {
  getQuizById,
  updateQuiz,
  deleteQuiz,
} from "@/app/(main)/projects/actions/quiz-actions";
import { withApiSecurity } from "@/lib/utils/apiSecurity";
import { validateUUID } from "@/lib/utils/security";

// GET /api/quizzes/[id]
async function handleGetQuiz(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validate UUID format
  const uuidValidation = validateUUID(id);
  if (!uuidValidation.isValid) {
    return NextResponse.json(
      { error: "Invalid quiz ID format" },
      { status: 400 }
    );
  }

  try {
    const quiz = await getQuizById(id);

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz" },
      { status: 500 }
    );
  }
}

// PUT /api/quizzes/[id]
async function handleUpdateQuiz(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validate UUID format
  const uuidValidation = validateUUID(id);
  if (!uuidValidation.isValid) {
    return NextResponse.json(
      { error: "Invalid quiz ID format" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { title, questions, settings, tags } = body;

    // At least one field is required for update
    if (!title && !questions && !settings && !tags) {
      return NextResponse.json(
        {
          error:
            "At least one field (title, questions, settings, tags) must be provided",
        },
        { status: 400 }
      );
    }

    // Validate title if provided
    if (
      title !== undefined &&
      (typeof title !== "string" || title.trim() === "")
    ) {
      return NextResponse.json(
        { error: "title must be a non-empty string" },
        { status: 400 }
      );
    }

    // Validate questions if provided
    if (questions !== undefined) {
      if (!Array.isArray(questions) || questions.length === 0) {
        return NextResponse.json(
          { error: "questions must be a non-empty array" },
          { status: 400 }
        );
      }

      // Validate each question
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        if (!question.question || typeof question.question !== "string") {
          return NextResponse.json(
            { error: `Question ${i + 1}: question text is required` },
            { status: 400 }
          );
        }
        if (
          !question.type ||
          ![
            "multiple-choice",
            "true-false",
            "short-answer",
            "fill-blank",
          ].includes(question.type)
        ) {
          return NextResponse.json(
            { error: `Question ${i + 1}: invalid question type` },
            { status: 400 }
          );
        }
        if (
          question.correctAnswer === undefined ||
          question.correctAnswer === null
        ) {
          return NextResponse.json(
            { error: `Question ${i + 1}: correctAnswer is required` },
            { status: 400 }
          );
        }
      }
    }

    // Validate settings if provided
    if (settings !== undefined && typeof settings !== "object") {
      return NextResponse.json(
        { error: "settings must be an object" },
        { status: 400 }
      );
    }

    // Validate tags if provided
    if (
      tags !== undefined &&
      (!Array.isArray(tags) || !tags.every((tag) => typeof tag === "string"))
    ) {
      return NextResponse.json(
        { error: "tags must be an array of strings" },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { id };
    if (title !== undefined) updateData.title = title.trim();
    if (questions !== undefined) updateData.questions = questions;
    if (settings !== undefined) updateData.settings = settings;
    if (tags !== undefined) updateData.tags = tags;

    const quiz = await updateQuiz(
      updateData as unknown as Parameters<typeof updateQuiz>[0]
    );

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("Error updating quiz:", error);
    return NextResponse.json(
      { error: "Failed to update quiz" },
      { status: 500 }
    );
  }
}

// DELETE /api/quizzes/[id]
async function handleDeleteQuiz(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validate UUID format
  const uuidValidation = validateUUID(id);
  if (!uuidValidation.isValid) {
    return NextResponse.json(
      { error: "Invalid quiz ID format" },
      { status: 400 }
    );
  }

  try {
    await deleteQuiz(id);
    return NextResponse.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("Error deleting quiz:", error);

    // Check if it's a not found error
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to delete quiz" },
      { status: 500 }
    );
  }
}

// Route handlers with security
export const GET = withApiSecurity(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    return handleGetQuiz(request, context);
  },
  {
    requireAuth: true,
    rateLimit: { requests: 100, window: 60 },
    allowedMethods: ["GET"],
  }
);

export const PUT = withApiSecurity(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    return handleUpdateQuiz(request, context);
  },
  {
    requireAuth: true,
    rateLimit: { requests: 30, window: 60 },
    allowedMethods: ["PUT"],
  }
);

export const DELETE = withApiSecurity(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
  ) => {
    return handleDeleteQuiz(request, context);
  },
  {
    requireAuth: true,
    rateLimit: { requests: 20, window: 60 },
    allowedMethods: ["DELETE"],
  }
);
