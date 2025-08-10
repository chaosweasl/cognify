"use client";

import { useState, useEffect } from "react";
import { ManageFlashcardsModal } from "./ManageFlashcardsModal";
import { ProjectInfoForm } from "./ProjectInfoForm";
import { FlashcardCardEditor } from "./FlashcardCardEditor";
import { FlashcardNavigation } from "./FlashcardNavigation";
import { useRouter } from "next/navigation";
import { Plus, Save, X, Loader2, BookOpen, CheckCircle2 } from "lucide-react";
import { updateProject } from "../actions";
import { Project } from "../utils/normalizeProject";
import { FlashcardJsonImporter } from "./FlashcardJsonImporter";
import { useFlashcardsStore } from "../hooks/useFlashcards";
import ProjectResetComponent from "./ProjectResetComponent";
import { CreateFlashcardData } from "../types/flashcard";

// Working flashcard type for the editor (without full database fields)
type EditorFlashcard = {
  id?: string; // Keep optional for internal use
  front: string;
  back: string;
};

// Main FlashcardEditor Component
interface FlashcardEditorProps {
  project: Project;
}

export function FlashcardEditor({ project }: FlashcardEditorProps) {
  const router = useRouter();
  const {
    flashcards: dbFlashcards,
    loading: flashcardsLoading,
    fetchFlashcards,
    replaceAllFlashcards,
  } = useFlashcardsStore();

  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [flashcards, setFlashcards] = useState<EditorFlashcard[]>([]);
  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Load flashcards on component mount
  useEffect(() => {
    fetchFlashcards(project.id);
  }, [project.id, fetchFlashcards]);

  // Update local flashcards when database flashcards change
  useEffect(() => {
    const editorFlashcards = dbFlashcards.map(
      (card): EditorFlashcard => ({
        id: card.id,
        front: card.front,
        back: card.back,
      })
    );
    setFlashcards(editorFlashcards);
    if (editorFlashcards.length > 0 && current >= editorFlashcards.length) {
      setCurrent(Math.max(0, editorFlashcards.length - 1));
    }
  }, [dbFlashcards, current]);

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
      up[current] = { ...up[current], [field]: value };
      return up;
    });
  }

  function handleAdd() {
    setFlashcards((prev) => [
      ...prev,
      {
        front: "",
        back: "",
      },
    ]);
    setCurrent(flashcards.length);
  }

  function handleJumpTo(idx: number) {
    setCurrent(idx);
  }

  function handleDeleteAt(idx: number) {
    setFlashcards((prev) => prev.filter((_, i) => i !== idx));
    // If deleting current card, move to previous or 0
    setCurrent((prev) => {
      if (idx < prev) return prev - 1;
      if (idx === prev) return Math.max(0, prev - 1);
      return prev;
    });
  }

  function handleDeleteAll() {
    setFlashcards([]);
    setCurrent(0);
  }

  function handleDelete() {
    if (flashcards.length <= 1) return;
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
      // Update project info
      await updateProject({
        id: project.id,
        name,
        description,
      });

      // Only save non-empty cards (at least one non-empty field)
      const filtered = flashcards.filter(
        (fc) =>
          (typeof fc.front === "string" && fc.front.trim()) ||
          (typeof fc.back === "string" && fc.back.trim())
      );

      // Convert editor format to database format
      const flashcardData: CreateFlashcardData[] = filtered.map((card) => ({
        front: card.front,
        back: card.back,
        extra: {},
      }));

      // Save flashcards using new API
      await replaceAllFlashcards(project.id, flashcardData);

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
    const editorCards: EditorFlashcard[] = importedCards.map((card) => ({
      front: card.question || card.front || "",
      back: card.answer || card.back || "",
    }));

    // Remove any cards that are missing a non-empty front or back
    const filtered = editorCards.filter(
      (fc) =>
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
      (typeof fc.front === "string" && fc.front.trim()) ||
      (typeof fc.back === "string" && fc.back.trim())
  ).length;

  const isLoading = saving || flashcardsLoading;

  return (
    <div className="min-h-screen pt-5 bg-gradient-to-br from-base-200 to-base-300/50">
      <div className="container mx-auto px-4 pb-12 md:pb-6">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-base-content">
                Edit Flashcard Set
              </h1>
              <p className="text-base-content/60 text-sm md:text-base">
                Create and manage your flashcards with ease
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="stats stats-horizontal shadow-sm bg-base-100/80 backdrop-blur">
                <div className="stat py-2 px-4">
                  <div className="stat-title text-xs">Total Cards</div>
                  <div className="stat-value text-lg">{flashcards.length}</div>
                </div>
                <div className="stat py-2 px-4">
                  <div className="stat-title text-xs">Completed</div>
                  <div className="stat-value text-lg text-success">
                    {completedCards}
                  </div>
                </div>
              </div>
            </div>
            {isValid && (
              <div className="badge badge-success gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Ready to Save
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Project Info Form */}
          <div className="xl:col-span-1 space-y-6">
            <ProjectInfoForm
              name={name}
              setName={setName}
              description={description}
              setDescription={setDescription}
              isValid={isValid}
              saving={isLoading}
            />

            {/* Reset SRS Data Section */}
            <ProjectResetComponent
              projectId={project.id}
              projectName={project.name}
              onResetComplete={() => {
                // Optionally refresh the page or show additional feedback
                window.location.reload();
              }}
            />
          </div>

          {/* Card Editor and Navigation */}
          <div className="xl:col-span-2">
            <div className="card bg-base-100/90 backdrop-blur shadow-lg border border-base-300/50">
              <div className="card-body p-6">
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <h2 className="card-title text-xl">Flashcard Editor</h2>
                    <div className="flex items-center gap-2">
                      <div className="badge badge-primary badge-lg">
                        {current + 1} of {flashcards.length}
                      </div>
                      {currentCardValid && (
                        <div className="badge badge-success badge-sm">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <FlashcardJsonImporter
                      onImport={handleImportFlashcards}
                      disabled={isLoading}
                      existingFlashcards={flashcards}
                    />
                    <button
                      className="btn btn-outline btn-info"
                      onClick={() => setManageModalOpen(true)}
                      disabled={isLoading || flashcards.length === 0}
                    >
                      Manage Cards
                    </button>
                    <button
                      className="btn btn-primary shadow-md hover:shadow-lg transition-all duration-200"
                      onClick={handleAdd}
                      disabled={isLoading}
                    >
                      <Plus className="w-4 h-4" />
                      Add Card
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
                <FlashcardCardEditor
                  card={card}
                  handleChange={handleChange}
                  saving={isLoading}
                />
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
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-8">
          <button
            className="btn btn-ghost btn-lg hover:shadow-md transition-all duration-200"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
            Cancel
          </button>

          <button
            className={`btn btn-lg shadow-lg hover:shadow-xl transition-all duration-200 ${
              isValid && !isLoading ? "btn-success" : "btn-disabled"
            }`}
            onClick={handleSave}
            disabled={!isValid || isLoading}
          >
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
          </button>
        </div>
      </div>
    </div>
  );
}
