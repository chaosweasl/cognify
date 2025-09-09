"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ArrowLeft,
  Wifi,
  Key,
  Globe,
  Code,
} from "lucide-react";
import Link from "next/link";

const troubleshootingItems = [
  {
    category: "CORS Issues",
    icon: <Globe className="w-5 h-5" />,
    color: "text-status-error",
    bgColor: "bg-status-error/5",
    borderColor: "border-status-error/30",
    items: [
      {
        problem: "API calls blocked by browser",
        symptoms: [
          "Connection failed errors",
          "Network request blocked",
          "CORS policy error",
        ],
        solutions: [
          "Use the manual copy-paste workflow instead",
          "Copy prompts from /docs/generate",
          "Paste into web-based AI services (ChatGPT, Claude)",
          "Import the JSON response back into Cognify",
          "For immediate access, click 'Show Solutions' when CORS errors occur",
          "Consider setting up local AI (Ollama/LM Studio) for direct browser access",
        ],
      },
      {
        problem: "Provider doesn't support browser requests",
        symptoms: [
          "Consistent connection failures",
          "CORS errors for specific provider",
        ],
        solutions: [
          "Check provider compatibility table in /docs/api-keys",
          "Use local models (Ollama, LM Studio) for full CORS support",
          "Switch to manual workflow for that provider",
        ],
      },
    ],
  },
  {
    category: "API Key Issues",
    icon: <Key className="w-5 h-5" />,
    color: "text-status-warning",
    bgColor: "bg-status-warning/5",
    borderColor: "border-status-warning/30",
    items: [
      {
        problem: "Invalid API Key error",
        symptoms: [
          "Authentication failed",
          "Invalid key format",
          "Unauthorized errors",
        ],
        solutions: [
          "Verify key format matches provider requirements",
          "Check for extra spaces or characters",
          "Ensure account has available credits/quota",
          "Test key directly on provider's website",
        ],
      },
      {
        problem: "Keys not persisting",
        symptoms: [
          "Need to re-enter keys",
          "Settings don't save",
          "Keys disappear",
        ],
        solutions: [
          'Ensure "Remember API key" is enabled',
          "Check if browser is clearing localStorage",
          "Disable private/incognito mode for key storage",
          "Try ephemeral mode for session-only keys",
        ],
      },
    ],
  },
  {
    category: "Connection Problems",
    icon: <Wifi className="w-5 h-5" />,
    color: "text-status-info",
    bgColor: "bg-status-info/5",
    borderColor: "border-status-info/30",
    items: [
      {
        problem: "Connection timeout",
        symptoms: [
          "Request taking too long",
          "Timeout errors",
          "No response from AI",
        ],
        solutions: [
          "Check internet connection stability",
          "Verify provider service status",
          "Try reducing content length for generation",
          "Switch to a different provider temporarily",
        ],
      },
      {
        problem: "Rate limiting",
        symptoms: [
          "Too many requests error",
          "Rate limit exceeded",
          "Temporary blocks",
        ],
        solutions: [
          "Wait and retry after the rate limit resets",
          "Check your provider's rate limits documentation",
          "Upgrade your provider plan if needed",
          "Use manual workflow to avoid rate limits",
        ],
      },
    ],
  },
  {
    category: "Content Generation",
    icon: <Code className="w-5 h-5" />,
    color: "text-brand-primary",
    bgColor: "bg-brand-primary/5",
    borderColor: "border-brand-primary/30",
    items: [
      {
        problem: "AI returns text instead of JSON",
        symptoms: ["Import fails", "Invalid format", "Non-JSON responses"],
        solutions: [
          'Add "Return ONLY the JSON object, no additional text" to prompts',
          "Use the exact prompt templates from /docs/generate",
          "Ask AI to reformat the response as valid JSON",
          "Manually format the response into JSON structure",
        ],
      },
      {
        problem: "Poor quality generation",
        symptoms: [
          "Irrelevant flashcards",
          "Too simple/complex",
          "Missing information",
        ],
        solutions: [
          "Adjust the complexity setting in AI configuration",
          "Provide more context in your source material",
          "Use more specific prompts with examples",
          "Edit generated content before accepting",
        ],
      },
    ],
  },
];

export default function TroubleshootingPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/docs">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Docs
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-primary">
            Troubleshooting Guide
          </h1>
          <p className="text-secondary mt-2">
            Common issues and solutions for Cognify&apos;s AI-powered features
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="border-brand/30 bg-brand/5">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-bold text-primary">Quick Solutions</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 surface-elevated rounded-lg border border-subtle">
                <h3 className="font-medium text-primary mb-2">
                  Can&apos;t Connect?
                </h3>
                <p className="text-sm text-secondary mb-3">
                  Try the manual workflow instead
                </p>
                <Link href="/docs/generate">
                  <Button size="sm" variant="outline">
                    Copy-Paste Prompts
                  </Button>
                </Link>
              </div>
              <div className="p-4 surface-elevated rounded-lg border border-subtle">
                <h3 className="font-medium text-primary mb-2">Key Issues?</h3>
                <p className="text-sm text-secondary mb-3">
                  Check format and permissions
                </p>
                <Link href="/docs/api-keys">
                  <Button size="sm" variant="outline">
                    Security Guide
                  </Button>
                </Link>
              </div>
              <div className="p-4 surface-elevated rounded-lg border border-subtle">
                <h3 className="font-medium text-primary mb-2">
                  Bad Generation?
                </h3>
                <p className="text-sm text-secondary mb-3">
                  Edit content before saving
                </p>
                <Link href="/settings">
                  <Button size="sm" variant="outline">
                    AI Settings
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting Categories */}
      <div className="space-y-8">
        {troubleshootingItems.map((category, categoryIndex) => (
          <Card
            key={categoryIndex}
            className={`${category.borderColor} ${category.bgColor}`}
          >
            <CardHeader>
              <CardTitle
                className={`flex items-center gap-2 ${category.color}`}
              >
                {category.icon}
                {category.category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="space-y-3">
                    <h4 className="text-lg font-semibold text-primary flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-status-error" />
                      {item.problem}
                    </h4>

                    <div className="ml-6 space-y-3">
                      <div>
                        <h5 className="text-sm font-medium text-secondary mb-2">
                          Common Symptoms:
                        </h5>
                        <ul className="space-y-1">
                          {item.symptoms.map((symptom, symptomIndex) => (
                            <li
                              key={symptomIndex}
                              className="text-sm text-muted flex items-start gap-2"
                            >
                              <span className="w-1 h-1 bg-muted rounded-full mt-2 flex-shrink-0" />
                              {symptom}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-secondary mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-status-success" />
                          Solutions:
                        </h5>
                        <ol className="space-y-1">
                          {item.solutions.map((solution, solutionIndex) => (
                            <li
                              key={solutionIndex}
                              className="text-sm text-secondary flex items-start gap-2"
                            >
                              <span className="bg-status-success text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-medium mt-0.5 flex-shrink-0">
                                {solutionIndex + 1}
                              </span>
                              {solution}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Resources */}
      <Card className="surface-elevated border-subtle">
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-primary">Documentation</h4>
              <div className="space-y-2">
                <Link
                  href="/docs/api-keys"
                  className="flex items-center gap-2 text-sm text-brand-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  API Keys & Security Guide
                </Link>
                <Link
                  href="/docs/generate"
                  className="flex items-center gap-2 text-sm text-brand-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Copy-Paste Templates
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 text-sm text-brand-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  AI Configuration Settings
                </Link>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-primary">Community Support</h4>
              <div className="space-y-2">
                <a
                  href="https://github.com/chaosweasl/cognify/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-brand-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Report Issues on GitHub
                </a>
                <a
                  href="https://github.com/chaosweasl/cognify/discussions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-brand-primary hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  Community Discussions
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Still Need Help */}
      <Card className="border-brand/30 bg-brand/5">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="w-5 h-5 text-brand-primary" />
              <h3 className="text-lg font-semibold text-primary">
                Still Need Help?
              </h3>
            </div>
            <p className="text-secondary">
              If you&apos;re still experiencing issues, check our GitHub
              repository or try the manual workflow as a reliable fallback.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/docs/generate">
                <Button className="bg-gradient-brand">
                  Try Manual Workflow
                </Button>
              </Link>
              <a
                href="https://github.com/chaosweasl/cognify/issues/new"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Report Issue
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
