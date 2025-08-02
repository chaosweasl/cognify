import "dotenv/config";
import { createSuperClient } from "@/utils/supabase/superClient";

const supabase = createSuperClient();

// Set your test user ID here
const userId = process.env.TEST_USER_ID;

if (!userId) {
  throw new Error("Please set TEST_USER_ID in your .env file.");
}
if (!supabase) {
  throw new Error(
    "SuperClient could not be created. Check your env variables."
  );
}

async function main() {
  if (!supabase) {
    throw new Error(
      "SuperClient could not be created. Check your env variables."
    );
  }
  for (let i = 1; i <= 10; i++) {
    await supabase.from("user_notifications").insert({
      user_id: userId,
      type: "test",
      title: `Bulk User Notification ${i}`,
      message: `This is bulk user notification #${i}.`,
      url: "/dashboard",
      trigger_at: new Date().toISOString(),
      read: false,
    });
  }
  console.log("Pushed 10 user notifications for user:", userId);
}

main();

// To run this script:
// pnpm exec tsx scripts/pushManyUserNotifications.ts
