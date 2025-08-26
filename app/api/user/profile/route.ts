import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/user/profile
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "User not authenticated" },
      { status: 401 }
    );
  }
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*, onboarding_completed")
    .eq("id", user.id)
    .single();
  if (error && error.code !== "PGRST116") {
    return NextResponse.json(
      { error: "Error fetching profile" },
      { status: 500 }
    );
  }
  if (!profile) {
    // Create a new profile if not found
    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert([
        {
          id: user.id,
          username: null,
          display_name: null,
          avatar_url: user.user_metadata?.avatar_url || null,
          bio: "",
          email: user.email || null,
        },
      ])
      .select()
      .single();
    if (createError) {
      return NextResponse.json(
        { error: "Error creating profile" },
        { status: 500 }
      );
    }
    return NextResponse.json({ ...newProfile, email: user.email || null });
  }
  return NextResponse.json({ ...profile, email: user.email || null });
}

// PATCH /api/user/profile
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "User not authenticated" },
      { status: 401 }
    );
  }
  const updates = await request.json();
  const { error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) {
    return NextResponse.json(
      { error: "Error updating profile" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}
