"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Code,
  Calculator,
  GraduationCap,
  Heart,
  Star,
  Plus,
  Check,
  Clock,
  Target,
  Brain,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CacheInvalidation } from "@/hooks/useCache";

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  settings: {
    new_cards_per_day: number;
    max_reviews_per_day: number;
    learning_steps: number[];
    relearning_steps: number[];
    graduating_interval: number;
    easy_interval: number;
    starting_ease: number;
    minimum_ease: number;
    easy_bonus: number;
    hard_interval_factor: number;
    easy_interval_factor: number;
    lapse_recovery_factor: number;
    leech_threshold: number;
    leech_action: "suspend" | "tag";
    new_card_order: "random" | "fifo";
    review_ahead: boolean;
    bury_siblings: boolean;
    max_interval: number;
    lapse_ease_penalty: number;
  };
  tags: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "language-learning",
    name: "Language Learning",
    description:
      "Optimized for vocabulary, phrases, and grammar rules with frequent reviews",
    category: "Language",
    icon: Globe,
    color: "from-blue-400 to-cyan-400",
    settings: {
      new_cards_per_day: 20,
      max_reviews_per_day: 150,
      learning_steps: [1, 10, 1440], // 1 min, 10 min, 1 day
      relearning_steps: [10, 1440], // 10 min, 1 day
      graduating_interval: 1,
      easy_interval: 4,
      starting_ease: 2.5,
      minimum_ease: 1.3,
      easy_bonus: 1.3,
      hard_interval_factor: 1.2,
      easy_interval_factor: 1.3,
      lapse_recovery_factor: 0.8,
      leech_threshold: 8,
      leech_action: "tag" as const,
      new_card_order: "random" as const,
      review_ahead: true,
      bury_siblings: true,
      max_interval: 36500,
      lapse_ease_penalty: 0.2,
    },
    tags: ["vocabulary", "grammar", "pronunciation", "frequent-review"],
    difficulty: "Beginner",
  },
  {
    id: "medical-studies",
    name: "Medical Studies",
    description:
      "High-retention settings for medical terminology, anatomy, and procedures",
    category: "Academic",
    icon: Heart,
    color: "from-red-400 to-pink-400",
    settings: {
      new_cards_per_day: 15,
      max_reviews_per_day: 200,
      learning_steps: [15, 60, 1440], // 15 min, 1 hour, 1 day
      relearning_steps: [30, 1440], // 30 min, 1 day
      graduating_interval: 3,
      easy_interval: 7,
      starting_ease: 2.5,
      minimum_ease: 1.5,
      easy_bonus: 1.2,
      hard_interval_factor: 1.1,
      easy_interval_factor: 1.2,
      lapse_recovery_factor: 0.7,
      leech_threshold: 6,
      leech_action: "suspend" as const,
      new_card_order: "fifo" as const,
      review_ahead: false,
      bury_siblings: false,
      max_interval: 18250, // 50 years
      lapse_ease_penalty: 0.15,
    },
    tags: ["medical", "terminology", "high-stakes", "retention"],
    difficulty: "Advanced",
  },
  {
    id: "programming-concepts",
    name: "Programming Concepts",
    description:
      "Perfect for learning syntax, algorithms, and programming principles",
    category: "Technology",
    icon: Code,
    color: "from-green-400 to-emerald-400",
    settings: {
      new_cards_per_day: 25,
      max_reviews_per_day: 120,
      learning_steps: [5, 25, 1440], // 5 min, 25 min, 1 day
      relearning_steps: [15, 1440], // 15 min, 1 day
      graduating_interval: 1,
      easy_interval: 3,
      starting_ease: 2.3,
      minimum_ease: 1.3,
      easy_bonus: 1.4,
      hard_interval_factor: 1.3,
      easy_interval_factor: 1.4,
      lapse_recovery_factor: 0.9,
      leech_threshold: 10,
      leech_action: "tag" as const,
      new_card_order: "random" as const,
      review_ahead: true,
      bury_siblings: true,
      max_interval: 36500,
      lapse_ease_penalty: 0.25,
    },
    tags: ["syntax", "algorithms", "concepts", "practice-focused"],
    difficulty: "Intermediate",
  },
  {
    id: "exam-preparation",
    name: "Exam Preparation",
    description:
      "Intensive review schedule for test preparation with spaced repetition",
    category: "Academic",
    icon: GraduationCap,
    color: "from-purple-400 to-indigo-400",
    settings: {
      new_cards_per_day: 30,
      max_reviews_per_day: 250,
      learning_steps: [10, 60, 720], // 10 min, 1 hour, 12 hours
      relearning_steps: [20, 720], // 20 min, 12 hours
      graduating_interval: 1,
      easy_interval: 2,
      starting_ease: 2.0,
      minimum_ease: 1.3,
      easy_bonus: 1.15,
      hard_interval_factor: 1.0,
      easy_interval_factor: 1.15,
      lapse_recovery_factor: 0.6,
      leech_threshold: 5,
      leech_action: "suspend" as const,
      new_card_order: "fifo" as const,
      review_ahead: false,
      bury_siblings: false,
      max_interval: 90, // 3 months max for exam prep
      lapse_ease_penalty: 0.3,
    },
    tags: ["exam", "intensive", "short-term", "high-frequency"],
    difficulty: "Advanced",
  },
  {
    id: "general-knowledge",
    name: "General Knowledge",
    description:
      "Balanced settings for learning facts, trivia, and general information",
    category: "General",
    icon: Brain,
    color: "from-orange-400 to-yellow-400",
    settings: {
      new_cards_per_day: 20,
      max_reviews_per_day: 100,
      learning_steps: [1, 10, 1440], // Standard Anki
      relearning_steps: [10, 1440],
      graduating_interval: 1,
      easy_interval: 4,
      starting_ease: 2.5,
      minimum_ease: 1.3,
      easy_bonus: 1.3,
      hard_interval_factor: 1.2,
      easy_interval_factor: 1.3,
      lapse_recovery_factor: 0.8,
      leech_threshold: 8,
      leech_action: "tag" as const,
      new_card_order: "random" as const,
      review_ahead: true,
      bury_siblings: true,
      max_interval: 36500,
      lapse_ease_penalty: 0.2,
    },
    tags: ["facts", "trivia", "balanced", "standard"],
    difficulty: "Beginner",
  },
  {
    id: "mathematics",
    name: "Mathematics",
    description:
      "Designed for formulas, theorems, and mathematical problem-solving",
    category: "Academic",
    icon: Calculator,
    color: "from-teal-400 to-cyan-400",
    settings: {
      new_cards_per_day: 15,
      max_reviews_per_day: 100,
      learning_steps: [10, 60, 1440], // Allow more time to understand
      relearning_steps: [30, 1440],
      graduating_interval: 2,
      easy_interval: 5,
      starting_ease: 2.3,
      minimum_ease: 1.4,
      easy_bonus: 1.2,
      hard_interval_factor: 1.1,
      easy_interval_factor: 1.2,
      lapse_recovery_factor: 0.7,
      leech_threshold: 6,
      leech_action: "tag" as const,
      new_card_order: "fifo" as const,
      review_ahead: false,
      bury_siblings: false,
      max_interval: 36500,
      lapse_ease_penalty: 0.15,
    },
    tags: ["formulas", "theorems", "problem-solving", "conceptual"],
    difficulty: "Intermediate",
  },
];

interface ProjectTemplatesProps {
  onTemplateSelect?: (template: ProjectTemplate) => void;
  className?: string;
}

export function ProjectTemplates({
  onTemplateSelect,
  className = "",
}: ProjectTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<ProjectTemplate | null>(null);
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const router = useRouter();

  const categories = [
    "All",
    ...Array.from(new Set(PROJECT_TEMPLATES.map((t) => t.category))),
  ];
  const filteredTemplates =
    filterCategory === "All"
      ? PROJECT_TEMPLATES
      : PROJECT_TEMPLATES.filter((t) => t.category === filterCategory);

  const createProjectFromTemplate = async (template: ProjectTemplate) => {
    if (isCreating) return;

    setIsCreating(true);

    try {
      const projectData = {
        name: customName || template.name,
        description: customDescription || template.description,
        ...template.settings,
      };

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to create project");
      }

      // Invalidate cache
      CacheInvalidation.invalidate("user_projects");
      CacheInvalidation.invalidatePattern("project_stats_");

      toast.success(`Project "${data.name}" created from template!`);

      // Navigate to the new project
      router.push(`/projects/${data.id}`);
    } catch (error) {
      console.error("Error creating project from template:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create project"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setCustomName(template.name);
    setCustomDescription(template.description);

    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  return (
    <div className={`space-y-8 p-6 ${className}`}>
      {/* Enhanced Header with Glass Morphism */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 glass-surface px-6 py-3 rounded-2xl border border-brand-primary/20">
          <div className="w-8 h-8 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center">
            <Star className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
            Choose a Project Template
          </h2>
        </div>
        <p className="text-text-muted max-w-2xl mx-auto text-lg leading-relaxed">
          Get started quickly with pre-configured settings optimized for
          different learning scenarios and proven methodologies.
        </p>
      </div>

      {/* Enhanced Category Filter */}
      <div className="flex flex-wrap justify-center gap-3">
        {categories.map((category, index) => (
          <Button
            key={category}
            variant={filterCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterCategory(category)}
            className={`
              transition-all duration-300 hover:scale-105
              ${
                filterCategory === category
                  ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-brand"
                  : "glass-surface border-brand-primary/30 hover:border-brand-primary/60 hover:bg-brand-primary/5"
              }
            `}
            style={{
              animationDelay: `${index * 50}ms`,
              animation: "slideInUp 0.4s ease-out both",
            }}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Enhanced Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredTemplates.map((template, index) => {
          const IconComponent = template.icon;
          const isSelected = selectedTemplate?.id === template.id;

          return (
            <Card
              key={template.id}
              className={`
                group p-8 cursor-pointer transition-all duration-500 hover:scale-[1.02]
                ${
                  isSelected
                    ? "glass-surface border-2 border-brand-primary bg-gradient-to-br from-brand-primary/10 to-brand-secondary/5 shadow-brand-lg"
                    : "glass-surface border border-brand-primary/20 hover:border-brand-primary/50 hover:shadow-brand-md hover:bg-gradient-to-br hover:from-brand-primary/5 hover:to-transparent"
                }
              `}
              style={{
                animationDelay: `${index * 120}ms`,
                animation:
                  "slideInLeft 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94) both",
              }}
              onClick={() => handleTemplateSelect(template)}
            >
              <div className="space-y-6">
                {/* Enhanced Header */}
                <div className="flex items-start justify-between">
                  <div
                    className={`
                      w-16 h-16 bg-gradient-to-br ${template.color} rounded-2xl flex items-center justify-center 
                      shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-110
                    `}
                  >
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  {isSelected && (
                    <div className="w-10 h-10 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-full flex items-center justify-center shadow-brand animate-pulse">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Enhanced Content */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-bold text-text-primary group-hover:text-brand-primary transition-colors">
                      {template.name}
                    </h3>
                    <Badge
                      variant="secondary"
                      className={`
                        text-xs px-3 py-1 rounded-full
                        ${
                          template.difficulty === "Beginner"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : template.difficulty === "Intermediate"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : "bg-red-100 text-red-700 border-red-200"
                        }
                      `}
                    >
                      {template.difficulty}
                    </Badge>
                  </div>
                  <p className="text-text-muted text-sm leading-relaxed line-clamp-3">
                    {template.description}
                  </p>
                </div>

                {/* Enhanced Stats Grid */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass-surface p-3 rounded-xl border border-green-200/50 hover:border-green-300/70 transition-colors">
                      <div className="flex items-center gap-2 text-sm">
                        <Star className="w-4 h-4 text-green-500" />
                        <span className="text-text-muted">New cards</span>
                      </div>
                      <div className="text-lg font-bold text-text-primary mt-1">
                        {template.settings.new_cards_per_day}/day
                      </div>
                    </div>
                    <div className="glass-surface p-3 rounded-xl border border-blue-200/50 hover:border-blue-300/70 transition-colors">
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="w-4 h-4 text-blue-500" />
                        <span className="text-text-muted">Max reviews</span>
                      </div>
                      <div className="text-lg font-bold text-text-primary mt-1">
                        {template.settings.max_reviews_per_day}
                      </div>
                    </div>
                    <div className="glass-surface p-3 rounded-xl border border-purple-200/50 hover:border-purple-300/70 transition-colors">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-purple-500" />
                        <span className="text-text-muted">Graduation</span>
                      </div>
                      <div className="text-lg font-bold text-text-primary mt-1">
                        {template.settings.graduating_interval}d
                      </div>
                    </div>
                    <div className="glass-surface p-3 rounded-xl border border-orange-200/50 hover:border-orange-300/70 transition-colors">
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4 text-orange-500" />
                        <span className="text-text-muted">Start ease</span>
                      </div>
                      <div className="text-lg font-bold text-text-primary mt-1">
                        {template.settings.starting_ease.toFixed(1)}
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Tags */}
                  <div className="flex flex-wrap gap-2">
                    {template.tags.slice(0, 3).map((tag, tagIndex) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs px-3 py-1 glass-surface border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10 transition-colors"
                        style={{
                          animationDelay: `${index * 120 + tagIndex * 50}ms`,
                          animation: "slideInUp 0.4s ease-out both",
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 3 && (
                      <Badge
                        variant="outline"
                        className="text-xs px-3 py-1 glass-surface border-text-muted/30 text-text-muted"
                      >
                        +{template.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Enhanced Create Project Form */}
      {selectedTemplate && (
        <Card className="p-8 glass-surface border-2 border-brand-primary/30 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5">
          <div className="flex items-center gap-4 mb-8">
            <div
              className={`w-12 h-12 bg-gradient-to-br ${selectedTemplate.color} rounded-2xl flex items-center justify-center shadow-lg`}
            >
              <selectedTemplate.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                Create Project from Template
              </h3>
              <p className="text-text-muted">{selectedTemplate.name}</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Enhanced Input Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                  <span>Project Name</span>
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={selectedTemplate.name}
                  className="glass-surface border-brand-primary/30 focus:border-brand-primary h-12 text-text-primary placeholder:text-text-muted"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-text-secondary">
                  Category
                </label>
                <Input
                  value={selectedTemplate.category}
                  disabled
                  className="glass-surface bg-surface-muted border-text-muted/20 h-12 text-text-muted"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-text-secondary">
                Description
              </label>
              <textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder={selectedTemplate.description}
                rows={4}
                className="w-full p-4 glass-surface border border-brand-primary/30 focus:border-brand-primary rounded-xl text-text-primary placeholder:text-text-muted resize-none transition-colors"
              />
            </div>

            {/* Enhanced Template Settings Preview */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-text-secondary flex items-center gap-2">
                <Target className="w-5 h-5 text-brand-primary" />
                Template Settings Preview
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-surface p-4 rounded-xl border border-green-200/50 bg-gradient-to-br from-green-50/50 to-transparent">
                  <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
                    <Star className="w-4 h-4" />
                    <span className="font-medium">New Cards/Day</span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary">
                    {selectedTemplate.settings.new_cards_per_day}
                  </div>
                </div>
                <div className="glass-surface p-4 rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50/50 to-transparent">
                  <div className="flex items-center gap-2 text-sm text-blue-600 mb-2">
                    <Target className="w-4 h-4" />
                    <span className="font-medium">Max Reviews/Day</span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary">
                    {selectedTemplate.settings.max_reviews_per_day}
                  </div>
                </div>
                <div className="glass-surface p-4 rounded-xl border border-purple-200/50 bg-gradient-to-br from-purple-50/50 to-transparent">
                  <div className="flex items-center gap-2 text-sm text-purple-600 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">Graduation</span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary">
                    {selectedTemplate.settings.graduating_interval} day
                    {selectedTemplate.settings.graduating_interval !== 1
                      ? "s"
                      : ""}
                  </div>
                </div>
                <div className="glass-surface p-4 rounded-xl border border-orange-200/50 bg-gradient-to-br from-orange-50/50 to-transparent">
                  <div className="flex items-center gap-2 text-sm text-orange-600 mb-2">
                    <Zap className="w-4 h-4" />
                    <span className="font-medium">Starting Ease</span>
                  </div>
                  <div className="text-2xl font-bold text-text-primary">
                    {selectedTemplate.settings.starting_ease.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={() => createProjectFromTemplate(selectedTemplate)}
                disabled={isCreating || !customName.trim()}
                className="flex-1 h-14 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold rounded-xl shadow-brand hover:shadow-brand-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isCreating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                    Creating Project...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 mr-3" />
                    Create Project
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTemplate(null);
                  setCustomName("");
                  setCustomDescription("");
                }}
                className="h-14 px-8 glass-surface border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10 font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Enhanced Template Benefits */}
      <Card className="p-8 glass-surface border-2 border-brand-primary/20 bg-gradient-to-br from-brand-primary/5 to-transparent">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center shadow-lg">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
            Template Benefits
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4 group">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
              <Check className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-2">
              <div className="font-bold text-lg text-text-primary group-hover:text-brand-primary transition-colors">
                Optimized Settings
              </div>
              <div className="text-text-muted leading-relaxed">
                Pre-configured SRS parameters based on proven learning research
                and cognitive science principles
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-2">
              <div className="font-bold text-lg text-text-primary group-hover:text-brand-primary transition-colors">
                Quick Start
              </div>
              <div className="text-text-muted leading-relaxed">
                Get studying immediately without complex configuration or setup
                time
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 group">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-2">
              <div className="font-bold text-lg text-text-primary group-hover:text-brand-primary transition-colors">
                Best Practices
              </div>
              <div className="text-text-muted leading-relaxed">
                Based on successful learning methodologies and spaced repetition
                algorithms
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
