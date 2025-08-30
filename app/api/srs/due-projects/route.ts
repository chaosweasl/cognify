import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/srs/due-projects?userId=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("srs_states")
    .select("project_id")
    .eq("user_id", userId)
    .lte("due", new Date().toISOString());
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
