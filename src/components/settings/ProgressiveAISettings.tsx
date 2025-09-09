"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Settings,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Zap,
  Shield,
  Sliders,
  Brain,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { AIConfigurationSection } from "./AIConfigurationSection";
import { HelpTooltip, CommonTooltips } from "@/src/components/ui/HelpTooltip";
import { ContextualGuidance } from "@/src/components/ui/ContextualGuidance";

interface ProgressiveAISettingsProps {
  showTitle?: boolean;
  showDescription?: boolean;
  onConfigurationComplete?: (isValid: boolean) => void;
  variant?: "settings" | "onboarding";
}

export function ProgressiveAISettings({
  showTitle = true,
  showDescription = true,
  onConfigurationComplete,
  variant = "settings",
}: ProgressiveAISettingsProps) {
  const [showBasicSettings, setShowBasicSettings] = useState(true);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [userExperience, setUserExperience] = useState<
    "beginner" | "intermediate" | "advanced"
  >("beginner");

  const isOnboarding = variant === "onboarding";

  // Auto-expand sections based on user experience level
  useEffect(() => {
    if (userExperience === "intermediate") {
      setShowAdvancedSettings(true);
    } else if (userExperience === "advanced") {
      setShowAdvancedSettings(true);
      setShowSecuritySettings(true);
    }
  }, [userExperience]);

  const ExperienceLevelSelector = () => (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-4 h-4 text-brand" />
        <h4 className="text-sm font-medium text-primary">Experience Level</h4>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="w-3 h-3 text-muted" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Determines which settings are shown by default</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { id: "beginner", label: "Beginner", desc: "Just getting started" },
          {
            id: "intermediate",
            label: "Intermediate",
            desc: "Some AI experience",
          },
          { id: "advanced", label: "Advanced", desc: "Full control" },
        ].map((level) => (
          <button
            key={level.id}
            onClick={() =>
              setUserExperience(
                level.id as "beginner" | "intermediate" | "advanced"
              )
            }
            className={cn(
              "p-3 rounded-lg text-left transition-all duration-200",
              "border-2 hover:scale-[1.02]",
              userExperience === level.id
                ? "border-brand bg-brand/5 shadow-brand text-brand"
                : "border-subtle surface-secondary hover:border-brand/50"
            )}
          >
            <div className="text-xs font-medium">{level.label}</div>
            <div className="text-xs text-muted mt-1">{level.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );

  const SectionHeader = ({
    icon: Icon,
    title,
    description,
    isOpen,
    onToggle,
    badge,
    tooltip,
  }: {
    icon: React.ElementType;
    title: string;
    description: string;
    isOpen: boolean;
    onToggle: () => void;
    badge?: string;
    tooltip?: string;
  }) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-brand/10 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-brand" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-primary">{title}</h3>
            {badge && (
              <Badge variant="outline" className="text-xs">
                {badge}
              </Badge>
            )}
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-3 h-3 text-muted" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-xs text-muted">{description}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onToggle}>
        {isOpen ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </Button>
    </div>
  );

  const GettingStartedTips = () => (
    <div className="space-y-4">
      <ContextualGuidance
        context={userExperience === "beginner" ? "first-time-user" : "ai-setup"}
        className="mb-4"
      />
      <div className="p-4 bg-brand/5 border border-brand/20 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-brand/10 rounded-full flex items-center justify-center mt-0.5">
            <Zap className="w-3 h-3 text-brand" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-brand flex items-center gap-2">
              Quick Start Tips
              <HelpTooltip
                content={CommonTooltips.byoModel}
                type="feature"
                showIcon={false}
              >
                <Info className="w-3 h-3 text-brand cursor-help" />
              </HelpTooltip>
            </h4>
            <ul className="text-xs text-secondary space-y-1">
              <li>• Start with OpenAI or Anthropic for best results</li>
              <li>
                • Keep your API keys secure - they&apos;re never stored on our
                servers
              </li>
              <li>• Test your connection before generating content</li>
              <li>
                • Use the beginner settings unless you need specific
                customization
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="surface-elevated border-subtle">
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            AI Configuration
            {isOnboarding && (
              <Badge variant="outline" className="text-brand">
                Optional
              </Badge>
            )}
          </CardTitle>
          {showDescription && (
            <p className="text-secondary">
              Configure AI providers to automatically generate learning content
            </p>
          )}
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {/* Experience Level Selector */}
        <ExperienceLevelSelector />

        {/* Getting Started Tips for beginners */}
        {userExperience === "beginner" && <GettingStartedTips />}

        {/* Basic Settings - Always Shown */}
        <Collapsible
          open={showBasicSettings}
          onOpenChange={setShowBasicSettings}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full p-4 h-auto">
              <SectionHeader
                icon={Zap}
                title="Basic Settings"
                description="Essential AI configuration to get started"
                isOpen={showBasicSettings}
                onToggle={() => setShowBasicSettings(!showBasicSettings)}
                badge="Required"
                tooltip="Provider selection, API key, and basic model settings"
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <AIConfigurationSection
              showTitle={false}
              showDescription={false}
              onConfigurationComplete={onConfigurationComplete}
              variant={variant}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Advanced Settings - Progressive Disclosure */}
        {userExperience !== "beginner" && (
          <Collapsible
            open={showAdvancedSettings}
            onOpenChange={setShowAdvancedSettings}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full p-4 h-auto">
                <SectionHeader
                  icon={Sliders}
                  title="Advanced Settings"
                  description="Fine-tune AI behavior and generation parameters"
                  isOpen={showAdvancedSettings}
                  onToggle={() =>
                    setShowAdvancedSettings(!showAdvancedSettings)
                  }
                  badge="Optional"
                  tooltip="Temperature, token limits, and model-specific parameters"
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="p-4 border border-subtle rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                      Temperature
                      <HelpTooltip
                        content={CommonTooltips.temperature}
                        type="feature"
                        showIcon={false}
                      >
                        <HelpCircle className="w-3 h-3 text-muted cursor-help" />
                      </HelpTooltip>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      defaultValue="0.7"
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted mt-1">
                      <span>Focused</span>
                      <span>Creative</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                      Max Tokens
                      <HelpTooltip
                        content={CommonTooltips.maxTokens}
                        type="cost"
                        showIcon={false}
                      >
                        <HelpCircle className="w-3 h-3 text-muted cursor-help" />
                      </HelpTooltip>
                    </label>
                    <select className="w-full p-2 border border-subtle rounded-lg surface-secondary">
                      <option value="500">500 (Short)</option>
                      <option value="1000" selected>
                        1000 (Medium)
                      </option>
                      <option value="2000">2000 (Long)</option>
                      <option value="4000">4000 (Very Long)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-muted/5 border border-muted/20 rounded-lg">
                  <p className="text-xs text-muted">
                    💡 <strong>Tip:</strong> Higher temperature creates more
                    varied content but may be less accurate. Start with 0.7 for
                    balanced results.
                  </p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Security Settings - Advanced Users Only */}
        {userExperience === "advanced" && (
          <Collapsible
            open={showSecuritySettings}
            onOpenChange={setShowSecuritySettings}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full p-4 h-auto">
                <SectionHeader
                  icon={Shield}
                  title="Security & Privacy"
                  description="Advanced security options and privacy controls"
                  isOpen={showSecuritySettings}
                  onToggle={() =>
                    setShowSecuritySettings(!showSecuritySettings)
                  }
                  badge="Advanced"
                  tooltip="Ephemeral keys, request logging, and security preferences"
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="space-y-4">
                <ContextualGuidance context="security-focused" />
                <div className="p-4 border border-subtle rounded-lg space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-primary flex items-center gap-2">
                          Auto-clear API keys on logout
                          <HelpTooltip
                            content="Automatically removes stored API keys from localStorage when you log out for enhanced security."
                            type="security"
                            showIcon={false}
                          >
                            <HelpCircle className="w-3 h-3 text-muted cursor-help" />
                          </HelpTooltip>
                        </label>
                        <p className="text-xs text-muted">
                          Automatically remove stored keys when you log out
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="rounded"
                        defaultChecked
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-primary flex items-center gap-2">
                          Prefer ephemeral mode
                          <HelpTooltip
                            content={CommonTooltips.ephemeralMode}
                            type="security"
                            showIcon={false}
                          >
                            <HelpCircle className="w-3 h-3 text-muted cursor-help" />
                          </HelpTooltip>
                        </label>
                        <p className="text-xs text-muted">
                          Default to ephemeral mode for new API keys
                        </p>
                      </div>
                      <input type="checkbox" className="rounded" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-primary">
                          Show security warnings
                        </label>
                        <p className="text-xs text-muted">
                          Display security notices when configuring AI
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="rounded"
                        defaultChecked
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-status-warning/5 border border-status-warning/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-status-warning mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-status-warning">
                          Security Note
                        </p>
                        <p className="text-xs text-muted mt-1">
                          These settings only affect local storage and do not
                          change our core security model - API keys never reach
                          our servers.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Summary for beginners */}
        {userExperience === "beginner" && (
          <div className="text-center p-4 border border-brand/20 bg-brand/5 rounded-lg">
            <p className="text-sm text-brand font-medium mb-1">
              Ready to explore more?
            </p>
            <p className="text-xs text-muted mb-3">
              Change your experience level above to access advanced settings
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProgressiveAISettings;
