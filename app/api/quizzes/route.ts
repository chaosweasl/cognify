import { NextRequest, NextResponse } from "next/server";
import {
  getQuizzesByProjectId,
  createQuiz,
} from "@/app/(main)/projects/actions/quiz-actions";
import { withApiSecurity } from "@/lib/utils/apiSecurity";
import { validateUUID } from "@/lib/utils/security";

// GET /api/quizzes?project_id=<id>
async function handleGetQuizzes(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");

  if (!projectId) {
    return NextResponse.json(
      { error: "project_id parameter is required" },
      { status: 400 }
    );
  }

  // Validate UUID format
  const uuidValidation = validateUUID(projectId);
  if (!uuidValidation.isValid) {
    return NextResponse.json(
      { error: "Invalid project_id format" },
      { status: 400 }
    );
  }

  try {
    const quizzes = await getQuizzesByProjectId(projectId);
    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}

// POST /api/quizzes
async function handleCreateQuiz(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, title, questions, settings = {}, tags = [] } = body;

    // Validate project_id
    if (!project_id) {
      return NextResponse.json(
        { error: "project_id is required" },
        { status: 400 }
      );
    }

    const projectIdValidation = validateUUID(project_id);
    if (!projectIdValidation.isValid) {
      return NextResponse.json(
        { error: "Invalid project_id format" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json(
        { error: "title is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "questions is required and must be a non-empty array" },
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

    // Validate settings
    if (settings && typeof settings !== "object") {
      return NextResponse.json(
        { error: "settings must be an object" },
        { status: 400 }
      );
    }

    // Validate tags array
    if (
      tags &&
      (!Array.isArray(tags) || !tags.every((tag) => typeof tag === "string"))
    ) {
      return NextResponse.json(
        { error: "tags must be an array of strings" },
        { status: 400 }
      );
    }

    const quizData = {
      title: title.trim(),
      questions,
      settings: settings || {},
      tags: tags || [],
    };

    const quiz = await createQuiz(project_id, quizData);

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error("Error creating quiz:", error);
    return NextResponse.json(
      { error: "Failed to create quiz" },
      { status: 500 }
    );
  }
}

// Route handlers with security
export const GET = withApiSecurity(
  async (request: NextRequest) => {
    return handleGetQuizzes(request);
  },
  {
    requireAuth: true,
    rateLimit: { requests: 100, window: 60 },
    allowedMethods: ["GET"],
  }
);

export const POST = withApiSecurity(
  async (request: NextRequest) => {
    return handleCreateQuiz(request);
  },
  {
    requireAuth: true,
    rateLimit: { requests: 30, window: 60 },
    allowedMethods: ["POST"],
  }
);
