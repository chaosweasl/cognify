"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Key,
  ExternalLink,
  Info,
  X,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface BYOBannerProps {
  variant?: "default" | "compact" | "warning";
  showDismiss?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function BYOBanner({
  variant = "default",
  showDismiss = true,
  onDismiss,
  className = "",
}: BYOBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) return null;

  if (variant === "compact") {
    return (
      <div
        className={`flex items-center justify-between p-3 surface-elevated border border-brand/30 rounded-lg ${className}`}
      >
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-brand-primary" />
          <span className="text-sm text-secondary">
            <strong className="text-primary">BYO Keys:</strong> Cognify uses
            your own AI API keys
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/docs/api-keys">
            <Button variant="outline" size="sm" className="text-xs">
              Learn More
            </Button>
          </Link>
          {showDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (variant === "warning") {
    return (
      <Card
        className={`border-status-warning/30 bg-status-warning/5 ${className}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-status-warning mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-status-warning mb-2">
                AI Configuration Required
              </h4>
              <p className="text-sm text-secondary mb-3">
                To use AI features, you need to configure your own API keys.
                Cognify never stores your keys on our servers - they stay in
                your browser only.
              </p>
              <div className="flex gap-2">
                <Link href="/settings">
                  <Button
                    size="sm"
                    className="bg-status-warning text-white hover:bg-status-warning/90"
                  >
                    Configure AI
                  </Button>
                </Link>
                <Link href="/docs/api-keys">
                  <Button variant="outline" size="sm">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            {showDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="p-1 h-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card
      className={`border-brand/30 bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5 ${className}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-primary">
                Bring Your Own AI Keys
              </h3>
              <Badge className="bg-brand-primary/10 text-brand-primary border-brand-primary/30">
                BYO Model
              </Badge>
            </div>
            <p className="text-secondary mb-4 leading-relaxed">
              Cognify is designed with privacy and security first. You provide
              your own AI API keys from providers like OpenAI, Anthropic, or
              local models. Your keys are stored locally in your browser only
              and never sent to our servers.
            </p>

            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-success" />
                <span className="text-sm text-secondary">
                  Keys stay in your browser
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-success" />
                <span className="text-sm text-secondary">
                  Never stored on our servers
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-success" />
                <span className="text-sm text-secondary">
                  You control your AI usage
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/settings">
                <Button className="bg-gradient-brand">
                  <Key className="w-4 h-4 mr-2" />
                  Configure AI Settings
                </Button>
              </Link>
              <Link href="/docs/api-keys">
                <Button
                  variant="outline"
                  className="border-brand/30 text-brand-primary hover:bg-brand/10"
                >
                  <Info className="w-4 h-4 mr-2" />
                  Security Guide
                </Button>
              </Link>
              <Link href="/docs/generate">
                <Button
                  variant="outline"
                  className="border-brand/30 text-brand-primary hover:bg-brand/10"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manual Workflow
                </Button>
              </Link>
            </div>
          </div>
          {showDismiss && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="p-1 h-auto text-muted hover:text-primary"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Hook to manage banner dismissal state
export function useBYOBannerState(key: string = "byo-banner-dismissed") {
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(key) === "true";
    }
    return false;
  });

  const dismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(key, "true");
    }
  };

  const reset = () => {
    setIsDismissed(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem(key);
    }
  };

  return { isDismissed, dismiss, reset };
}
