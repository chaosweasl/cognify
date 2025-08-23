"use client";

import { useState, useEffect, useRef } from "react";
import { ManageFlashcardsModal } from "./ManageFlashcardsModal";
import { ProjectInfoForm } from "../projects/ProjectInfoForm";
import { ProjectSRSSettings } from "../projects/ProjectSRSSettings";
import { FlashcardCardEditor } from "./FlashcardCardEditor";
import { FlashcardNavigation } from "./FlashcardNavigation";
import { useRouter } from "next/navigation";
import {
  Plus,
  Save,
  X,
  Loader2,
  BookOpen,
  CheckCircle2,
  Edit3,
  Sparkles,
} from "lucide-react";
import { updateProject } from "@/app/(main)/projects/actions";
import { NormalizedProject } from "@/lib/utils/normalizeProject";
import { FlashcardJsonImporter } from "./FlashcardJsonImporter";
import { useFlashcardsStore } from "@/hooks/useFlashcards";
import { useProjectsStore } from "@/hooks/useProjects";
import ProjectResetComponent from "../projects/ProjectResetComponent";
import { CreateFlashcardData } from "../../types";
import { CacheInvalidation } from "@/hooks/useCache";

// Working flashcard type for the editor (without full database fields)
type EditorFlashcard = {
  id?: string; // Keep optional for internal use
  front: string;
  back: string;
};

// Main FlashcardEditor Component
interface FlashcardEditorProps {
  project: NormalizedProject;
}

export function FlashcardEditor({ project }: FlashcardEditorProps) {
  const router = useRouter();
  const {
    flashcards: dbFlashcards,
    loading: flashcardsLoading,
    fetchFlashcards,
    replaceAllFlashcards,
    reset: resetFlashcards,
  } = useFlashcardsStore();

  const { reset: resetProjects } = useProjectsStore();

  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [newCardsPerDay, setNewCardsPerDay] = useState(
    project.new_cards_per_day || 20
  );
  const [maxReviewsPerDay, setMaxReviewsPerDay] = useState(
    project.max_reviews_per_day || 100
  );
  const [projectUpdates, setProjectUpdates] = useState<
    Partial<NormalizedProject>
  >({});
  const [flashcards, setFlashcards] = useState<EditorFlashcard[]>([
    { front: "", back: "" },
  ]); // Always start with at least one card
  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const isAddingCard = useRef(false);

  // Load flashcards on component mount
  useEffect(() => {
    fetchFlashcards(project.id);
  }, [project.id, fetchFlashcards]);

  // Update local flashcards when database flashcards change
  useEffect(() => {
    const editorFlashcards = dbFlashcards
      .filter((card) => card && typeof card === "object") // Filter out null/undefined entries
      .map(
        (card): EditorFlashcard => ({
          id: card.id,
          front: card.front || "",
          back: card.back || "",
        })
      );

    // Ensure there's always at least one flashcard for editing
    if (editorFlashcards.length === 0) {
      editorFlashcards.push({ front: "", back: "" });
    }

    setFlashcards(editorFlashcards);

    // Only update current if it's out of bounds
    setCurrent((prevCurrent) => {
      if (prevCurrent >= editorFlashcards.length) {
        return Math.max(0, editorFlashcards.length - 1);
      }
      return prevCurrent;
    });
  }, [dbFlashcards]); // Removed 'current' from dependencies

  useEffect(() => {
    // Allow saving as long as project name is present
    setIsValid(
      typeof name === "string" &&
        typeof name.trim === "function" &&
        !!name.trim()
    );
  }, [flashcards, name]);

  function handleChange(field: "front" | "back", value: string) {
    setFlashcards((prev) => {
      const up = [...prev];
      // Ensure we have a valid card at current index
      if (!up[current]) {
        up[current] = { front: "", back: "" };
      }
      up[current] = { ...up[current], [field]: value };
      return up;
    });
  }

  function handleAdd() {
    isAddingCard.current = true;
    setFlashcards((prev) => [
      ...prev,
      {
        front: "",
        back: "",
      },
    ]);
  }

  // Handle current index update when cards are added
  useEffect(() => {
    if (isAddingCard.current) {
      setCurrent(flashcards.length - 1);
      isAddingCard.current = false;
    }
  }, [flashcards.length]);

  function handleJumpTo(idx: number) {
    setCurrent(idx);
  }

  function handleDeleteAt(idx: number) {
    setFlashcards((prev) => {
      const filtered = prev.filter((_, i) => i !== idx);
      // Ensure there's always at least one flashcard
      return filtered.length === 0 ? [{ front: "", back: "" }] : filtered;
    });
    // If deleting current card, move to previous or 0
    setCurrent((prev) => {
      if (idx < prev) return prev - 1;
      if (idx === prev) return Math.max(0, prev - 1);
      return prev;
    });
  }

  function handleDeleteAll() {
    setFlashcards([{ front: "", back: "" }]); // Always keep at least one card
    setCurrent(0);
  }

  function handleDelete() {
    if (flashcards.length <= 1) {
      // If only one card left, reset it instead of deleting
      setFlashcards([{ front: "", back: "" }]);
      setCurrent(0);
      return;
    }
    setFlashcards((prev) => {
      const updated = [...prev.slice(0, current), ...prev.slice(current + 1)];
      return updated;
    });
    setCurrent((prev) => Math.max(0, prev - 1));
  }

  function navigate(dir: number) {
    setCurrent((p) => Math.max(0, Math.min(p + dir, flashcards.length - 1)));
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Update project info including SRS settings
      await updateProject({
        id: project.id,
        name,
        description,
        new_cards_per_day: newCardsPerDay,
        max_reviews_per_day: maxReviewsPerDay,
        ...projectUpdates, // Include any SRS setting updates
      });

      // Only save non-empty cards (at least one non-empty field)
      const filtered = flashcards.filter(
        (fc) =>
          fc &&
          typeof fc === "object" &&
          ((typeof fc.front === "string" && fc.front.trim()) ||
            (typeof fc.back === "string" && fc.back.trim()))
      );

      // Convert editor format to database format
      const flashcardData: CreateFlashcardData[] = filtered
        .filter((card) => card && typeof card === "object") // Extra safety check
        .map((card) => ({
          front: card.front || "",
          back: card.back || "",
          extra: {},
        }));

      // Save flashcards using new API
      await replaceAllFlashcards(project.id, flashcardData);

      // Invalidate project list cache to force reload
      CacheInvalidation.invalidate("user_projects");

      // Reset stores to ensure fresh data is loaded
      resetFlashcards();
      resetProjects();

      router.push("/projects");
    } catch (error) {
      console.error("Error saving project:", error);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push("/projects");
  }

  function handleImportFlashcards(
    importedCards: Array<{
      front?: string;
      back?: string;
      question?: string;
      answer?: string;
    }>
  ) {
    // Convert from legacy format to editor format if needed
    const editorCards: EditorFlashcard[] = importedCards
      .filter((card) => card && typeof card === "object") // Filter out null/undefined entries
      .map((card) => ({
        front: card.question || card.front || "",
        back: card.answer || card.back || "",
      }));

    // Remove any cards that are missing a non-empty front or back
    const filtered = editorCards.filter(
      (fc) =>
        fc &&
        typeof fc === "object" &&
        typeof fc.front === "string" &&
        typeof fc.back === "string" &&
        fc.front.trim() &&
        fc.back.trim()
    );
    setFlashcards(filtered);
    setCurrent(0);
  }

  const card = flashcards[current] || { front: "", back: "" };
  const currentCardValid =
    (typeof card.front === "string" && card.front.trim()) ||
    (typeof card.back === "string" && card.back.trim());
  const completedCards = flashcards.filter(
    (fc) =>
      fc &&
      typeof fc === "object" &&
      ((typeof fc.front === "string" && fc.front.trim()) ||
        (typeof fc.back === "string" && fc.back.trim()))
  ).length;

  const isLoading = saving || flashcardsLoading;

  return (
    <div className="min-h-screen surface-primary">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-brand opacity-5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "4s" }}
        />
        <div
          className="absolute bottom-32 right-16 w-48 h-48 bg-gradient-to-r from-brand-secondary to-brand-tertiary opacity-5 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "6s", animationDelay: "2s" }}
        />
      </div>

      <div className="relative container mx-auto px-4 pb-12 md:pb-6 pt-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative group">
              <div className="p-3 bg-gradient-brand rounded-2xl shadow-brand transform group-hover:scale-110 transition-all transition-normal">
                <Edit3 className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -inset-1 bg-gradient-glass rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all transition-normal" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary mb-2">
                Edit Project
              </h1>
              <p className="text-text-muted text-lg">
                Fine-tune your flashcards and study settings
              </p>
            </div>
          </div>

          {/* Enhanced Progress Indicator */}
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <div className="stats stats-horizontal shadow-brand surface-elevated border border-subtle backdrop-blur">
              <div className="stat py-3 px-4">
                <div className="stat-title text-xs text-muted uppercase tracking-wider">
                  Total Cards
                </div>
                <div className="stat-value text-xl text-primary">
                  {flashcards.length}
                </div>
              </div>
              <div className="stat py-3 px-4">
                <div className="stat-title text-xs text-muted uppercase tracking-wider">
                  Completed
                </div>
                <div className="stat-value text-xl text-green-500">
                  {completedCards}
                </div>
              </div>
              <div className="stat py-3 px-4">
                <div className="stat-title text-xs text-muted uppercase tracking-wider">
                  Progress
                </div>
                <div className="stat-value text-xl brand-secondary">
                  {flashcards.length > 0
                    ? Math.round((completedCards / flashcards.length) * 100)
                    : 0}
                  %
                </div>
              </div>
            </div>

            {isValid && (
              <div className="badge badge-lg bg-green-500/10 text-green-400 border-green-500/30 gap-2 px-4 py-3">
                <CheckCircle2 className="w-4 h-4" />
                Ready to Save
              </div>
            )}

            {currentCardValid && (
              <div className="badge badge-lg bg-gradient-glass border-brand-primary text-brand-primary gap-2 px-4 py-3">
                <Sparkles className="w-4 h-4" />
                Current Card Valid
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Project Info Form */}
          <div className="xl:col-span-1 space-y-8">
            {/* Project Details Card */}
            <div className="card surface-elevated border border-subtle shadow-brand-lg backdrop-blur">
              <div className="card-body p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-glass rounded-lg">
                    <BookOpen className="w-5 h-5 brand-primary" />
                  </div>
                  <h2 className="text-xl font-bold text-primary">
                    Project Details
                  </h2>
                </div>

                <ProjectInfoForm
                  name={name}
                  setName={setName}
                  description={description}
                  setDescription={setDescription}
                  newCardsPerDay={newCardsPerDay}
                  setNewCardsPerDay={setNewCardsPerDay}
                  maxReviewsPerDay={maxReviewsPerDay}
                  setMaxReviewsPerDay={setMaxReviewsPerDay}
                  isValid={isValid}
                  saving={isLoading}
                />
              </div>
            </div>

            {/* SRS Settings Card */}
            <div className="card surface-elevated border border-subtle shadow-brand-lg backdrop-blur">
              <div className="card-body p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-glass rounded-lg">
                    <div className="w-5 h-5 bg-gradient-brand rounded-sm" />
                  </div>
                  <h2 className="text-xl font-bold text-primary">
                    Study Settings
                  </h2>
                </div>

                <ProjectSRSSettings
                  project={{ ...project, ...projectUpdates }}
                  onChange={setProjectUpdates}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Reset SRS Data Section */}
            <div className="card surface-elevated border border-subtle shadow-brand backdrop-blur">
              <div className="card-body p-6">
                <ProjectResetComponent
                  projectId={project.id}
                  projectName={project.name}
                  onResetComplete={() => {
                    window.location.reload();
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card Editor and Navigation */}
          <div className="xl:col-span-2">
            <div className="card surface-elevated border border-subtle shadow-brand-lg backdrop-blur overflow-hidden">
              {/* Card with gradient overlay */}
              <div className="absolute inset-0 bg-gradient-glass opacity-20 pointer-events-none" />

              <div className="card-body p-8 relative z-10">
                {/* Enhanced Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <h2 className="text-2xl font-bold text-primary">
                        Flashcard Editor
                      </h2>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="badge badge-lg bg-gradient-brand text-white px-4 py-2">
                          {current + 1} of {flashcards.length}
                        </div>
                        {currentCardValid && (
                          <div className="badge badge-success badge-lg gap-2 px-3 py-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Valid
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <FlashcardJsonImporter
                      onImport={handleImportFlashcards}
                      disabled={isLoading}
                      existingFlashcards={flashcards}
                    />
                    <button
                      className="btn btn-outline border-brand-primary text-brand-primary hover:bg-gradient-brand hover:border-brand hover:text-white interactive-hover transition-all transition-normal"
                      onClick={() => setManageModalOpen(true)}
                      disabled={isLoading || flashcards.length === 0}
                    >
                      Manage Cards
                    </button>
                    <button
                      className="btn bg-gradient-brand hover:bg-gradient-brand-hover text-white border-0 shadow-brand hover:shadow-brand-lg transition-all transition-normal relative overflow-hidden group"
                      onClick={handleAdd}
                      disabled={isLoading}
                    >
                      <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />
                      <div className="relative z-10 flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Card
                      </div>
                    </button>
                  </div>

                  <ManageFlashcardsModal
                    open={manageModalOpen}
                    onClose={() => setManageModalOpen(false)}
                    flashcards={flashcards}
                    onJump={handleJumpTo}
                    onDelete={handleDeleteAt}
                    onDeleteAll={handleDeleteAll}
                  />
                </div>

                {/* Card Content */}
                <div className="mb-8">
                  <FlashcardCardEditor
                    card={card}
                    handleChange={handleChange}
                    saving={isLoading}
                  />
                </div>

                {/* Card Navigation */}
                <FlashcardNavigation
                  current={current}
                  total={flashcards.length}
                  onPrev={() => navigate(-1)}
                  onNext={() => navigate(1)}
                  onDelete={handleDelete}
                  canDelete={flashcards.length > 1}
                  saving={isLoading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-4 mt-12">
          <button
            className="btn btn-ghost btn-lg border border-subtle interactive-hover hover:shadow-brand transition-all transition-normal"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
            Cancel
          </button>

          <button
            className={`btn btn-lg shadow-brand hover:shadow-brand-lg transition-all transition-normal relative overflow-hidden group ${
              isValid && !isLoading
                ? "bg-gradient-brand hover:bg-gradient-brand-hover text-white border-0"
                : "btn-disabled"
            }`}
            onClick={handleSave}
            disabled={!isValid || isLoading}
          >
            <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />

            <div className="relative z-10 flex items-center gap-3">
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving Project...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Project
                </>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
