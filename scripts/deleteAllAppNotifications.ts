import "dotenv/config";
import { createSuperClient } from "@/utils/supabase/superClient";

const supabase = createSuperClient();

async function main() {
  if (!supabase) {
    throw new Error(
      "SuperClient could not be created. Check your env variables."
    );
  }
  const { error } = await supabase
    .from("app_notifications")
    .delete()
    .neq("id", "");
  if (error) {
    console.error("Error deleting app notifications:", error);
  } else {
    console.log("All app notifications deleted.");
  }
}

main();

// To run this script:
// pnpm exec tsx scripts/deleteAllAppNotifications.ts
