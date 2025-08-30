import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/user/settings
export async function GET() {
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
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (error && error.code !== "PGRST116") {
    return NextResponse.json(
      { error: "Error fetching settings" },
      { status: 500 }
    );
  }
  if (!data) {
    // Create default settings if not found
    const newSettings = {
      user_id: user.id,
      theme: "system",
      notifications_enabled: true,
      daily_reminder: true,
      reminder_time: "09:00:00",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await supabase.from("user_settings").insert(newSettings);
    return NextResponse.json(newSettings);
  }
  return NextResponse.json(data);
}

// PATCH /api/user/settings
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
    .from("user_settings")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);
  if (error) {
    return NextResponse.json(
      { error: "Error updating settings" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true });
}
