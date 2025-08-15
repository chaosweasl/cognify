import { BookOpen, Edit2, Trash2, Play, Calendar } from "lucide-react";
import React, { useState } from "react";
import Link from "next/link";

type Project = {
  id: string;
  name: string;
  description: string;
  formattedCreatedAt: string;
};

interface ProjectCardProps {
  project: Project;
  flashcardCount: number;
  srsStats?: {
    dueCards: number;
    newCards: number;
    learningCards: number;
    nextReviewDate?: Date | null;
  };
  onDelete: (id: string) => Promise<void>;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  flashcardCount,
  srsStats,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Debug logging
  console.log(`[ProjectCard] Rendering project ${project.id}:`, {
    flashcardCount,
    srsStats,
    hasFlashcards: flashcardCount > 0,
  });
  
  // SRS stats logic can be refactored to fetch from API or use flashcardCount only
  // SRS stats logic placeholder (future use)

  const hasFlashcards = flashcardCount > 0;

  // Check if there are any cards available for study (respecting daily limits)
  const hasCardsToStudy = srsStats
    ? srsStats.dueCards > 0 ||
      srsStats.newCards > 0 ||
      srsStats.learningCards > 0
    : hasFlashcards;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(project.id);
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col justify-between w-full bg-base-100 border border-base-300 rounded-2xl shadow-md hover:shadow-lg transition duration-200 overflow-hidden group focus-within:ring-2 focus-within:ring-primary">
      {/* Project Info */}
      <div className="p-6 space-y-3 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between">
          <h2
            className="text-xl md:text-2xl font-semibold text-base-content line-clamp-2"
            title={project.name}
          >
            {project.name}
          </h2>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary font-medium">
            <BookOpen className="w-4 h-4" />
            <span>{flashcardCount}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-base text-base-content/80 line-clamp-3">
          {project.description || "No description provided"}
        </p>

        {/* SRS Statistics */}
        {srsStats && (
          <div className="flex items-center justify-center gap-4 p-3 bg-base-200/50 rounded-lg border border-base-300/50">
            <div className="text-center">
              <div
                className={`text-lg font-bold ${
                  srsStats.dueCards > 0 ? "text-red-600" : "text-gray-400"
                }`}
              >
                {srsStats.dueCards}
              </div>
              <div className="text-xs text-base-content/70">Due</div>
            </div>
            <div className="text-center">
              <div
                className={`text-lg font-bold ${
                  srsStats.newCards > 0 ? "text-blue-600" : "text-gray-400"
                }`}
              >
                {srsStats.newCards}
              </div>
              <div className="text-xs text-base-content/70">New</div>
            </div>
            <div className="text-center">
              <div
                className={`text-lg font-bold ${
                  srsStats.learningCards > 0
                    ? "text-orange-600"
                    : "text-gray-400"
                }`}
              >
                {srsStats.learningCards}
              </div>
              <div className="text-xs text-base-content/70">Learning</div>
            </div>
          </div>
        )}

        {/* Next Review Date or Creation Date */}
        {srsStats?.nextReviewDate ? (
          <div className="flex items-center gap-2 text-sm text-base-content/60 pt-2 border-t border-base-300/50 mt-2">
            <Calendar className="w-4 h-4" />
            <span>
              Next review: {srsStats.nextReviewDate.toLocaleDateString()} at{" "}
              {srsStats.nextReviewDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ) : hasFlashcards ? (
          <div className="flex items-center gap-2 text-sm text-green-600 pt-2 border-t border-base-300/50 mt-2">
            <Calendar className="w-4 h-4" />
            <span>Ready for review!</span>
          </div>
        ) : null}
      </div>

      {/* Actions */}
      <div className="bg-base-200 px-6 py-4 border-t border-base-300 flex flex-wrap justify-center items-center gap-3">
        {hasCardsToStudy ? (
          <Link href={`/projects/${project.id}`} prefetch={false}>
            <button className="btn btn-md btn-primary gap-2 flex-auto max-w-[6rem]">
              <Play className="w-4 h-4" />
              Study
            </button>
          </Link>
        ) : (
          <button
            disabled
            className="btn btn-md btn-disabled gap-2 flex-auto max-w-[8rem]"
          >
            <span className="text-xs text-warning">
              {!hasFlashcards
                ? "No flashcards"
                : srsStats &&
                  srsStats.dueCards === 0 &&
                  srsStats.newCards === 0 &&
                  srsStats.learningCards === 0
                ? "Daily limit reached"
                : "No cards due"}
            </span>
          </button>
        )}

        <Link href={`/projects/${project.id}/edit`} prefetch={false}>
          <button className="btn btn-md btn-outline gap-2 flex-auto max-w-[6rem]">
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        </Link>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`btn btn-md btn-outline btn-error gap-2 flex-auto max-w-[6rem] ${
            isDeleting ? "loading" : ""
          }`}
        >
          {!isDeleting && <Trash2 className="w-4 h-4" />}
          Delete
        </button>
      </div>
    </div>
  );
};
