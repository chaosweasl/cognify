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
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setError("Not authenticated");
        return;
      }

      // Update or create profile
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          username: formData.username,
          display_name: formData.displayName,
          bio: formData.bio,
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
                <span className="label-text font-medium">Username</span>
              </label>
              <input
                type="text"
                required
                minLength={3}
                maxLength={30}
                pattern="^[a-zA-Z0-9_-]+$"
                className="input input-bordered w-full"
                placeholder="your_username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
              <label className="label">
                <span className="label-text-alt">3-30 characters, letters, numbers, underscore, dash only</span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Display Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Your Display Name"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Bio (Optional)</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Tell us a bit about yourself..."
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
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
        </div>
      </div>
    </div>
  );
}