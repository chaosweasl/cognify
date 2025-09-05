import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Create study reminder notification
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { project_id, reminder_type, message, scheduled_for } =
      await req.json();

    // Validate required fields
    if (!project_id || !reminder_type || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create notification
    const { data: notification, error: notificationError } = await supabase
      .from("user_notifications")
      .insert({
        user_id: user.id,
        project_id,
        type: reminder_type,
        title: "Study Reminder",
        message,
        scheduled_for: scheduled_for || new Date().toISOString(),
      })
      .select("*")
      .single();

    if (notificationError) {
      throw notificationError;
    }

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("Create reminder error:", error);
    return NextResponse.json(
      { error: "Failed to create reminder" },
      { status: 500 }
    );
  }
}

// Get due study reminders
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date().toISOString();

    // Get notifications that are due
    const { data: notifications, error: notificationError } = await supabase
      .from("user_notifications")
      .select(
        `
        *,
        projects!user_notifications_project_id_fkey (
          id,
          name
        )
      `
      )
      .eq("user_id", user.id)
      .eq("is_read", false)
      .lte("scheduled_for", now)
      .order("scheduled_for", { ascending: false });

    if (notificationError) {
      throw notificationError;
    }

    return NextResponse.json({ notifications: notifications || [] });
  } catch (error) {
    console.error("Get reminders error:", error);
    return NextResponse.json(
      { error: "Failed to get reminders" },
      { status: 500 }
    );
  }
}
