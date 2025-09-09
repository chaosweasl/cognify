import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withApiSecurity } from "@/lib/utils/apiSecurity";
import { validateUUID } from "@/lib/utils/security";

// GET /api/srs/states?projectId=...
async function handleGetSRSStates(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "Missing projectId parameter" },
      { status: 400 }
    );
  }

  // Validate UUID format
  const uuidValidation = validateUUID(projectId);
  if (!uuidValidation.isValid) {
    return NextResponse.json(
      { error: "Invalid projectId format" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Get current user from auth
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // RLS will automatically filter for user's data
  const { data, error } = await supabase
    .from("srs_states")
    .select("*")
    .eq("user_id", user.id)
    .eq("project_id", projectId);

  if (error) {
    console.error("Error fetching SRS states:", error);
    return NextResponse.json(
      { error: "Failed to fetch SRS states" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export const GET = withApiSecurity(
  async (request: NextRequest) => {
    return handleGetSRSStates(request);
  },
  {
    requireAuth: true,
    rateLimit: { requests: 100, window: 60 },
    allowedMethods: ["GET"],
  }
);
