import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/srs/upsert
export async function POST(request: Request) {
  const body = await request.json();
  const state = body.state;
  if (!state || !state.user_id || !state.project_id || !state.card_id) {
    return NextResponse.json(
      { error: "Missing required state fields" },
      { status: 400 }
    );
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("srs_states")
    .upsert([state], { onConflict: "user_id,project_id,card_id" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
