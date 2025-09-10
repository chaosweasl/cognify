"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CacheInvalidation } from "@/hooks/useCache";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Save,
  Loader2,
  Sparkles,
  Rocket,
  ChevronRight,
  Settings,
} from "lucide-react";
import { ProjectTypeSelector, ProjectTypeInfo } from "./ProjectTypeComponents";
import { ProjectType, CreateProjectData } from "@/src/types";

const STEPS = {
  PROJECT_TYPE: 0,
  PROJECT_DETAILS: 1,
  STUDY_SETTINGS: 2,
  CONFIRMATION: 3,
};

export function ProjectCreator() {
  const [currentStep, setCurrentStep] = useState(STEPS.PROJECT_TYPE);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    project_type: ProjectType | null;
    new_cards_per_day: number;
    max_reviews_per_day: number;
  }>({
    name: "",
    description: "",
    project_type: null,
    new_cards_per_day: 20,
    max_reviews_per_day: 100,
  });
  const router = useRouter();

  const progress = ((currentStep + 1) / 4) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.CONFIRMATION) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > STEPS.PROJECT_TYPE) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case STEPS.PROJECT_TYPE:
        return formData.project_type !== null;
      case STEPS.PROJECT_DETAILS:
        return formData.name.trim().length > 0;
      case STEPS.STUDY_SETTINGS:
        return formData.new_cards_per_day > 0 && formData.max_reviews_per_day > 0;
      case STEPS.CONFIRMATION:
        return true;
      default:
        return false;
    }
  };

  const handleCreateProject = async () => {
    if (!formData.project_type || !formData.name.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreating(true);

    try {
      const projectData: CreateProjectData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        project_type: formData.project_type,
        new_cards_per_day: formData.new_cards_per_day,
        max_reviews_per_day: formData.max_reviews_per_day,
      };

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Project creation failed:", error);
        throw new Error("Failed to create project");
      }

      const newProject = await response.json();

      // Invalidate cache
      CacheInvalidation.invalidate("user_projects");

      toast.success("Project created successfully!");
      router.push(`/projects/${newProject.id}/edit`);
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error("Failed to create project. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case STEPS.PROJECT_TYPE:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-primary">
                Choose Your Project Type
              </h2>
              <p className="text-secondary max-w-2xl mx-auto">
                Select the type of learning material you want to create. This will help us optimize the experience for your needs.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <ProjectTypeSelector
                selectedType={formData.project_type}
                onTypeSelect={(type) =>
                  setFormData((prev) => ({ ...prev, project_type: type }))
                }
                variant="grid"
              />
            </div>
          </div>
        );

      case STEPS.PROJECT_DETAILS:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-primary">
                Project Details
              </h2>
              <p className="text-secondary max-w-2xl mx-auto">
                Give your project a name and describe what you want to learn.
              </p>
            </div>

            {formData.project_type && (
              <div className="max-w-md mx-auto mb-8">
                <ProjectTypeInfo projectType={formData.project_type} showFeatures={false} />
              </div>
            )}

            <div className="max-w-2xl mx-auto space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-secondary">
                  Project Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Spanish Vocabulary, React Fundamentals, Biology Terms..."
                  className="text-lg py-3"
                  autoFocus
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-semibold text-secondary">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Describe what you want to learn or achieve with this project..."
                  rows={4}
                />
              </div>
            </div>
          </div>
        );

      case STEPS.STUDY_SETTINGS:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-primary">
                Study Settings
              </h2>
              <p className="text-secondary max-w-2xl mx-auto">
                Configure how many cards you want to study each day. You can change these settings later.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Card className="glass-surface border-subtle">
                <CardHeader>
                  <CardTitle className="text-xl text-primary">Daily Study Limits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-secondary">
                        New Cards Per Day
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.new_cards_per_day}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            new_cards_per_day: parseInt(e.target.value) || 1,
                          }))
                        }
                        className="text-lg"
                      />
                      <p className="text-xs text-muted">
                        How many new cards to introduce daily
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-secondary">
                        Max Reviews Per Day
                      </label>
                      <Input
                        type="number"
                        min="10"
                        max="500"
                        value={formData.max_reviews_per_day}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            max_reviews_per_day: parseInt(e.target.value) || 10,
                          }))
                        }
                        className="text-lg"
                      />
                      <p className="text-xs text-muted">
                        Maximum cards to review in one day
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-xl">
                    <h4 className="font-semibold text-brand-primary mb-2">
                      Recommended Settings
                    </h4>
                    <p className="text-sm text-secondary">
                      For beginners, we recommend starting with 10-20 new cards and 50-100 reviews per day. You can always adjust these settings later based on your progress.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case STEPS.CONFIRMATION:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-brand rounded-2xl flex items-center justify-center mx-auto">
                <Rocket className="w-8 h-8 text-white animate-bounce" />
              </div>
              <h2 className="text-3xl font-bold text-primary">
                Ready to Create Your Project!
              </h2>
              <p className="text-secondary max-w-2xl mx-auto">
                Review your project settings below and click create to start your learning journey.
              </p>
            </div>

            <div className="max-w-2xl mx-auto">
              <Card className="glass-surface border-subtle">
                <CardHeader>
                  <CardTitle className="text-xl text-primary flex items-center gap-3">
                    {formData.project_type && (
                      <ProjectTypeInfo 
                        projectType={formData.project_type} 
                        showFeatures={false}
                        className="mb-0"
                      />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-semibold text-secondary">Project Name:</span>
                      <p className="text-primary font-medium">{formData.name}</p>
                    </div>
                    
                    {formData.description && (
                      <div>
                        <span className="text-sm font-semibold text-secondary">Description:</span>
                        <p className="text-primary">{formData.description}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-subtle">
                      <div>
                        <span className="text-sm font-semibold text-secondary">New Cards/Day:</span>
                        <p className="text-primary font-medium">{formData.new_cards_per_day}</p>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-secondary">Max Reviews/Day:</span>
                        <p className="text-primary font-medium">{formData.max_reviews_per_day}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface-primary to-surface-secondary">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-brand-primary to-brand-secondary bg-clip-text text-transparent mb-4">
            Create New Project
          </h1>
          
          {/* Progress Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-secondary">Progress</span>
              <span className="text-sm font-medium text-brand-primary">
                {currentStep + 1} of 4
              </span>
            </div>
            <div className="w-full h-2 surface-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-brand rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-12">
          {renderStep()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={currentStep === STEPS.PROJECT_TYPE ? () => router.back() : handlePrev}
            className="hover:scale-105 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === STEPS.PROJECT_TYPE ? "Cancel" : "Previous"}
          </Button>

          {currentStep === STEPS.CONFIRMATION ? (
            <Button
              onClick={handleCreateProject}
              disabled={!canProceed() || isCreating}
              className="bg-gradient-brand hover:scale-105 transition-transform"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Project
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-gradient-brand hover:scale-105 transition-transform disabled:opacity-50 disabled:transform-none"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
