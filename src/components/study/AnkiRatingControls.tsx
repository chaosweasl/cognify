import React from "react";
import {
  SRSRating,
  SRSCardState,
  DEFAULT_SRS_SETTINGS,
} from "@/lib/srs/SRSScheduler";

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
        return `${DEFAULT_SRS_SETTINGS.LEARNING_STEPS[0]}m`;
      case 2: // Good
        if (DEFAULT_SRS_SETTINGS.LEARNING_STEPS.length > 1) {
          return `${DEFAULT_SRS_SETTINGS.LEARNING_STEPS[1]}m`;
        }
        return `${DEFAULT_SRS_SETTINGS.GRADUATING_INTERVAL}d`;
      case 3: // Easy
        return `${DEFAULT_SRS_SETTINGS.EASY_INTERVAL}d`;
    }
  } else if (cardState.state === "learning") {
    switch (rating) {
      case 0: // Again
        return `${DEFAULT_SRS_SETTINGS.LEARNING_STEPS[0]}m`;
      case 1: // Hard
        return `${
          DEFAULT_SRS_SETTINGS.LEARNING_STEPS[cardState.learningStep]
        }m`;
      case 2: // Good
        if (
          cardState.learningStep + 1 >=
          DEFAULT_SRS_SETTINGS.LEARNING_STEPS.length
        ) {
          return `${DEFAULT_SRS_SETTINGS.GRADUATING_INTERVAL}d`;
        }
        return `${
          DEFAULT_SRS_SETTINGS.LEARNING_STEPS[cardState.learningStep + 1]
        }m`;
      case 3: // Easy
        return `${DEFAULT_SRS_SETTINGS.EASY_INTERVAL}d`;
    }
  } else if (cardState.state === "review") {
    const ease = cardState.ease;
    switch (rating) {
      case 0: // Again
        return `${DEFAULT_SRS_SETTINGS.RELEARNING_STEPS[0]}m`;
      case 1: // Hard
        return `${Math.round(
          cardState.interval * DEFAULT_SRS_SETTINGS.HARD_INTERVAL_FACTOR
        )}d`;
      case 2: // Good
        return `${Math.round(cardState.interval * ease)}d`;
      case 3: // Easy
        return `${Math.round(
          cardState.interval * ease * DEFAULT_SRS_SETTINGS.EASY_INTERVAL_FACTOR
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
    className={`flex flex-col gap-4 mb-6 transition-all transition-normal ${
      flipped
        ? "opacity-100 pointer-events-auto"
        : "opacity-0 pointer-events-none"
    }`}
    aria-hidden={!flipped}
    role="group"
    aria-label="Card difficulty rating controls"
  >
    <div id="rating-help" className="sr-only" aria-live="polite">
      Use keyboard shortcuts: Press 1 for Again, 2 for Hard, 3 for Good, or 4
      for Easy. These ratings determine when you&rsquo;ll see this card next.
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-center">
      <button
        className="surface-glass border-2 border-status-error text-status-error hover:bg-status-error hover:text-white interactive-hover flex flex-col h-16 px-4 rounded-md font-medium transition-all transition-normal transform hover:scale-[1.02] shadow-lg focus:ring-2 focus:ring-status-error/50 focus:outline-none"
        onClick={() => handleRate(0)}
        disabled={ratingLoading}
        aria-label={`Rate card as Again. Next review in ${getNextIntervalDisplay(
          cardState,
          0
        )}`}
        aria-describedby="rating-help"
        tabIndex={0}
      >
        <span className="font-medium">Again</span>
        <span className="text-xs opacity-70">
          {getNextIntervalDisplay(cardState, 0)}
        </span>
      </button>
      <button
        className="surface-glass border-2 border-status-warning text-status-warning hover:bg-status-warning hover:text-white interactive-hover flex flex-col h-16 px-4 rounded-md font-medium transition-all transition-normal transform hover:scale-[1.02] shadow-lg focus:ring-2 focus:ring-status-warning/50 focus:outline-none"
        onClick={() => handleRate(1)}
        disabled={ratingLoading}
        aria-label={`Rate card as Hard. Next review in ${getNextIntervalDisplay(
          cardState,
          1
        )}`}
        aria-describedby="rating-help"
        tabIndex={0}
      >
        <span className="font-medium">Hard</span>
        <span className="text-xs opacity-70">
          {getNextIntervalDisplay(cardState, 1)}
        </span>
      </button>
      <button
        className="surface-glass border-2 border-status-success text-status-success hover:bg-status-success hover:text-white interactive-hover flex flex-col h-16 px-4 rounded-md font-medium transition-all transition-normal transform hover:scale-[1.02] shadow-lg focus:ring-2 focus:ring-status-success/50 focus:outline-none"
        onClick={() => handleRate(2)}
        disabled={ratingLoading}
        aria-label={`Rate card as Good. Next review in ${getNextIntervalDisplay(
          cardState,
          2
        )}`}
        aria-describedby="rating-help"
        tabIndex={0}
      >
        <span className="font-medium">Good</span>
        <span className="text-xs opacity-70">
          {getNextIntervalDisplay(cardState, 2)}
        </span>
      </button>
      <button
        className="surface-glass border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white interactive-hover flex flex-col h-16 px-4 rounded-md font-medium transition-all transition-normal transform hover:scale-[1.02] shadow-lg focus:ring-2 focus:ring-brand-primary/50 focus:outline-none"
        onClick={() => handleRate(3)}
        disabled={ratingLoading}
        aria-label={`Rate card as Easy. Next review in ${getNextIntervalDisplay(
          cardState,
          3
        )}`}
        aria-describedby="rating-help"
        tabIndex={0}
      >
        <span className="font-medium">Easy</span>
        <span className="text-xs opacity-70">
          {getNextIntervalDisplay(cardState, 3)}
        </span>
      </button>
    </div>
  </div>
);
