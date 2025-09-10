"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  Brain,
  FileText,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ProjectType,
  PROJECT_TYPE_CONFIGS,
  ProjectTypeConfig,
} from "@/src/types";

// Icon mapping for dynamic icons
const ICON_MAP = {
  BookOpen,
  Brain,
  FileText,
};

interface ProjectTypeBadgeProps {
  projectType: ProjectType;
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
  className?: string;
}

export function ProjectTypeBadge({
  projectType,
  size = "md",
  showDescription = false,
  className,
}: ProjectTypeBadgeProps) {
  const config = PROJECT_TYPE_CONFIGS[projectType];
  const IconComponent = ICON_MAP[config.icon as keyof typeof ICON_MAP];

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <Badge
        variant="outline"
        className={cn(
          sizeClasses[size],
          `border-${config.color}-500/30 bg-${config.color}-500/10 text-${config.color}-700 dark:text-${config.color}-300`,
          "font-medium"
        )}
      >
        <IconComponent className={cn(iconSizes[size], "mr-1.5")} />
        {config.name}
      </Badge>
      {showDescription && (
        <span className="text-sm text-secondary hidden sm:inline">
          {config.description}
        </span>
      )}
    </div>
  );
}

interface ProjectTypeSelectorProps {
  selectedType: ProjectType | null;
  onTypeSelect: (type: ProjectType) => void;
  variant?: "grid" | "dropdown" | "compact";
  disabled?: boolean;
  className?: string;
}

export function ProjectTypeSelector({
  selectedType,
  onTypeSelect,
  variant = "grid",
  disabled = false,
  className,
}: ProjectTypeSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  if (variant === "dropdown") {
    return (
      <div className={cn("relative", className)}>
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full justify-between"
        >
          {selectedType ? (
            <div className="flex items-center gap-2">
              {(() => {
                const config = PROJECT_TYPE_CONFIGS[selectedType];
                const IconComponent =
                  ICON_MAP[config.icon as keyof typeof ICON_MAP];
                return (
                  <>
                    <IconComponent className="w-4 h-4" />
                    {config.name}
                  </>
                );
              })()}
            </div>
          ) : (
            "Select project type"
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </Button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-background border border-subtle rounded-lg shadow-lg overflow-hidden">
            {Object.values(PROJECT_TYPE_CONFIGS).map((config) => {
              const IconComponent =
                ICON_MAP[config.icon as keyof typeof ICON_MAP];
              return (
                <button
                  key={config.id}
                  onClick={() => {
                    onTypeSelect(config.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-secondary transition-colors",
                    selectedType === config.id &&
                      "bg-brand-primary/10 text-brand-primary"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      `bg-${config.color}-500/10`
                    )}
                  >
                    <IconComponent
                      className={cn("w-4 h-4", `text-${config.color}-500`)}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{config.name}</div>
                    <div className="text-xs text-secondary">
                      {config.description}
                    </div>
                  </div>
                  {selectedType === config.id && (
                    <CheckCircle2 className="w-4 h-4 text-brand-primary" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className={cn("flex gap-2", className)}>
        {Object.values(PROJECT_TYPE_CONFIGS).map((config) => {
          const IconComponent = ICON_MAP[config.icon as keyof typeof ICON_MAP];
          const isSelected = selectedType === config.id;

          return (
            <button
              key={config.id}
              onClick={() => onTypeSelect(config.id)}
              disabled={disabled}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all hover:scale-105",
                isSelected
                  ? `border-${config.color}-500 bg-${config.color}-500/10 text-${config.color}-700 dark:text-${config.color}-300`
                  : "border-subtle hover:border-primary text-secondary hover:text-primary"
              )}
            >
              <IconComponent className="w-4 h-4" />
              <span className="text-sm font-medium">{config.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Default grid variant
  return (
    <div className={cn("grid gap-4", className)}>
      {Object.values(PROJECT_TYPE_CONFIGS).map((config) => {
        const IconComponent = ICON_MAP[config.icon as keyof typeof ICON_MAP];
        const isSelected = selectedType === config.id;

        return (
          <Card
            key={config.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md hover:-translate-y-1",
              isSelected
                ? `border-${config.color}-500 bg-${config.color}-500/5 shadow-${config.color}-100`
                : "border-subtle hover:border-brand-primary/30",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !disabled && onTypeSelect(config.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    `bg-${config.color}-500/10`
                  )}
                >
                  <IconComponent
                    className={cn("w-6 h-6", `text-${config.color}-500`)}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-primary">
                      {config.name}
                    </h3>
                    {isSelected && (
                      <CheckCircle2
                        className={cn("w-4 h-4", `text-${config.color}-500`)}
                      />
                    )}
                  </div>

                  <p className="text-sm text-secondary mb-3">
                    {config.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {config.features.map((feature, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

interface ProjectTypeInfoProps {
  projectType: ProjectType;
  showFeatures?: boolean;
  className?: string;
}

export function ProjectTypeInfo({
  projectType,
  showFeatures = true,
  className,
}: ProjectTypeInfoProps) {
  const config = PROJECT_TYPE_CONFIGS[projectType];
  const IconComponent = ICON_MAP[config.icon as keyof typeof ICON_MAP];

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          `bg-${config.color}-500/10`
        )}
      >
        <IconComponent className={cn("w-5 h-5", `text-${config.color}-500`)} />
      </div>

      <div className="flex-1">
        <h4 className="font-semibold text-primary mb-1">{config.name}</h4>
        <p className="text-sm text-secondary mb-2">{config.description}</p>

        {showFeatures && (
          <div className="flex flex-wrap gap-1">
            {config.features.map((feature, index) => (
              <Badge
                key={index}
                variant="outline"
                className={cn(
                  "text-xs",
                  `border-${config.color}-500/30 bg-${config.color}-500/10 text-${config.color}-700 dark:text-${config.color}-300`
                )}
              >
                {feature}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
