import React from "react";
import { SRSRating, SRSCardState, SRS_SETTINGS } from "./SRSScheduler";

interface AnkiRatingControlsProps {
  flipped: boolean;
  handleRate: (rating: SRSRating) => void;
  ratingLoading?: boolean;
  cardState?: SRSCardState;
}

function getNextIntervalDisplay(
  cardState: SRSCardState | undefined,
  rating: SRSRating
): string {
  if (!cardState) return "";

  if (cardState.state === "new") {
    switch (rating) {
      case 0: // Again
      case 1: // Hard
        return `${SRS_SETTINGS.LEARNING_STEPS[0]}m`;
      case 2: // Good
        if (SRS_SETTINGS.LEARNING_STEPS.length > 1) {
          return `${SRS_SETTINGS.LEARNING_STEPS[1]}m`;
        }
        return `${SRS_SETTINGS.GRADUATING_INTERVAL}d`;
      case 3: // Easy
        return `${SRS_SETTINGS.EASY_INTERVAL}d`;
    }
  } else if (cardState.state === "learning") {
    switch (rating) {
      case 0: // Again
        return `${SRS_SETTINGS.LEARNING_STEPS[0]}m`;
      case 1: // Hard
        return `${SRS_SETTINGS.LEARNING_STEPS[cardState.learningStep]}m`;
      case 2: // Good
        if (cardState.learningStep + 1 >= SRS_SETTINGS.LEARNING_STEPS.length) {
          return `${SRS_SETTINGS.GRADUATING_INTERVAL}d`;
        }
        return `${SRS_SETTINGS.LEARNING_STEPS[cardState.learningStep + 1]}m`;
      case 3: // Easy
        return `${SRS_SETTINGS.EASY_INTERVAL}d`;
    }
  } else if (cardState.state === "review") {
    const ease = cardState.ease;
    switch (rating) {
      case 0: // Again
        return `${SRS_SETTINGS.RELEARNING_STEPS[0]}m`;
      case 1: // Hard
        return `${Math.round(
          cardState.interval * SRS_SETTINGS.HARD_INTERVAL_FACTOR
        )}d`;
      case 2: // Good
        return `${Math.round(cardState.interval * ease)}d`;
      case 3: // Easy
        return `${Math.round(
          cardState.interval * ease * SRS_SETTINGS.EASY_INTERVAL_FACTOR
        )}d`;
    }
  }

  return "";
}

export const AnkiRatingControls: React.FC<AnkiRatingControlsProps> = ({
  flipped,
  handleRate,
  ratingLoading = false,
  cardState,
}) => (
  <div
    className={`flex flex-wrap gap-3 mb-6 min-h-[72px] transition-all duration-200 justify-center ${
      flipped
        ? "opacity-100 pointer-events-auto"
        : "opacity-0 pointer-events-none"
    }`}
    aria-hidden={!flipped}
  >
    <button
      className="btn btn-outline btn-error flex flex-col h-16"
      onClick={() => handleRate(0)}
      disabled={ratingLoading}
    >
      <span className="font-medium">Again</span>
      <span className="text-xs opacity-70">
        {getNextIntervalDisplay(cardState, 0)}
      </span>
    </button>
    <button
      className="btn btn-outline btn-warning flex flex-col h-16"
      onClick={() => handleRate(1)}
      disabled={ratingLoading}
    >
      <span className="font-medium">Hard</span>
      <span className="text-xs opacity-70">
        {getNextIntervalDisplay(cardState, 1)}
      </span>
    </button>
    <button
      className="btn btn-outline btn-success flex flex-col h-16"
      onClick={() => handleRate(2)}
      disabled={ratingLoading}
    >
      <span className="font-medium">Good</span>
      <span className="text-xs opacity-70">
        {getNextIntervalDisplay(cardState, 2)}
      </span>
    </button>
    <button
      className="btn btn-outline btn-info flex flex-col h-16"
      onClick={() => handleRate(3)}
      disabled={ratingLoading}
    >
      <span className="font-medium">Easy</span>
      <span className="text-xs opacity-70">
        {getNextIntervalDisplay(cardState, 3)}
      </span>
    </button>
  </div>
);
