"use client";

import React from "react";
import { CircleAlert } from "lucide-react";

export const EarlyDevWarning: React.FC = () => {
  const [showTooltip, setShowTooltip] = React.useState(false);
  // Detect mobile (simple user agent check)
  const isMobile =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(max-width: 640px)").matches;
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-end">
      <div className="relative">
        {/* DaisyUI tooltip for desktop, toggled for mobile */}
        <button
          className="bg-error text-error-content rounded-full shadow-lg border border-error/30 p-2 text-xl focus:outline-none focus:ring-2 focus:ring-warning/60"
          tabIndex={0}
          onClick={() => isMobile && setShowTooltip((v) => !v)}
          onMouseEnter={() => !isMobile && setShowTooltip(true)}
          onMouseLeave={() => !isMobile && setShowTooltip(false)}
          onFocus={() => !isMobile && setShowTooltip(true)}
          onBlur={() => !isMobile && setShowTooltip(false)}
        >
          <CircleAlert />
        </button>
        {/* Tooltip */}
        <div
          className={`tooltip tooltip-error tooltip-left font-semibold ${
            showTooltip ? "tooltip-open" : ""
          }`}
          data-tip="Cognify is in early development. Data and features may be volatile."
          style={{ position: "absolute", right: "2.5rem", bottom: "1.3rem" }}
        ></div>
      </div>
    </div>
  );
};

export default EarlyDevWarning;
