"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain } from "lucide-react";

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
        const { error: uploadError } = await supabase.storage
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white overflow-hidden">
      {/* Animated background elements - matching home page */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" 
             style={{ left: '10%', top: '20%' }} />
        <div className="absolute w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse" 
             style={{ right: '10%', bottom: '20%', animationDelay: '2s' }} />
      </div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/40 border border-slate-600 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Welcome to <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">Cognify</span>
            </CardTitle>
            <p className="text-slate-300 text-lg">
              Let&apos;s set up your profile to get started
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-slate-200">
                  Username <span className="text-red-400">*</span>
                </label>
                <Input
                  id="username"
                  type="text"
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="^[a-zA-Z0-9_\-]+$"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  placeholder="your_username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
                <p className="text-xs text-slate-400">
                  3-30 characters, letters, numbers, underscore, dash only
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="displayName" className="text-sm font-medium text-slate-200">Display Name</label>
                  <span className="text-xs text-slate-400">Optional</span>
                </div>
                <Input
                  id="displayName"
                  type="text"
                  maxLength={50}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  placeholder="Your Display Name"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                />
                <p className="text-xs text-slate-400">Max 50 characters</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="avatar" className="text-sm font-medium text-slate-200">Avatar</label>
                  <span className="text-xs text-slate-400">Optional</span>
                </div>
                <div className="relative">
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    className="bg-slate-700/50 border-slate-600 text-white file:bg-blue-500/20 file:text-blue-200 file:border-0 file:mr-4 file:px-4 file:py-2 file:rounded"
                    onChange={(e) => {
                      const file = e.target.files && e.target.files[0];
                      setFormData({ ...formData, avatarFile: file });
                    }}
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Upload a profile picture (JPG, PNG, etc.)
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="bio" className="text-sm font-medium text-slate-200">Bio</label>
                  <span className="text-xs text-slate-400">Optional</span>
                </div>
                <Textarea
                  id="bio"
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 resize-none"
                  placeholder="Tell us a bit about yourself..."
                  rows={3}
                  maxLength={500}
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                />
                <p className="text-xs text-slate-400">
                  {formData.bio.length}/500 characters
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-500/10 border-red-500/20 text-red-400">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white border-none"
                disabled={loading || !formData.username.trim()}
              >
                {loading ? (
                  <>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Setting up...</span>
                    </div>
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </form>

            <div className="text-center mt-4">
              <p className="text-sm text-slate-400">
                <span className="text-red-400">*</span> Required field
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
