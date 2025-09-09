import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CacheInvalidation } from "@/hooks/useCache";
import { withApiSecurity } from "@/lib/utils/apiSecurity";

// Helper: safely pull id out of the framework's context without using `any`
function getProjectIdFromContext(ctx: unknown): string | undefined {
  if (typeof ctx !== "object" || ctx === null) return undefined;
  const maybe = ctx as { params?: Record<string, unknown> };
  const id = maybe.params?.id;
  return typeof id === "string" ? id : undefined;
}

async function handleUpdateProject(request: NextRequest, context: unknown) {
  const id = getProjectIdFromContext(context);
  if (!id) {
    return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
  }

  const supabase = await createClient();
  const updates = await request.json();

  // Validate user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Update project
  const { error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }

  // Invalidate cache
  CacheInvalidation.invalidate("user_projects");
  CacheInvalidation.invalidatePattern("project_stats_");

  return NextResponse.json({ message: "Project updated" });
}

async function handleDeleteProject(request: NextRequest, context: unknown) {
  const id = getProjectIdFromContext(context);
  if (!id) {
    return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
  }

  const supabase = await createClient();

  // Validate user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Delete project (will cascade to flashcards and SRS states)
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }

  // Invalidate cache
  CacheInvalidation.invalidate("user_projects");
  CacheInvalidation.invalidatePattern("project_stats_");

  return NextResponse.json({ message: "Project deleted successfully" });
}

// Apply security middleware
export const PATCH = withApiSecurity(handleUpdateProject, {
  requireAuth: true,
  rateLimit: { requests: 30, window: 60 },
  allowedMethods: ["PATCH"],
  validateInput: "project",
});

export const DELETE = withApiSecurity(handleDeleteProject, {
  requireAuth: true,
  rateLimit: { requests: 10, window: 60 },
  allowedMethods: ["DELETE"],
});
