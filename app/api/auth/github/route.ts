import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getConfig } from "@/lib/utils/env-config";

export async function POST() {
  try {
    console.log("API github: signInWithGithub called");
    const supabase = await createClient();

    // Use environment variables for URLs
    const config = getConfig();
    const siteUrl = config.NEXT_PUBLIC_SITE_URL;

    console.log("[signInWithGithub] NODE_ENV:", config.NODE_ENV);
    console.log("[signInWithGithub] siteUrl:", siteUrl);
    console.log(
      "[signInWithGithub] redirectTo:",
      `${siteUrl}/auth/callback?next=/dashboard`
    );

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=/dashboard`,
      },
    });
    
    console.log("[signInWithOAuth] data:", data);
    console.log("[signInWithOAuth] error:", error);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (data?.url) {
      console.log("[signInWithGithub] Returning URL:", data.url);
      return NextResponse.json({ url: data.url });
    }

    return NextResponse.json(
      { error: "No redirect URL received" },
      { status: 500 }
    );

  } catch (error) {
    console.error("API github error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}