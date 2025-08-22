import { BookOpen, Edit2, Trash2, Play, Calendar } from "lucide-react";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    <Card className="w-full bg-slate-800/40 border border-slate-600 backdrop-blur-sm hover:bg-slate-800/50 hover:border-slate-500 transition-all duration-500 group shadow-2xl hover:shadow-xl">
      <CardHeader className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <h2
            className="text-xl md:text-2xl font-semibold text-white line-clamp-2 group-hover:text-blue-300 transition-colors"
            title={project.name}
          >
            {project.name}
          </h2>
          <Badge variant="secondary" className="flex items-center gap-1 bg-blue-500/20 text-blue-200 border border-blue-500/30">
            <BookOpen className="w-4 h-4" />
            <span>{flashcardCount}</span>
          </Badge>
        </div>

        {/* Description */}
        <p className="text-base text-slate-300 line-clamp-3">
          {project.description || "No description provided"}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* SRS Statistics */}
        {srsStats && (
          <div className="flex items-center justify-center gap-4 p-3 bg-slate-700/40 rounded-lg border border-slate-600">
            <div className="text-center">
              <div
                className={`text-lg font-bold ${
                  srsStats.dueCards > 0 ? "text-red-400" : "text-slate-400"
                }`}
              >
                {srsStats.dueCards}
              </div>
              <div className="text-xs text-slate-400">Due</div>
            </div>
            <div className="text-center">
              <div
                className={`text-lg font-bold ${
                  srsStats.newCards > 0 ? "text-blue-400" : "text-slate-400"
                }`}
              >
                {srsStats.newCards}
              </div>
              <div className="text-xs text-slate-400">New</div>
            </div>
            <div className="text-center">
              <div
                className={`text-lg font-bold ${
                  srsStats.learningCards > 0
                    ? "text-violet-400"
                    : "text-slate-400"
                }`}
              >
                {srsStats.learningCards}
              </div>
              <div className="text-xs text-slate-400">Learning</div>
            </div>
          </div>
        )}

        {/* Next Review Date or Creation Date */}
        {srsStats?.nextReviewDate ? (
          <div className="flex items-center gap-2 text-sm text-slate-300 pt-2 border-t border-slate-600 mt-2">
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
          <div className="flex items-center gap-2 text-sm text-green-400 pt-2 border-t border-slate-600 mt-2">
            <Calendar className="w-4 h-4" />
            <span>Ready for review!</span>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="bg-slate-700/30 border-t border-slate-600 flex flex-wrap justify-center items-center gap-3">
        {hasCardsToStudy ? (
          <Button asChild size="sm" className="flex-auto max-w-[6rem] bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white border-none">
            <Link href={`/projects/${project.id}`} prefetch={false}>
              <Play className="w-4 h-4 mr-2" />
              Study
            </Link>
          </Button>
        ) : (
          <Button
            disabled
            size="sm"
            variant="outline"
            className="flex-auto max-w-[8rem] bg-slate-600/20 border-slate-500/50 text-slate-400"
          >
            <span className="text-xs text-yellow-400">
              {!hasFlashcards
                ? "No flashcards"
                : srsStats &&
                  srsStats.dueCards === 0 &&
                  srsStats.newCards === 0 &&
                  srsStats.learningCards === 0
                ? "Daily limit reached"
                : "No cards due"}
            </span>
          </Button>
        )}

        <Button asChild variant="outline" size="sm" className="flex-auto max-w-[6rem] bg-slate-600/20 border-slate-500/50 text-slate-200 hover:bg-slate-600/40 hover:text-white">
          <Link href={`/projects/${project.id}/edit`} prefetch={false}>
            <Edit2 className="w-4 h-4 mr-2" />
            Edit
          </Link>
        </Button>

        <Button
          onClick={handleDelete}
          disabled={isDeleting}
          variant="outline"
          size="sm"
          className="flex-auto max-w-[6rem] bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
        >
          {!isDeleting && <Trash2 className="w-4 h-4 mr-2" />}
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </CardFooter>
    </Card>
  );
};
