import { create } from "zustand";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface UserProfileState {
  userProfile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchUserProfile: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  setUserProfile: (profile: UserProfile | null) => void;
}

export const useUserProfileStore = create<UserProfileState>((set, get) => ({
  userProfile: null,
  isLoading: false,
  error: null,
  fetchUserProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: userResponse } = await supabase.auth.getUser();
      const user = userResponse?.user;
      if (!user) {
        set({ error: "User not authenticated", isLoading: false });
        return;
      }
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) {
        // If profile doesn't exist, create one
        if (error.code === "PGRST116") {
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert([
              {
                id: user.id,
                display_name:
                  user.user_metadata?.name || user.email?.split("@")[0] || "",
                avatar_url: user.user_metadata?.avatar_url || null,
                bio: "",
                email: user.email || null,
              },
            ])
            .select()
            .single();
          if (createError) {
            set({ error: "Error creating profile" });
            return;
          }
          if (newProfile) {
            set({ userProfile: { ...newProfile, email: user.email || null } });
          }
        } else {
          set({ error: "Error fetching profile" });
          return;
        }
      }
      if (profile) {
        set({ userProfile: { ...profile, email: user.email || null } });
      }
    } catch (err) {
      set({ error: "An unexpected error occurred" });
    } finally {
      set({ isLoading: false });
    }
  },
  updateUserProfile: async (updates) => {
    try {
      const { data: userResponse } = await supabase.auth.getUser();
      const user = userResponse?.user;
      if (!user) throw new Error("User not authenticated");
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (updateError) throw updateError;
      await get().fetchUserProfile();
    } catch (err) {
      set({ error: "Error updating profile" });
      throw err;
    }
  },
  uploadAvatar: async (file) => {
    try {
      const { data: userResponse } = await supabase.auth.getUser();
      const user = userResponse?.user;
      if (!user) throw new Error("User not authenticated");
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;
      // Update the profile with the new avatar URL
      await get().updateUserProfile({ avatar_url: publicUrl });
      return publicUrl;
    } catch (err) {
      set({ error: "Error uploading avatar" });
      throw err;
    }
  },
  setUserProfile: (profile) => set({ userProfile: profile }),
}));

// Simple hook to match the interface expected by simplified components
export const useUserProfile = () => {
  const { userProfile, isLoading, error, fetchUserProfile } = useUserProfileStore();
  return { userProfile, isLoading, error, fetchUserProfile };
};
