import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/user/avatar
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "User not authenticated" },
      { status: 401 }
    );
  }
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }
  const fileExt = (file.name || "avatar.png").split(".").pop();
  const fileName = `${user.id}/avatar.${fileExt}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, { upsert: true });
  if (uploadError) {
    return NextResponse.json(
      { error: "Error uploading avatar" },
      { status: 500 }
    );
  }
  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);
  const publicUrl = urlData.publicUrl;
  // Update the profile with the new avatar URL
  await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  return NextResponse.json({ publicUrl });
}
