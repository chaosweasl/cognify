import { NextRequest, NextResponse } from "next/server";
import {
  getFlashcardsByProjectId,
  createFlashcards,
  replaceAllFlashcardsForProject,
} from "@/app/(main)/projects/actions/flashcard-actions";
import { CreateFlashcardData } from "@/src/types";
import { withApiSecurity } from "@/lib/utils/apiSecurity";
import { validateAndSanitizeText, validateUUID } from "@/lib/utils/security";

// GET /api/flashcards?project_id=<id>
async function handleGetFlashcards(request: NextRequest) {
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
    const flashcards = await getFlashcardsByProjectId(projectId);
    return NextResponse.json(flashcards);
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    return NextResponse.json(
      { error: "Failed to fetch flashcards" },
      { status: 500 }
    );
  }
}

// POST /api/flashcards
async function handleCreateFlashcards(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, flashcards, replace = false } = body;

    // Validate project_id
    const uuidValidation = validateUUID(project_id);
    if (!uuidValidation.isValid) {
      return NextResponse.json(
        { error: "Invalid project_id format" },
        { status: 400 }
      );
    }

    if (!Array.isArray(flashcards)) {
      return NextResponse.json(
        { error: "flashcards must be an array" },
        { status: 400 }
      );
    }

    // Validate and sanitize flashcard data
    const validFlashcards: CreateFlashcardData[] = [];

    for (const card of flashcards) {
      if (
        !card ||
        typeof card.front !== "string" ||
        typeof card.back !== "string"
      ) {
        continue; // Skip invalid cards
      }

      // Sanitize front and back content
      const frontValidation = validateAndSanitizeText(
        card.front,
        2000,
        "Flashcard front"
      );
      const backValidation = validateAndSanitizeText(
        card.back,
        2000,
        "Flashcard back"
      );

      if (frontValidation.isValid && backValidation.isValid) {
        validFlashcards.push({
          front: frontValidation.sanitized,
          back: backValidation.sanitized,
          extra: card.extra || {},
        });
      }
    }

    if (validFlashcards.length === 0) {
      return NextResponse.json(
        { error: "No valid flashcards provided" },
        { status: 400 }
      );
    }

    // Limit number of flashcards for performance
    const limitedFlashcards = validFlashcards.slice(0, 500); // Max 500 cards per request

    let result;
    if (replace) {
      result = await replaceAllFlashcardsForProject(
        project_id,
        limitedFlashcards
      );
    } else {
      result = await createFlashcards(project_id, limitedFlashcards);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating flashcards:", error);
    return NextResponse.json(
      { error: "Failed to create flashcards" },
      { status: 500 }
    );
  }
}

// Apply security middleware
export const GET = withApiSecurity(
  async (request: NextRequest) => {
    return handleGetFlashcards(request);
  },
  {
    requireAuth: true,
    rateLimit: { requests: 60, window: 60 },
    allowedMethods: ["GET"],
  }
);

export const POST = withApiSecurity(
  async (request: NextRequest) => {
    return handleCreateFlashcards(request);
  },
  {
    requireAuth: true,
    rateLimit: { requests: 30, window: 60 },
    allowedMethods: ["POST"],
  }
);
