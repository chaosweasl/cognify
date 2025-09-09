import { NextRequest, NextResponse } from "next/server";
import {
  submitQuizAttempt,
  getQuizAttemptsByUserId,
} from "@/app/(main)/projects/actions/quiz-actions";
import { withApiSecurity } from "@/lib/utils/apiSecurity";
import { validateUUID } from "@/lib/utils/security";

// POST /api/quiz-attempts - Submit a quiz attempt
async function handleSubmitQuizAttempt(request: NextRequest) {
  try {
    const body = await request.json();
    const { quiz_id, answers, time_spent_seconds } = body;

    // Validate quiz_id
    if (!quiz_id) {
      return NextResponse.json(
        { error: "quiz_id is required" },
        { status: 400 }
      );
    }

    const quizIdValidation = validateUUID(quiz_id);
    if (!quizIdValidation.isValid) {
      return NextResponse.json(
        { error: "Invalid quiz_id format" },
        { status: 400 }
      );
    }

    // Validate answers
    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "answers is required and must be an object" },
        { status: 400 }
      );
    }

    // Validate time_spent_seconds if provided
    if (
      time_spent_seconds !== undefined &&
      (typeof time_spent_seconds !== "number" || time_spent_seconds < 0)
    ) {
      return NextResponse.json(
        { error: "time_spent_seconds must be a non-negative number" },
        { status: 400 }
      );
    }

    const attempt = await submitQuizAttempt(
      quiz_id,
      answers,
      time_spent_seconds
    );

    return NextResponse.json(attempt, { status: 201 });
  } catch (error) {
    console.error("Error submitting quiz attempt:", error);

    // Check for specific error types
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to submit quiz attempt" },
      { status: 500 }
    );
  }
}

// GET /api/quiz-attempts?quiz_id=<id> - Get attempts for a specific quiz
async function handleGetQuizAttempts(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const quizId = searchParams.get("quiz_id");

  if (!quizId) {
    return NextResponse.json(
      { error: "quiz_id parameter is required" },
      { status: 400 }
    );
  }

  // Validate UUID format
  const quizIdValidation = validateUUID(quizId);
  if (!quizIdValidation.isValid) {
    return NextResponse.json(
      { error: "Invalid quiz_id format" },
      { status: 400 }
    );
  }

  try {
    const attempts = await getQuizAttemptsByUserId(quizId);
    return NextResponse.json(attempts);
  } catch (error) {
    console.error("Error fetching quiz attempts:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz attempts" },
      { status: 500 }
    );
  }
}

// Route handlers with security
export const POST = withApiSecurity(
  async (request: NextRequest) => {
    return handleSubmitQuizAttempt(request);
  },
  {
    requireAuth: true,
    rateLimit: { requests: 30, window: 60 }, // Limit quiz submissions to prevent spam
    allowedMethods: ["POST"],
  }
);

export const GET = withApiSecurity(
  async (request: NextRequest) => {
    return handleGetQuizAttempts(request);
  },
  {
    requireAuth: true,
    rateLimit: { requests: 100, window: 60 },
    allowedMethods: ["GET"],
  }
);
