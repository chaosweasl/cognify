"use client";

import { useState } from "react";
import { Download, FileDown } from "lucide-react";
import { toast } from "sonner";
import { Flashcard } from "@/src/types";

interface FlashcardExporterProps {
  flashcards: Flashcard[];
  projectName?: string;
  disabled?: boolean;
}

export function FlashcardExporter({
  flashcards,
  projectName = "flashcards",
  disabled = false,
}: FlashcardExporterProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToJson = async () => {
    if (!flashcards || flashcards.length === 0) {
      toast.error("No flashcards to export");
      return;
    }

    setIsExporting(true);
    try {
      // Prepare export data in clean format
      const exportData = {
        export_date: new Date().toISOString(),
        project_name: projectName,
        flashcard_count: flashcards.length,
        flashcards: flashcards.map((card) => ({
          front: card.front,
          back: card.back,
          // Include extra data if available
          ...(card.extra && Object.keys(card.extra).length > 0
            ? { extra: card.extra }
            : {}),
        })),
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Generate filename with date and project name
      const safeProjectName = projectName
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase();
      const dateStr = new Date().toISOString().split("T")[0];
      a.download = `${safeProjectName}_flashcards_${dateStr}.json`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${flashcards.length} flashcards successfully`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export flashcards");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      className="btn btn-outline border-brand-primary text-brand-primary hover:bg-gradient-brand hover:border-brand hover:text-white interactive-hover transition-all transition-normal rounded-xl shadow-brand hover:shadow-brand-lg group relative overflow-hidden"
      onClick={exportToJson}
      disabled={
        disabled || isExporting || !flashcards || flashcards.length === 0
      }
      title={
        flashcards?.length === 0
          ? "No flashcards to export"
          : `Export ${flashcards.length} flashcard${
              flashcards.length !== 1 ? "s" : ""
            } to JSON`
      }
    >
      <div className="absolute inset-0 bg-gradient-glass translate-x-full group-hover:translate-x-0 transition-transform duration-slow skew-x-12" />
      <div className="relative z-10 flex items-center gap-2">
        {isExporting ? (
          <>
            <FileDown className="w-4 h-4 animate-pulse" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Export JSON
            {flashcards && flashcards.length > 0 && (
              <span className="text-xs opacity-75">({flashcards.length})</span>
            )}
          </>
        )}
      </div>
    </button>
  );
}
