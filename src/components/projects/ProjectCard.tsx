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

  // Calculate project progress/status
  const getProjectStatus = () => {
    if (srsStats.dueCards > 0)
      return { label: "Ready to Study", color: "green", icon: Play };
    if (srsStats.learningCards > 0)
      return { label: "In Progress", color: "blue", icon: TrendingUp };
    if (srsStats.newCards > 0)
      return { label: "New Cards", color: "purple", icon: Sparkles };
    if (flashcardCount > 0)
      return { label: "Completed", color: "gray", icon: Target };
    return { label: "Empty", color: "gray", icon: BookOpen };
  };

  const status = getProjectStatus();

  // Truncate description for grid view
  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year:
          date.getFullYear() !== new Date().getFullYear()
            ? "numeric"
            : undefined,
      });
    } catch {
      return "Unknown";
    }
  };

  if (viewMode === "list") {
    return (
      <Card
        className={cn(
          "group relative overflow-hidden transition-all duration-slower transform",
          "glass-surface border border-subtle shadow-brand hover:shadow-brand-lg",
          "hover:scale-[1.01] hover:-translate-y-1",
          isHovered && "surface-elevated scale-[1.005]",
          isDeleting && "opacity-50 scale-95"
        )}
      >
        {/* Animated background gradient */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-glass opacity-0 transition-opacity duration-slower",
            "group-hover:opacity-100"
          )}
        />

        {/* Hover glow effect */}
        <div
          className={cn(
            "absolute -inset-0.5 bg-gradient-brand rounded-xl blur opacity-0 transition-opacity duration-slower",
            isHovered && "opacity-20"
          )}
        />

        <div className="relative z-10 p-6">
          <div className="flex items-center justify-between">
            {/* Left section - Main info */}
            <div className="flex items-center space-x-6 flex-1 min-w-0">
              {/* Project indicator */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-brand transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-slower">
                  <status.icon className="w-6 h-6 text-white" />
                </div>
                {hasActiveCards && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>

              {/* Project details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3
                    className="text-xl font-bold text-primary group-hover:brand-primary transition-colors cursor-pointer truncate"
                    onClick={() => router.push(`/projects/${project.id}`)}
                    title={project.name}
                  >
                    {project.name}
                  </h3>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-medium px-2 py-1",
                      status.color === "green" &&
                        "bg-green-500/10 text-green-400 border-green-500/30",
                      status.color === "blue" &&
                        "bg-blue-500/10 text-blue-400 border-blue-500/30",
                      status.color === "purple" &&
                        "bg-purple-500/10 text-purple-400 border-purple-500/30",
                      status.color === "gray" &&
                        "bg-gray-500/10 text-gray-400 border-gray-500/30"
                    )}
                  >
                    {status.label}
                  </Badge>
                </div>

                <p className="text-secondary text-sm mb-3 leading-relaxed">
                  {project.description || "No description"}
                </p>

                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-muted">
                    <BookOpen className="w-4 h-4" />
                    <span>{flashcardCount} cards</span>
                  </div>
                  {hasActiveCards && (
                    <div className="flex items-center gap-2 text-green-400">
                      <Zap className="w-4 h-4" />
                      <span>{totalActiveCards} to study</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Created {formatDate(project.formattedCreatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right section - Actions */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {hasActiveCards && (
                <Button
                  onClick={() => router.push(`/projects/${project.id}/study`)}
                  className="bg-gradient-brand hover:bg-gradient-brand-hover text-white shadow-brand hover:shadow-brand-lg transform hover:scale-105 transition-all duration-slower px-6 py-2 rounded-xl font-medium group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-slower skew-x-12" />
                  <div className="relative z-10 flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Study Now
                  </div>
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 surface-secondary border border-subtle interactive-hover rounded-xl glass-surface"
                  >
                    <MoreVertical className="w-4 h-4 text-secondary" />
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
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus-visible:text-red-300 focus-visible:bg-red-500/10 flex items-center gap-2"
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

  // Grid view (default)
  return (
    <Card
      className={cn(
        "group relative overflow-hidden cursor-pointer transition-all duration-slower transform",
        "glass-surface border border-subtle shadow-brand hover:shadow-brand-lg",
        "hover:scale-[1.03] hover:-translate-y-2",
        isHovered && "surface-elevated scale-[1.01]",
        isDeleting && "opacity-50 scale-95"
      )}
    >
      {/* Animated background gradient */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-glass opacity-0 transition-opacity duration-slower",
          "group-hover:opacity-100"
        )}
      />

      {/* Hover glow effect */}
      <div
        className={cn(
          "absolute -inset-0.5 bg-gradient-brand rounded-xl blur opacity-0 transition-opacity duration-slower",
          isHovered && "opacity-20"
        )}
      />

      {/* Status indicator bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1 transition-all duration-slower",
          status.color === "green" &&
            "bg-gradient-to-r from-green-400 to-green-500",
          status.color === "blue" &&
            "bg-gradient-to-r from-blue-400 to-blue-500",
          status.color === "purple" &&
            "bg-gradient-to-r from-purple-400 to-purple-500",
          status.color === "gray" &&
            "bg-gradient-to-r from-gray-400 to-gray-500"
        )}
      />

      {/* Main click area */}
      <div
        className="relative z-10"
        onClick={() => router.push(`/projects/${project.id}`)}
      >
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Project icon */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-brand transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-slower">
                  <status.icon className="w-6 h-6 text-white" />
                </div>
                {hasActiveCards && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
                <div
                  className={cn(
                    "absolute -inset-1 bg-gradient-glass rounded-2xl blur opacity-0 transition-opacity duration-slower",
                    "group-hover:opacity-60"
                  )}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className="text-lg font-bold text-primary group-hover:brand-primary transition-colors truncate mb-1"
                  title={project.name}
                >
                  {project.name}
                </h3>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-medium px-2 py-1",
                    status.color === "green" &&
                      "bg-green-500/10 text-green-400 border-green-500/30",
                    status.color === "blue" &&
                      "bg-blue-500/10 text-blue-400 border-blue-500/30",
                    status.color === "purple" &&
                      "bg-purple-500/10 text-purple-400 border-purple-500/30",
                    status.color === "gray" &&
                      "bg-gray-500/10 text-gray-400 border-gray-500/30"
                  )}
                >
                  {status.label}
                </Badge>
              </div>
            </div>

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-slower",
                    "surface-secondary border border-subtle interactive-hover rounded-lg glass-surface"
                  )}
                >
                  <MoreVertical className="w-3 h-3 text-secondary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44 surface-overlay glass-surface border-subtle"
              >
                <DropdownMenuItem
                  className="interactive-hover"
                  onSelect={() => router.push(`/projects/${project.id}`)}
                >
                  View Project
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="interactive-hover"
                  onSelect={() => router.push(`/projects/${project.id}/edit`)}
                >
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-subtle" />
                <DropdownMenuItem
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus-visible:text-red-300 focus-visible:bg-red-500/10"
                  onSelect={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Description */}
            <p className="text-secondary text-sm leading-relaxed min-h-[2.5rem]">
              {project.description
                ? truncateText(project.description, 100)
                : "No description"}
            </p>

            {/* Stats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted">
                  <BookOpen className="w-4 h-4" />
                  <span>{flashcardCount} cards</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(project.formattedCreatedAt)}</span>
                </div>
              </div>

              {/* Active cards breakdown */}
              {hasActiveCards && (
                <div className="p-3 bg-gradient-glass border border-brand/20 rounded-xl">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary font-medium">
                      Ready to Study
                    </span>
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
                      {totalActiveCards} cards
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-2 text-xs">
                    {srsStats.dueCards > 0 && (
                      <div className="flex items-center gap-1 text-red-400">
                        <Clock className="w-3 h-3" />
                        <span>{srsStats.dueCards} due</span>
                      </div>
                    )}
                    {srsStats.learningCards > 0 && (
                      <div className="flex items-center gap-1 text-blue-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>{srsStats.learningCards} learning</span>
                      </div>
                    )}
                    {srsStats.newCards > 0 && (
                      <div className="flex items-center gap-1 text-purple-400">
                        <Sparkles className="w-3 h-3" />
                        <span>{srsStats.newCards} new</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </div>

      {/* Study button overlay */}
      {hasActiveCards && (
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-slower transform translate-y-2 group-hover:translate-y-0">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/projects/${project.id}/study`);
            }}
            size="sm"
            className="bg-gradient-brand hover:bg-gradient-brand-hover text-white shadow-brand hover:shadow-brand-lg transform hover:scale-110 transition-all duration-slower px-4 py-2 rounded-xl font-medium group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-slower skew-x-12" />
            <div className="relative z-10 flex items-center gap-2">
              <Play className="w-3 h-3" />
              Study
            </div>
          </Button>
        </div>
      )}
    </Card>
  );
};
