"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  User,
  Brain,
  Shield,
  Sparkles,
  Loader2,
  Clock,
  Star,
} from "lucide-react";

// Sub-components
import { UserSettingsTab } from "./components/UserSettingsTab";

interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  is_admin: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("user");
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/user/profile");
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await response.json();
        setUserProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const tabs = [{ id: "user", label: "User Settings", icon: User }];

  // Enhanced loading state
  if (loading) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 left-1/4 w-40 h-40 bg-gradient-glass rounded-full blur-3xl animate-pulse opacity-40"
            style={{ animationDuration: "3s" }}
          />
          <div
            className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-gradient-to-r from-brand-secondary/20 to-brand-accent/20 rounded-full blur-2xl animate-pulse opacity-50"
            style={{ animationDuration: "4s", animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 right-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-brand-primary/15 rounded-full blur-xl animate-pulse opacity-60"
            style={{ animationDuration: "5s", animationDelay: "2s" }}
          />
        </div>

        {/* Subtle animated grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div
            className="absolute inset-0 animate-pulse"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, var(--color-brand-primary) 1px, transparent 0)`,
              backgroundSize: "60px 60px",
              animationDuration: "8s",
            }}
          />
        </div>

        <div className="surface-elevated glass-surface border border-subtle rounded-3xl p-12 max-w-2xl w-full mx-4 relative z-10 shadow-brand-lg">
          <div className="flex flex-col items-center space-y-8">
            {/* Enhanced multi-layered loading animation */}
            <div className="relative mb-6">
              {/* Outer spinning ring */}
              <div className="w-32 h-32 border-4 border-secondary/20 border-t-brand-primary rounded-full animate-spin" />

              {/* Middle counter-spinning ring */}
              <div
                className="absolute inset-4 w-24 h-24 border-3 border-transparent border-r-brand-secondary rounded-full animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "2s",
                }}
              />

              {/* Inner pulsing core */}
              <div className="absolute inset-8 w-16 h-16 bg-gradient-brand rounded-full animate-pulse opacity-80" />

              {/* Center settings icon */}
              <div className="absolute inset-12 w-8 h-8 flex items-center justify-center">
                <Settings className="w-8 h-8 text-white animate-pulse drop-shadow-sm" />
              </div>

              {/* Orbiting dots */}
              <div
                className="absolute inset-0 animate-spin"
                style={{ animationDuration: "12s" }}
              >
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-brand-accent rounded-full animate-pulse" />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-brand-secondary rounded-full animate-pulse" />
              </div>
            </div>

            <div className="text-center space-y-6">
              <h2 className="text-4xl font-bold text-primary">
                Loading Settings
              </h2>

              <div className="flex items-center justify-center space-x-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-brand-primary rounded-full animate-bounce"></div>
                  <div
                    className="w-3 h-3 bg-brand-secondary rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-3 h-3 bg-brand-accent rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-3 h-3 bg-brand-tertiary rounded-full animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  ></div>
                </div>
                <div className="flex items-center gap-2 text-lg text-secondary animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Preparing your preferences...</span>
                </div>
              </div>
            </div>

            {/* Enhanced progress indicators */}
            <div className="w-full max-w-lg space-y-4">
              <div className="flex justify-between text-sm text-muted">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Initializing
                </span>
                <span className="font-mono">100%</span>
              </div>
              <div className="w-full bg-surface-secondary rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-brand rounded-full animate-pulse shadow-brand"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Enhanced animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-gradient-glass rounded-full blur-3xl animate-pulse opacity-30" />
          <div
            className="absolute bottom-1/3 right-1/4 w-32 h-32 bg-gradient-to-r from-red-500/25 to-red-400/25 rounded-full blur-2xl animate-pulse opacity-40"
            style={{ animationDelay: "2s", animationDuration: "8s" }}
          />
        </div>

        <div className="surface-elevated glass-surface border border-subtle rounded-3xl p-16 text-center max-w-2xl mx-4 relative z-10 shadow-brand-lg">
          <div className="flex flex-col items-center space-y-8">
            <div className="w-24 h-24 bg-red-500/20 rounded-3xl flex items-center justify-center">
              <Settings className="w-12 h-12 text-red-400" />
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-primary">
                Unable to Load Settings
              </h2>
              <p className="text-lg text-secondary">{error}</p>

              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-brand hover:bg-gradient-brand-hover text-white shadow-brand-lg hover:shadow-brand px-6 py-3 rounded-2xl font-medium transform hover:scale-105 transition-all duration-slower"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen relative overflow-hidden">
      {/* Enhanced animated background elements */}
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

      <main className="relative z-10 px-4 md:px-12 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-6">
              {/* Enhanced icon container */}
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-brand rounded-3xl flex items-center justify-center shadow-brand-lg transform hover:scale-110 hover:rotate-3 transition-all duration-slower group cursor-pointer">
                  <Settings className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-slower drop-shadow-lg" />

                  {/* Enhanced glow effect */}
                  <div className="absolute -inset-2 bg-gradient-glass rounded-3xl blur-xl opacity-60 animate-pulse" />

                  {/* Floating sparkle */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-brand-secondary to-brand-accent rounded-full flex items-center justify-center animate-bounce shadow-brand">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>

                {/* Orbiting elements */}
                <div
                  className="absolute inset-0 animate-spin pointer-events-none"
                  style={{ animationDuration: "20s" }}
                >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-2 h-2 bg-brand-primary/40 rounded-full blur-sm" />
                  <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-2 h-2 bg-brand-secondary/50 rounded-full blur-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-5xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent bg-clip-text text-transparent">
                    Settings
                  </span>
                </h1>
                <p className="text-lg text-secondary">
                  Customize your Cognify experience
                </p>
              </div>
            </div>

            {/* Admin badge */}
            {userProfile?.is_admin && (
              <div className="surface-secondary glass-surface border border-brand-secondary/30 px-4 py-2 rounded-2xl shadow-brand">
                <div className="flex items-center gap-2 brand-secondary font-medium">
                  <Shield className="w-4 h-4" />
                  <span>Admin</span>
                  <Star className="w-3 h-3 animate-pulse" />
                </div>
              </div>
            )}
          </div>

          {/* Enhanced main content card */}
          <div className="surface-elevated glass-surface border border-subtle rounded-3xl shadow-brand-lg overflow-hidden transform hover:scale-[1.01] transition-all duration-slower">
            {/* Enhanced decorative corner elements */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-brand-primary/50 rounded-tl-3xl" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-brand-secondary/50 rounded-tr-3xl" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-brand-accent/50 rounded-bl-3xl" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-brand-primary/50 rounded-br-3xl" />

            {/* Enhanced Tab Navigation */}
            <div className="border-b border-subtle bg-surface-secondary/30 backdrop-blur-sm">
              <div className="flex">
                {tabs.map((tab, index) => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-3 px-8 py-6 font-semibold text-lg transition-all duration-slower group ${
                        activeTab === tab.id
                          ? "brand-primary bg-gradient-to-r from-brand-primary/10 to-brand-secondary/10"
                          : "text-muted hover:text-primary interactive-hover"
                      }`}
                    >
                      {/* Enhanced icon container */}
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-slower ${
                          activeTab === tab.id
                            ? "bg-gradient-brand shadow-brand"
                            : "bg-surface-elevated group-hover:bg-gradient-brand/20"
                        }`}
                      >
                        <TabIcon
                          className={`w-5 h-5 transition-all duration-slower ${
                            activeTab === tab.id
                              ? "text-white"
                              : "text-muted group-hover:brand-primary"
                          }`}
                        />
                      </div>

                      <span className="relative z-10">{tab.label}</span>

                      {/* Active indicator */}
                      {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-brand rounded-t-full" />
                      )}

                      {/* Hover shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Enhanced Tab Content */}
            <div className="p-12 relative">
              {/* Content background decoration */}
              <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-glass rounded-full blur-2xl opacity-20 animate-pulse" />

              <div className="relative z-10">
                {activeTab === "user" && (
                  <UserSettingsTab userProfile={userProfile} />
                )}
              </div>
            </div>
          </div>

          {/* Enhanced footer tips */}
          <div className="mt-12 text-center space-y-4">
            <p className="text-sm text-muted leading-relaxed max-w-2xl mx-auto">
              <strong className="brand-primary">Pro Tip:</strong> Your settings
              are automatically saved and synced across all your devices.
              Changes take effect immediately to enhance your learning
              experience.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
