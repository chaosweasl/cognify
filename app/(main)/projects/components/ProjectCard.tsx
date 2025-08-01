import { BookOpen, Edit2, Trash2, Play, Calendar } from "lucide-react";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ProjectSRSStats } from "./ProjectSRSStats";
import { getProjectSRSStats, ProjectSRSInfo } from "./ProjectSRSUtils";
import { useUserId } from "@/hooks/useUserId";

type Flashcard = { question: string; answer: string };

type Project = {
  id: string;
  name: string;
  description: string;
  flashcards: Flashcard[];
  formattedCreatedAt: string;
};

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => Promise<void>;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [srsStats, setSRSStats] = useState<ProjectSRSInfo | null>(null);
  const userId = useUserId();

  const flashcardCount = Array.isArray(project.flashcards)
    ? project.flashcards.length
    : 0;
  const hasFlashcards = flashcardCount > 0;

  // Load SRS statistics
  useEffect(() => {
    async function loadSRSStats() {
      if (userId && hasFlashcards) {
        const cardIds = project.flashcards.map((_, index) => `${index}`);
        const stats = await getProjectSRSStats(userId, project.id, cardIds);
        setSRSStats(stats);
      }
    }
    loadSRSStats();
  }, [userId, project.id, project.flashcards, hasFlashcards]);

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
        {hasFlashcards && srsStats && (
          <ProjectSRSStats
            newCards={srsStats.newCards}
            learningCards={srsStats.learningCards}
            reviewCards={srsStats.reviewCards}
            dueCards={srsStats.dueCards}
            totalCards={srsStats.totalCards}
          />
        )}

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-base-content/60 pt-2 border-t border-base-300/50 mt-2">
          <Calendar className="w-4 h-4" />
          <span>{project.formattedCreatedAt}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-base-200 px-6 py-4 border-t border-base-300 flex flex-wrap justify-center items-center gap-3">
        {hasFlashcards ? (
          srsStats && (srsStats.dueCards > 0 || srsStats.newCards > 0) ? (
            <Link href={`/projects/${project.id}`}>
              <button
                className={`btn btn-md gap-2 flex-auto max-w-[6rem] ${
                  srsStats && srsStats.dueCards > 0
                    ? "btn-error"
                    : srsStats && srsStats.newCards > 0
                    ? "btn-primary"
                    : "btn-success"
                }`}
              >
                <Play className="w-4 h-4" />
                {srsStats && srsStats.dueCards > 0
                  ? "Review"
                  : srsStats && srsStats.newCards > 0
                  ? "Study"
                  : "Practice"}
              </button>
            </Link>
          ) : (
            <button
              disabled
              className="btn btn-md btn-disabled gap-2 flex-auto max-w-[8rem]"
              title="All caught up! No cards due for review."
            >
              <span className="text-xs text-success">✓ All caught up</span>
            </button>
          )
        ) : (
          <button
            disabled
            className="btn btn-md btn-disabled gap-2 flex-auto max-w-[8rem]"
          >
            <span className="text-xs text-warning">No flashcards</span>
          </button>
        )}

        <Link href={`/projects/${project.id}/edit`}>
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
