"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Key,
  FileText,
  ExternalLink,
  Book,
  Zap,
  Users,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import { BYOBanner } from "@/src/components/ui/byo-banner";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-surface-primary to-surface-secondary">
      <div className="container mx-auto py-12 px-4 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-3 bg-gradient-brand/10 px-6 py-3 rounded-full border border-brand-primary/20">
            <Sparkles className="w-5 h-5 text-brand-primary" />
            <span className="text-sm font-medium text-brand-primary">
              AI-Powered Study Platform
            </span>
          </div>

          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-brand-primary to-brand-secondary bg-clip-text text-transparent">
            Getting Started with Cognify
          </h1>

          <p className="text-xl text-secondary max-w-3xl mx-auto leading-relaxed">
            Transform your study materials into personalized flashcards,
            cheatsheets, and quizzes. Use your own AI keys for complete privacy
            and control.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/settings">
              <Button
                size="lg"
                className="bg-gradient-brand hover:scale-105 transition-transform"
              >
                <Key className="w-5 h-5 mr-2" />
                Start with API Keys
              </Button>
            </Link>
            <Link href="/docs/generate">
              <Button
                size="lg"
                variant="outline"
                className="hover:scale-105 transition-transform"
              >
                <Copy className="w-5 h-5 mr-2" />
                Manual Workflow
              </Button>
            </Link>
          </div>
        </div>

        {/* BYO Model Banner */}
        <div className="max-w-4xl mx-auto">
          <BYOBanner showDismiss={false} />
        </div>

        {/* Quick Start Paths */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* API Users Path */}
          <Card className="glass-surface border-brand-primary/20 hover:border-brand-primary/40 transition-all group">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-2xl text-primary">
                  For API Users
                </CardTitle>
              </div>
              <p className="text-secondary">
                Have API keys? Get started in minutes with automated generation.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    text: "Configure your AI provider in Settings",
                    link: "/settings",
                    icon: Key,
                  },
                  {
                    step: 2,
                    text: "Create a project and upload content",
                    link: "/projects",
                    icon: FileText,
                  },
                  {
                    step: 3,
                    text: "Generate study materials instantly",
                    link: "/projects",
                    icon: Target,
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex items-center gap-4 p-3 rounded-lg bg-surface-secondary/50 hover:bg-surface-secondary transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-brand rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <Link
                        href={item.link}
                        className="text-primary hover:text-brand-primary transition-colors font-medium"
                      >
                        {item.text}
                      </Link>
                    </div>
                    <item.icon className="w-4 h-4 text-brand-primary opacity-60" />
                  </div>
                ))}
              </div>

              <Link href="/settings" className="w-full">
                <Button
                  size="lg"
                  className="w-full bg-gradient-brand hover:scale-[1.02] transition-transform"
                >
                  <Key className="w-5 h-5 mr-2" />
                  Configure API Keys
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Manual Users Path */}
          <Card className="glass-surface border-brand-secondary/20 hover:border-brand-secondary/40 transition-all group">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-brand-secondary to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Copy className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-2xl text-primary">
                  For Manual Users
                </CardTitle>
              </div>
              <p className="text-secondary">
                No API keys? Use our copy-paste workflow with any AI service.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    text: "Copy generation prompts from our guide",
                    link: "/docs/generate",
                    icon: Copy,
                  },
                  {
                    step: 2,
                    text: "Paste into ChatGPT, Claude, or any AI",
                    link: "/docs/generate",
                    icon: ExternalLink,
                  },
                  {
                    step: 3,
                    text: "Import the JSON response to Cognify",
                    link: "/docs/generate",
                    icon: FileText,
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex items-center gap-4 p-3 rounded-lg bg-surface-secondary/50 hover:bg-surface-secondary transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-brand-secondary to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <Link
                        href={item.link}
                        className="text-primary hover:text-brand-primary transition-colors font-medium"
                      >
                        {item.text}
                      </Link>
                    </div>
                    <item.icon className="w-4 h-4 text-brand-secondary opacity-60" />
                  </div>
                ))}
              </div>

              <Link href="/docs/generate" className="w-full">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full border-brand-secondary text-brand-secondary hover:bg-brand-secondary/10 hover:scale-[1.02] transition-all"
                >
                  <Copy className="w-5 h-5 mr-2" />
                  Get Copy-Paste Templates
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* What You Can Create */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary mb-4">
              What You Can Create
            </h2>
            <p className="text-lg text-secondary max-w-2xl mx-auto">
              Transform any content into multiple study formats tailored to your
              learning style.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: FileText,
                title: "Smart Flashcards",
                description:
                  "AI-generated question-answer pairs with spaced repetition scheduling for optimal retention.",
                color: "blue",
                features: [
                  "Spaced repetition",
                  "Difficulty tracking",
                  "Progress analytics",
                ],
              },
              {
                icon: Book,
                title: "Study Cheatsheets",
                description:
                  "Organized summaries with key concepts, formulas, and quick reference materials.",
                color: "green",
                features: [
                  "Key concepts",
                  "Quick references",
                  "Organized layout",
                ],
              },
              {
                icon: Users,
                title: "Practice Quizzes",
                description:
                  "Interactive quizzes with multiple choice and short answers to test comprehension.",
                color: "purple",
                features: [
                  "Multiple choice",
                  "Short answers",
                  "Instant feedback",
                ],
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="glass-surface border-subtle hover:border-brand-primary/30 transition-all group hover:-translate-y-1"
              >
                <CardContent className="p-8 text-center space-y-4">
                  <div
                    className={`w-16 h-16 bg-${feature.color}-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}
                  >
                    <feature.icon
                      className={`w-8 h-8 text-${feature.color}-500`}
                    />
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="space-y-2 pt-4">
                    {feature.features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 justify-center"
                      >
                        <CheckCircle2
                          className={`w-4 h-4 text-${feature.color}-500`}
                        />
                        <span className="text-sm text-secondary">{feat}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Help & Resources */}
        <div className="max-w-4xl mx-auto">
          <Card className="glass-surface border-subtle">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-primary">
                    Resources & Support
                  </h2>
                </div>

                <p className="text-lg text-secondary">
                  Need help getting started? Check out our comprehensive guides
                  and troubleshooting resources.
                </p>

                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  <Link href="/docs/api-keys">
                    <Card className="group cursor-pointer surface-elevated border-subtle hover:border-brand-primary/30 transition-all hover:-translate-y-1">
                      <CardContent className="p-6 text-center space-y-3">
                        <div className="w-12 h-12 bg-status-success/10 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                          <Shield className="w-6 h-6 text-status-success" />
                        </div>
                        <h3 className="font-semibold text-primary group-hover:text-brand-primary transition-colors">
                          API Keys & Security
                        </h3>
                        <p className="text-sm text-secondary">
                          Safe configuration and management of your AI provider
                          keys
                        </p>
                        <Badge variant="outline" className="text-xs">
                          Security Guide
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/docs/generate">
                    <Card className="group cursor-pointer surface-elevated border-subtle hover:border-brand-primary/30 transition-all hover:-translate-y-1">
                      <CardContent className="p-6 text-center space-y-3">
                        <div className="w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                          <Zap className="w-6 h-6 text-brand-primary" />
                        </div>
                        <h3 className="font-semibold text-primary group-hover:text-brand-primary transition-colors">
                          Generation Templates
                        </h3>
                        <p className="text-sm text-secondary">
                          Copy-paste prompts and manual workflows for any AI
                          service
                        </p>
                        <Badge variant="outline" className="text-xs">
                          Templates & Prompts
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>

                  <Link href="/docs/troubleshooting">
                    <Card className="group cursor-pointer surface-elevated border-subtle hover:border-brand-primary/30 transition-all hover:-translate-y-1">
                      <CardContent className="p-6 text-center space-y-3">
                        <div className="w-12 h-12 bg-status-warning/10 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                          <AlertTriangle className="w-6 h-6 text-status-warning" />
                        </div>
                        <h3 className="font-semibold text-primary group-hover:text-brand-primary transition-colors">
                          Troubleshooting
                        </h3>
                        <p className="text-sm text-secondary">
                          Common issues and solutions for CORS, rate limits, and
                          errors
                        </p>
                        <Badge variant="outline" className="text-xs">
                          Problem Solving
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                </div>

                <div className="flex flex-wrap justify-center gap-4 pt-6">
                  <Link
                    href="https://github.com/chaosweasl/cognify"
                    target="_blank"
                  >
                    <Button
                      variant="outline"
                      className="hover:scale-105 transition-transform"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      GitHub Repository
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
