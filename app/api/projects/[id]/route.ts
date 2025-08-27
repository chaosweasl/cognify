import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CacheInvalidation } from "@/hooks/useCache";

// PATCH: Update a project by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { id } = params;
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

// DELETE: Delete a project by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { id } = params;

  // Validate user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Delete project
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

  return NextResponse.json({ message: "Project deleted" });
}
