"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  Shield,
  DollarSign,
  Zap,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { ContextualHelp } from "./HelpTooltip";
import { cn } from "@/lib/utils";

interface ContextualGuidanceProps {
  context:
    | "ai-setup"
    | "first-time-user"
    | "security-focused"
    | "cost-conscious"
    | "study-setup";
  className?: string;
}

export function ContextualGuidance({
  context,
  className,
}: ContextualGuidanceProps) {
  const guidanceContent = {
    "ai-setup": {
      title: "AI Setup Guide",
      subtitle: "Get started with AI-powered content generation",
      tips: [
        {
          icon: CheckCircle,
          title: "Quick Start",
          description:
            "Choose OpenAI or Anthropic for the most reliable results",
          type: "success" as const,
        },
        {
          icon: Shield,
          title: "Security First",
          description: "Your API keys stay on your device - we never see them",
          type: "security" as const,
        },
        {
          icon: DollarSign,
          title: "Control Costs",
          description:
            "Monitor usage in your provider dashboard and set billing alerts",
          type: "warning" as const,
        },
      ],
      actions: [
        {
          label: "API Key Security Guide",
          href: "/docs/api-keys",
          external: false,
        },
        { label: "Test Connection", action: "test-connection" },
      ],
    },
    "first-time-user": {
      title: "Welcome to Cognify!",
      subtitle: "Here's what you need to know to get started",
      tips: [
        {
          icon: Zap,
          title: "Bring Your Own Keys",
          description:
            "Use your AI provider accounts for unlimited, private content generation",
          type: "info" as const,
        },
        {
          icon: Lightbulb,
          title: "Start Small",
          description:
            "Try importing our sample content first, then create your own",
          type: "success" as const,
        },
        {
          icon: Shield,
          title: "Privacy by Design",
          description:
            "Everything stays on your device - no data sent to our servers",
          type: "security" as const,
        },
      ],
      actions: [
        {
          label: "View Sample Content",
          href: "/docs/generate",
          external: false,
        },
        {
          label: "Learn About BYO Model",
          href: "/docs/api-keys",
          external: false,
        },
      ],
    },
    "security-focused": {
      title: "Maximum Security Setup",
      subtitle: "For users who prioritize privacy and security",
      tips: [
        {
          icon: Shield,
          title: "Use Ephemeral Mode",
          description: "Never store API keys - enter them fresh each session",
          type: "security" as const,
        },
        {
          icon: AlertCircle,
          title: "Local-Only Models",
          description: "Consider Ollama or LM Studio for completely offline AI",
          type: "warning" as const,
        },
        {
          icon: CheckCircle,
          title: "Regular Key Rotation",
          description: "Create and rotate API keys regularly for best security",
          type: "success" as const,
        },
      ],
      actions: [
        {
          label: "Security Documentation",
          href: "/docs/api-keys",
          external: false,
        },
        {
          label: "Ollama Setup Guide",
          href: "https://ollama.ai",
          external: true,
        },
      ],
    },
    "cost-conscious": {
      title: "Cost-Effective AI Usage",
      subtitle: "Optimize your spending while getting great results",
      tips: [
        {
          icon: DollarSign,
          title: "Monitor Usage",
          description: "Set up billing alerts in your AI provider dashboard",
          type: "warning" as const,
        },
        {
          icon: Zap,
          title: "Optimize Settings",
          description:
            "Lower temperature and max tokens for basic content generation",
          type: "info" as const,
        },
        {
          icon: Lightbulb,
          title: "Batch Processing",
          description: "Generate multiple cards at once to reduce API calls",
          type: "success" as const,
        },
      ],
      actions: [
        {
          label: "Cost Optimization Tips",
          href: "/docs/generate",
          external: false,
        },
        { label: "Provider Pricing", action: "show-pricing" },
      ],
    },
    "study-setup": {
      title: "Effective Study Setup",
      subtitle: "Configure spaced repetition for optimal learning",
      tips: [
        {
          icon: Lightbulb,
          title: "Start Conservative",
          description: "Begin with 10-15 new cards per day to avoid overwhelm",
          type: "success" as const,
        },
        {
          icon: CheckCircle,
          title: "Consistent Schedule",
          description: "Study at the same time daily for best retention",
          type: "info" as const,
        },
        {
          icon: Zap,
          title: "Quality Over Quantity",
          description:
            "Better to study fewer cards well than many cards poorly",
          type: "warning" as const,
        },
      ],
      actions: [
        { label: "Study Best Practices", href: "/docs", external: false },
        { label: "SRS Algorithm Guide", action: "show-srs-info" },
      ],
    },
  };

  const content = guidanceContent[context];

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-status-success/5",
          border: "border-status-success/20",
          icon: "text-status-success",
        };
      case "warning":
        return {
          bg: "bg-status-warning/5",
          border: "border-status-warning/20",
          icon: "text-status-warning",
        };
      case "security":
        return {
          bg: "bg-brand/5",
          border: "border-brand/20",
          icon: "text-brand",
        };
      default:
        return {
          bg: "bg-status-info/5",
          border: "border-status-info/20",
          icon: "text-status-info",
        };
    }
  };

  return (
    <Card className={cn("surface-elevated border-subtle", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="w-5 h-5 text-brand" />
              {content.title}
            </CardTitle>
            <p className="text-sm text-secondary mt-1">{content.subtitle}</p>
          </div>
          <Badge variant="outline" className="text-brand">
            Guide
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tips Grid */}
        <div className="space-y-3">
          {content.tips.map((tip, index) => {
            const styles = getTypeStyles(tip.type);
            return (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border",
                  styles.bg,
                  styles.border
                )}
              >
                <div className="w-6 h-6 flex-shrink-0 mt-0.5">
                  <tip.icon className={cn("w-5 h-5", styles.icon)} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-medium text-primary">
                    {tip.title}
                  </h4>
                  <p className="text-sm text-secondary">{tip.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        {content.actions && content.actions.length > 0 && (
          <div className="pt-2 border-t border-subtle">
            <div className="flex flex-wrap gap-2">
              {content.actions.map((action, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-brand border-brand/30 hover:bg-brand/5"
                  asChild={action.href ? true : false}
                  onClick={
                    "action" in action
                      ? () => {
                          // Handle custom actions
                          console.log("Action:", action.action);
                        }
                      : undefined
                  }
                >
                  {action.href ? (
                    <a
                      href={action.href}
                      target={action.external ? "_blank" : undefined}
                      rel={action.external ? "noopener noreferrer" : undefined}
                      className="flex items-center gap-2"
                    >
                      {action.label}
                      {action.external ? (
                        <ExternalLink className="w-3 h-3" />
                      ) : (
                        <ArrowRight className="w-3 h-3" />
                      )}
                    </a>
                  ) : (
                    <span className="flex items-center gap-2">
                      {action.label}
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Quick tips component for inline guidance
interface QuickTipProps {
  tip: string;
  type?: "info" | "warning" | "success";
  className?: string;
}

export function QuickTip({ tip, type = "info", className }: QuickTipProps) {
  const styles = {
    info: {
      bg: "bg-status-info/10",
      border: "border-status-info/20",
      text: "text-status-info",
    },
    warning: {
      bg: "bg-status-warning/10",
      border: "border-status-warning/20",
      text: "text-status-warning",
    },
    success: {
      bg: "bg-status-success/10",
      border: "border-status-success/20",
      text: "text-status-success",
    },
  };

  const currentStyles = styles[type];

  return (
    <div
      className={cn(
        "flex items-start gap-2 p-3 rounded-lg border text-sm",
        currentStyles.bg,
        currentStyles.border,
        className
      )}
    >
      <Lightbulb
        className={cn("w-4 h-4 flex-shrink-0 mt-0.5", currentStyles.text)}
      />
      <p className="text-secondary">{tip}</p>
    </div>
  );
}

export default ContextualGuidance;
