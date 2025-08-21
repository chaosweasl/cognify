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
    <Card className="w-full hover:shadow-lg transition-shadow duration-200 group focus-within:ring-2 focus-within:ring-ring">
      <CardHeader className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <h2
            className="text-xl md:text-2xl font-semibold text-foreground line-clamp-2"
            title={project.name}
          >
            {project.name}
          </h2>
          <Badge variant="secondary" className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>{flashcardCount}</span>
          </Badge>
        </div>

        {/* Description */}
        <p className="text-base text-muted-foreground line-clamp-3">
          {project.description || "No description provided"}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* SRS Statistics */}
        {srsStats && (
          <div className="flex items-center justify-center gap-4 p-3 bg-muted/50 rounded-lg border">
            <div className="text-center">
              <div
                className={`text-lg font-bold ${
                  srsStats.dueCards > 0 ? "text-red-600" : "text-muted-foreground"
                }`}
              >
                {srsStats.dueCards}
              </div>
              <div className="text-xs text-muted-foreground">Due</div>
            </div>
            <div className="text-center">
              <div
                className={`text-lg font-bold ${
                  srsStats.newCards > 0 ? "text-blue-600" : "text-muted-foreground"
                }`}
              >
                {srsStats.newCards}
              </div>
              <div className="text-xs text-muted-foreground">New</div>
            </div>
            <div className="text-center">
              <div
                className={`text-lg font-bold ${
                  srsStats.learningCards > 0
                    ? "text-orange-600"
                    : "text-muted-foreground"
                }`}
              >
                {srsStats.learningCards}
              </div>
              <div className="text-xs text-muted-foreground">Learning</div>
            </div>
          </div>
        )}

        {/* Next Review Date or Creation Date */}
        {srsStats?.nextReviewDate ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t mt-2">
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
          <div className="flex items-center gap-2 text-sm text-green-600 pt-2 border-t mt-2">
            <Calendar className="w-4 h-4" />
            <span>Ready for review!</span>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="bg-muted/30 flex flex-wrap justify-center items-center gap-3">
        {hasCardsToStudy ? (
          <Button asChild size="sm" className="flex-auto max-w-[6rem]">
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
            className="flex-auto max-w-[8rem]"
          >
            <span className="text-xs text-yellow-600">
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

        <Button asChild variant="outline" size="sm" className="flex-auto max-w-[6rem]">
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
          className="flex-auto max-w-[6rem] text-destructive hover:text-destructive"
        >
          {!isDeleting && <Trash2 className="w-4 h-4 mr-2" />}
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </CardFooter>
    </Card>
  );
};
