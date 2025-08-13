"use client";
import React from "react";
import { RotateCcw, BookOpen, Target, Zap } from "lucide-react";
import { SRSCardState } from "@/lib/srs/SRSScheduler";
import { useSettingsStore } from "@/hooks/useSettings";

// Daily Limits Progress Component
interface DailyLimitsProgressProps {
  newCardsStudied: number;
  reviewsCompleted: number;
}

export function DailyLimitsProgress({
  newCardsStudied,
  reviewsCompleted,
}: DailyLimitsProgressProps) {
  const { srsSettings } = useSettingsStore();
  
  const newCardsProgress = (newCardsStudied / srsSettings.NEW_CARDS_PER_DAY) * 100;
  const reviewsProgress = (reviewsCompleted / srsSettings.MAX_REVIEWS_PER_DAY) * 100;

  return (
    <div className="flex flex-col gap-3 p-4 bg-base-200 rounded-lg">
      <h3 className="text-sm font-semibold text-base-content">Daily Progress</h3>
      
      {/* New Cards Progress */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs">
          <span>New Cards</span>
          <span>{newCardsStudied} / {srsSettings.NEW_CARDS_PER_DAY}</span>
        </div>
        <div className="w-full bg-base-300 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${Math.min(newCardsProgress, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Reviews Progress */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs">
          <span>Reviews</span>
          <span>{reviewsCompleted} / {srsSettings.MAX_REVIEWS_PER_DAY}</span>
        </div>
        <div className="w-full bg-base-300 rounded-full h-2">
          <div 
            className="bg-secondary h-2 rounded-full transition-all duration-300" 
            style={{ width: `${Math.min(reviewsProgress, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

// Card Type Indicator Component
interface CardTypeIndicatorProps {
  cardState: SRSCardState;
}

export function CardTypeIndicator({ cardState }: CardTypeIndicatorProps) {
  const { srsSettings } = useSettingsStore();

  const getCardTypeInfo = (state: SRSCardState) => {
    switch (state.state) {
      case "new":
        return {
          icon: Zap,
          label: "New",
          color: "text-info",
          bgColor: "bg-info/10",
          description: "First time learning this card",
        };
      case "learning":
        return {
          icon: BookOpen,
          label: "Learning",
          color: "text-warning",
          bgColor: "bg-warning/10",
          description: `Step ${state.learningStep + 1} of ${srsSettings.LEARNING_STEPS.length}`,
        };
      case "review":
        return {
          icon: Target,
          label: "Review",
          color: "text-success",
          bgColor: "bg-success/10",
          description: `Interval: ${state.interval} days`,
        };
      case "relearning":
        return {
          icon: RotateCcw,
          label: "Relearning",
          color: "text-error",
          bgColor: "bg-error/10",
          description: `Relearning step ${state.learningStep + 1}`,
        };
      default:
        return {
          icon: BookOpen,
          label: "Unknown",
          color: "text-base-content",
          bgColor: "bg-base-200",
          description: "Unknown card state",
        };
    }
  };

  const { icon: Icon, label, color, bgColor, description } = getCardTypeInfo(cardState);

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${bgColor}`}>
      <Icon className={`w-4 h-4 ${color}`} />
      <div className="flex flex-col">
        <span className={`text-sm font-medium ${color}`}>{label}</span>
        <span className="text-xs text-base-content/70">{description}</span>
      </div>
    </div>
  );
}