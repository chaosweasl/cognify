import { create } from "zustand";
import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { cachedFetch, CacheInvalidation } from "./useCache";
import type { CacheKey } from "./useCache";

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

interface CachedUserProfileState {
  userProfile: UserProfile | null;
  userNotifications: any[] | null;
  isLoading: boolean;
  isLoadingNotifications: boolean;
  error: string | null;
  lastFetch: number | null;

  fetchUserProfile: (forceRefresh?: boolean) => Promise<void>;
  fetchUserNotifications: (forceRefresh?: boolean) => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string>;
  setUserProfile: (profile: UserProfile | null) => void;
}

export const useCachedUserProfileStore = create<CachedUserProfileState>(
  (set, get) => ({
    userProfile: null,
    userNotifications: null,
    isLoading: false,
    isLoadingNotifications: false,
    error: null,
    lastFetch: null,

    fetchUserProfile: async (forceRefresh = false) => {
      set({ isLoading: true, error: null });

      try {
        const { data: userResponse } = await supabase.auth.getUser();
        const user = userResponse?.user;

        if (!user) {
          set({ error: "User not authenticated", isLoading: false });
          return;
        }

        const cacheKey: CacheKey = `user_profile:${user.id}`;

        const profile = await cachedFetch(
          cacheKey,
          async () => {
            console.log(
              `[UserProfile] Fetching profile from database for user: ${user.id}`
            );
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", user.id)
              .single();

            if (error) {
              console.error(`[UserProfile] Database error details:`, {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint,
              });

              // If profile doesn't exist, create one
              if (error.code === "PGRST116") {
                console.log(
                  `[UserProfile] Creating new profile for user: ${user.id}`
                );

                const profileData = {
                  id: user.id,
                  display_name:
                    user.user_metadata?.name || user.email?.split("@")[0] || "",
                  avatar_url: user.user_metadata?.avatar_url || null,
                  bio: "",
                };

                console.log(
                  `[UserProfile] Inserting profile data:`,
                  profileData
                );

                const { data: newProfile, error: createError } = await supabase
                  .from("profiles")
                  .insert([profileData])
                  .select()
                  .single();

                if (createError) {
                  console.error(
                    `[UserProfile] Profile creation error details:`,
                    {
                      code: createError.code,
                      message: createError.message,
                      details: createError.details,
                      hint: createError.hint,
                    }
                  );
                  throw new Error("Error creating profile");
                }

                if (newProfile) {
                  return { ...newProfile, email: user.email || null };
                }
              } else {
                throw new Error("Error fetching profile");
              }
            }

            if (profile) {
              return { ...profile, email: user.email || null };
            }

            throw new Error("Profile not found");
          },
          {
            forceRefresh,
            onCacheHit: (cachedProfile) => {
              console.log(
                `[UserProfile] Using cached profile for user: ${user.id}`
              );
            },
            onCacheMiss: () => {
              console.log(
                `[UserProfile] Cache miss, fetching from database for user: ${user.id}`
              );
            },
          }
        );

        set({
          userProfile: profile,
          isLoading: false,
          lastFetch: Date.now(),
        });
      } catch (err) {
        console.error("[UserProfile] Error fetching profile:", err);
        set({
          error:
            err instanceof Error ? err.message : "An unexpected error occurred",
          isLoading: false,
        });
      }
    },

    fetchUserNotifications: async (forceRefresh = false) => {
      set({ isLoadingNotifications: true, error: null });

      try {
        const { data: userResponse } = await supabase.auth.getUser();
        const user = userResponse?.user;

        if (!user) {
          set({
            error: "User not authenticated",
            isLoadingNotifications: false,
          });
          return;
        }

        const cacheKey: CacheKey = `notifications:${user.id}`;

        const notifications = await cachedFetch(
          cacheKey,
          async () => {
            console.log(
              `[UserProfile] Fetching user notifications for user: ${user.id}`
            );
            const { data: notifications, error: notificationsError } =
              await supabase
                .from("user_notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("trigger_at", { ascending: false });

            if (notificationsError) {
              console.warn(
                "[UserProfile] Failed to fetch user notifications:",
                notificationsError
              );
              return [];
            }

            return notifications || [];
          },
          {
            forceRefresh,
            onCacheHit: () =>
              console.log(
                `[UserProfile] Using cached notifications for user: ${user.id}`
              ),
            onCacheMiss: () =>
              console.log(
                `[UserProfile] Cache miss, fetching notifications for user: ${user.id}`
              ),
          }
        );

        set({
          userNotifications: notifications,
          isLoadingNotifications: false,
        });
      } catch (err) {
        console.error("[UserProfile] Error fetching notifications:", err);
        set({
          error:
            err instanceof Error ? err.message : "An unexpected error occurred",
          isLoadingNotifications: false,
        });
      }
    },

    updateUserProfile: async (updates) => {
      const currentProfile = get().userProfile;
      if (!currentProfile) {
        throw new Error("No profile to update");
      }

      set({ isLoading: true, error: null });

      try {
        const { data: userResponse } = await supabase.auth.getUser();
        const user = userResponse?.user;

        if (!user) {
          throw new Error("User not authenticated");
        }

        console.log(
          `[UserProfile] Updating profile for user: ${user.id}`,
          updates
        );

        const { data, error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", user.id)
          .select()
          .single();

        if (error) throw error;

        const updatedProfile = {
          ...data,
          email: user.email || null,
        };

        set({
          userProfile: updatedProfile,
          isLoading: false,
          lastFetch: Date.now(),
        });

        // Invalidate cache
        CacheInvalidation.onProfileUpdate(user.id);

        console.log(
          `[UserProfile] Profile updated successfully for user: ${user.id}`
        );
      } catch (err) {
        console.error("[UserProfile] Error updating profile:", err);
        set({
          error: err instanceof Error ? err.message : "Error updating profile",
          isLoading: false,
        });
        throw err;
      }
    },

    uploadAvatar: async (file: File): Promise<string> => {
      const { data: userResponse } = await supabase.auth.getUser();
      const user = userResponse?.user;

      if (!user) {
        throw new Error("User not authenticated");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      console.log(`[UserProfile] Uploading avatar for user: ${user.id}`);

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("[UserProfile] Error uploading avatar:", uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      console.log(
        `[UserProfile] Avatar uploaded successfully: ${data.publicUrl}`
      );
      return data.publicUrl;
    },

    setUserProfile: (profile) => {
      set({ userProfile: profile });
    },
  })
);

// Hook for automatic profile loading
export function useAutoLoadUserProfile() {
  const { fetchUserProfile, lastFetch, userProfile } =
    useCachedUserProfileStore();

  useEffect(() => {
    if (!userProfile && !lastFetch) {
      fetchUserProfile();
    }
  }, [fetchUserProfile, lastFetch, userProfile]);
}
