"use client";
import React from "react";
import { Info, Brain, Settings, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function SRSSettingsTab() {
  const router = useRouter();

  return (
    <div className="space-y-8">
      <Card className="bg-brand-primary/10 border border-brand-primary/30">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-brand-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Info className="w-6 h-6 text-brand-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-primary text-xl mb-3">
                SRS Settings Moved to Projects
              </h3>
              <p className="text-secondary mb-4 leading-relaxed">
                SRS (Spaced Repetition System) settings are now configured individually for each project, 
                giving you more control over how different types of content are studied.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => router.push("/projects")}
                  className="bg-gradient-brand hover:shadow-brand-lg text-white"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Manage Project Settings
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="surface-elevated glass-surface border border-subtle">
        <CardContent className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-brand-secondary to-brand-accent rounded-2xl flex items-center justify-center shadow-brand">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-primary">What this means</h3>
              <p className="text-secondary">Benefits of project-specific SRS settings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 surface-secondary rounded-xl border border-subtle">
                <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-1">Personalized Learning</h4>
                  <p className="text-sm text-secondary">Each project can have different learning steps, intervals, and ease settings</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 surface-secondary rounded-xl border border-subtle">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-1">Content Optimization</h4>
                  <p className="text-sm text-secondary">Optimize settings for different types of content (languages, facts, etc.)</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 surface-secondary rounded-xl border border-subtle">
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-3 h-3 bg-purple-500 rounded-full" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-1">Smart Defaults</h4>
                  <p className="text-sm text-secondary">New projects use sensible defaults based on Anki&apos;s proven algorithms</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 surface-secondary rounded-xl border border-subtle">
                <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-3 h-3 bg-orange-500 rounded-full" />
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-1">Preserved Settings</h4>
                  <p className="text-sm text-secondary">Existing projects keep their current behavior</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gradient-glass rounded-xl border border-brand-primary/20">
            <div className="text-center">
              <h4 className="font-bold text-primary mb-2">Getting Started</h4>
              <p className="text-secondary text-sm mb-4">
                Create a new project to experience the enhanced SRS configuration, or visit an existing project to fine-tune its settings.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => router.push("/create")}
                  variant="outline"
                  className="surface-elevated border-brand-primary/20 text-brand-primary hover:bg-brand-primary/10"
                >
                  Create New Project
                </Button>
                <Button
                  onClick={() => router.push("/projects")}
                  className="bg-gradient-brand hover:shadow-brand text-white"
                >
                  View Existing Projects
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}