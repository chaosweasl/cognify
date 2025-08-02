import "dotenv/config";
import { pushAppNotificationOnce } from "@/utils/supabase/appNotifications";
import { createSuperClient } from "@/utils/supabase/superClient";

const supabase = createSuperClient();

async function main() {
  if (!supabase) {
    throw new Error(
      "SuperClient could not be created. Check your env variables."
    );
  }
  for (let i = 1; i <= 10; i++) {
    await pushAppNotificationOnce({
      title: `Bulk App Notification ${i}`,
      message: `This is bulk app notification #${i}.`,
      url: "/dashboard",
      published: true,
    });
  }
  console.log("Pushed 10 app notifications.");
}

main();

// To run this script:
// pnpm exec tsx scripts/pushManyAppNotifications.ts
