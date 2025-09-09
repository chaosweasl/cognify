"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import Link from "next/link";
import { BYOBanner } from "@/src/components/ui/byo-banner";

export default function DocsPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center">
            <Book className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-primary">
            Cognify Documentation
          </h1>
        </div>
        <p className="text-xl text-secondary max-w-2xl mx-auto leading-relaxed">
          Learn how to use Cognify&apos;s AI-powered study tools with your own
          API keys. Generate flashcards, cheatsheets, and quizzes while
          maintaining complete privacy.
        </p>
      </div>

      {/* BYO Model Banner */}
      <BYOBanner showDismiss={false} />

      {/* Quick Links */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/docs/api-keys">
          <Card className="group cursor-pointer surface-elevated border-subtle hover:border-brand/30 hover:surface-elevated transition-all transition-normal">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-status-success/10 rounded-lg flex items-center justify-center group-hover:bg-status-success/20 transition-colors">
                  <Shield className="w-5 h-5 text-status-success" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-primary group-hover:brand-primary transition-colors">
                    API Keys & Security
                  </h3>
                  <p className="text-sm text-secondary mt-1 mb-3">
                    How to safely configure and manage your AI provider API keys
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Security Guide
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/docs/generate">
          <Card className="group cursor-pointer surface-elevated border-subtle hover:border-brand/30 hover:surface-elevated transition-all transition-normal">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center group-hover:bg-brand-primary/20 transition-colors">
                  <Zap className="w-5 h-5 text-brand-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-primary group-hover:brand-primary transition-colors">
                    Content Generation
                  </h3>
                  <p className="text-sm text-secondary mt-1 mb-3">
                    Copy-paste prompts and manual workflows for generating study
                    content
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Templates & Prompts
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/docs/troubleshooting">
          <Card className="group cursor-pointer surface-elevated border-subtle hover:border-brand/30 hover:surface-elevated transition-all transition-normal">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-status-warning/10 rounded-lg flex items-center justify-center group-hover:bg-status-warning/20 transition-colors">
                  <AlertTriangle className="w-5 h-5 text-status-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-primary group-hover:brand-primary transition-colors">
                    Troubleshooting
                  </h3>
                  <p className="text-sm text-secondary mt-1 mb-3">
                    Common issues and solutions for CORS, rate limits, and
                    errors
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Problem Solving
                    </Badge>
                    <ArrowRight className="w-4 h-4 text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Getting Started */}
      <Card className="surface-secondary border-subtle">
        <CardContent className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-brand rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-primary">Getting Started</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">
                For API Users
              </h3>
              <p className="text-secondary">
                If you have API keys from providers like OpenAI, Anthropic, or
                run local models:
              </p>
              <ol className="space-y-2 text-sm text-secondary">
                <li className="flex items-start gap-2">
                  <span className="bg-brand-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">
                    1
                  </span>
                  Go to{" "}
                  <Link
                    href="/settings"
                    className="text-brand-primary hover:underline"
                  >
                    AI Settings
                  </Link>{" "}
                  and configure your provider
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-brand-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">
                    2
                  </span>
                  Create a project and upload PDFs or paste text
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-brand-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">
                    3
                  </span>
                  Generate flashcards, cheatsheets, or quizzes instantly
                </li>
              </ol>
              <Link href="/settings">
                <Button className="bg-gradient-brand">
                  <Key className="w-4 h-4 mr-2" />
                  Configure API Keys
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">
                For Manual Users
              </h3>
              <p className="text-secondary">
                Don&apos;t have API keys? No problem! Use our copy-paste
                workflow:
              </p>
              <ol className="space-y-2 text-sm text-secondary">
                <li className="flex items-start gap-2">
                  <span className="bg-brand-secondary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">
                    1
                  </span>
                  Copy prompts from our{" "}
                  <Link
                    href="/docs/generate"
                    className="text-brand-primary hover:underline"
                  >
                    generation guide
                  </Link>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-brand-secondary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">
                    2
                  </span>
                  Paste them into ChatGPT, Claude, or any AI service
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-brand-secondary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">
                    3
                  </span>
                  Import the JSON response back into Cognify
                </li>
              </ol>
              <Link href="/docs/generate">
                <Button
                  variant="outline"
                  className="border-brand-secondary text-brand-secondary hover:bg-brand-secondary/10"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Get Copy-Paste Templates
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="surface-elevated border-subtle">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">
              Flashcards
            </h3>
            <p className="text-sm text-secondary">
              Generate question-answer pairs from any text or PDF content for
              effective spaced repetition study.
            </p>
          </CardContent>
        </Card>

        <Card className="surface-elevated border-subtle">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Book className="w-6 h-6 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">
              Cheatsheets
            </h3>
            <p className="text-sm text-secondary">
              Create organized summaries and reference materials with key
              concepts, formulas, and quick facts.
            </p>
          </CardContent>
        </Card>

        <Card className="surface-elevated border-subtle">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">Quizzes</h3>
            <p className="text-sm text-secondary">
              Build multiple-choice and short-answer quizzes to test
              comprehension and track progress.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Support */}
      <Card className="surface-elevated border-subtle">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-bold text-primary">Need Help?</h2>
            <p className="text-secondary">
              Check our troubleshooting guide, review the security
              documentation, or explore the manual workflow options.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/docs/troubleshooting">
                <Button variant="outline">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Troubleshooting
                </Button>
              </Link>
              <Link href="/docs/api-keys">
                <Button variant="outline">
                  <Shield className="w-4 h-4 mr-2" />
                  Security Guide
                </Button>
              </Link>
              <Link
                href="https://github.com/chaosweasl/cognify"
                target="_blank"
              >
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  GitHub
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
