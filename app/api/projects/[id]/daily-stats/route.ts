import { NextResponse, NextRequest } from "next/server";
import { getProjectDailyStudyStats } from "@/lib/supabase/dailyStudyStats";

// GET /api/projects/[id]/daily-stats
export const GET = async (request: NextRequest, context: any) => {
  const projectId = context?.params?.id as string | undefined;
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
};
