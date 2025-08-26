import { NextResponse, NextRequest } from "next/server";
import { getProjectDailyStudyStats } from "@/lib/supabase/dailyStudyStats";

// Helper: safely pull id out of the framework's context without using `any`
function getProjectIdFromContext(ctx: unknown): string | undefined {
  if (typeof ctx !== "object" || ctx === null) return undefined;
  const maybe = ctx as { params?: Record<string, unknown> };
  const id = maybe.params?.id;
  return typeof id === "string" ? id : undefined;
}

// Export as const to avoid Next's fragile typegen behavior
export const GET = async (request: NextRequest, context: unknown) => {
  const projectId = getProjectIdFromContext(context);
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
