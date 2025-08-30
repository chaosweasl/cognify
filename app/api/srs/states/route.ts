import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/srs/states?userId=...&projectId=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const projectId = searchParams.get("projectId");

  if (!userId || !projectId) {
    return NextResponse.json(
      { error: "Missing userId or projectId" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("srs_states")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
