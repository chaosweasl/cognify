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
    <div className={`space-y-6 ${className}`}>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-primary">
          Choose a Project Template
        </h2>
        <p className="text-text-muted max-w-2xl mx-auto">
          Get started quickly with pre-configured settings optimized for
          different learning scenarios.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            variant={filterCategory === category ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template, index) => {
          const IconComponent = template.icon;
          const isSelected = selectedTemplate?.id === template.id;

          return (
            <Card
              key={template.id}
              className={`p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
                isSelected
                  ? "border-brand-primary bg-brand-primary/5 shadow-brand"
                  : "glass-surface border border-subtle hover:border-brand-primary/50"
              }`}
              style={{
                animationDelay: `${index * 100}ms`,
                animation: "slideInUp 0.6s ease-out both",
              }}
              onClick={() => handleTemplateSelect(template)}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${template.color} rounded-xl flex items-center justify-center shadow-lg`}
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  {isSelected && (
                    <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-primary">
                      {template.name}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {template.difficulty}
                    </Badge>
                  </div>
                  <p className="text-text-muted text-sm line-clamp-2">
                    {template.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1 text-text-muted">
                      <Star className="w-3 h-3 text-green-500" />
                      <span>{template.settings.new_cards_per_day} new/day</span>
                    </div>
                    <div className="flex items-center gap-1 text-text-muted">
                      <Target className="w-3 h-3 text-blue-500" />
                      <span>
                        {template.settings.max_reviews_per_day} max reviews
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-text-muted">
                      <Clock className="w-3 h-3 text-purple-500" />
                      <span>{template.settings.graduating_interval}d grad</span>
                    </div>
                    <div className="flex items-center gap-1 text-text-muted">
                      <Zap className="w-3 h-3 text-orange-500" />
                      <span>
                        {template.settings.starting_ease.toFixed(1)} ease
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {template.tags.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.tags.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Create Project Form */}
      {selectedTemplate && (
        <Card className="p-6 glass-surface border border-subtle">
          <h3 className="text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            <selectedTemplate.icon className="w-5 h-5 text-brand-primary" />
            Create Project from Template: {selectedTemplate.name}
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">
                  Project Name
                </label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={selectedTemplate.name}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">
                  Category
                </label>
                <Input
                  value={selectedTemplate.category}
                  disabled
                  className="bg-subtle"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary">
                Description
              </label>
              <textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder={selectedTemplate.description}
                rows={3}
                className="w-full p-3 surface-elevated border border-subtle rounded-lg text-primary resize-none"
              />
            </div>

            {/* Template Settings Preview */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-secondary">
                Template Settings
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="p-2 surface-elevated rounded-lg">
                  <div className="text-text-muted">New Cards/Day</div>
                  <div className="font-medium text-primary">
                    {selectedTemplate.settings.new_cards_per_day}
                  </div>
                </div>
                <div className="p-2 surface-elevated rounded-lg">
                  <div className="text-text-muted">Max Reviews/Day</div>
                  <div className="font-medium text-primary">
                    {selectedTemplate.settings.max_reviews_per_day}
                  </div>
                </div>
                <div className="p-2 surface-elevated rounded-lg">
                  <div className="text-text-muted">Graduation</div>
                  <div className="font-medium text-primary">
                    {selectedTemplate.settings.graduating_interval} day(s)
                  </div>
                </div>
                <div className="p-2 surface-elevated rounded-lg">
                  <div className="text-text-muted">Starting Ease</div>
                  <div className="font-medium text-primary">
                    {selectedTemplate.settings.starting_ease.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => createProjectFromTemplate(selectedTemplate)}
                disabled={isCreating || !customName.trim()}
                className="bg-brand-primary text-white"
              >
                {isCreating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
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
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Template Benefits */}
      <Card className="p-6 glass-surface border border-subtle">
        <h3 className="text-lg font-semibold text-primary mb-4">
          Template Benefits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-medium text-primary">Optimized Settings</div>
              <div className="text-text-muted">
                Pre-configured SRS parameters based on learning research
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-medium text-primary">Quick Start</div>
              <div className="text-text-muted">
                Get studying immediately without configuration
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-medium text-primary">Best Practices</div>
              <div className="text-text-muted">
                Based on successful learning methodologies
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
