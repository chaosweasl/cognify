import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return NextResponse.json([]);

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, description, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error || !data) return NextResponse.json([]);
  return NextResponse.json(
    data.map((project) => ({
      ...project,
      flashcards: [], // Flashcards are now loaded separately
    }))
  );
}
