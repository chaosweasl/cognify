import React from "react";
import { SRSRating } from "./SRSScheduler";

interface AnkiRatingControlsProps {
  flipped: boolean;
  handleRate: (rating: SRSRating) => void;
  ratingLoading?: boolean;
}

export const AnkiRatingControls: React.FC<AnkiRatingControlsProps> = ({
  flipped,
  handleRate,
  ratingLoading = false,
}) => (
  <div
    className={`flex flex-wrap gap-3 mb-6 min-h-[48px] transition-all duration-200 justify-center ${
      flipped
        ? "opacity-100 pointer-events-auto"
        : "opacity-0 pointer-events-none"
    }`}
    aria-hidden={!flipped}
  >
    <button
      className="btn btn-outline btn-error"
      onClick={() => handleRate(0)}
      disabled={ratingLoading}
    >
      Again
    </button>
    <button
      className="btn btn-outline btn-warning"
      onClick={() => handleRate(1)}
      disabled={ratingLoading}
    >
      Hard
    </button>
    <button
      className="btn btn-outline btn-success"
      onClick={() => handleRate(2)}
      disabled={ratingLoading}
    >
      Good
    </button>
    <button
      className="btn btn-outline btn-info"
      onClick={() => handleRate(3)}
      disabled={ratingLoading}
    >
      Easy
    </button>
  </div>
);
