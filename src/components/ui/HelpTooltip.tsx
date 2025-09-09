"use client";

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HelpCircle,
  Info,
  AlertTriangle,
  Shield,
  Zap,
  Clock,
  DollarSign,
  Lock,
  Eye,
  FileText,
  Settings,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HelpTooltipProps {
  content: string | React.ReactNode;
  type?: "info" | "warning" | "security" | "feature" | "cost" | "performance";
  placement?: "top" | "bottom" | "left" | "right";
  className?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
}

const tooltipIcons = {
  info: Info,
  warning: AlertTriangle,
  security: Shield,
  feature: Zap,
  cost: DollarSign,
  performance: Clock,
};

const tooltipStyles = {
  info: "text-status-info",
  warning: "text-status-warning",
  security: "text-brand",
  feature: "text-brand-primary",
  cost: "text-orange-500",
  performance: "text-green-500",
};

export function HelpTooltip({
  content,
  type = "info",
  placement = "top",
  className = "",
  children,
  showIcon = true,
}: HelpTooltipProps) {
  const Icon = tooltipIcons[type];
  const iconStyle = tooltipStyles[type];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <button className={cn("inline-flex items-center", className)}>
              {showIcon && <Icon className={cn("w-3 h-3", iconStyle)} />}
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent side={placement} className="max-w-xs">
          <div className="flex items-start gap-2">
            {showIcon && (
              <Icon className={cn("w-3 h-3 mt-0.5 flex-shrink-0", iconStyle)} />
            )}
            <div className="text-sm">
              {typeof content === "string" ? <p>{content}</p> : content}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Predefined tooltips for common use cases
export const CommonTooltips = {
  // Security-related tooltips
  apiKeySecurity: (
    <div className="space-y-2">
      <p className="font-medium">🔒 Your API Key Security</p>
      <ul className="text-xs space-y-1">
        <li>• Stored locally in your browser only</li>
        <li>• Never sent to our servers</li>
        <li>• You control when to clear or store keys</li>
      </ul>
    </div>
  ),

  ephemeralMode: (
    <div className="space-y-2">
      <p className="font-medium">🛡️ Ephemeral Mode</p>
      <p>
        Maximum security - your API key is never stored anywhere and must be
        re-entered each session.
      </p>
      <p className="text-status-warning text-xs">
        ⚠️ You'll need to re-enter your key each time you use AI features.
      </p>
    </div>
  ),

  byoModel: (
    <div className="space-y-2">
      <p className="font-medium">🔑 Bring Your Own API Key</p>
      <p>
        Cognify uses your own AI provider accounts for generation. This ensures:
      </p>
      <ul className="text-xs space-y-1 mt-2">
        <li>• You control your data and costs</li>
        <li>• No rate limits from our side</li>
        <li>• Direct access to latest models</li>
        <li>• Complete privacy and security</li>
      </ul>
    </div>
  ),

  // AI Features
  temperature: (
    <div className="space-y-2">
      <p className="font-medium">🌡️ Temperature Setting</p>
      <p>Controls AI creativity and randomness:</p>
      <ul className="text-xs space-y-1 mt-1">
        <li>
          • <strong>0.0-0.3:</strong> Focused, consistent output
        </li>
        <li>
          • <strong>0.4-0.7:</strong> Balanced creativity
        </li>
        <li>
          • <strong>0.8-1.0:</strong> More creative, varied output
        </li>
      </ul>
    </div>
  ),

  maxTokens: (
    <div className="space-y-2">
      <p className="font-medium">📝 Max Tokens</p>
      <p>Limits response length and controls costs:</p>
      <ul className="text-xs space-y-1 mt-1">
        <li>• Higher = longer responses, more cost</li>
        <li>• Lower = shorter responses, less cost</li>
        <li>• ~4 characters per token on average</li>
      </ul>
    </div>
  ),

  // Spaced Repetition System
  srsExplanation: (
    <div className="space-y-2">
      <p className="font-medium">🧠 Spaced Repetition</p>
      <p>An evidence-based learning technique that:</p>
      <ul className="text-xs space-y-1 mt-1">
        <li>• Shows cards just before you forget them</li>
        <li>• Strengthens long-term memory</li>
        <li>• Reduces study time by 50-80%</li>
      </ul>
    </div>
  ),

  ease: (
    <div className="space-y-2">
      <p className="font-medium">⚖️ Ease Factor</p>
      <p>How easily you remember a card:</p>
      <ul className="text-xs space-y-1 mt-1">
        <li>• Higher = longer intervals between reviews</li>
        <li>• Adjusts automatically based on your performance</li>
        <li>• Starts at 250% (2.5x multiplier)</li>
      </ul>
    </div>
  ),

  interval: (
    <div className="space-y-2">
      <p className="font-medium">📅 Review Interval</p>
      <p>Time until next review based on:</p>
      <ul className="text-xs space-y-1 mt-1">
        <li>• How well you remembered the card</li>
        <li>• Previous intervals and performance</li>
        <li>• The card's ease factor</li>
      </ul>
    </div>
  ),

  // Study features
  newCardsPerDay:
    "Maximum new cards to introduce each day. Start with 10-20 to avoid overwhelming yourself.",

  maxReviews:
    "Maximum review cards per day. Set high enough to handle your review queue.",

  learningSteps:
    "Minutes between learning steps for new cards. Default: 1, 10 minutes (first mistake, then 10 minutes later).",

  // Cost and performance
  costEstimate: (
    <div className="space-y-2">
      <p className="font-medium">💰 Cost Estimate</p>
      <p>Rough calculation based on:</p>
      <ul className="text-xs space-y-1 mt-1">
        <li>• Provider pricing per token</li>
        <li>• Input content size</li>
        <li>• Expected output length</li>
      </ul>
      <p className="text-status-warning text-xs">⚠️ Actual costs may vary</p>
    </div>
  ),

  // Import/Export
  jsonFormat: (
    <div className="space-y-2">
      <p className="font-medium">📄 JSON Format</p>
      <p>Expected format for importing content:</p>
      <pre className="text-xs bg-surface-secondary p-2 rounded mt-1">
        {`{
  "flashcards": [
    {
      "front": "Question",
      "back": "Answer"
    }
  ]
}`}
      </pre>
    </div>
  ),

  duplicateDetection:
    "Automatically finds cards with similar content to prevent duplicates and save study time.",
};

// Higher-order component for adding tooltips to existing components
export function withTooltip<P extends object>(
  Component: React.ComponentType<P>,
  tooltip: string | React.ReactNode,
  type: HelpTooltipProps["type"] = "info"
) {
  return React.forwardRef<
    any,
    P & { tooltipProps?: Partial<HelpTooltipProps> }
  >((props, ref) => {
    const { tooltipProps, ...componentProps } = props;

    return (
      <HelpTooltip content={tooltip} type={type} {...tooltipProps}>
        <Component ref={ref} {...(componentProps as P)} />
      </HelpTooltip>
    );
  });
}

// Contextual help sections for complex features
interface ContextualHelpProps {
  title: string;
  items: Array<{
    icon?: React.ElementType;
    label: string;
    description: string;
    tooltip?: string;
  }>;
  className?: string;
}

export function ContextualHelp({
  title,
  items,
  className,
}: ContextualHelpProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="text-sm font-medium text-primary flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-brand" />
        {title}
      </h4>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-2 surface-secondary rounded-lg"
          >
            {item.icon && (
              <div className="w-6 h-6 bg-brand/10 rounded flex items-center justify-center">
                <item.icon className="w-3 h-3 text-brand" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-primary">{item.label}</p>
                {item.tooltip && (
                  <HelpTooltip content={item.tooltip} showIcon={false}>
                    <Info className="w-3 h-3 text-muted cursor-help" />
                  </HelpTooltip>
                )}
              </div>
              <p className="text-xs text-secondary mt-1">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HelpTooltip;
