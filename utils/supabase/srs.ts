import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export async function getSRSStates(userId: string, projectId: string) {
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
  interval: number;
  ease: number;
  due: string;
  last_reviewed: string;
  repetitions: number;
}) {
  return supabase
    .from("srs_states")
    .upsert([state], { onConflict: "user_id,project_id,card_id" });
}

export async function getDueSRSProjects(userId: string) {
  return supabase
    .from("srs_states")
    .select("project_id")
    .eq("user_id", userId)
    .lte("due", new Date().toISOString());
}
