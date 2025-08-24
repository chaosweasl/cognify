"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { NormalizedProject } from "@/lib/utils/normalizeProject";
import {
  Plus,
  Save,
  Loader2,
  BookOpen,
  CheckCircle2,
  Edit3,
  Sparkles,
  ArrowLeft,
  Settings,
  Type,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
} from "lucide-react";

// Mock data for demonstration
const mockProject = {
  id: "1",
  name: "Spanish Vocabulary",
  description: "Essential Spanish words for everyday conversation",
  new_cards_per_day: 20,
  max_reviews_per_day: 100,
  learning_steps: [1, 10],
  relearning_steps: [10],
  graduating_interval: 1,
  easy_interval: 4,
  starting_ease: 2.5,
  minimum_ease: 1.3,
  easy_bonus: 1.3,
  hard_interval_factor: 1.2,
  leech_threshold: 8,
  max_interval: 36500,
  lapse_ease_penalty: 0.2,
  lapse_recovery_factor: 0.5,
  new_card_order: "random",
  leech_action: "suspend",
  review_ahead: false,
  bury_siblings: false,
};

const mockFlashcards = [
  { id: "1", front: 'What is "hello" in Spanish?', back: "Hola" },
  { id: "2", front: 'How do you say "goodbye"?', back: "Adiós" },
  { id: "3", front: "", back: "" },
];

export function FlashcardEditor({ project }: { project?: NormalizedProject }) {
  const router = useRouter();
  // Use project data or fallback to mock data
  console.log("Project data:", project);
  const [flashcards, setFlashcards] = useState(mockFlashcards);
  const [current, setCurrent] = useState(0);
  const [name, setName] = useState(mockProject.name);
  const [description, setDescription] = useState(mockProject.description);
  const [newCardsPerDay, setNewCardsPerDay] = useState(
    mockProject.new_cards_per_day
  );
  const [maxReviewsPerDay, setMaxReviewsPerDay] = useState(
    mockProject.max_reviews_per_day
  );
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const saving = false; // TODO: implement actual saving state
  const isAddingCard = useRef(false);

  const handleGoBack = () => {
    router.push("/projects");
  };

  const handleChange = (field: string, value: string) => {
    setFlashcards((prev) => {
      const updated = [...prev];
      if (!updated[current]) {
        updated[current] = { id: `temp-${Date.now()}`, front: "", back: "" };
      }
      updated[current] = { ...updated[current], [field]: value };
      return updated;
    });
  };

  const handleAdd = () => {
    isAddingCard.current = true;
    setFlashcards((prev) => [...prev, { id: `temp-${Date.now()}`, front: "", back: "" }]);
  };

  useEffect(() => {
    if (isAddingCard.current) {
      setCurrent(flashcards.length - 1);
      isAddingCard.current = false;
    }
  }, [flashcards.length]);

  const navigate = (dir: number) => {
    setCurrent((p) => Math.max(0, Math.min(p + dir, flashcards.length - 1)));
  };

  const handleDelete = () => {
    if (flashcards.length <= 1) return;
    setFlashcards((prev) => {
      const updated = [...prev.slice(0, current), ...prev.slice(current + 1)];
      return updated;
    });
    setCurrent((prev) => Math.max(0, prev - 1));
  };

  const card = flashcards[current] || { id: "temp", front: "", back: "" };
  const currentCardValid = card.front?.trim() || card.back?.trim();
  const isValid = flashcards.some(fc => fc.front?.trim() || fc.back?.trim());
  const progressPercent =
    flashcards.length > 0 ? ((current + 1) / flashcards.length) * 100 : 0;

  return (
    <div className="min-h-screen surface-primary relative overflow-hidden">
      {/* Enhanced animated background elements matching projects page */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-15">
        <div
          className="absolute top-0 right-0 w-96 h-96 bg-gradient-glass rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-r from-brand-secondary/30 to-brand-accent/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "12s", animationDelay: "4s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-primary/20 rounded-full blur-2xl animate-pulse"
          style={{ animationDuration: "10s", animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/4 left-1/4 w-40 h-40 bg-gradient-glass rounded-full blur-3xl animate-pulse opacity-40"
          style={{ animationDuration: "3s" }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-gradient-to-r from-brand-secondary/20 to-brand-accent/20 rounded-full blur-2xl animate-pulse opacity-50"
          style={{ animationDuration: "4s", animationDelay: "1s" }}
        />
        <div
          className="absolute top-3/4 left-1/3 w-20 h-20 bg-gradient-to-r from-brand-tertiary/15 to-brand-primary/15 rounded-full blur-2xl animate-pulse opacity-40"
          style={{ animationDuration: "6s", animationDelay: "3s" }}
        />
      </div>
      <div className="relative container mx-auto px-6 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-12 animate-[slideUp_0.6s_ease-out]">
          <div className="flex items-start gap-6 mb-8">
            <button 
              onClick={handleGoBack}
              className="p-3 surface-elevated glass-surface border border-subtle rounded-2xl hover:surface-glass hover:shadow-brand hover:scale-105 transition-all transition-normal group"
            >
              <ArrowLeft className="w-5 h-5 text-secondary group-hover:text-brand-primary transition-colors" />
            </button>

            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-brand rounded-3xl flex items-center justify-center shadow-brand hover:shadow-brand-lg hover:scale-110 transition-all transition-slow group cursor-pointer">
                    <Edit3 className="w-8 h-8 text-white group-hover:rotate-12 transition-transform transition-normal" />
                  </div>
                  <div className="absolute -inset-2 bg-gradient-glass rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity transition-normal" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-text-primary via-brand-primary to-brand-secondary bg-clip-text text-transparent mb-2">
                    Edit Project
                  </h1>
                  <p className="text-xl text-secondary font-medium">
                    Fine-tune your flashcards and study settings
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-3 mt-6 animate-[slideUp_1s_ease-out_0.4s_both]">
            {isValid && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-full flex items-center gap-2 font-medium hover:scale-105 transition-transform transition-fast">
                <CheckCircle2 className="w-4 h-4" />
                Ready to Save
              </div>
            )}
            {currentCardValid && (
              <div className="bg-brand-primary/10 border border-brand-primary/30 text-brand-primary px-4 py-2 rounded-full flex items-center gap-2 font-medium hover:scale-105 transition-transform transition-fast">
                <Sparkles className="w-4 h-4" />
                Current Card Valid
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
          {/* Left Column - Project Settings */}
          <div className="xl:col-span-1 space-y-8">
            {/* Project Info */}
            <div className="surface-elevated glass-surface border border-subtle rounded-3xl p-8 hover:surface-glass hover:shadow-brand transition-all transition-normal animate-[slideUp_1.2s_ease-out_0.6s_both]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-brand">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-primary">
                    Project Details
                  </h2>
                  <p className="text-secondary">Basic information</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="group">
                  <label className="block text-sm font-semibold text-secondary mb-3">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full px-4 py-4 rounded-2xl surface-secondary border-2 border-secondary transition-all transition-normal text-primary placeholder:text-muted ${
                      focusedField === "name"
                        ? "border-brand-primary surface-elevated shadow-brand scale-[1.02]"
                        : "hover:border-primary"
                    }`}
                    placeholder="Enter project name..."
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-secondary mb-3">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onFocus={() => setFocusedField("description")}
                    onBlur={() => setFocusedField(null)}
                    rows={3}
                    className={`w-full px-4 py-4 rounded-2xl surface-secondary border-2 border-secondary transition-all transition-normal text-primary placeholder:text-muted resize-none ${
                      focusedField === "description"
                        ? "border-brand-primary surface-elevated shadow-brand scale-[1.01]"
                        : "hover:border-primary"
                    }`}
                    placeholder="Describe your project..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-3">
                      New Cards/Day
                    </label>
                    <input
                      type="number"
                      value={newCardsPerDay}
                      onChange={(e) =>
                        setNewCardsPerDay(parseInt(e.target.value) || 0)
                      }
                      className="w-full px-4 py-3 rounded-xl surface-secondary border-2 border-secondary hover:border-primary focus:border-brand-primary focus:surface-elevated transition-all transition-normal text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-3">
                      Max Reviews/Day
                    </label>
                    <input
                      type="number"
                      value={maxReviewsPerDay}
                      onChange={(e) =>
                        setMaxReviewsPerDay(parseInt(e.target.value) || 0)
                      }
                      className="w-full px-4 py-3 rounded-xl surface-secondary border-2 border-secondary hover:border-primary focus:border-brand-primary focus:surface-elevated transition-all transition-normal text-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SRS Settings Preview */}
            <div className="surface-elevated glass-surface border border-subtle rounded-3xl p-8 hover:surface-glass hover:shadow-brand transition-all transition-normal animate-[slideUp_1.4s_ease-out_0.8s_both]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-brand-secondary to-brand-accent rounded-2xl flex items-center justify-center shadow-brand">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-primary">
                    Study Settings
                  </h2>
                  <p className="text-secondary">Spaced repetition config</p>
                </div>
              </div>

              {!showAdvancedSettings ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-subtle">
                    <span className="font-medium text-secondary">
                      Learning Steps
                    </span>
                    <span className="text-muted">1, 10 min</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-subtle">
                    <span className="font-medium text-secondary">
                      Graduating Interval
                    </span>
                    <span className="text-muted">1 day</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-subtle">
                    <span className="font-medium text-secondary">
                      Starting Ease
                    </span>
                    <span className="text-muted">250%</span>
                  </div>
                  <button 
                    onClick={() => setShowAdvancedSettings(true)}
                    className="w-full mt-4 px-4 py-3 bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20 rounded-xl font-medium hover:bg-brand-secondary/20 transition-colors transition-fast"
                  >
                    Advanced Settings
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-secondary mb-2">
                        Learning Steps (min)
                      </label>
                      <input
                        type="text"
                        defaultValue="1, 10"
                        className="w-full px-3 py-2 rounded-lg surface-secondary border border-secondary hover:border-primary focus:border-brand-primary transition-all transition-fast text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-secondary mb-2">
                        Graduating Interval (days)
                      </label>
                      <input
                        type="number"
                        defaultValue="1"
                        className="w-full px-3 py-2 rounded-lg surface-secondary border border-secondary hover:border-primary focus:border-brand-primary transition-all transition-fast text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-secondary mb-2">
                        Starting Ease (%)
                      </label>
                      <input
                        type="number"
                        defaultValue="250"
                        className="w-full px-3 py-2 rounded-lg surface-secondary border border-secondary hover:border-primary focus:border-brand-primary transition-all transition-fast text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-secondary mb-2">
                        Easy Interval (days)
                      </label>
                      <input
                        type="number"
                        defaultValue="4"
                        className="w-full px-3 py-2 rounded-lg surface-secondary border border-secondary hover:border-primary focus:border-brand-primary transition-all transition-fast text-primary"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowAdvancedSettings(false)}
                    className="w-full mt-4 px-4 py-3 bg-muted/10 text-muted border border-subtle rounded-xl font-medium hover:bg-muted/20 transition-colors transition-fast"
                  >
                    Hide Advanced Settings
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Flashcard Editor */}
          <div className="xl:col-span-2">
            <div className="surface-elevated glass-surface border border-subtle rounded-3xl overflow-hidden hover:surface-glass hover:shadow-brand transition-all transition-normal animate-[slideUp_1.6s_ease-out_1s_both]">
              {/* Editor Header */}
              <div className="p-8 border-b border-subtle">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-brand">
                      <Edit3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-primary">
                        Flashcard Editor
                      </h2>
                      <p className="text-secondary">
                        Create and edit your study cards
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleAdd}
                    className="px-6 py-3 bg-gradient-brand text-white rounded-2xl font-semibold hover:shadow-brand-lg hover:scale-105 transition-all transition-normal flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Card
                  </button>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-3 px-4 py-2 surface-secondary rounded-2xl">
                    <div className="w-3 h-3 bg-gradient-brand rounded-full animate-pulse" />
                    <span className="text-sm font-semibold text-secondary">
                      Card {current + 1} of {flashcards.length}
                    </span>
                  </div>
                  {currentCardValid && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Valid
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 surface-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-brand rounded-full transition-all transition-slow ease-out relative"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30 animate-pulse" />
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-8">
                <div className="space-y-8">
                  {/* Front Side */}
                  <div className="group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-xl flex items-center justify-center shadow-brand">
                        <Type className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-primary">
                          Front Side
                        </h3>
                        <p className="text-secondary text-sm">
                          Question or prompt
                        </p>
                      </div>
                    </div>
                    <textarea
                      value={card.front || ""}
                      onChange={(e) => handleChange("front", e.target.value)}
                      placeholder="What would you like to ask? Be clear and specific..."
                      rows={4}
                      className="w-full px-6 py-4 rounded-2xl surface-secondary border-2 border-secondary hover:border-primary focus:border-brand-primary focus:surface-elevated focus:shadow-brand transition-all transition-normal text-primary placeholder:text-muted resize-none text-lg"
                    />
                  </div>

                  {/* Visual Separator */}
                  <div className="flex items-center justify-center py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-px border-secondary w-20" />
                      <div className="w-8 h-8 bg-gradient-to-br from-brand-secondary to-brand-accent rounded-full flex items-center justify-center animate-pulse shadow-brand">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                      <div className="h-px border-secondary w-20" />
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-brand-secondary to-brand-accent rounded-xl flex items-center justify-center shadow-brand">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-primary">
                          Back Side
                        </h3>
                        <p className="text-secondary text-sm">
                          Answer or explanation
                        </p>
                      </div>
                    </div>
                    <textarea
                      value={card.back || ""}
                      onChange={(e) => handleChange("back", e.target.value)}
                      placeholder="Provide a clear, concise answer..."
                      rows={4}
                      className="w-full px-6 py-4 rounded-2xl surface-secondary border-2 border-secondary hover:border-primary focus:border-brand-secondary focus:surface-elevated focus:shadow-brand transition-all transition-normal text-primary placeholder:text-muted resize-none text-lg"
                    />
                  </div>

                  {/* Card Preview */}
                  {(card.front?.trim() || card.back?.trim()) && (
                    <div className="mt-8 p-6 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl animate-[slideUp_0.4s_ease-out]">
                      <div className="flex items-center gap-2 mb-4">
                        <Eye className="w-4 h-4 text-brand-primary" />
                        <span className="text-sm font-semibold text-brand-primary">
                          Card Preview
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {card.front?.trim() && (
                          <div className="surface-elevated rounded-xl p-4 shadow-brand border border-subtle">
                            <div className="text-xs text-muted uppercase tracking-wider font-semibold mb-2">
                              Front
                            </div>
                            <div className="text-primary">{card.front}</div>
                          </div>
                        )}
                        {card.back?.trim() && (
                          <div className="surface-elevated rounded-xl p-4 shadow-brand border border-subtle">
                            <div className="text-xs text-muted uppercase tracking-wider font-semibold mb-2">
                              Back
                            </div>
                            <div className="text-primary">{card.back}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Footer */}
              <div className="p-6 surface-secondary border-t border-subtle">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigate(-1)}
                    disabled={current === 0}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all transition-normal disabled:opacity-40 disabled:cursor-not-allowed text-brand-primary surface-elevated hover:surface-glass hover:scale-105 border border-brand-primary/20"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                  </button>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleDelete}
                      disabled={flashcards.length <= 1}
                      className="p-3 text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-xl transition-all transition-normal disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    onClick={() => navigate(1)}
                    disabled={current === flashcards.length - 1}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all transition-normal disabled:opacity-40 disabled:cursor-not-allowed text-brand-primary surface-elevated hover:surface-glass hover:scale-105 border border-brand-primary/20"
                  >
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-4 animate-[slideUp_2s_ease-out_1.2s_both]">
          <button 
            onClick={handleGoBack}
            className="px-8 py-4 border-2 border-subtle text-secondary rounded-2xl font-semibold hover:surface-glass hover:border-brand hover:text-brand-primary hover:scale-105 transition-all transition-normal"
          >
            Cancel
          </button>
          <button
            disabled={!isValid || saving}
            className={`px-8 py-4 rounded-2xl font-semibold transition-all transition-normal flex items-center gap-3 ${
              isValid && !saving
                ? "bg-gradient-brand text-white hover:shadow-brand-lg hover:scale-105"
                : "surface-secondary text-muted cursor-not-allowed border border-subtle"
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Project
              </>
            )}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
