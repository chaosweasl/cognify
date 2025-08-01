"use client";
import React from "react";
import { RotateCcw, BookOpen, Target, Zap } from "lucide-react";
import { SRSCardState, SRS_SETTINGS } from "./SRSScheduler";

interface CardTypeIndicatorProps {
  cardState: SRSCardState;
}

export function CardTypeIndicator({ cardState }: CardTypeIndicatorProps) {
  const getCardTypeInfo = (state: SRSCardState) => {
    switch (state.state) {
      case "new":
        return { label: "New", color: "text-blue-600", icon: Zap };
      case "learning":
        return {
          label: `Learning (${state.learningStep + 1}/${
            SRS_SETTINGS.LEARNING_STEPS.length
          })`,
          color: "text-orange-600",
          icon: Target,
        };
      case "relearning":
        return {
          label: `Relearning (${state.learningStep + 1}/${
            SRS_SETTINGS.RELEARNING_STEPS.length
          })`,
          color: "text-red-600",
          icon: RotateCcw,
        };
      case "review":
        return {
          label: `Review (${state.interval}d)`,
          color: "text-green-600",
          icon: BookOpen,
        };
      default:
        return { label: "Unknown", color: "text-gray-600", icon: BookOpen };
    }
  };

  const cardTypeInfo = getCardTypeInfo(cardState);
  const CardTypeIcon = cardTypeInfo.icon;

  return (
    <div className="flex items-center justify-center gap-2 mb-4">
      <CardTypeIcon className={`w-5 h-5 ${cardTypeInfo.color}`} />
      <span className={`font-medium ${cardTypeInfo.color}`}>
        {cardTypeInfo.label}
      </span>
      {cardState.isLeech && (
        <span className="badge badge-error badge-sm">Leech</span>
      )}
    </div>
  );
}
