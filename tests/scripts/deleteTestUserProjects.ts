import "dotenv/config";
import { createSuperClient } from "@/utils/supabase/superClient";

const supabase = createSuperClient();
const userId = process.env.TEST_USER_ID;
if (!userId) throw new Error("Please set TEST_USER_ID in your .env file.");

async function main() {
  // Find all projects for the test user
  if (!supabase)
    throw new Error(
      "SuperClient could not be created. Check your env variables."
    );

  const { data: projects, error: fetchError } = await supabase
    .from("projects")
    .select("id, name")
    .eq("user_id", userId);

  if (fetchError) {
    console.error("Error fetching projects:", fetchError);
    return;
  }
  if (!projects || projects.length === 0) {
    console.log("No projects found for test user.");
    return;
  }
  console.log(`Found ${projects.length} projects for test user.`);

  // Delete all projects for the test user
  const projectIds = projects.map((p: { id: string }) => p.id);
  const { error: deleteError } = await supabase
    .from("projects")
    .delete()
    .in("id", projectIds);

  if (deleteError) {
    console.error("Error deleting projects:", deleteError);
    return;
  }
  console.log(`Deleted ${projectIds.length} projects for test user.`);
}

main();

// To run this script:
// pnpm exec tsx scripts/deleteTestUserProjects.ts
