import { NextResponse } from "next/server";
import { getProjectDailyStudyStats } from "@/lib/supabase/dailyStudyStats";

// GET /api/projects/[id]/daily-stats
export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const { id: projectId } = context.params;
  const userId = request.headers.get("x-user-id");

  if (!projectId || !userId) {
    return NextResponse.json(
      { error: "Project ID and User ID are required" },
      { status: 400 }
    );
  }

  try {
    const stats = await getProjectDailyStudyStats(userId, projectId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching project daily stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
