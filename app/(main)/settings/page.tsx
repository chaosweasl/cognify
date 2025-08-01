"use client";
import React from "react";
import { useSettingsStore } from "@/hooks/useSettings";
import { UserSettingsTab } from "./components/UserSettingsTab";
import { SRSSettingsTab } from "./components/SRSSettingsTab";
import { User, Brain } from "lucide-react";

export default function SettingsPage() {
  const { loadSettings, isLoading } = useSettingsStore();
  const [activeTab, setActiveTab] = React.useState<"user" | "srs">("user");
  const [isInitialized, setIsInitialized] = React.useState(false);

  React.useEffect(() => {
    if (!isInitialized) {
      loadSettings().finally(() => setIsInitialized(true));
    }
  }, [loadSettings, isInitialized]);

  if (isLoading && !isInitialized) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-base-content mb-2">Settings</h1>
          <p className="text-base-content/70">
            Configure your preferences and study settings
          </p>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-bordered mb-8">
          <button
            className={`tab tab-lg gap-2 ${
              activeTab === "user" ? "tab-active" : ""
            }`}
            onClick={() => setActiveTab("user")}
          >
            <User className="w-5 h-5" />
            Profile & Preferences
          </button>
          <button
            className={`tab tab-lg gap-2 ${
              activeTab === "srs" ? "tab-active" : ""
            }`}
            onClick={() => setActiveTab("srs")}
          >
            <Brain className="w-5 h-5" />
            Card & Study Settings
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-base-200 rounded-lg p-6">
          {activeTab === "user" && <UserSettingsTab />}
          {activeTab === "srs" && <SRSSettingsTab />}
        </div>
      </div>
    </div>
  );
}
