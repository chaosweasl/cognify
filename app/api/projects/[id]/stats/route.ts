import { NextRequest, NextResponse } from "next/server";
import { getProjectStudyStats } from "@/lib/srs/SRSDBUtils";
import { createClient } from "@/lib/supabase/server";

// GET /api/projects/[id]/stats
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;

  if (!projectId) {
    return NextResponse.json(
      { error: "Project ID is required" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get project stats
    const stats = await getProjectStudyStats(supabase, user.id, projectId);

    if (stats === null) {
      return NextResponse.json(
        { error: "Failed to fetch project stats" },
        { status: 500 }
      );
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching project stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
