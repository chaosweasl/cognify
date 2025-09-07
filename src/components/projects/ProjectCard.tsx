"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  Calendar,
  BookOpen,
  TrendingUp,
  Clock,
  Zap,
  Target,
  Sparkles,
  Play,
  Edit,
  Trash2,
  Eye,
  Star,
  Award,
  Brain,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string;
    formattedCreatedAt: string;
  };
  flashcardCount: number;
  srsStats: {
    dueCards: number;
    newCards: number;
    learningCards: number;
  };
  onDelete: () => void;
  viewMode?: "grid" | "list";
  isHovered?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  flashcardCount,
  srsStats,
  onDelete,
  viewMode = "grid",
  isHovered = false,
}) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [localHover, setLocalHover] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const totalActiveCards =
    srsStats.dueCards + srsStats.newCards + srsStats.learningCards;
  const hasActiveCards = totalActiveCards > 0;

  // Calculate project status with semantic design system colors
  const getProjectStatus = () => {
    const completionRate =
      flashcardCount > 0
        ? ((flashcardCount - totalActiveCards) / flashcardCount) * 100
        : 0;

    if (srsStats.dueCards > 0)
      return {
        label: "Ready to Study",
        color: "success",
        icon: Play,
        gradient: "bg-gradient-to-r from-status-success to-brand-tertiary",
        bgGradient:
          "bg-gradient-to-br from-status-success/10 to-brand-tertiary/10",
        borderColor: "border-status-success/30",
        textColor: "text-status-success",
      };
    if (srsStats.learningCards > 0)
      return {
        label: "In Progress",
        color: "primary",
        icon: TrendingUp,
        gradient: "bg-gradient-brand",
        bgGradient:
          "bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10",
        borderColor: "border-brand-primary/30",
        textColor: "brand-primary",
      };
    if (srsStats.newCards > 0)
      return {
        label: "New Cards",
        color: "secondary",
        icon: Sparkles,
        gradient: "bg-gradient-to-r from-brand-secondary to-brand-accent",
        bgGradient:
          "bg-gradient-to-br from-brand-secondary/10 to-brand-accent/10",
        borderColor: "border-brand-secondary/30",
        textColor: "brand-secondary",
      };
    if (flashcardCount > 0 && completionRate >= 80)
      return {
        label: "Mastered",
        color: "warning",
        icon: Award,
        gradient: "bg-gradient-to-r from-status-warning to-status-success",
        bgGradient:
          "bg-gradient-to-br from-status-warning/10 to-status-success/10",
        borderColor: "border-status-warning/30",
        textColor: "text-status-warning",
      };
    if (flashcardCount > 0)
      return {
        label: "Complete",
        color: "neutral",
        icon: Target,
        gradient: "bg-gradient-to-r from-text-muted to-text-secondary",
        bgGradient: "surface-elevated",
        borderColor: "border-subtle",
        textColor: "text-secondary",
      };
    return {
      label: "Getting Started",
      color: "neutral",
      icon: BookOpen,
      gradient: "bg-gradient-to-r from-text-muted to-text-secondary",
      bgGradient: "surface-secondary",
      borderColor: "border-subtle",
      textColor: "text-muted",
    };
  };

  const status = getProjectStatus();

  // Enhanced truncate function
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + "...";
  };

  // Enhanced date formatting
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    } catch {
      return "Unknown";
    }
  };

  // Get priority level for visual emphasis
  const getPriorityLevel = () => {
    if (srsStats.dueCards > 10) return "high";
    if (srsStats.dueCards > 5 || srsStats.learningCards > 0) return "medium";
    if (totalActiveCards > 0) return "low";
    return "none";
  };

  const priority = getPriorityLevel();

  if (viewMode === "list") {
    return (
      <Card
        className={cn(
          "group relative overflow-hidden transition-all duration-slower transform",
          "glass-surface border border-subtle shadow-brand hover:shadow-brand-lg",
          "hover:scale-[1.01] hover:-translate-y-1",
          isHovered && "surface-elevated scale-[1.005]",
          isDeleting && "opacity-50 scale-95 pointer-events-none",
          priority === "high" && "ring-2 ring-red-500/20",
          priority === "medium" && "ring-2 ring-yellow-500/20"
        )}
        onMouseEnter={() => setLocalHover(true)}
        onMouseLeave={() => setLocalHover(false)}
      >
        {/* Enhanced animated background gradient */}
        <div
          className={cn(
            "absolute inset-0 opacity-0 transition-opacity duration-slower",
            `bg-gradient-to-br ${status.bgGradient}`,
            "group-hover:opacity-100"
          )}
        />

        {/* Dynamic glow effect based on status */}
        <div
          className={cn(
            "absolute -inset-0.5 rounded-xl blur opacity-0 transition-opacity duration-slower",
            `bg-gradient-to-r ${status.gradient}`,
            localHover && "opacity-20"
          )}
        />

        {/* Priority indicator */}
        {priority !== "none" && (
          <div
            className={cn(
              "absolute top-0 left-0 w-2 h-full transition-all duration-slower rounded-l-xl",
              priority === "high" &&
                "bg-gradient-to-b from-status-error to-status-warning",
              priority === "medium" &&
                "bg-gradient-to-b from-status-warning to-brand-primary",
              priority === "low" &&
                "bg-gradient-to-b from-status-success to-brand-tertiary"
            )}
          />
        )}

        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between">
            {/* Left section - Enhanced main info */}
            <div className="flex items-center space-x-6 flex-1 min-w-0">
              {/* Enhanced project indicator */}
              <div className="relative flex-shrink-0">
                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-brand transform transition-all duration-slower",
                    status.gradient,
                    "group-hover:scale-110 group-hover:rotate-6"
                  )}
                >
                  <status.icon className="w-7 h-7 text-white drop-shadow-sm" />
                </div>

                {/* Activity pulse indicator */}
                {hasActiveCards && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-status-success rounded-full flex items-center justify-center animate-pulse shadow-brand">
                    <Flame className="w-3 h-3 text-white" />
                  </div>
                )}

                {/* Floating sparkle effect */}
                <div
                  className={cn(
                    "absolute -inset-2 rounded-2xl opacity-0 transition-all duration-slower",
                    status.gradient,
                    "group-hover:opacity-30 blur-xl animate-pulse"
                  )}
                />
              </div>

              {/* Enhanced project details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <h3
                    className="text-xl font-bold text-primary group-hover:brand-primary transition-colors transition-normal cursor-pointer truncate"
                    onClick={() => router.push(`/projects/${project.id}`)}
                    title={project.name}
                  >
                    {project.name}
                  </h3>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-semibold px-3 py-1 transition-all transition-normal",
                      status.bgGradient,
                      status.borderColor,
                      status.textColor,
                      "border-2 group-hover:scale-105"
                    )}
                  >
                    {status.label}
                  </Badge>
                </div>

                <p className="text-secondary text-sm mb-4 leading-relaxed line-clamp-2">
                  {project.description || (
                    <span className="italic text-muted">
                      No description provided
                    </span>
                  )}
                </p>

                {/* Enhanced stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted group-hover:text-secondary transition-colors transition-normal">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-medium">{flashcardCount}</span>
                    <span>cards</span>
                  </div>

                  {hasActiveCards && (
                    <div className="flex items-center gap-2 text-status-success group-hover:text-status-success transition-colors">
                      <Zap className="w-4 h-4" />
                      <span className="font-medium">{totalActiveCards}</span>
                      <span>active</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-muted group-hover:text-secondary transition-colors">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Created {formatDate(project.formattedCreatedAt)}
                    </span>
                  </div>

                  {flashcardCount > 0 && (
                    <div className="flex items-center gap-2 text-muted group-hover:text-secondary transition-colors">
                      <Star className="w-4 h-4" />
                      <span>
                        {Math.round(
                          ((flashcardCount - totalActiveCards) /
                            flashcardCount) *
                            100
                        )}
                        % complete
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced right section - Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {hasActiveCards && (
                <Button
                  onClick={() => router.push(`/projects/${project.id}/study`)}
                  className={cn(
                    "text-white shadow-brand hover:shadow-brand-lg transform hover:scale-105 transition-all duration-slower",
                    "px-6 py-3 rounded-xl font-semibold group relative overflow-hidden",
                    `bg-gradient-to-r ${status.gradient} hover:brightness-110`
                  )}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <div className="relative z-10 flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    <span>Study Now</span>
                    {srsStats.dueCards > 0 && (
                      <Badge className="bg-white/20 text-white border-white/30 text-xs px-2">
                        {srsStats.dueCards}
                      </Badge>
                    )}
                  </div>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-12 w-12 p-0 surface-secondary border border-subtle interactive-hover rounded-xl glass-surface hover:border-brand transition-all duration-slower"
                  >
                    <MoreVertical className="w-4 h-4 text-secondary group-hover:text-primary transition-colors" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 surface-overlay glass-surface border-subtle"
                >
                  <DropdownMenuItem
                    className="interactive-hover flex items-center gap-2"
                    onSelect={() => router.push(`/projects/${project.id}`)}
                  >
                    <Eye className="w-4 h-4" />
                    View Project
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="interactive-hover flex items-center gap-2"
                    onSelect={() => router.push(`/projects/${project.id}/edit`)}
                  >
                    <Edit className="w-4 h-4" />
                    Edit Project
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="border-subtle" />
                  <DropdownMenuItem
                    className={cn(
                      "flex items-center gap-2",
                      "text-destructive hover:text-destructive focus-visible:text-destructive",
                      "hover:bg-destructive/10 focus-visible:bg-destructive/10",
                      "transition-colors interactive-hover"
                    )}
                    onSelect={handleDelete}
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Enhanced Grid view
  return (
    <Card
      className={cn(
        "group relative overflow-hidden cursor-pointer transition-all duration-slower transform",
        "glass-surface border border-subtle shadow-brand hover:shadow-brand-lg",
        "hover:scale-[1.03] hover:-translate-y-3",
        isHovered && "surface-elevated scale-[1.01]",
        isDeleting && "opacity-50 scale-95 pointer-events-none",
        priority === "high" && "ring-2 ring-red-500/20",
        priority === "medium" && "ring-2 ring-yellow-500/20"
      )}
      onMouseEnter={() => setLocalHover(true)}
      onMouseLeave={() => setLocalHover(false)}
    >
      {/* Enhanced animated background gradient */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-slower",
          `bg-gradient-to-br ${status.bgGradient}`,
          "group-hover:opacity-100"
        )}
      />

      {/* Enhanced glow effect */}
      <div
        className={cn(
          "absolute -inset-1 rounded-xl blur opacity-0 transition-opacity duration-slower",
          `bg-gradient-to-br ${status.gradient}`,
          localHover && "opacity-30"
        )}
      />

      {/* Enhanced status indicator bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1.5 transition-all duration-slower",
          `bg-gradient-to-r ${status.gradient}`,
          "group-hover:h-2"
        )}
      />

      {/* Priority corner indicator */}
      {priority !== "none" && (
        <div
          className={cn(
            "absolute top-4 right-4 w-3 h-3 rounded-full transition-all duration-slower",
            priority === "high" && "bg-status-error animate-pulse",
            priority === "medium" && "bg-status-warning animate-pulse",
            priority === "low" && "bg-status-success"
          )}
        />
      )}

      {/* Main click area */}
      <div
        className="relative z-10"
        onClick={() => router.push(`/projects/${project.id}`)}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Enhanced project icon */}
              <div className="relative flex-shrink-0">
                <div
                  className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center shadow-brand transform transition-all duration-slower",
                    `bg-gradient-to-br ${status.gradient}`,
                    "group-hover:scale-110 group-hover:rotate-6"
                  )}
                >
                  <status.icon className="w-8 h-8 text-white drop-shadow-sm" />
                </div>

                {/* Enhanced activity indicator */}
                {hasActiveCards && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-status-success rounded-full flex items-center justify-center animate-pulse shadow-lg">
                    <span className="text-white text-xs font-bold">
                      {Math.min(totalActiveCards, 99)}
                    </span>
                  </div>
                )}

                {/* Floating glow */}
                <div
                  className={cn(
                    "absolute -inset-2 rounded-2xl opacity-0 transition-all duration-slower",
                    `bg-gradient-to-br ${status.gradient}`,
                    "group-hover:opacity-40 blur-xl animate-pulse"
                  )}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className="text-lg font-bold text-primary group-hover:brand-primary transition-colors truncate mb-2"
                  title={project.name}
                >
                  {project.name}
                </h3>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-semibold px-3 py-1 transition-all duration-slower",
                    `${status.bgGradient} ${status.borderColor}`,
                    `bg-gradient-to-r ${status.gradient} bg-clip-text text-transparent border-2`,
                    "group-hover:scale-105"
                  )}
                >
                  {status.label}
                </Badge>
              </div>
            </div>

            {/* Enhanced actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-slower surface-secondary border border-subtle interactive-hover rounded-lg glass-surface"
                >
                  <MoreVertical className="w-3 h-3 text-secondary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44 surface-overlay glass-surface border-subtle"
              >
                <DropdownMenuItem
                  className="flex items-center gap-2 text-primary transition-colors interactive-hover"
                  onSelect={() => router.push(`/projects/${project.id}`)}
                >
                  <Eye className="w-4 h-4" />
                  View Project
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2 text-primary transition-colors interactive-hover"
                  onSelect={() => router.push(`/projects/${project.id}/edit`)}
                >
                  <Edit className="w-4 h-4" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-subtle" />
                <DropdownMenuItem
                  className="flex items-center gap-2 text-status-error hover:text-status-error hover:bg-status-error/10 transition-colors interactive-hover"
                  onSelect={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-6">
          <div className="space-y-5">
            {/* Enhanced description */}
            <div className="min-h-[3rem]">
              <p className="text-secondary text-sm leading-relaxed">
                {project.description ? (
                  truncateText(project.description, 120)
                ) : (
                  <span className="italic text-muted">
                    No description provided
                  </span>
                )}
              </p>
            </div>

            {/* Enhanced stats section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-medium">{flashcardCount}</span>
                  <span>cards</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(project.formattedCreatedAt)}</span>
                </div>
              </div>

              {/* Enhanced active cards section */}
              {hasActiveCards ? (
                <div
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all duration-slower",
                    `${status.bgGradient} ${status.borderColor}`,
                    "group-hover:scale-[1.02]"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-status-success" />
                      <span className="text-sm font-semibold text-secondary">
                        Ready to Study
                      </span>
                    </div>
                    <Badge
                      className={cn(
                        "text-xs font-bold px-2 py-1",
                        `bg-gradient-to-r ${status.gradient} text-white border-0`
                      )}
                    >
                      {totalActiveCards} cards
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {srsStats.dueCards > 0 && (
                      <div className="flex items-center gap-1 text-status-error">
                        <Clock className="w-3 h-3" />
                        <span className="font-medium">{srsStats.dueCards}</span>
                        <span>due</span>
                      </div>
                    )}
                    {srsStats.learningCards > 0 && (
                      <div className="flex items-center gap-1 text-brand-primary">
                        <TrendingUp className="w-3 h-3" />
                        <span className="font-medium">
                          {srsStats.learningCards}
                        </span>
                        <span>learning</span>
                      </div>
                    )}
                    {srsStats.newCards > 0 && (
                      <div className="flex items-center gap-1 text-brand-accent">
                        <Sparkles className="w-3 h-3" />
                        <span className="font-medium">{srsStats.newCards}</span>
                        <span>new</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 surface-secondary rounded-xl border border-subtle">
                  <div className="flex items-center justify-center gap-2 text-muted">
                    <Target className="w-4 h-4" />
                    <span className="text-sm">
                      {flashcardCount === 0 ? "No cards yet" : "All caught up!"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </div>

      {/* Enhanced floating study button */}
      {hasActiveCards && (
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-slower transform translate-y-4 group-hover:translate-y-0">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/projects/${project.id}/study`);
            }}
            size="sm"
            className={cn(
              "text-white shadow-brand hover:shadow-brand-lg transform hover:scale-110 transition-all duration-slower",
              "px-4 py-2 rounded-xl font-semibold group relative overflow-hidden",
              `bg-gradient-to-r ${status.gradient} hover:brightness-110`
            )}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
            <div className="relative z-10 flex items-center gap-2">
              <Play className="w-3 h-3" />
              <span>Study</span>
            </div>
          </Button>
        </div>
      )}
    </Card>
  );
};
