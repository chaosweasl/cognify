import { create } from "zustand";
// import { createClient } from "@/lib/supabase/client";
import { CacheInvalidation } from "@/hooks/useCache";

// const supabase = createClient();

export interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  onboarding_completed: boolean; // <-- Added field
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
      const res = await fetch("/api/user/profile");
      if (!res.ok) {
        set({ error: "Error fetching profile", isLoading: false });
        return;
      }
      const profile = await res.json();
      set({
        userProfile: {
          ...profile,
          onboarding_completed: !!profile.onboarding_completed,
        },
        isLoading: false,
      });
    } catch (err) {
      set({ error: "An unexpected error occurred" });
    } finally {
      set({ isLoading: false });
    }
  },
  updateUserProfile: async (updates) => {
    // Accepts: { username, display_name, bio, avatar_url }
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Error updating profile");
      }
      await get().fetchUserProfile();
    } catch (err) {
      set({ error: "Error updating profile" });
      throw err;
    }
  },
  uploadAvatar: async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/user/avatar", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Error uploading avatar");
      }
      const { publicUrl } = await res.json();
      // Optionally update profile with new avatar_url
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
  const {
    userProfile,
    isLoading,
    error,
    fetchUserProfile,
    updateUserProfile,
    uploadAvatar,
    setUserProfile,
  } = useUserProfileStore();
  return {
    userProfile,
    isLoading,
    error,
    fetchUserProfile,
    updateUserProfile,
    uploadAvatar,
    setUserProfile,
  };
};
