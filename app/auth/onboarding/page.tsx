"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Brain,
  User,
  Settings,
  FolderPlus,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
} from "lucide-react";
import { AIConfigurationSection } from "@/src/components/settings/AIConfigurationSection";
import { useAISettings } from "@/hooks/useAISettings";

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setOnboardingCompleted } = useAISettings();

  // Step 1: Profile Data
  const [formData, setFormData] = useState({
    username: "",
    displayName: "",
    bio: "",
    avatarFile: null as File | null,
    avatarUrl: "",
  });

  // Step 3: First Project Data
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    template: "general" as "general" | "language" | "science" | "history",
  });

  const projectTemplates = [
    {
      id: "general",
      name: "General Knowledge",
      description: "Perfect for any subject or topic",
      icon: "📚",
    },
    {
      id: "language",
      name: "Language Learning",
      description: "Vocabulary, grammar, and phrases",
      icon: "🌍",
    },
    {
      id: "science",
      name: "Science & Math",
      description: "Formulas, concepts, and definitions",
      icon: "🧪",
    },
    {
      id: "history",
      name: "History & Facts",
      description: "Dates, events, and important information",
      icon: "🏛️",
    },
  ];

  const steps = [
    {
      id: 1,
      title: "Profile",
      icon: User,
      description: "Tell us about yourself",
    },
    {
      id: 2,
      title: "AI Setup",
      icon: Settings,
      description: "Configure AI features (optional)",
    },
    {
      id: 3,
      title: "First Project",
      icon: FolderPlus,
      description: "Create your first project",
    },
  ];

  const handleProfileSubmit = async () => {
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

      // Update or create profile (but don't mark onboarding as completed yet)
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        username: formData.username.trim(),
        display_name: formData.displayName.trim() || null,
        bio: formData.bio.trim() || null,
        avatar_url: avatarUrl,
        email: user.email,
        onboarding_completed: false, // Will complete after all steps
      });

      if (profileError) {
        console.error("Profile error:", profileError);
        setError(profileError.message);
        return;
      }

      // Move to next step
      setCurrentStep(2);
    } catch (error) {
      console.error("Profile creation error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleProjectSubmit = async () => {
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

      // Create the first project
      const { error: projectError } = await supabase.from("projects").insert({
        name: projectData.name.trim(),
        description: projectData.description.trim() || null,
        user_id: user.id,
        // Add some sensible defaults for the project
        new_cards_per_day: 10,
        max_reviews_per_day: 50,
      });

      if (projectError) {
        console.error("Project creation error:", projectError);
        setError(projectError.message);
        return;
      }

      // Mark onboarding as completed
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (profileUpdateError) {
        console.error("Profile update error:", profileUpdateError);
        setError("Failed to complete onboarding");
        return;
      }

      // Mark AI onboarding as completed if AI was configured
      setOnboardingCompleted(true);

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Project creation error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const canProceedFromStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.username.trim().length >= 3;
      case 2:
        return true; // AI setup is optional
      case 3:
        return projectData.name.trim().length >= 3;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-primary mb-2">
                Create Your Profile
              </h3>
              <p className="text-secondary">
                Tell us about yourself to personalize your experience
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProfileSubmit();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-secondary"
                >
                  Username <span className="text-status-error">*</span>
                </label>
                <Input
                  id="username"
                  type="text"
                  required
                  minLength={3}
                  maxLength={30}
                  pattern="^[a-zA-Z0-9_\-]+$"
                  className="surface-glass border-subtle text-primary placeholder:text-muted focus:border-brand transition-all transition-normal"
                  placeholder="your_username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
                <p className="text-xs text-muted">
                  3-30 characters, letters, numbers, underscore, dash only
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="displayName"
                    className="text-sm font-medium text-secondary"
                  >
                    Display Name
                  </label>
                  <span className="text-xs text-muted">Optional</span>
                </div>
                <Input
                  id="displayName"
                  type="text"
                  maxLength={50}
                  className="surface-glass border-subtle text-primary placeholder:text-muted focus:border-brand transition-all transition-normal"
                  placeholder="Your Display Name"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                />
                <p className="text-xs text-muted">Max 50 characters</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="avatar"
                    className="text-sm font-medium text-secondary"
                  >
                    Avatar
                  </label>
                  <span className="text-xs text-muted">Optional</span>
                </div>
                <div className="relative">
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    className="surface-glass border-subtle text-primary file:bg-brand-primary/20 file:text-brand-primary file:border-0 file:mr-4 file:px-4 file:py-2 file:rounded transition-all transition-normal"
                    onChange={(e) => {
                      const file = e.target.files && e.target.files[0];
                      setFormData({ ...formData, avatarFile: file });
                    }}
                  />
                </div>
                <p className="text-xs text-muted">
                  Upload a profile picture (JPG, PNG, etc.)
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="bio"
                    className="text-sm font-medium text-secondary"
                  >
                    Bio
                  </label>
                  <span className="text-xs text-muted">Optional</span>
                </div>
                <Textarea
                  id="bio"
                  className="surface-glass border-subtle text-primary placeholder:text-muted resize-none focus:border-brand transition-all transition-normal"
                  placeholder="Tell us a bit about yourself..."
                  rows={3}
                  maxLength={500}
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                />
                <p className="text-xs text-muted">
                  {formData.bio.length}/500 characters
                </p>
              </div>
            </form>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                AI Configuration
              </h3>
              <p className="text-secondary">
                Configure AI to automatically generate flashcards from your
                content (optional)
              </p>
            </div>

            <AIConfigurationSection
              showTitle={false}
              showDescription={false}
              onConfigurationComplete={() => {}}
              variant="onboarding"
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">
                Create Your First Project
              </h3>
              <p className="text-secondary">
                Projects help you organize your flashcards by subject or topic
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProjectSubmit();
              }}
              className="space-y-6"
            >
              {/* Project Templates */}
              <div>
                <label className="text-sm font-medium text-secondary mb-3 block">
                  Choose a Template
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {projectTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all transition-normal transform hover:scale-[1.02] ${
                        projectData.template === template.id
                          ? "border-brand surface-glass shadow-brand"
                          : "border-subtle surface-elevated hover:border-brand"
                      }`}
                      onClick={() =>
                        setProjectData({
                          ...projectData,
                          template: template.id as
                            | "general"
                            | "language"
                            | "science"
                            | "history",
                        })
                      }
                    >
                      <div className="text-2xl mb-2">{template.icon}</div>
                      <h4 className="font-medium text-primary text-sm">
                        {template.name}
                      </h4>
                      <p className="text-xs text-muted mt-1">
                        {template.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="projectName"
                  className="text-sm font-medium text-secondary"
                >
                  Project Name <span className="text-status-error">*</span>
                </label>
                <Input
                  id="projectName"
                  type="text"
                  required
                  minLength={3}
                  maxLength={100}
                  className="surface-glass border-subtle text-primary placeholder:text-muted focus:border-brand transition-all transition-normal"
                  placeholder="e.g., Spanish Vocabulary, Biology Chapter 1"
                  value={projectData.name}
                  onChange={(e) =>
                    setProjectData({ ...projectData, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="projectDescription"
                    className="text-sm font-medium text-secondary"
                  >
                    Description
                  </label>
                  <span className="text-xs text-muted">Optional</span>
                </div>
                <Textarea
                  id="projectDescription"
                  className="surface-glass border-subtle text-primary placeholder:text-muted resize-none focus:border-brand transition-all transition-normal"
                  placeholder="Describe what you'll be studying in this project..."
                  rows={3}
                  maxLength={500}
                  value={projectData.description}
                  onChange={(e) =>
                    setProjectData({
                      ...projectData,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </form>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen surface-primary overflow-hidden relative">
      {/* Enhanced animated background elements with semantic variables */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute w-96 h-96 opacity-20 rounded-full blur-3xl animate-pulse"
          style={{
            left: "10%",
            top: "20%",
            background: "var(--gradient-glass)",
          }}
        />
        <div
          className="absolute w-96 h-96 opacity-20 rounded-full blur-3xl animate-pulse"
          style={{
            right: "10%",
            bottom: "20%",
            animationDelay: "2s",
            background: "var(--gradient-glass)",
          }}
        />
        <div
          className="absolute w-64 h-64 opacity-10 rounded-full blur-2xl animate-pulse"
          style={{
            left: "60%",
            top: "10%",
            animationDelay: "4s",
            background: "var(--gradient-brand-primary)",
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl glass-surface shadow-brand-lg border border-subtle transform hover:scale-[1.01] transition-all transition-slow">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="relative group">
                <div className="w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all transition-normal shadow-brand">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-glass rounded-xl blur opacity-0 group-hover:opacity-100 transition-all transition-normal" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-primary mb-3">
              Welcome to{" "}
              <span className="bg-gradient-brand bg-clip-text text-transparent">
                Cognify
              </span>
            </CardTitle>

            {/* Enhanced Progress Steps */}
            <div className="flex items-center justify-center space-x-4 mt-6">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center space-x-2 transition-all transition-normal ${
                      step.id === currentStep
                        ? "text-brand-primary"
                        : step.id < currentStep
                        ? "text-status-success"
                        : "text-muted"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all transition-normal ${
                        step.id === currentStep
                          ? "border-brand shadow-brand surface-glass"
                          : step.id < currentStep
                          ? "border-status-success bg-status-success/10"
                          : "border-subtle surface-elevated"
                      }`}
                    >
                      {step.id < currentStep ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <step.icon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs text-muted">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-muted mx-2" />
                  )}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            {/* Step Content */}
            {renderStepContent()}

            {/* Error Display */}
            {error && (
              <Alert
                variant="destructive"
                className="surface-glass border-destructive mt-6"
              >
                <AlertDescription className="text-destructive-foreground">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1 || loading}
                className="surface-glass border-subtle text-primary hover:surface-elevated hover:border-brand interactive-hover transition-all transition-normal"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <div className="flex space-x-3">
                {currentStep < 3 && (
                  <Button
                    onClick={() => {
                      if (currentStep === 1) {
                        handleProfileSubmit();
                      } else {
                        setCurrentStep(currentStep + 1);
                      }
                    }}
                    disabled={!canProceedFromStep(currentStep) || loading}
                    className="bg-gradient-brand hover:bg-gradient-brand-hover text-white border-none transform hover:scale-[1.02] transition-all transition-normal shadow-brand"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        {currentStep === 1
                          ? "Creating Profile..."
                          : "Processing..."}
                      </>
                    ) : (
                      <>
                        {currentStep === 1 ? "Create Profile" : "Continue"}
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}

                {currentStep === 3 && (
                  <Button
                    onClick={handleProjectSubmit}
                    disabled={!canProceedFromStep(currentStep) || loading}
                    className="bg-status-success hover:bg-status-success/80 text-white border-none transform hover:scale-[1.02] transition-all transition-normal shadow-brand"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Completing Setup...
                      </>
                    ) : (
                      <>
                        Complete Setup
                        <CheckCircle2 className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Skip Options */}
            {currentStep === 2 && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="text-sm text-muted hover:text-secondary transition-colors transition-normal underline"
                >
                  Skip AI setup for now
                </button>
              </div>
            )}

            {/* Help Text */}
            <div className="text-center mt-4">
              <p className="text-sm text-muted">
                {currentStep === 1 && (
                  <>
                    <span className="text-status-error">*</span> Required field
                  </>
                )}
                {currentStep === 2 && (
                  <>
                    AI setup is optional but recommended for the best experience
                  </>
                )}
                {currentStep === 3 && (
                  <>
                    You can always create more projects later from your
                    dashboard
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
