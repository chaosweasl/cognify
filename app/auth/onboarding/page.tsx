"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    bio: "",
    avatarFile: null as File | null,
    avatarUrl: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Not authenticated");
        return;
      }

      let avatarUrl = null;
      if (formData.avatarFile) {
        // Upload avatar to Supabase Storage
        const fileExt = formData.avatarFile.name.split(".").pop();
        const filePath = `avatars/${user.id}_${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, formData.avatarFile, { upsert: true });
        if (uploadError) {
          setError("Failed to upload avatar: " + uploadError.message);
          return;
        }
        avatarUrl = supabase.storage.from("avatars").getPublicUrl(filePath)
          .data.publicUrl;
      }

      // Update or create profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        username: formData.username.trim(),
        display_name: formData.displayName.trim() || null,
        bio: formData.bio.trim() || null,
        avatar_url: avatarUrl,
        email: user.email,
        onboarding_completed: true,
      });

      if (profileError) {
        console.error("Profile error:", profileError);
        setError(profileError.message);
        return;
      }

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Onboarding error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-2xl">
        <div className="card-body p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-base-content mb-3">
              Welcome to <span className="text-primary">Cognify</span>
            </h1>
            <p className="text-base-content/70 text-lg">
              Let&apos;s set up your profile to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  Username <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={30}
                pattern="^[a-zA-Z0-9_\-]+$"
                className="input input-bordered w-full"
                placeholder="your_username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
              />
              <label className="label">
                <span className="label-text-alt">
                  3-30 characters, letters, numbers, underscore, dash only
                </span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Display Name</span>
                <span className="label-text-alt">Optional</span>
              </label>
              <input
                type="text"
                maxLength={50}
                className="input input-bordered w-full"
                placeholder="Your Display Name"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
              />
              <label className="label">
                <span className="label-text-alt">Max 50 characters</span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Avatar</span>
                <span className="label-text-alt">Optional</span>
              </label>
              <input
                type="file"
                accept="image/*"
                className="file-input file-input-bordered w-full"
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0];
                  setFormData({ ...formData, avatarFile: file });
                }}
              />
              <label className="label">
                <span className="label-text-alt">
                  Upload a profile picture (JPG, PNG, etc.)
                </span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Bio</span>
                <span className="label-text-alt">Optional</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Tell us a bit about yourself..."
                rows={3}
                maxLength={500}
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
              />
              <label className="label">
                <span className="label-text-alt">
                  {formData.bio.length}/500 characters
                </span>
              </label>
            </div>

            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading || !formData.username.trim()}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Setting up...
                </>
              ) : (
                "Complete Setup"
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="text-sm text-base-content/60">
              <span className="text-error">*</span> Required field
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
