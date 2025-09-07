import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's projects
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select(
        `
        *,
        flashcards (*)
      `
      )
      .eq("user_id", user.id);

    if (projectsError) {
      throw projectsError;
    }

    // Fetch user settings
    const { data: userSettings, error: settingsError } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (settingsError && settingsError.code !== "PGRST116") {
      // PGRST116 = no rows returned, which is OK for settings
      throw settingsError;
    }

    // Fetch user notifications
    const { data: userNotifications, error: notificationsError } =
      await supabase
        .from("user_notifications")
        .select("*")
        .eq("user_id", user.id);

    if (notificationsError) {
      throw notificationsError;
    }

    const exportData = {
      export_date: new Date().toISOString(),
      user_id: user.id,
      email: user.email,
      projects: projects || [],
      user_settings: userSettings || null,
      user_notifications: userNotifications || [],
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
