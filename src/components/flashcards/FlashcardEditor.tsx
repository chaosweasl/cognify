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
  ArrowLeft,
  Settings,
  RotateCcw,
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
  id?: string;
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
  ]);
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
      .filter((card) => card && typeof card === "object")
      .map(
        (card): EditorFlashcard => ({
          id: card.id,
          front: card.front || "",
          back: card.back || "",
        })
      );

    if (editorFlashcards.length === 0) {
      editorFlashcards.push({ front: "", back: "" });
    }

    setFlashcards(editorFlashcards);

    setCurrent((prevCurrent) => {
      if (prevCurrent >= editorFlashcards.length) {
        return Math.max(0, editorFlashcards.length - 1);
      }
      return prevCurrent;
    });
  }, [dbFlashcards]);

  useEffect(() => {
    setIsValid(
      typeof name === "string" &&
        typeof name.trim === "function" &&
        !!name.trim()
    );
  }, [flashcards, name]);

  function handleChange(field: "front" | "back", value: string) {
    setFlashcards((prev) => {
      const up = [...prev];
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
      return filtered.length === 0 ? [{ front: "", back: "" }] : filtered;
    });
    setCurrent((prev) => {
      if (idx < prev) return prev - 1;
      if (idx === prev) return Math.max(0, prev - 1);
      return prev;
    });
  }

  function handleDeleteAll() {
    setFlashcards([{ front: "", back: "" }]);
    setCurrent(0);
  }

  function handleDelete() {
    if (flashcards.length <= 1) {
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
      await updateProject({
        id: project.id,
        name,
        description,
        new_cards_per_day: newCardsPerDay,
        max_reviews_per_day: maxReviewsPerDay,
        ...projectUpdates,
      });

      const filtered = flashcards.filter(
        (fc) =>
          fc &&
          typeof fc === "object" &&
          ((typeof fc.front === "string" && fc.front.trim()) ||
            (typeof fc.back === "string" && fc.back.trim()))
      );

      const flashcardData: CreateFlashcardData[] = filtered
        .filter((card) => card && typeof card === "object")
        .map((card) => ({
          front: card.front || "",
          back: card.back || "",
          extra: {},
        }));

      await replaceAllFlashcards(project.id, flashcardData);

      CacheInvalidation.invalidate("user_projects");
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
    const editorCards: EditorFlashcard[] = importedCards
      .filter((card) => card && typeof card === "object")
      .map((card) => ({
        front: card.question || card.front || "",
        back: card.answer || card.back || "",
      }));

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
    <div className="min-h-screen surface-primary relative overflow-hidden">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating orbs with improved animations */}
        <div
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-brand opacity-10 rounded-full blur-3xl animate-pulse"
          style={{
            animationDuration: "4s",
            transform: "translateX(0px) translateY(0px)",
            animation: "float1 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-brand-secondary to-brand-tertiary opacity-8 rounded-full blur-2xl"
          style={{
            animationDuration: "6s",
            animationDelay: "2s",
            animation: "float2 10s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bottom-32 left-1/4 w-40 h-40 bg-gradient-to-r from-brand-primary to-brand-secondary opacity-6 rounded-full blur-3xl"
          style={{
            animation: "float3 12s ease-in-out infinite",
            animationDelay: "4s",
          }}
        />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-brand-primary) 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative container mx-auto px-4 pb-12 md:pb-6 pt-8 max-w-7xl">
        {/* Enhanced Header with staggered animations */}
        <div className="mb-12 animate-[slideInUp_0.6s_ease-out]">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={handleCancel}
              className="p-3 surface-elevated border border-subtle rounded-xl interactive-hover hover:shadow-brand transition-all transition-normal group hover:scale-105"
              disabled={isLoading}
            >
              <ArrowLeft className="w-5 h-5 text-secondary group-hover:brand-primary transition-colors transition-normal" />
            </button>

            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="p-4 bg-gradient-brand rounded-2xl shadow-brand transform group-hover:scale-110 group-hover:rotate-3 transition-all transition-normal">
                  <Edit3 className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-glass rounded-2xl blur opacity-0 group-hover:opacity-100 transition-all transition-normal" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-primary mb-3 bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text">
                  Edit Project
                </h1>
                <p className="text-muted text-xl">
                  Fine-tune your flashcards and study settings
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Progress Indicator with better animations */}
          <div className="flex flex-wrap items-center gap-6 animate-[slideInUp_0.8s_ease-out_0.2s_both]">
            <div className="stats stats-horizontal shadow-brand-lg surface-elevated border border-subtle backdrop-blur rounded-2xl overflow-hidden hover:scale-105 transition-transform transition-normal">
              <div className="stat py-4 px-6 border-r border-subtle">
                <div className="stat-title text-xs text-muted uppercase tracking-wider font-semibold">
                  Total Cards
                </div>
                <div className="stat-value text-2xl text-primary font-bold">
                  {flashcards.length}
                </div>
              </div>
              <div className="stat py-4 px-6 border-r border-subtle">
                <div className="stat-title text-xs text-muted uppercase tracking-wider font-semibold">
                  Completed
                </div>
                <div className="stat-value text-2xl text-green-500 font-bold">
                  {completedCards}
                </div>
              </div>
              <div className="stat py-4 px-6">
                <div className="stat-title text-xs text-muted uppercase tracking-wider font-semibold">
                  Progress
                </div>
                <div className="stat-value text-2xl brand-secondary font-bold">
                  {flashcards.length > 0
                    ? Math.round((completedCards / flashcards.length) * 100)
                    : 0}
                  %
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {isValid && (
                <div className="badge badge-lg bg-green-500/10 text-green-400 border-green-500/30 gap-2 px-4 py-3 rounded-xl hover:scale-105 transition-transform animate-[slideInRight_0.6s_ease-out]">
                  <CheckCircle2 className="w-4 h-4" />
                  Ready to Save
                </div>
              )}

              {currentCardValid && (
                <div className="badge badge-lg bg-gradient-glass border-brand-primary text-brand-primary gap-2 px-4 py-3 rounded-xl hover:scale-105 transition-transform animate-[slideInRight_0.8s_ease-out]">
                  <Sparkles className="w-4 h-4" />
                  Current Card Valid
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row-based layout with staggered animations */}
        <div className="space-y-8">
          {/* Project Details Row */}
          <div className="animate-[slideInUp_1s_ease-out_0.4s_both]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Project Info Card */}
              <div className="card surface-elevated border border-subtle shadow-brand-lg backdrop-blur rounded-2xl overflow-hidden group hover:shadow-brand-hover hover:-translate-y-1 transition-all transition-normal">
                <div className="absolute inset-0 bg-gradient-glass opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity" />
                <div className="card-body p-8 relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-glass rounded-xl group-hover:scale-110 transition-transform">
                      <BookOpen className="w-6 h-6 brand-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary">
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
              <div className="card surface-elevated border border-subtle shadow-brand-lg backdrop-blur rounded-2xl overflow-hidden group hover:shadow-brand-hover hover:-translate-y-1 transition-all transition-normal">
                <div className="absolute inset-0 bg-gradient-glass opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity" />
                <div className="card-body p-8 relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-glass rounded-xl group-hover:scale-110 transition-transform">
                      <Settings className="w-6 h-6 brand-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary">
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
            </div>
          </div>

          {/* Flashcard Editor Row */}
          <div className="animate-[slideInUp_1.2s_ease-out_0.6s_both]">
            <div className="card surface-elevated border border-subtle shadow-brand-lg backdrop-blur overflow-hidden rounded-2xl group hover:shadow-brand-hover transition-all transition-normal">
              <div className="absolute inset-0 bg-gradient-glass opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity" />

              <div className="card-body p-8 relative z-10">
                {/* Enhanced Card Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <h2 className="text-3xl font-bold text-primary">
                        Flashcard Editor
                      </h2>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="badge badge-lg bg-gradient-brand text-white px-5 py-3 rounded-xl shadow-brand hover:scale-105 transition-transform">
                          {current + 1} of {flashcards.length}
                        </div>
                        {currentCardValid && (
                          <div className="badge badge-success badge-lg gap-2 px-4 py-3 rounded-xl hover:scale-105 transition-transform">
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
                      className="btn btn-outline border-brand-primary text-brand-primary hover:bg-gradient-brand hover:border-brand hover:text-white interactive-hover transition-all transition-normal rounded-xl hover:scale-105"
                      onClick={() => setManageModalOpen(true)}
                      disabled={isLoading || flashcards.length === 0}
                    >
                      Manage Cards
                    </button>
                    <button
                      className="btn bg-gradient-brand hover:bg-gradient-brand-hover text-white border-0 shadow-brand hover:shadow-brand-lg transition-all transition-normal relative overflow-hidden group rounded-xl hover:scale-105"
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

                {/* Card Content with enhanced styling */}
                <div className="mb-10">
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

          {/* Reset SRS Data Row */}
          <div className="animate-[slideInUp_1.4s_ease-out_0.8s_both]">
            <div className="card surface-elevated border border-subtle shadow-brand backdrop-blur rounded-2xl group hover:shadow-brand-hover hover:-translate-y-1 transition-all transition-normal">
              <div className="absolute inset-0 bg-gradient-glass opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity" />
              <div className="card-body p-8 relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-glass rounded-xl group-hover:scale-110 transition-transform">
                    <RotateCcw className="w-6 h-6 brand-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-primary">
                    Reset SRS Data
                  </h2>
                </div>
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
        </div>

        {/* Enhanced Action Buttons with better animations */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-4 mt-16 animate-[slideInUp_1.6s_ease-out_1s_both]">
          <button
            className="btn btn-ghost btn-lg border border-subtle interactive-hover hover:shadow-brand transition-all transition-normal rounded-xl hover:scale-105"
            onClick={handleCancel}
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
            Cancel
          </button>

          <button
            className={`btn btn-lg shadow-brand hover:shadow-brand-lg transition-all transition-normal relative overflow-hidden group rounded-xl hover:scale-105 ${
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

      <style jsx>{`
        @keyframes float1 {
          0%,
          100% {
            transform: translate(0px, 0px) rotate(0deg);
          }
          33% {
            transform: translate(30px, -30px) rotate(120deg);
          }
          66% {
            transform: translate(-20px, 20px) rotate(240deg);
          }
        }

        @keyframes float2 {
          0%,
          100% {
            transform: translate(0px, 0px) rotate(0deg);
          }
          50% {
            transform: translate(-25px, -15px) rotate(180deg);
          }
        }

        @keyframes float3 {
          0%,
          100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(20px, -20px) scale(1.1);
          }
          66% {
            transform: translate(-15px, 10px) scale(0.9);
          }
        }
      `}</style>
    </div>
  );
}
