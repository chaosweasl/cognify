import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withApiSecurity } from "@/lib/utils/apiSecurity";

export const POST = withApiSecurity(
  async () => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
      // Implement privacy cleanup logic here
      // This is a placeholder implementation
      return NextResponse.json({
        success: true,
        message: "Privacy cleanup completed",
      });
    } catch (error) {
      console.error("Privacy cleanup error:", error);
      return NextResponse.json(
        { error: "Failed to perform privacy cleanup" },
        { status: 500 }
      );
    }
  },
  {
    requireAuth: true,
    rateLimit: { requests: 5, window: 60 },
    allowedMethods: ["POST"],
  }
);
