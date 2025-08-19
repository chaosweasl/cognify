import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export async function getSRSStates(userId: string, projectId: string) {
  console.log(
    `[Supabase] getSRSStates for userId: ${userId}, projectId: ${projectId}`
  );
  return supabase
    .from("srs_states")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId);
}

export async function upsertSRSState(state: {
  user_id: string;
  project_id: string;
  card_id: string;
  card_interval: number; // Updated column name
  ease: number;
  due: string;
  last_reviewed: string;
  repetitions: number;
}) {
  console.log(
    `[Supabase] upsertSRSState for userId: ${state.user_id}, projectId: ${state.project_id}, cardId: ${state.card_id}`
  );
  return supabase
    .from("srs_states")
    .upsert([state], { onConflict: "user_id,project_id,card_id" });
}

export async function getDueSRSProjects(userId: string) {
  console.log(`[Supabase] getDueSRSProjects for userId: ${userId}`);
  return supabase
    .from("srs_states")
    .select("project_id")
    .eq("user_id", userId)
    .lte("due", new Date().toISOString());
}
