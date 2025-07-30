import "dotenv/config";
import { pushAppNotificationOnce } from "@/utils/supabase/appNotifications";

async function main() {
  try {
    const result = await pushAppNotificationOnce({
      title: "Test Notification",
      message: "This is a test notification pushed from the script.",
      url: "/dashboard",
    });
    if (result) {
      console.log("Notification pushed:", result);
    } else {
      console.log(
        "Notification with this title already exists. No new notification pushed."
      );
    }
  } catch (err) {
    console.error("Error pushing notification:", err);
  }
}

main();
