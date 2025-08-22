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
    <main className="flex-1 min-h-screen relative px-4 md:px-12 py-4 md:py-8">
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
              <Settings className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            {!isLoading && userProfile?.is_admin && (
              <div className="bg-violet-500/20 text-violet-200 border border-violet-500/30 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Admin
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-800/40 border border-slate-600 backdrop-blur-sm rounded-lg shadow-2xl overflow-hidden">
          {/* Tab Navigation */}
          <div className="border-b border-slate-600">
            <div className="flex">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? "text-blue-300 border-b-2 border-blue-400 bg-blue-500/10"
                        : "text-slate-300 hover:text-white hover:bg-slate-700/50"
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
