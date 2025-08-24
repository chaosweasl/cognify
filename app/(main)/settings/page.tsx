"use client";
import React, { useState } from "react";
import { Settings, User, Brain, Shield, Sparkles } from "lucide-react";
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
    <div className="flex-1 min-h-screen relative overflow-hidden">
      {/* Enhanced animated background elements matching projects page */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-15">
        <div
          className="absolute top-0 right-0 w-96 h-96 bg-gradient-glass rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-r from-brand-secondary/30 to-brand-accent/30 rounded-full blur-3xl animate-pulse"
          style={{ animationDuration: "12s", animationDelay: "4s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-primary/20 rounded-full blur-2xl animate-pulse"
          style={{ animationDuration: "10s", animationDelay: "2s" }}
        />
      </div>

      {/* Enhanced subtle grid pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-8">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, var(--color-border-subtle) 1px, transparent 0)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <main className="relative z-10 flex-1 px-4 sm:px-6 lg:px-8 py-8 md:py-12 transition-all">
        <div className="max-w-6xl mx-auto">
          {/* Enhanced Header Section with Glass Morphism */}
          <div className="relative mb-8">
            {/* Animated background elements */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div
                className="absolute top-0 left-1/4 w-32 h-32 bg-gradient-glass rounded-full blur-3xl animate-pulse"
                style={{ animationDuration: "8s" }}
              />
              <div
                className="absolute bottom-0 right-1/4 w-24 h-24 bg-gradient-to-r from-brand-secondary/30 to-brand-accent/30 rounded-full blur-2xl animate-pulse"
                style={{ animationDuration: "12s", animationDelay: "4s" }}
              />
            </div>

            <div className="relative z-10 surface-elevated glass-surface border border-subtle rounded-3xl p-6 shadow-brand">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center shadow-brand transform hover:scale-110 hover:rotate-3 transition-all duration-slower">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -inset-1 bg-gradient-glass rounded-2xl blur opacity-60 animate-pulse" />
                </div>

                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
                    Settings
                    {!isLoading && userProfile?.is_admin && (
                      <div className="bg-gradient-to-r from-brand-secondary/20 to-brand-accent/20 text-brand-secondary border border-brand-secondary/30 px-3 py-1 rounded-full text-sm flex items-center gap-1 shadow-brand">
                        <Shield className="w-3 h-3" />
                        Admin
                      </div>
                    )}
                  </h1>
                  <p className="text-secondary mt-1">
                    Customize your profile and learning preferences
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="relative overflow-hidden rounded-3xl glass-surface border border-subtle shadow-brand-lg backdrop-blur group">
            {/* Card glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-glass rounded-3xl blur opacity-0 group-hover:opacity-100 transition-all transition-slow" />

            <div className="relative">
              {/* Enhanced Tab Navigation */}
              <div className="border-b border-subtle surface-secondary">
                <div className="flex">
                  {tabs.map((tab) => {
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-8 py-6 font-semibold transition-all duration-slower relative group ${
                          activeTab === tab.id
                            ? "text-brand-primary"
                            : "text-secondary hover:text-primary"
                        }`}
                      >
                        {/* Active tab indicator */}
                        {activeTab === tab.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-brand rounded-t-full" />
                        )}
                        
                        {/* Tab background */}
                        <div
                          className={`absolute inset-0 transition-all duration-slower ${
                            activeTab === tab.id
                              ? "bg-brand-primary/10"
                              : "bg-transparent group-hover:bg-surface-glass"
                          }`}
                        />

                        <div className="relative z-10 flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-slower ${
                              activeTab === tab.id
                                ? "bg-gradient-brand shadow-brand"
                                : "bg-surface-elevated group-hover:bg-gradient-glass"
                            }`}
                          >
                            <TabIcon
                              className={`w-5 h-5 transition-all duration-slower ${
                                activeTab === tab.id
                                  ? "text-white"
                                  : "text-muted group-hover:text-brand-primary"
                              }`}
                            />
                          </div>
                          <span className="text-lg">{tab.label}</span>
                          
                          {/* Sparkle effect for active tab */}
                          {activeTab === tab.id && (
                            <Sparkles className="w-4 h-4 text-brand-secondary animate-pulse" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Enhanced Tab Content */}
              <div className="p-8">
                {activeTab === "user" && <UserSettingsTab />}
                {activeTab === "srs" && <SRSSettingsTab />}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
