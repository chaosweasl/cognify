"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateProject } from "@/app/(main)/projects/actions";
import { CacheInvalidation } from "@/hooks/useCache";
import { replaceAllFlashcardsForProject } from "@/app/(main)/projects/actions/flashcard-actions";
import type { Project, Flashcard } from "@/src/types";

interface FlashcardEditorProps {
  project: Project;
  initialFlashcards: Flashcard[];
  onSaved?: () => void;
}

export function FlashcardEditor({
  project,
  initialFlashcards,
  onSaved,
}: FlashcardEditorProps) {
  const router = useRouter();
  const [flashcards, setFlashcards] = useState<
    Pick<Flashcard, "id" | "front" | "back">[]
  >(initialFlashcards.map(({ id, front, back }) => ({ id, front, back })));
  const [current, setCurrent] = useState(0);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [newCardsPerDay, setNewCardsPerDay] = useState(
    project.new_cards_per_day
  );
  const [maxReviewsPerDay, setMaxReviewsPerDay] = useState(
    project.max_reviews_per_day
  );
  const [saving, setSaving] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const isAddingCard = useRef(false);

  const handleChange = (field: string, value: string) => {
    setFlashcards((prev) => {
      const updated = [...prev];
      if (!updated[current]) {
        updated[current] = { id: `${Date.now()}`, front: "", back: "" };
      }
      updated[current] = { ...updated[current], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProject({
        id: project.id,
        name,
        description,
        new_cards_per_day: newCardsPerDay,
        max_reviews_per_day: maxReviewsPerDay,
      });
      // Invalidate client-side cache for projects list and this project
      CacheInvalidation.invalidate("user_projects");
      CacheInvalidation.invalidate(`project_${project.id}`);

      const cardsToSave = flashcards
        .filter((card) => card.front?.trim() || card.back?.trim())
        .map((card) => ({ front: card.front, back: card.back }));
      await replaceAllFlashcardsForProject(project.id, cardsToSave);
      toast.success("Project saved successfully!");
      if (onSaved) onSaved();
    } catch (error) {
      console.error("Failed to save project:", error);
      toast.error("Failed to save project. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = () => {
    isAddingCard.current = true;
    setFlashcards((prev) => [
      ...prev,
      { id: `${Date.now()}`, front: "", back: "" },
    ]);
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

  const card = flashcards[current] || { front: "", back: "" };
  const currentCardValid = card.front?.trim() || card.back?.trim();
  // Removed unused completedCards
  const progressPercent =
    flashcards.length > 0 ? ((current + 1) / flashcards.length) * 100 : 0;

  return (
    <div className="min-h-screen relative overflow-hidden">
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
              className="p-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl hover:bg-white hover:shadow-lg hover:scale-105 transition-all duration-300 group"
              onClick={() => router.back()}
              aria-label="Back to project"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
            </button>

            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-500 group cursor-pointer">
                    <Edit3 className="w-8 h-8 text-white group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2">
                    Edit Project
                  </h1>
                  <p className="text-xl text-gray-600 font-medium">
                    Fine-tune your flashcards and study settings
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-3 mt-6 animate-[slideUp_1s_ease-out_0.4s_both]">
            {currentCardValid && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-full flex items-center gap-2 font-medium hover:scale-105 transition-transform duration-200">
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
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-8 hover:bg-white hover:shadow-xl transition-all duration-300 animate-[slideUp_1.2s_ease-out_0.6s_both]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Project Details
                  </h2>
                  <p className="text-gray-600">Basic information</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    className={`w-full px-4 py-4 rounded-2xl bg-gray-50 border-2 transition-all duration-300 text-gray-900 placeholder:text-gray-500 ${
                      focusedField === "name"
                        ? "border-blue-500 bg-white shadow-lg scale-[1.02]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    placeholder="Enter project name..."
                  />
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onFocus={() => setFocusedField("description")}
                    onBlur={() => setFocusedField(null)}
                    rows={3}
                    className={`w-full px-4 py-4 rounded-2xl bg-gray-50 border-2 transition-all duration-300 text-gray-900 placeholder:text-gray-500 resize-none ${
                      focusedField === "description"
                        ? "border-blue-500 bg-white shadow-lg scale-[1.01]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    placeholder="Describe your project..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      New Cards/Day
                    </label>
                    <input
                      type="number"
                      value={newCardsPerDay}
                      onChange={(e) =>
                        setNewCardsPerDay(parseInt(e.target.value) || 0)
                      }
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:bg-white transition-all duration-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Max Reviews/Day
                    </label>
                    <input
                      type="number"
                      value={maxReviewsPerDay}
                      onChange={(e) =>
                        setMaxReviewsPerDay(parseInt(e.target.value) || 0)
                      }
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:bg-white transition-all duration-300 text-gray-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SRS Settings Preview */}
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl p-8 hover:bg-white hover:shadow-xl transition-all duration-300 animate-[slideUp_1.4s_ease-out_0.8s_both]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Study Settings
                  </h2>
                  <p className="text-gray-600">Spaced repetition config</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="font-medium text-gray-700">
                    Learning Steps
                  </span>
                  <span className="text-gray-600">1, 10 min</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="font-medium text-gray-700">
                    Graduating Interval
                  </span>
                  <span className="text-gray-600">1 day</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="font-medium text-gray-700">
                    Starting Ease
                  </span>
                  <span className="text-gray-600">250%</span>
                </div>
                <button className="w-full mt-4 px-4 py-3 bg-purple-50 text-purple-700 rounded-xl font-medium hover:bg-purple-100 transition-colors duration-200">
                  Advanced Settings
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Flashcard Editor */}
          <div className="xl:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-3xl overflow-hidden hover:bg-white hover:shadow-xl transition-all duration-300 animate-[slideUp_1.6s_ease-out_1s_both]">
              {/* Editor Header */}
              <div className="p-8 border-b border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                      <Edit3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        Flashcard Editor
                      </h2>
                      <p className="text-gray-600">
                        Create and edit your study cards
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleAdd}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Card
                  </button>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-2xl">
                    <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse" />
                    <span className="text-sm font-semibold text-gray-700">
                      Card {current + 1} of {flashcards.length}
                    </span>
                  </div>
                  {currentCardValid && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Valid
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out relative"
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
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <Type className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Front Side
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Question or prompt
                        </p>
                      </div>
                    </div>
                    <textarea
                      value={card.front || ""}
                      onChange={(e) => handleChange("front", e.target.value)}
                      placeholder="What would you like to ask? Be clear and specific..."
                      rows={4}
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:shadow-lg transition-all duration-300 text-gray-900 placeholder:text-gray-500 resize-none text-lg"
                    />
                  </div>

                  {/* Visual Separator */}
                  <div className="flex items-center justify-center py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-px bg-gray-200 w-20" />
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                      <div className="h-px bg-gray-200 w-20" />
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Back Side
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Answer or explanation
                        </p>
                      </div>
                    </div>
                    <textarea
                      value={card.back || ""}
                      onChange={(e) => handleChange("back", e.target.value)}
                      placeholder="Provide a clear, concise answer..."
                      rows={4}
                      className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-gray-200 hover:border-gray-300 focus:border-purple-500 focus:bg-white focus:shadow-lg transition-all duration-300 text-gray-900 placeholder:text-gray-500 resize-none text-lg"
                    />
                  </div>

                  {/* Card Preview */}
                  {(card.front?.trim() || card.back?.trim()) && (
                    <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 rounded-2xl animate-[slideUp_0.4s_ease-out]">
                      <div className="flex items-center gap-2 mb-4">
                        <Eye className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-800">
                          Card Preview
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {card.front?.trim() && (
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
                              Front
                            </div>
                            <div className="text-gray-900">{card.front}</div>
                          </div>
                        )}
                        {card.back?.trim() && (
                          <div className="bg-white rounded-xl p-4 shadow-sm">
                            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-2">
                              Back
                            </div>
                            <div className="text-gray-900">{card.back}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation Footer */}
              <div className="p-6 bg-gray-50/80 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigate(-1)}
                    disabled={current === 0}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed text-blue-700 bg-blue-50 hover:bg-blue-100 hover:scale-105"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                  </button>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleDelete}
                      disabled={flashcards.length <= 1}
                      className="p-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    onClick={() => navigate(1)}
                    disabled={current === flashcards.length - 1}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed text-blue-700 bg-blue-50 hover:bg-blue-100 hover:scale-105"
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
            className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 hover:scale-105 transition-all duration-300"
            onClick={() => router.back()}
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!currentCardValid || saving}
            className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3 ${
              currentCardValid && !saving
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-xl hover:scale-105"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
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
