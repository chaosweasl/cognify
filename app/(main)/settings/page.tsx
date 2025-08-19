"use client";
import React, { useState } from "react";
import { Settings, User, Brain, Shield } from "lucide-react";
import { useUserProfile } from "@/hooks/useUserProfile";

// Sub-components
import { UserSettingsTab } from "./components/UserSettingsTab";
import { SRSSettingsTab } from "./components/SRSSettingsTab";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("user");
  const { userProfile, isLoading } = useUserProfile();

  const tabs = [
    { id: "user", label: "User Settings", icon: User },
    { id: "srs", label: "Card Settings", icon: Brain },
  ];

  return (
    <main className="flex-1 min-h-screen bg-base-200 px-4 md:px-12 py-4 md:py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-base-content">Settings</h1>
            {!isLoading && userProfile?.is_admin && (
              <div className="badge badge-primary gap-1">
                <Shield className="w-3 h-3" />
                Admin
              </div>
            )}
          </div>
        </div>

        <div className="bg-base-100 rounded-lg shadow-lg overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-base-300">
            <div className="flex">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                      activeTab === tab.id
                        ? "text-primary border-b-2 border-primary bg-primary/5"
                        : "text-base-content/70 hover:text-base-content hover:bg-base-200"
                    }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "user" && <UserSettingsTab />}
            {activeTab === "srs" && <SRSSettingsTab />}
          </div>
        </div>
      </div>
    </main>
  );
}
