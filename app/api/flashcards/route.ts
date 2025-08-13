import { NextRequest, NextResponse } from "next/server";
import { 
  getFlashcardsByProjectId,
  createFlashcards,
  replaceAllFlashcardsForProject 
} from "@/app/(main)/projects/actions/flashcard-actions";
import { CreateFlashcardData } from "@/src/types";

// GET /api/flashcards?project_id=<id>
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("project_id");

  if (!projectId) {
    return NextResponse.json(
      { error: "project_id parameter is required" },
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
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, flashcards, replace = false } = body;

    if (!project_id) {
      return NextResponse.json(
        { error: "project_id is required" },
        { status: 400 }
      );
    }

    if (!Array.isArray(flashcards)) {
      return NextResponse.json(
        { error: "flashcards must be an array" },
        { status: 400 }
      );
    }

    // Validate flashcard data
    const validFlashcards: CreateFlashcardData[] = flashcards.filter(card => 
      card && 
      typeof card.front === 'string' && 
      typeof card.back === 'string' &&
      (card.front.trim() || card.back.trim()) // At least one field must have content
    );

    let result;
    if (replace) {
      result = await replaceAllFlashcardsForProject(project_id, validFlashcards);
    } else {
      result = await createFlashcards(project_id, validFlashcards);
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