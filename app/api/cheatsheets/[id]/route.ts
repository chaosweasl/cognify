import { NextRequest, NextResponse } from "next/server";
import {
  getCheatsheetById,
  updateCheatsheet,
  deleteCheatsheet,
} from "@/app/(main)/projects/actions/cheatsheet-actions";
import { withApiSecurity } from "@/lib/utils/apiSecurity";
import { validateUUID } from "@/lib/utils/security";

// GET /api/cheatsheets/[id]
async function handleGetCheatsheet(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validate UUID format
  const uuidValidation = validateUUID(id);
  if (!uuidValidation.isValid) {
    return NextResponse.json(
      { error: "Invalid cheatsheet ID format" },
      { status: 400 }
    );
  }

  try {
    const cheatsheet = await getCheatsheetById(id);

    if (!cheatsheet) {
      return NextResponse.json(
        { error: "Cheatsheet not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(cheatsheet);
  } catch (error) {
    console.error("Error fetching cheatsheet:", error);
    return NextResponse.json(
      { error: "Failed to fetch cheatsheet" },
      { status: 500 }
    );
  }
}

// PUT /api/cheatsheets/[id]
async function handleUpdateCheatsheet(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validate UUID format
  const uuidValidation = validateUUID(id);
  if (!uuidValidation.isValid) {
    return NextResponse.json(
      { error: "Invalid cheatsheet ID format" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { title, content, tags } = body;

    // At least one field is required for update
    if (!title && !content && !tags) {
      return NextResponse.json(
        { error: "At least one field (title, content, tags) must be provided" },
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

    // Validate content if provided
    if (content !== undefined && typeof content !== "object") {
      return NextResponse.json(
        { error: "content must be an object" },
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

    // Build update data dynamically to avoid type complexity
    const updateDataObj: Record<string, unknown> = { id };
    if (title !== undefined) updateDataObj.title = title.trim();
    if (content !== undefined) updateDataObj.content = content;
    if (tags !== undefined) updateDataObj.tags = tags;

    // Ensure we have the required fields for the update
    if (!updateDataObj.title) {
      return NextResponse.json(
        { error: "Title is required for cheatsheet update" },
        { status: 400 }
      );
    }

    const cheatsheet = await updateCheatsheet(
      updateDataObj as unknown as Parameters<typeof updateCheatsheet>[0]
    );

    if (!cheatsheet) {
      return NextResponse.json(
        { error: "Cheatsheet not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(cheatsheet);
  } catch (error) {
    console.error("Error updating cheatsheet:", error);
    return NextResponse.json(
      { error: "Failed to update cheatsheet" },
      { status: 500 }
    );
  }
}

// DELETE /api/cheatsheets/[id]
async function handleDeleteCheatsheet(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Validate UUID format
  const uuidValidation = validateUUID(id);
  if (!uuidValidation.isValid) {
    return NextResponse.json(
      { error: "Invalid cheatsheet ID format" },
      { status: 400 }
    );
  }

  try {
    await deleteCheatsheet(id);
    return NextResponse.json({ message: "Cheatsheet deleted successfully" });
  } catch (error) {
    console.error("Error deleting cheatsheet:", error);

    // Check if it's a not found error (you might want to customize this based on your error handling)
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json(
        { error: "Cheatsheet not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete cheatsheet" },
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
    return handleGetCheatsheet(request, context);
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
    return handleUpdateCheatsheet(request, context);
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
    return handleDeleteCheatsheet(request, context);
  },
  {
    requireAuth: true,
    rateLimit: { requests: 20, window: 60 },
    allowedMethods: ["DELETE"],
  }
);
