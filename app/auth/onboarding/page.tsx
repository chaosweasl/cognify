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
  Target,
  Sparkles,
  BookOpen,
  FileText,
  Trophy,
  Clock,
  Zap,
  ArrowRight,
  Lightbulb,
} from "lucide-react";
import { ProgressiveAISettings } from "@/src/components/settings/ProgressiveAISettings";
import { ContextualGuidance } from "@/src/components/ui/ContextualGuidance";
import { HelpTooltip, CommonTooltips } from "@/src/components/ui/HelpTooltip";
import { useAISettings } from "@/hooks/useAISettings";
import {
  ProjectTypeSelector,
  ProjectTypeBadge,
} from "@/src/components/projects/ProjectTypeComponents";
import { ProjectType, PROJECT_TYPE_CONFIGS } from "@/src/types";

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

  // Step 2: Study Goals Data
  const [goalsData, setGoalsData] = useState({
    primaryGoal: "" as
      | "academic"
      | "professional"
      | "personal"
      | "certification"
      | "",
    studyTime: "" as "15min" | "30min" | "1hour" | "2hours" | "",
    subjects: [] as string[],
    experience: "" as "beginner" | "intermediate" | "advanced" | "",
  });

  // Step 4: First Project Data
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    project_type: "flashcards" as ProjectType,
    addSampleContent: true,
  });

  const studyGoals = [
    {
      id: "academic",
      name: "Academic Study",
      description: "Studying for school, college, or university courses",
      icon: "🎓",
    },
    {
      id: "professional",
      name: "Professional Development",
      description: "Learning skills for career advancement",
      icon: "💼",
    },
    {
      id: "personal",
      name: "Personal Interest",
      description: "Learning for curiosity and personal growth",
      icon: "🌱",
    },
    {
      id: "certification",
      name: "Certification Prep",
      description: "Preparing for professional certifications or exams",
      icon: "🏆",
    },
  ];

  const timeCommitments = [
    {
      id: "15min",
      label: "15 minutes/day",
      description: "Quick daily reviews",
    },
    { id: "30min", label: "30 minutes/day", description: "Balanced learning" },
    { id: "1hour", label: "1 hour/day", description: "Focused study sessions" },
    { id: "2hours", label: "2+ hours/day", description: "Intensive learning" },
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
      title: "Goals",
      icon: Target,
      description: "Set your learning goals",
    },
    {
      id: 3,
      title: "AI Setup",
      icon: Settings,
      description: "Configure AI features (optional)",
    },
    {
      id: 4,
      title: "First Project",
      icon: FolderPlus,
      description: "Create your first project",
    },
    {
      id: 5,
      title: "Success!",
      icon: Trophy,
      description: "You're all set",
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

  const handleGoalsSubmit = () => {
    setCurrentStep(3);
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
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          name: projectData.name.trim(),
          description: projectData.description.trim() || null,
          project_type: projectData.project_type,
          user_id: user.id,
          // Add some sensible defaults for the project based on user goals
          new_cards_per_day:
            goalsData.studyTime === "15min"
              ? 5
              : goalsData.studyTime === "30min"
              ? 10
              : goalsData.studyTime === "1hour"
              ? 15
              : 20,
          max_reviews_per_day:
            goalsData.studyTime === "15min"
              ? 25
              : goalsData.studyTime === "30min"
              ? 50
              : goalsData.studyTime === "1hour"
              ? 75
              : 100,
        })
        .select()
        .single();

      if (projectError) {
        console.error("Project creation error:", projectError);
        setError(projectError.message);
        return;
      }

      // Add sample content if requested
      if (projectData.addSampleContent && project) {
        const sampleCards = getSampleContent(projectData.project_type);
        if (sampleCards.length > 0) {
          const { error: cardsError } = await supabase
            .from("flashcards")
            .insert(
              sampleCards.map((card) => ({
                ...card,
                project_id: project.id,
                is_ai_generated: false,
              }))
            );

          if (cardsError) {
            console.warn("Failed to add sample content:", cardsError);
            // Don't fail the whole process for sample content
          }
        }
      }

      // Move to success step
      setCurrentStep(5);
    } catch (error) {
      console.error("Project creation error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
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
      }
    } catch (error) {
      console.error("Completion error:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getSampleContent = (projectType: ProjectType) => {
    switch (projectType) {
      case "flashcards":
        return [
          {
            front: "What is spaced repetition?",
            back: "A learning technique where information is reviewed at increasing intervals to improve long-term retention.",
          },
          {
            front: "Why is active recall important?",
            back: "Active recall strengthens memory by forcing your brain to retrieve information, creating stronger neural pathways.",
          },
          {
            front: "How does Cognify help with learning?",
            back: "Cognify uses AI to generate study materials and spaced repetition algorithms to optimize your learning schedule.",
          },
        ];
      case "quiz":
        return [
          {
            front: "What are the key benefits of spaced repetition?",
            back: "1. Improved long-term retention\n2. More efficient studying\n3. Reduced cramming\n4. Better memory consolidation",
          },
        ];
      case "cheatsheet":
        return [
          {
            front: "Study Tips",
            back: "• Review cards daily\n• Use active recall\n• Space out study sessions\n• Focus on difficult concepts\n• Stay consistent",
          },
        ];
      default:
        return [];
    }
  };

  const canProceedFromStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.username.trim().length >= 3;
      case 2:
        return (
          goalsData.primaryGoal && goalsData.studyTime && goalsData.experience
        );
      case 3:
        return true; // AI setup is optional
      case 4:
        return projectData.name.trim().length >= 3;
      case 5:
        return true; // Success step
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Welcome section */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-brand rounded-full mx-auto mb-4 flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-primary mb-3">
                Welcome to Cognify! 🧠
              </h2>
              <p className="text-secondary mb-4">
                Your AI-powered spaced repetition learning platform
              </p>

              <div className="p-4 bg-brand/5 border border-brand/20 rounded-lg text-left max-w-md mx-auto">
                <h4 className="text-sm font-medium text-brand mb-2 flex items-center gap-2">
                  <span>🔑</span>
                  What makes Cognify different?
                </h4>
                <ul className="text-xs text-secondary space-y-1">
                  <li>
                    • <strong>Bring Your Own API Keys:</strong> You control your
                    AI costs and data
                  </li>
                  <li>
                    • <strong>Privacy First:</strong> API keys never leave your
                    device
                  </li>
                  <li>
                    • <strong>Smart Learning:</strong> Spaced repetition with
                    AI-generated content
                  </li>
                  <li>
                    • <strong>Cost Transparent:</strong> Pay only your AI
                    provider directly
                  </li>
                </ul>
              </div>
            </div>

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
              <h3 className="text-xl font-semibold text-primary mb-2 flex items-center justify-center gap-2">
                <Target className="w-6 h-6 text-brand" />
                Set Your Learning Goals
              </h3>
              <p className="text-secondary">
                Help us personalize your learning experience
              </p>
            </div>

            <div className="space-y-6">
              {/* Primary Goal */}
              <div>
                <label className="text-sm font-medium text-secondary mb-3 block">
                  What&apos;s your primary learning goal?{" "}
                  <span className="text-status-error">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {studyGoals.map((goal) => (
                    <div
                      key={goal.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all transition-normal transform hover:scale-[1.02] ${
                        goalsData.primaryGoal === goal.id
                          ? "border-brand surface-glass shadow-brand"
                          : "border-subtle surface-elevated hover:border-brand"
                      }`}
                      onClick={() =>
                        setGoalsData({
                          ...goalsData,
                          primaryGoal: goal.id as
                            | "academic"
                            | "professional"
                            | "personal"
                            | "certification",
                        })
                      }
                    >
                      <div className="text-2xl mb-2">{goal.icon}</div>
                      <h4 className="font-medium text-primary text-sm">
                        {goal.name}
                      </h4>
                      <p className="text-xs text-muted mt-1">
                        {goal.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Study Time */}
              <div>
                <label className="text-sm font-medium text-secondary mb-3 block">
                  How much time can you dedicate daily?{" "}
                  <span className="text-status-error">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {timeCommitments.map((time) => (
                    <div
                      key={time.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all transition-normal transform hover:scale-[1.02] ${
                        goalsData.studyTime === time.id
                          ? "border-brand surface-glass shadow-brand"
                          : "border-subtle surface-elevated hover:border-brand"
                      }`}
                      onClick={() =>
                        setGoalsData({
                          ...goalsData,
                          studyTime: time.id as
                            | "15min"
                            | "30min"
                            | "1hour"
                            | "2hours",
                        })
                      }
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-brand" />
                        <span className="font-medium text-primary text-sm">
                          {time.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted">{time.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <label className="text-sm font-medium text-secondary mb-3 block">
                  How would you describe your learning experience?{" "}
                  <span className="text-status-error">*</span>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      id: "beginner",
                      label: "Beginner",
                      description: "New to spaced repetition",
                      icon: "🌱",
                    },
                    {
                      id: "intermediate",
                      label: "Intermediate",
                      description: "Some experience",
                      icon: "📈",
                    },
                    {
                      id: "advanced",
                      label: "Advanced",
                      description: "Very experienced",
                      icon: "🎯",
                    },
                  ].map((level) => (
                    <div
                      key={level.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all transition-normal transform hover:scale-[1.02] ${
                        goalsData.experience === level.id
                          ? "border-brand surface-glass shadow-brand"
                          : "border-subtle surface-elevated hover:border-brand"
                      }`}
                      onClick={() =>
                        setGoalsData({
                          ...goalsData,
                          experience: level.id as
                            | "beginner"
                            | "intermediate"
                            | "advanced",
                        })
                      }
                    >
                      <div className="text-xl mb-2">{level.icon}</div>
                      <h4 className="font-medium text-primary text-sm">
                        {level.label}
                      </h4>
                      <p className="text-xs text-muted mt-1">
                        {level.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-primary mb-2 flex items-center justify-center gap-2">
                AI Configuration
                <HelpTooltip
                  content={CommonTooltips.byoModel}
                  type="feature"
                  showIcon={false}
                >
                  <Settings className="w-5 h-5 text-brand cursor-help" />
                </HelpTooltip>
              </h3>
              <p className="text-secondary">
                Configure AI to automatically generate flashcards from your
                content
              </p>
              <p className="text-xs text-muted mt-2">
                💡 This step is optional - you can always set this up later
              </p>
            </div>

            <div className="space-y-4">
              <ContextualGuidance context="first-time-user" className="mb-6" />

              <ProgressiveAISettings
                showTitle={false}
                showDescription={false}
                onConfigurationComplete={() => {}}
                variant="onboarding"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-primary mb-2 flex items-center justify-center gap-2">
                <FolderPlus className="w-6 h-6 text-brand" />
                Create Your First Project
              </h3>
              <p className="text-secondary">
                Projects help you organize your learning materials by subject or
                topic
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleProjectSubmit();
              }}
              className="space-y-6"
            >
              {/* Project Type Selection */}
              <div>
                <label className="text-sm font-medium text-secondary mb-3 block">
                  What type of project would you like to create?{" "}
                  <span className="text-status-error">*</span>
                </label>
                <div className="mb-4">
                  <ProjectTypeSelector
                    selectedType={projectData.project_type}
                    onTypeSelect={(projectType: ProjectType) =>
                      setProjectData({
                        ...projectData,
                        project_type: projectType,
                      })
                    }
                    variant="grid"
                    className="grid-cols-3"
                  />
                </div>

                {/* Project type info */}
                <div className="p-4 bg-brand/5 border border-brand/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <ProjectTypeBadge
                      projectType={projectData.project_type}
                      size="sm"
                    />
                    <div className="text-left">
                      <p className="text-sm text-secondary">
                        {
                          PROJECT_TYPE_CONFIGS[projectData.project_type]
                            .description
                        }
                      </p>
                      <ul className="text-xs text-muted mt-2 space-y-1">
                        {PROJECT_TYPE_CONFIGS[
                          projectData.project_type
                        ].features.map((feature, index) => (
                          <li key={index}>• {feature}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
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

              {/* Sample Content Option */}
              <div className="p-4 bg-brand/5 border border-brand/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-brand mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-brand">
                        Add sample content
                      </h4>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={projectData.addSampleContent}
                          onChange={(e) =>
                            setProjectData({
                              ...projectData,
                              addSampleContent: e.target.checked,
                            })
                          }
                        />
                        <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand"></div>
                      </label>
                    </div>
                    <p className="text-xs text-secondary">
                      We&apos;ll add a few sample {projectData.project_type} to
                      help you get started and understand how the platform
                      works.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-status-success to-brand rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-primary mb-3">
                🎉 Welcome to Cognify!
              </h2>
              <p className="text-secondary mb-6">
                Your learning journey is ready to begin
              </p>

              {/* Success Summary */}
              <div className="max-w-md mx-auto space-y-4">
                <div className="p-4 bg-status-success/10 border border-status-success/20 rounded-lg text-left">
                  <h4 className="text-sm font-medium text-status-success mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Setup Complete
                  </h4>
                  <ul className="text-xs text-secondary space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-status-success" />
                      Profile created
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-status-success" />
                      Learning goals set ({goalsData.primaryGoal})
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-status-success" />
                      Study schedule configured ({goalsData.studyTime} daily)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-status-success" />
                      First project created ({projectData.project_type})
                    </li>
                  </ul>
                </div>

                {/* Next Steps */}
                <div className="p-4 bg-brand/5 border border-brand/20 rounded-lg text-left">
                  <h4 className="text-sm font-medium text-brand mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Next Steps
                  </h4>
                  <ul className="text-xs text-secondary space-y-2">
                    <li className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-brand" />
                      Explore your new project
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-brand" />
                      {projectData.addSampleContent
                        ? "Review sample content"
                        : "Add your first content"}
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-brand" />
                      Start your first study session
                    </li>
                    <li className="flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-brand" />
                      Configure AI in settings (if not done)
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tips for success */}
            <div className="max-w-lg mx-auto p-4 bg-gradient-to-r from-brand/10 to-brand-accent/10 border border-brand/20 rounded-lg">
              <h4 className="text-sm font-medium text-brand mb-3 flex items-center justify-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Tips for Success
              </h4>
              <div className="text-xs text-secondary space-y-2 text-left">
                <p>
                  • <strong>Consistency is key:</strong> Study a little bit
                  every day
                </p>
                <p>
                  • <strong>Trust the algorithm:</strong> Review cards when
                  they're due
                </p>
                <p>
                  • <strong>Use AI wisely:</strong> Generate content from your
                  materials
                </p>
                <p>
                  • <strong>Stay organized:</strong> Create separate projects
                  for different subjects
                </p>
              </div>
            </div>
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
            <div className="flex items-center justify-center space-x-2 mt-6 overflow-x-auto">
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
                    <ChevronRight className="w-3 h-3 text-muted mx-1 sm:mx-2" />
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
                {currentStep < 4 && (
                  <Button
                    onClick={() => {
                      if (currentStep === 1) {
                        handleProfileSubmit();
                      } else if (currentStep === 2) {
                        handleGoalsSubmit();
                      } else if (currentStep === 3) {
                        setCurrentStep(4);
                      }
                    }}
                    disabled={!canProceedFromStep(currentStep) || loading}
                    className="bg-gradient-brand hover:bg-gradient-brand-hover text-white border-none transform hover:scale-[1.02] transition-all transition-normal shadow-brand"
                  >
                    {loading && currentStep === 1 ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Creating Profile...
                      </>
                    ) : (
                      <>
                        {currentStep === 1 ? "Create Profile" : "Continue"}
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}

                {currentStep === 4 && (
                  <Button
                    onClick={handleProjectSubmit}
                    disabled={!canProceedFromStep(currentStep) || loading}
                    className="bg-gradient-brand hover:bg-gradient-brand-hover text-white border-none transform hover:scale-[1.02] transition-all transition-normal shadow-brand"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Creating Project...
                      </>
                    ) : (
                      <>
                        Create Project
                        <FolderPlus className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}

                {currentStep === 5 && (
                  <Button
                    onClick={handleCompleteOnboarding}
                    disabled={loading}
                    className="bg-status-success hover:bg-status-success/80 text-white border-none transform hover:scale-[1.02] transition-all transition-normal shadow-brand"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Finalizing...
                      </>
                    ) : (
                      <>
                        Go to Dashboard
                        <Trophy className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Skip Options */}
            {currentStep === 3 && (
              <div className="text-center mt-6 space-y-3">
                <div className="p-4 bg-brand/5 border border-brand/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Settings className="w-5 h-5 text-brand mt-0.5" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-brand mb-2">
                        Why configure AI now?
                      </p>
                      <ul className="text-xs text-secondary space-y-1">
                        <li>
                          • Generate flashcards automatically from your content
                        </li>
                        <li>
                          • Create cheatsheets and quizzes with AI assistance
                        </li>
                        <li>• Save time on manual content creation</li>
                        <li>
                          • Your API keys are stored securely on your device
                          only
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentStep(4)}
                  className="text-sm text-muted hover:text-secondary transition-colors transition-normal underline"
                >
                  Skip AI setup for now
                </button>

                <div className="text-xs text-muted">
                  You can always set up AI later in Settings → AI Configuration
                </div>
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
                    Help us personalize your learning experience based on your
                    goals
                  </>
                )}
                {currentStep === 3 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span>🔐</span>
                      <span>Your API keys never leave your device</span>
                    </div>
                    <div className="text-xs">
                      We use a &quot;Bring Your Own&quot; model for maximum
                      security and cost transparency
                    </div>
                  </div>
                )}
                {currentStep === 4 && (
                  <>
                    You can always create more projects later from your
                    dashboard
                  </>
                )}
                {currentStep === 5 && (
                  <>Ready to start your learning journey! 🚀</>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
