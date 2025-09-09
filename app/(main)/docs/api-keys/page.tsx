"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Lock,
  Globe,
  Server,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const providerGuides = {
  openai: {
    name: "OpenAI",
    website: "https://platform.openai.com/api-keys",
    keyFormat: "sk-...",
    corsSupport: "Limited",
    setup: [
      "Go to OpenAI Platform (platform.openai.com)",
      "Sign in to your account",
      "Navigate to API Keys section",
      "Click 'Create new secret key'",
      "Copy and paste the key into Cognify settings",
    ],
  },
  anthropic: {
    name: "Anthropic",
    website: "https://console.anthropic.com/",
    keyFormat: "sk-ant-...",
    corsSupport: "Limited",
    setup: [
      "Visit Anthropic Console (console.anthropic.com)",
      "Sign in or create an account",
      "Go to API Keys in settings",
      "Generate a new API key",
      "Copy the key into Cognify settings",
    ],
  },
  ollama: {
    name: "Ollama",
    website: "https://ollama.com",
    keyFormat: "None (local)",
    corsSupport: "Full",
    setup: [
      "Install Ollama on your computer",
      "Pull a model (e.g., ollama pull llama3)",
      "Start Ollama server (ollama serve)",
      "Set base URL to http://localhost:11434 in Cognify",
      "No API key required for local installation",
    ],
  },
};

export default function ApiKeysPage() {
  const [activeTab, setActiveTab] = useState("security");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

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
            API Keys & Security
          </h1>
          <p className="text-secondary mt-2">
            Learn how to safely configure and manage your AI provider API keys
          </p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="security">Security Model</TabsTrigger>
          <TabsTrigger value="setup">Provider Setup</TabsTrigger>
          <TabsTrigger value="storage">Key Management</TabsTrigger>
          <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
        </TabsList>

        {/* Security Model */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-status-success/30 bg-status-success/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-status-success">
                <Shield className="w-5 h-5" />
                Privacy-First Architecture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-secondary">
                Cognify is built with a privacy-first "Bring Your Own" (BYO)
                model. Your API keys are never sent to our servers or stored in
                our database. Here's how it works:
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-primary flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-status-success" />
                    What We DO
                  </h4>
                  <ul className="space-y-2 text-sm text-secondary ml-6">
                    <li>• Store keys locally in your browser only</li>
                    <li>• Provide secure key management options</li>
                    <li>• Offer ephemeral mode for maximum security</li>
                    <li>• Allow you to clear keys anytime</li>
                    <li>• Make AI requests directly from your browser</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-primary flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-status-error" />
                    What We DON'T Do
                  </h4>
                  <ul className="space-y-2 text-sm text-secondary ml-6">
                    <li>• Store keys on our servers</li>
                    <li>• Log or monitor your API usage</li>
                    <li>• Access your AI provider accounts</li>
                    <li>• Share keys between users</li>
                    <li>• Proxy your AI requests through our servers</li>
                  </ul>
                </div>
              </div>

              <div className="border-l-4 border-brand-primary pl-4 py-2 bg-brand-primary/5 rounded-r">
                <p className="text-sm text-secondary">
                  <strong className="text-brand-primary">
                    Your Responsibility:
                  </strong>{" "}
                  You maintain full control and responsibility for your API
                  keys, usage, and costs. Monitor your provider billing and set
                  usage limits as needed.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Security Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="p-4 border border-subtle rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-status-success/10 rounded flex items-center justify-center">
                      <Eye className="w-4 h-4 text-status-success" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary">
                        Remember Keys (Default)
                      </h4>
                      <p className="text-sm text-secondary mt-1 mb-2">
                        Store keys in browser localStorage for convenience. Keys
                        persist across sessions but can be cleared anytime.
                      </p>
                      <Badge variant="outline" className="text-xs">
                        Recommended for personal devices
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-subtle rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-status-warning/10 rounded flex items-center justify-center">
                      <EyeOff className="w-4 h-4 text-status-warning" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary">
                        Ephemeral Mode
                      </h4>
                      <p className="text-sm text-secondary mt-1 mb-2">
                        Never store keys anywhere. Enter your key each session
                        for maximum security. Ideal for shared computers.
                      </p>
                      <Badge
                        variant="outline"
                        className="text-xs text-status-warning"
                      >
                        Highest security
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Provider Setup */}
        <TabsContent value="setup" className="space-y-6">
          <div className="grid gap-6">
            {Object.entries(providerGuides).map(([id, provider]) => (
              <Card key={id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      {provider.name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          provider.corsSupport === "Full"
                            ? "text-status-success border-status-success/30"
                            : "text-status-warning border-status-warning/30"
                        }
                      >
                        CORS: {provider.corsSupport}
                      </Badge>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={provider.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Visit Site
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-primary mb-2">
                        Setup Steps:
                      </h4>
                      <ol className="space-y-1 text-sm text-secondary">
                        {provider.setup.map((step, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="bg-brand-primary text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-medium mt-0.5 flex-shrink-0">
                              {index + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <h4 className="font-medium text-primary mb-2">
                        Key Format:
                      </h4>
                      <div className="p-3 bg-surface-elevated rounded border border-subtle">
                        <code className="text-sm text-brand-primary">
                          {provider.keyFormat}
                        </code>
                      </div>
                      {provider.corsSupport === "Limited" && (
                        <p className="text-xs text-status-warning mt-2">
                          ⚠️ May require manual workflow due to browser CORS
                          restrictions
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Key Management */}
        <TabsContent value="storage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Key Storage & Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-primary">Storage Location</h4>
                <div className="p-4 border border-brand/30 rounded-lg bg-brand/5">
                  <p className="text-sm text-secondary">
                    Keys are stored in your browser's{" "}
                    <code className="bg-surface-elevated px-1 rounded">
                      localStorage
                    </code>
                    . This means they:
                  </p>
                  <ul className="text-sm text-secondary mt-2 space-y-1 ml-4">
                    <li>• Only exist on your device</li>
                    <li>• Persist across browser sessions</li>
                    <li>• Are cleared when you clear browser data</li>
                    <li>• Are not accessible to other websites</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-primary">
                  Manual Key Management
                </h4>
                <p className="text-sm text-secondary">
                  You can manually manage your stored keys using browser
                  developer tools:
                </p>

                <div className="space-y-3">
                  <div className="p-3 bg-surface-elevated rounded border border-subtle">
                    <h5 className="text-sm font-medium text-primary mb-2">
                      View Stored Keys:
                    </h5>
                    <div className="relative">
                      <code className="text-xs text-secondary block p-2 bg-surface-primary rounded border">
                        {`// Open browser console (F12) and run:
Object.keys(localStorage).filter(key => key.startsWith('ai-api-key-'))`}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={() =>
                          copyToClipboard(
                            `Object.keys(localStorage).filter(key => key.startsWith('ai-api-key-'))`
                          )
                        }
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-3 bg-surface-elevated rounded border border-subtle">
                    <h5 className="text-sm font-medium text-primary mb-2">
                      Clear All AI Keys:
                    </h5>
                    <div className="relative">
                      <code className="text-xs text-secondary block p-2 bg-surface-primary rounded border">
                        {`// Remove all AI-related keys:
Object.keys(localStorage).filter(key => key.startsWith('ai-api-key-')).forEach(key => localStorage.removeItem(key))`}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={() =>
                          copyToClipboard(
                            `Object.keys(localStorage).filter(key => key.startsWith('ai-api-key-')).forEach(key => localStorage.removeItem(key))`
                          )
                        }
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-l-4 border-status-warning pl-4 py-2 bg-status-warning/5 rounded-r">
                <p className="text-sm text-secondary">
                  <strong className="text-status-warning">Important:</strong>{" "}
                  Keys are tied to the specific domain (e.g., yoursite.com). If
                  you're self-hosting or using a different domain, you'll need
                  to reconfigure your keys.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Troubleshooting */}
        <TabsContent value="troubleshooting" className="space-y-6">
          <div className="space-y-4">
            <Card className="border-status-error/30 bg-status-error/5">
              <CardHeader>
                <CardTitle className="text-status-error flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  CORS Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-secondary mb-4">
                  Browser CORS (Cross-Origin Resource Sharing) policies may
                  block direct API calls to some providers. Here's how to handle
                  this:
                </p>
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium text-primary">
                      If API calls fail:
                    </h5>
                    <ol className="text-sm text-secondary mt-2 space-y-1 ml-4">
                      <li>1. Use the manual copy-paste workflow instead</li>
                      <li>
                        2. Copy prompts from our{" "}
                        <Link
                          href="/docs/generate"
                          className="text-brand-primary hover:underline"
                        >
                          generation templates
                        </Link>
                      </li>
                      <li>3. Paste into ChatGPT/Claude web interface</li>
                      <li>4. Import the JSON response back into Cognify</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Common Issues & Solutions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border border-subtle rounded">
                    <h5 className="font-medium text-primary">
                      ❌ "Invalid API Key" Error
                    </h5>
                    <p className="text-sm text-secondary mt-1">
                      • Double-check the key format matches your provider
                      <br />
                      • Ensure the key has necessary permissions
                      <br />• Verify your account has available credits/quota
                    </p>
                  </div>

                  <div className="p-3 border border-subtle rounded">
                    <h5 className="font-medium text-primary">
                      ❌ "Connection Failed" Error
                    </h5>
                    <p className="text-sm text-secondary mt-1">
                      • Check your internet connection
                      <br />
                      • Try the manual workflow if CORS is blocking
                      <br />• Verify the base URL for local models (Ollama, LM
                      Studio)
                    </p>
                  </div>

                  <div className="p-3 border border-subtle rounded">
                    <h5 className="font-medium text-primary">
                      ❌ Keys Not Persisting
                    </h5>
                    <p className="text-sm text-secondary mt-1">
                      • Ensure "Remember API key" is enabled
                      <br />
                      • Check if browser is clearing localStorage
                      <br />• Try disabling private/incognito mode
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="surface-elevated border-subtle">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-primary">
              Ready to Get Started?
            </h3>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/settings">
                <Button className="bg-gradient-brand">
                  <Key className="w-4 h-4 mr-2" />
                  Configure API Keys
                </Button>
              </Link>
              <Link href="/docs/generate">
                <Button variant="outline">
                  <Copy className="w-4 h-4 mr-2" />
                  Get Copy-Paste Templates
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
