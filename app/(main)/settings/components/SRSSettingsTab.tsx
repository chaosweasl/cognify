"use client";
import React from "react";
import { Info } from "lucide-react";

export function SRSSettingsTab() {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-900 mb-2">
              SRS Settings Moved to Projects
            </h3>
            <p className="text-blue-800 mb-3">
              SRS (Spaced Repetition System) settings are now configured individually for each project, 
              giving you more control over how different types of content are studied.
            </p>
            <p className="text-blue-800 font-medium">
              To configure SRS settings, go to any project and look for the Settings tab.
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 mb-2">What this means:</h3>
        <ul className="text-gray-700 space-y-2">
          <li>• Each project can have different learning steps, intervals, and ease settings</li>
          <li>• You can optimize settings for different types of content (languages, facts, etc.)</li>
          <li>• New projects will use sensible defaults based on Anki&apos;s proven algorithms</li>
          <li>• Existing projects keep their current behavior</li>
        </ul>
      </div>
    </div>
  );
}