import { NextResponse, NextRequest } from "next/server";
import { getProjectStudyStats } from "@/lib/srs/SRSDBUtils";
import { createClient } from "@/lib/supabase/server";
import { withApiSecurity } from "@/lib/utils/apiSecurity";

// safely resolve id whether context.params is an object or a Promise
async function resolveProjectId(ctx: unknown): Promise<string | undefined> {
  if (typeof ctx !== "object" || ctx === null) return undefined;
  const maybe = ctx as { params?: unknown };
  const params = maybe.params;

  // params might be a Promise (some codegen/edge cases). handle both.
  if (params && typeof (params as { then?: unknown })?.then === "function") {
    const resolvedParams = (await params) as unknown;
    if (
      typeof resolvedParams === "object" &&
      resolvedParams !== null &&
      "id" in resolvedParams
    ) {
      const id = (resolvedParams as { id?: unknown }).id;
      return typeof id === "string" ? id : undefined;
    }
    return undefined;
  }

  if (
    typeof params === "object" &&
    params !== null &&
    "id" in (params as object)
  ) {
    const id = (params as { id?: unknown }).id;
    return typeof id === "string" ? id : undefined;
  }

  return undefined;
}

async function handleGetProjectStats(request: NextRequest, context: unknown) {
  const projectId = await resolveProjectId(context);

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

// Apply security middleware
export const GET = withApiSecurity(handleGetProjectStats, {
  requireAuth: true,
  rateLimit: { requests: 100, window: 60 },
  allowedMethods: ["GET"],
});
