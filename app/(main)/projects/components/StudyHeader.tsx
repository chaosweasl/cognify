"use client";
import React from "react";
import { RotateCcw, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

interface StudyHeaderProps {
  projectName: string;
  projectId: string;
  onReset: () => void;
}

export function StudyHeader({
  projectName,
  projectId,
  onReset,
}: StudyHeaderProps) {
  const router = useRouter();

  return (
    <div className="w-full max-w-2xl mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h2 className="text-2xl md:text-3xl font-bold text-primary">
          Study: {projectName || "Demo Flashcards"}
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => router.push(`/projects/${projectId}/edit`)}
            className="btn btn-outline btn-sm gap-2"
            title="Edit flashcards"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={onReset}
            className="btn btn-ghost btn-sm gap-2"
            title="Reset session"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
