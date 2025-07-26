"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Save,
  X,
  Loader2,
  BookOpen,
  Edit3,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { updateProject } from "../actions";
import { Project } from "../utils/normalizeProject";
import { FlashcardJsonImporter } from "./FlashcardJsonImporter";

// Define Flashcard type locally without 'id'
type Flashcard = {
  question: string;
  answer: string;
};

// Main FlashcardEditor Component
interface FlashcardEditorProps {
  project: Project;
}

export function FlashcardEditor({ project }: FlashcardEditorProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [flashcards, setFlashcards] = useState<Flashcard[]>(
    Array.isArray(project.flashcards)
      ? project.flashcards.map((fc) => ({
          question: typeof fc.question === "string" ? fc.question : "",
          answer: typeof fc.answer === "string" ? fc.answer : "",
        }))
      : []
  );
  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const valid =
      flashcards.length > 0 &&
      flashcards.every(
        (fc) =>
          typeof fc.question === "string" &&
          typeof fc.answer === "string" &&
          fc.question &&
          typeof fc.question.trim === "function" &&
          fc.question.trim() &&
          fc.answer &&
          typeof fc.answer.trim === "function" &&
          fc.answer.trim()
      );
    setIsValid(
      valid &&
        typeof name === "string" &&
        typeof name.trim === "function" &&
        !!name.trim()
    );
  }, [flashcards, name]);

  function handleChange(field: keyof Flashcard, value: string) {
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
        question: "",
        answer: "",
      },
    ]);
    setCurrent(flashcards.length);
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
    await updateProject({ id: project.id, name, description, flashcards });
    setSaving(false);
    router.push("/projects");
  }

  function handleCancel() {
    router.push("/projects");
  }

  function handleImportFlashcards(importedCards: Flashcard[]) {
    // Replace all existing flashcards with imported ones
    setFlashcards(importedCards);
    setCurrent(0);

    // Alternative: Append to existing flashcards (uncomment if preferred)
    // setFlashcards(prev => [...prev, ...importedCards]);
    // setCurrent(flashcards.length); // Navigate to first imported card
  }

  const card = flashcards[current] || { question: "", answer: "" };
  const currentCardValid =
    typeof card.question === "string" &&
    typeof card.answer === "string" &&
    card.question.trim() &&
    card.answer.trim();
  const completedCards = flashcards.filter(
    (fc) =>
      typeof fc.question === "string" &&
      typeof fc.answer === "string" &&
      fc.question.trim() &&
      fc.answer.trim()
  ).length;

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
          {/* Enhanced Project Info */}
          <div className="xl:col-span-1">
            <div className="card bg-base-100/90 backdrop-blur shadow-lg border border-base-300/50">
              <div className="card-body p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Edit3 className="w-5 h-5 text-secondary" />
                  <h2 className="card-title text-lg">Project Details</h2>
                </div>

                <div className="space-y-5">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-base-content/80">
                        Project Name
                      </span>
                      <span className="label-text-alt text-error">
                        {!name.trim() && "*Required"}
                      </span>
                    </label>
                    <input
                      className={`input input-bordered w-full transition-all duration-200 ${
                        !name.trim() ? "input-error" : "focus:input-primary"
                      }`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter project name"
                      disabled={saving}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-base-content/80">
                        Description
                      </span>
                      <span className="label-text-alt text-base-content/50">
                        Optional
                      </span>
                    </label>
                    <textarea
                      className="textarea textarea-bordered w-full h-28 resize-none focus:textarea-primary transition-all duration-200"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your flashcard set..."
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Validation Status */}
                <div className="mt-6 p-3 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    {isValid ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-success" />
                        <span className="text-success font-medium">
                          All fields valid
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-warning" />
                        <span className="text-warning font-medium">
                          {!name.trim()
                            ? "Project name required"
                            : flashcards.length === 0
                            ? "Add at least one card"
                            : "Complete all flashcards"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Card Editor */}
          <div className="xl:col-span-2">
            <div className="card bg-base-100/90 backdrop-blur shadow-lg border border-base-300/50">
              <div className="card-body p-6">
                {/* Enhanced Card Header */}
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
                      disabled={saving}
                    />
                    <button
                      className="btn btn-primary shadow-md hover:shadow-lg transition-all duration-200"
                      onClick={handleAdd}
                      disabled={saving}
                    >
                      <Plus className="w-4 h-4" />
                      Add Card
                    </button>
                  </div>
                </div>

                {/* Enhanced Card Content */}
                <div className="space-y-6">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-lg text-base-content/90">
                        Question
                      </span>
                      <span className="label-text-alt text-base-content/50">
                        {typeof card.question === "string"
                          ? card.question.length
                          : 0}
                        /300
                      </span>
                    </label>
                    <textarea
                      className={`textarea textarea-bordered w-full h-32 resize-none text-base transition-all duration-200 ${
                        !(
                          typeof card.question === "string" &&
                          card.question.trim()
                        )
                          ? "textarea-error"
                          : "focus:textarea-primary"
                      }`}
                      value={
                        typeof card.question === "string" ? card.question : ""
                      }
                      onChange={(e) => handleChange("question", e.target.value)}
                      placeholder="What would you like to ask? Be clear and specific..."
                      disabled={saving}
                      maxLength={300}
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium text-lg text-base-content/90">
                        Answer
                      </span>
                      <span className="label-text-alt text-base-content/50">
                        {typeof card.answer === "string"
                          ? card.answer.length
                          : 0}
                        /300
                      </span>
                    </label>
                    <textarea
                      className={`textarea textarea-bordered w-full h-32 resize-none text-base transition-all duration-200 ${
                        !(typeof card.answer === "string" && card.answer.trim())
                          ? "textarea-error"
                          : "focus:textarea-primary"
                      }`}
                      value={typeof card.answer === "string" ? card.answer : ""}
                      onChange={(e) => handleChange("answer", e.target.value)}
                      placeholder="Provide a clear, concise answer..."
                      disabled={saving}
                      maxLength={300}
                    />
                  </div>
                </div>

                {/* Enhanced Card Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8 pt-6 border-t border-base-300/60">
                  <div className="flex gap-2">
                    <button
                      className="btn btn-outline hover:btn-primary transition-all duration-200"
                      onClick={() => navigate(-1)}
                      disabled={current === 0 || saving}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <button
                      className="btn btn-outline hover:btn-primary transition-all duration-200"
                      onClick={() => navigate(1)}
                      disabled={current === flashcards.length - 1 || saving}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    className="btn btn-error btn-outline hover:shadow-md transition-all duration-200"
                    onClick={handleDelete}
                    disabled={flashcards.length <= 1 || saving}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Card
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-8">
          <button
            className="btn btn-ghost btn-lg hover:shadow-md transition-all duration-200"
            onClick={handleCancel}
            disabled={saving}
          >
            <X className="w-5 h-5" />
            Cancel
          </button>

          <button
            className={`btn btn-lg shadow-lg hover:shadow-xl transition-all duration-200 ${
              isValid && !saving ? "btn-success" : "btn-disabled"
            }`}
            onClick={handleSave}
            disabled={!isValid || saving}
          >
            {saving ? (
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
