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
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateProject } from "@/app/(main)/projects/actions";
import { CacheInvalidation } from "@/hooks/useCache";
import { replaceAllFlashcardsForProject } from "@/app/(main)/projects/actions/flashcard-actions";
import { PDFUploadModal } from "./PDFUploadModal";
import { FlashcardJsonImporter } from "./FlashcardJsonImporter";
import { FlashcardExporter } from "./FlashcardExporter";
import { FlashcardDuplicateDetector } from "./FlashcardDuplicateDetector";
import { useAISettings } from "@/hooks/useAISettings";
import { BYOBanner } from "@/src/components/ui/byo-banner";
import type { Project, Flashcard } from "@/src/types";

interface FlashcardEditorProps {
  project: Project;
  initialFlashcards: Flashcard[];
  onSaved?: () => void;
}

interface GeneratedFlashcard {
  id: string;
  front: string;
  back: string;
}

export function FlashcardEditor({
  project,
  initialFlashcards,
  onSaved,
}: FlashcardEditorProps) {
  const router = useRouter();
  const { isConfigValid, aiEnabled } = useAISettings();
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
  const [showPDFUpload, setShowPDFUpload] = useState(false);
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

  const handleFlashcardsGenerated = (
    generatedFlashcards: GeneratedFlashcard[]
  ) => {
    // Add the generated flashcards to the existing ones
    const newFlashcards = generatedFlashcards.map((card) => ({
      id: card.id,
      front: card.front,
      back: card.back,
    }));

    setFlashcards((prev) => [...prev, ...newFlashcards]);

    // Navigate to the first newly added card
    const newCardIndex = flashcards.length;
    setCurrent(newCardIndex);

    toast.success(
      `Added ${generatedFlashcards.length} AI-generated flashcards!`
    );
  };

  // Handle JSON import
  const handleImportFlashcards = (
    importedFlashcards: { front: string; back: string }[]
  ) => {
    const newFlashcards = importedFlashcards.map((card, index) => ({
      id: `imported_${Date.now()}_${index}`,
      front: card.front,
      back: card.back,
    }));

    setFlashcards((prev) => [...prev, ...newFlashcards]);

    // Navigate to the first newly imported card
    const newCardIndex = flashcards.length;
    setCurrent(newCardIndex);

    toast.success(
      `Imported ${importedFlashcards.length} flashcard${
        importedFlashcards.length !== 1 ? "s" : ""
      }!`
    );
  };

  // Handle duplicate detection and merging
  const handleMergeDuplicates = async (flashcardIdsToDelete: string[]) => {
    // For local state management, just remove the cards by ID
    setFlashcards((prev) =>
      prev.filter((card) => !flashcardIdsToDelete.includes(card.id))
    );

    // Adjust current index if needed
    setCurrent((prev) => {
      const newFlashcards = flashcards.filter(
        (card) => !flashcardIdsToDelete.includes(card.id)
      );
      return Math.min(prev, Math.max(0, newFlashcards.length - 1));
    });

    // Note: The actual deletion from the database will happen when the user saves
    // This is consistent with how the editor works - changes are local until save
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
              className="p-3 surface-glass backdrop-blur-sm border border-subtle rounded-2xl hover:surface-elevated hover:shadow-lg hover:scale-105 transition-all duration-300 group"
              onClick={() => router.back()}
              aria-label="Back to project"
            >
              <ArrowLeft className="w-5 h-5 text-muted group-hover:brand-primary transition-colors" />
            </button>

            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-accent rounded-3xl flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-500 group cursor-pointer">
                    <Edit3 className="w-8 h-8 text-white group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-text-primary via-brand-primary to-brand-secondary bg-clip-text text-transparent mb-2">
                    Edit Project
                  </h1>
                  <p className="text-xl text-muted font-medium">
                    Fine-tune your flashcards and study settings
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {/* AI Upload Button */}
                  {aiEnabled && (
                    <button
                      onClick={() => setShowPDFUpload(true)}
                      disabled={!isConfigValid()}
                      className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 hover:scale-105 ${
                        isConfigValid()
                          ? "bg-gradient-brand text-white hover:bg-gradient-brand-hover shadow-brand hover:shadow-brand-lg"
                          : "surface-elevated text-muted cursor-not-allowed"
                      }`}
                    >
                      <Zap className="w-5 h-5" />
                      <span className="hidden sm:inline">
                        Generate from PDF
                      </span>
                      <span className="sm:hidden">AI</span>
                    </button>
                  )}

                  {/* JSON Import Button */}
                  <FlashcardJsonImporter
                    onImport={handleImportFlashcards}
                    existingFlashcards={flashcards.map((card) => ({
                      front: card.front,
                      back: card.back,
                    }))}
                    disabled={saving}
                  />

                  {/* JSON Export Button */}
                  <FlashcardExporter
                    flashcards={flashcards.map(
                      (card) => ({ ...card, extra: {} } as Flashcard)
                    )}
                    projectName={name}
                    disabled={saving}
                  />

                  {/* Duplicate Detection Button */}
                  <FlashcardDuplicateDetector
                    flashcards={flashcards.map(
                      (card) => ({ ...card, extra: {} } as Flashcard)
                    )}
                    onMergeDuplicates={handleMergeDuplicates}
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap gap-3 mt-6 animate-[slideUp_1s_ease-out_0.4s_both]">
            {currentCardValid && (
              <div className="surface-elevated border border-brand-primary text-brand-primary px-4 py-2 rounded-full flex items-center gap-2 font-medium hover:scale-105 transition-transform duration-200">
                <Sparkles className="w-4 h-4" />
                Current Card Valid
              </div>
            )}
          </div>
        </div>

        {/* BYO Banner for AI features */}
        {aiEnabled && !isConfigValid() && (
          <div className="mb-8 animate-[slideUp_0.8s_ease-out_0.2s_both]">
            <BYOBanner variant="warning" showDismiss={true} />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
          {/* Left Column - Project Settings */}
          <div className="xl:col-span-1 space-y-8">
            {/* Project Info */}
            <div className="surface-glass backdrop-blur-sm border border-subtle rounded-3xl p-8 hover:surface-elevated hover:shadow-xl transition-all duration-300 animate-[slideUp_1.2s_ease-out_0.6s_both]">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-primary">
                    Project Details
                  </h2>
                  <p className="text-muted">Basic information</p>
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
                    className={`w-full px-4 py-4 rounded-2xl surface-secondary border-2 transition-all duration-300 text-primary placeholder:text-muted ${
                      focusedField === "name"
                        ? "border-brand surface-elevated shadow-brand-lg scale-[1.02]"
                        : "border-subtle hover:border-primary"
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
                    className={`w-full px-4 py-4 rounded-2xl surface-secondary border-2 transition-all duration-300 text-primary placeholder:text-muted resize-none ${
                      focusedField === "description"
                        ? "border-brand surface-elevated shadow-brand-lg scale-[1.01]"
                        : "border-subtle hover:border-primary"
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
                      className="w-full px-4 py-3 rounded-xl surface-secondary border-2 border-subtle hover:border-primary focus:border-brand focus:surface-elevated transition-all duration-300 text-primary"
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
                      className="w-full px-4 py-3 rounded-xl surface-secondary border-2 border-subtle hover:border-primary focus:border-brand focus:surface-elevated transition-all duration-300 text-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SRS Settings Preview */}
            <div className="surface-glass backdrop-blur-sm border border-subtle rounded-3xl p-8 hover:surface-elevated hover:shadow-xl transition-all duration-300 animate-[slideUp_1.4s_ease-out_0.8s_both]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-primary">
                    Study Settings
                  </h2>
                  <p className="text-muted">Spaced repetition config</p>
                </div>
              </div>

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
                <button className="w-full mt-4 px-4 py-3 surface-secondary text-brand rounded-xl font-medium hover:surface-elevated transition-colors duration-200">
                  Advanced Settings
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Flashcard Editor */}
          <div className="xl:col-span-2">
            <div className="surface-primary/80 backdrop-blur-sm border border-subtle rounded-3xl overflow-hidden hover:surface-primary hover:shadow-xl transition-all duration-300 animate-[slideUp_1.6s_ease-out_1s_both]">
              {/* Editor Header */}
              <div className="p-8 border-b border-subtle">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-accent rounded-2xl flex items-center justify-center">
                      <Edit3 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-primary">
                        Flashcard Editor
                      </h2>
                      <p className="text-muted">
                        Create and edit your study cards
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleAdd}
                    className="px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-2xl font-semibold hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Card
                  </button>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-3 px-4 py-2 surface-secondary rounded-2xl">
                    <div className="w-3 h-3 bg-gradient-to-r from-brand-primary to-brand-accent rounded-full animate-pulse" />
                    <span className="text-sm font-semibold text-secondary">
                      Card {current + 1} of {flashcards.length}
                    </span>
                  </div>
                  {currentCardValid && (
                    <div className="flex items-center gap-2 px-3 py-2 surface-elevated border border-status-success text-status-success rounded-xl text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Valid
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 surface-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-primary to-brand-accent rounded-full transition-all duration-500 ease-out relative"
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
                      <div className="w-10 h-10 bg-gradient-to-br from-brand-primary to-blue-600 rounded-xl flex items-center justify-center">
                        <Type className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-primary">
                          Front Side
                        </h3>
                        <p className="text-muted text-sm">Question or prompt</p>
                      </div>
                    </div>
                    <textarea
                      value={card.front || ""}
                      onChange={(e) => handleChange("front", e.target.value)}
                      placeholder="What would you like to ask? Be clear and specific..."
                      rows={4}
                      className="w-full px-6 py-4 rounded-2xl surface-secondary border-2 border-subtle hover:border-brand focus:border-brand-primary focus:surface-primary focus:shadow-lg transition-all duration-300 text-primary placeholder:text-muted resize-none text-lg"
                    />
                  </div>

                  {/* Visual Separator */}
                  <div className="flex items-center justify-center py-6">
                    <div className="flex items-center gap-4">
                      <div className="h-px border-subtle w-20" />
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center animate-pulse">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                      <div className="h-px border-subtle w-20" />
                    </div>
                  </div>

                  {/* Back Side */}
                  <div className="group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-primary">
                          Back Side
                        </h3>
                        <p className="text-muted text-sm">
                          Answer or explanation
                        </p>
                      </div>
                    </div>
                    <textarea
                      value={card.back || ""}
                      onChange={(e) => handleChange("back", e.target.value)}
                      placeholder="Provide a clear, concise answer..."
                      rows={4}
                      className="w-full px-6 py-4 rounded-2xl surface-secondary border-2 border-subtle hover:border-brand focus:border-brand-secondary focus:surface-primary focus:shadow-lg transition-all duration-300 text-primary placeholder:text-muted resize-none text-lg"
                    />
                  </div>

                  {/* Card Preview */}
                  {(card.front?.trim() || card.back?.trim()) && (
                    <div className="mt-8 p-6 bg-gradient-to-br from-brand-primary to-brand-accent border border-brand-primary rounded-2xl animate-[slideUp_0.4s_ease-out]">
                      <div className="flex items-center gap-2 mb-4">
                        <Eye className="w-4 h-4 text-brand-primary" />
                        <span className="text-sm font-semibold text-brand-primary">
                          Card Preview
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {card.front?.trim() && (
                          <div className="surface-primary rounded-xl p-4 shadow-sm">
                            <div className="text-xs text-muted uppercase tracking-wider font-semibold mb-2">
                              Front
                            </div>
                            <div className="text-primary">{card.front}</div>
                          </div>
                        )}
                        {card.back?.trim() && (
                          <div className="surface-primary rounded-xl p-4 shadow-sm">
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
              <div className="p-6 surface-secondary/80 border-t border-subtle">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigate(-1)}
                    disabled={current === 0}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed text-brand-primary surface-elevated hover:surface-elevated hover:scale-105"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                  </button>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleDelete}
                      disabled={flashcards.length <= 1}
                      className="p-3 text-status-error surface-elevated hover:surface-elevated rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    onClick={() => navigate(1)}
                    disabled={current === flashcards.length - 1}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed text-brand-primary surface-elevated hover:surface-elevated hover:scale-105"
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
            className="px-8 py-4 border-2 border-subtle text-secondary rounded-2xl font-semibold hover:surface-secondary hover:scale-105 transition-all duration-300"
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
                ? "bg-gradient-to-r from-brand-primary to-brand-accent text-white hover:shadow-xl hover:scale-105"
                : "surface-elevated text-muted cursor-not-allowed"
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

      {/* PDF Upload Modal */}
      <PDFUploadModal
        isOpen={showPDFUpload}
        onClose={() => setShowPDFUpload(false)}
        projectId={project.id}
        onFlashcardsGenerated={handleFlashcardsGenerated}
      />

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
