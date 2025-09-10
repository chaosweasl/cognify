"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Settings,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAIConfig } from "@/hooks/useAISettings";
import { validateAIConfig } from "@/lib/ai/types";
import { getAvailableAIProviders } from "@/lib/ai/developer";
import { cn } from "@/lib/utils";
import { ApiKeySecurityInput } from "@/src/components/ui/api-key-security";

interface AIProviderField {
  key: string;
  label: string;
  type: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
}

interface AIProviderInfo {
  id: string;
  name: string;
  description?: string;
  website?: string;
  requiresApiKey?: boolean;
  isDeveloperOnly?: boolean;
  models: Array<{ id: string; name: string; description?: string }>;
  configFields: AIProviderField[];
}

interface AIQuickConfigProps {
  onConfigurationComplete?: (isValid: boolean) => void;
  compact?: boolean;
}

export function AIQuickConfig({
  onConfigurationComplete,
  compact = true,
}: AIQuickConfigProps) {
  const { currentConfig, setConfig, aiEnabled, setAIEnabled } = useAIConfig();
  const [localConfig, setLocalConfig] = useState(currentConfig);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Update local state when global config changes
  useEffect(() => {
    setLocalConfig(currentConfig);
  }, [currentConfig]);

  // Notify parent when configuration validity changes
  useEffect(() => {
    if (onConfigurationComplete) {
      const isValid = validateAIConfig(localConfig);
      onConfigurationComplete(isValid);
    }
  }, [localConfig, onConfigurationComplete]);

  const selectedProvider = getAvailableAIProviders().find(
    (p: AIProviderInfo) => p.id === localConfig.provider
  ) as AIProviderInfo | undefined;
  const availableModels = selectedProvider?.models || [];
  const isConfigValid = validateAIConfig(localConfig);

  const handleProviderChange = (providerId: string) => {
    const provider = getAvailableAIProviders().find(
      (p: AIProviderInfo) => p.id === providerId
    ) as AIProviderInfo | undefined;
    if (!provider) return;

    setLocalConfig({
      ...localConfig,
      provider: providerId,
      model: provider.models[0]?.id || "",
      // Reset provider-specific config
      apiKey: "",
      baseUrl:
        provider.configFields.find((f: AIProviderField) => f.key === "baseUrl")
          ?.placeholder || "",
    });
  };

  const handleConfigChange = (key: string, value: unknown) => {
    setLocalConfig({ ...localConfig, [key]: value });
  };

  const handleSave = () => {
    setConfig(localConfig);
    if (onConfigurationComplete) {
      onConfigurationComplete(isConfigValid);
    }
  };

  const getStatusIcon = () => {
    if (!aiEnabled)
      return <AlertCircle className="w-4 h-4 text-status-warning" />;
    if (isConfigValid)
      return <CheckCircle2 className="w-4 h-4 text-status-success" />;
    return <AlertCircle className="w-4 h-4 text-status-error" />;
  };

  const getStatusText = () => {
    if (!aiEnabled) return "AI features disabled";
    if (isConfigValid) return "AI configuration valid";
    return "AI configuration incomplete";
  };

  const getStatusColor = () => {
    if (!aiEnabled) return "text-status-warning";
    if (isConfigValid) return "text-status-success";
    return "text-status-error";
  };

  if (compact && !isExpanded) {
    return (
      <Card className="glass-surface border-subtle hover:border-brand-primary/30 transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-primary flex items-center gap-2">
                  AI Configuration
                  {getStatusIcon()}
                </h3>
                <p className={cn("text-sm", getStatusColor())}>
                  {getStatusText()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isConfigValid && (
                <Badge
                  variant="outline"
                  className="text-status-success border-status-success"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Ready
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="hover:scale-105 transition-transform"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configure
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-surface border-subtle">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-primary">
                AI Configuration
              </CardTitle>
              <p className="text-sm text-secondary">
                Configure your AI provider for automated generation
              </p>
            </div>
          </div>
          {compact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
            >
              <ChevronUp className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Enable Toggle */}
        <div className="flex items-center justify-between p-4 bg-surface-secondary/50 rounded-xl">
          <div>
            <h4 className="font-medium text-primary">Enable AI Features</h4>
            <p className="text-sm text-secondary">
              Turn on AI-powered content generation
            </p>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={aiEnabled}
              onChange={(e) => setAIEnabled(e.target.checked)}
              className="sr-only"
              id="ai-enabled"
            />
            <label
              htmlFor="ai-enabled"
              className={cn(
                "flex h-6 w-11 cursor-pointer items-center rounded-full px-0.5 transition-colors",
                aiEnabled ? "bg-brand-primary" : "bg-surface-secondary"
              )}
            >
              <div
                className={cn(
                  "h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                  aiEnabled ? "translate-x-5" : "translate-x-0"
                )}
              />
            </label>
          </div>
        </div>

        {aiEnabled && (
          <>
            {/* Provider Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-secondary">
                AI Provider
              </label>
              <select
                value={localConfig.provider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl surface-secondary border-2 border-subtle hover:border-primary focus:border-brand-primary focus:surface-primary transition-all text-primary"
              >
                <option value="">Select a provider...</option>
                {getAvailableAIProviders().map((provider: AIProviderInfo) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedProvider && (
              <>
                {/* Model Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-secondary">
                    Model
                  </label>
                  <select
                    value={localConfig.model}
                    onChange={(e) =>
                      handleConfigChange("model", e.target.value)
                    }
                    className="w-full px-4 py-3 rounded-xl surface-secondary border-2 border-subtle hover:border-primary focus:border-brand-primary focus:surface-primary transition-all text-primary"
                  >
                    <option value="">Select a model...</option>
                    {availableModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                        {model.description && ` - ${model.description}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* API Key */}
                {selectedProvider.requiresApiKey && (
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-secondary">
                      API Key
                    </label>
                    <ApiKeySecurityInput
                      providerId={selectedProvider.id}
                      providerName={selectedProvider.name}
                      currentKey={localConfig.apiKey || ""}
                      onKeyChange={(value: string) =>
                        handleConfigChange("apiKey", value)
                      }
                      placeholder={`Enter your ${selectedProvider.name} API key...`}
                    />
                  </div>
                )}

                {/* Advanced Settings Toggle */}
                {selectedProvider.configFields.length > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full justify-center"
                  >
                    {showAdvanced ? "Hide" : "Show"} Advanced Settings
                    {showAdvanced ? (
                      <ChevronUp className="w-4 h-4 ml-2" />
                    ) : (
                      <ChevronDown className="w-4 h-4 ml-2" />
                    )}
                  </Button>
                )}

                {/* Advanced Settings */}
                {showAdvanced && (
                  <div className="space-y-4 p-4 bg-surface-secondary/30 rounded-xl">
                    {selectedProvider.configFields
                      .filter(
                        (field: AIProviderField) => field.key !== "apiKey"
                      )
                      .map((field: AIProviderField) => (
                        <div key={field.key} className="space-y-2">
                          <label className="block text-sm font-medium text-secondary">
                            {field.label}
                            {field.required && (
                              <span className="text-status-error ml-1">*</span>
                            )}
                          </label>
                          <input
                            type={field.type}
                            value={
                              (localConfig as any)[field.key]?.toString() || ""
                            }
                            onChange={(e) =>
                              handleConfigChange(field.key, e.target.value)
                            }
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 rounded-lg surface-primary border border-subtle hover:border-primary focus:border-brand-primary transition-all text-primary text-sm"
                          />
                          {field.description && (
                            <p className="text-xs text-muted">
                              {field.description}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                )}

                {/* Provider Info */}
                <div className="flex items-center justify-between p-3 bg-surface-secondary/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {selectedProvider.name}
                    </Badge>
                    {isConfigValid && (
                      <Badge
                        variant="outline"
                        className="text-xs text-status-success border-status-success"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Ready
                      </Badge>
                    )}
                  </div>
                  {selectedProvider.website && (
                    <a
                      href={selectedProvider.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-primary hover:underline text-xs flex items-center gap-1"
                    >
                      Visit Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Save Configuration */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={!validateAIConfig(localConfig)}
                    className="flex-1 bg-gradient-brand disabled:opacity-50 hover:scale-[1.02] transition-transform"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Save Configuration
                  </Button>
                  {compact && (
                    <Button
                      variant="outline"
                      onClick={() => setIsExpanded(false)}
                    >
                      Close
                    </Button>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
