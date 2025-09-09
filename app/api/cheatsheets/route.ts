import { NextRequest, NextResponse } from "next/server";
import {
  getCheatsheetsByProjectId,
  createCheatsheet,
} from "@/app/(main)/projects/actions/cheatsheet-actions";
import { withApiSecurity } from "@/lib/utils/apiSecurity";
import { validateUUID } from "@/lib/utils/security";

// GET /api/cheatsheets?project_id=<id>
async function handleGetCheatsheets(request: NextRequest) {
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
    const cheatsheets = await getCheatsheetsByProjectId(projectId);
    return NextResponse.json(cheatsheets);
  } catch (error) {
    console.error("Error fetching cheatsheets:", error);
    return NextResponse.json(
      { error: "Failed to fetch cheatsheets" },
      { status: 500 }
    );
  }
}

// POST /api/cheatsheets
async function handleCreateCheatsheet(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, title, content, tags = [] } = body;

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

    if (!content || typeof content !== "object") {
      return NextResponse.json(
        { error: "content is required and must be an object" },
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

    const cheatsheetData = {
      title: title.trim(),
      content,
      tags: tags || [],
    };

    const cheatsheet = await createCheatsheet(project_id, cheatsheetData);

    return NextResponse.json(cheatsheet, { status: 201 });
  } catch (error) {
    console.error("Error creating cheatsheet:", error);
    return NextResponse.json(
      { error: "Failed to create cheatsheet" },
      { status: 500 }
    );
  }
}

// Route handlers with security
export const GET = withApiSecurity(
  async (request: NextRequest) => {
    return handleGetCheatsheets(request);
  },
  {
    requireAuth: true,
    rateLimit: { requests: 100, window: 60 },
    allowedMethods: ["GET"],
  }
);

export const POST = withApiSecurity(
  async (request: NextRequest) => {
    return handleCreateCheatsheet(request);
  },
  {
    requireAuth: true,
    rateLimit: { requests: 30, window: 60 },
    allowedMethods: ["POST"],
  }
);
