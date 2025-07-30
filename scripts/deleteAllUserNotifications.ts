import "dotenv/config";
import { createSuperClient } from "@/utils/supabase/superClient";

const supabase = createSuperClient();

// Set your test user ID here
const userId = process.env.TEST_USER_ID;

if (!userId) {
  throw new Error("Please set TEST_USER_ID in your .env file.");
}

async function main() {
  if (!supabase) {
    throw new Error(
      "SuperClient could not be created. Check your env variables."
    );
  }
  const { error } = await supabase
    .from("user_notifications")
    .delete()
    .eq("user_id", userId);
  if (error) {
    console.error("Error deleting user notifications:", error);
  } else {
    console.log("All user notifications deleted for user:", userId);
  }
}

main();
