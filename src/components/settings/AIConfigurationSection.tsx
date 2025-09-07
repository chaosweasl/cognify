"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  Loader2,
  Zap,
  Settings,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Shield,
  Brain,
} from "lucide-react";
import { toast } from "sonner";
import { useAIConfig } from "@/hooks/useAISettings";
import { validateAIConfig } from "@/lib/ai/types";
import { getAvailableAIProviders } from "@/lib/ai/developer";
import { cn } from "@/lib/utils";

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

interface AIConfigurationSectionProps {
  showTitle?: boolean;
  showDescription?: boolean;
  onConfigurationComplete?: (isValid: boolean) => void;
  variant?: "settings" | "onboarding";
}

export function AIConfigurationSection({
  showTitle = true,
  showDescription = true,
  onConfigurationComplete,
  variant = "settings",
}: AIConfigurationSectionProps) {
  const { currentConfig, setConfig, aiEnabled, setAIEnabled } = useAIConfig();
  const [localConfig, setLocalConfig] = useState(currentConfig);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

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
    setLocalConfig({
      ...localConfig,
      [key]: value,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      setConfig(localConfig);
      toast.success("AI configuration saved successfully!");
    } catch (error) {
      console.error("Failed to save AI config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setLocalConfig(currentConfig);
    toast.info("Configuration reset to saved values");
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      // Save config first
      setConfig(localConfig);

      // Test connection
      const response = await fetch("/api/ai/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ config: localConfig }),
      });

      if (response.ok) {
        toast.success("Connection test successful!");
      } else {
        const error = await response.text();
        toast.error(`Connection failed: ${error}`);
      }
    } catch (error) {
      console.error("Connection test error:", error);
      toast.error("Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  const isValid = Boolean(
    localConfig.provider &&
      localConfig.model &&
      // Custom model requires customModelName
      (localConfig.model !== "custom" || localConfig.customModelName?.trim()) &&
      // API key validation for providers that require it
      (selectedProvider?.requiresApiKey ? localConfig.apiKey?.trim() : true) &&
      // Base URL validation for providers that require it
      (!selectedProvider?.configFields.some(
        (f: AIProviderField) => f.key === "baseUrl" && f.required
      ) ||
        localConfig.baseUrl?.trim())
  );

  const isOnboarding = variant === "onboarding";

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="relative">
          <div className="absolute inset-0 opacity-30 pointer-events-none">
            <div
              className="absolute top-0 left-0 w-full h-1/2 bg-gradient-glass animate-pulse"
              style={{ animationDuration: "4s" }}
            />
          </div>
          <div className="relative glass-surface border border-subtle rounded-xl p-6 shadow-brand">
            <div className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all transition-normal shadow-brand">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-glass rounded-xl blur opacity-0 group-hover:opacity-100 transition-all transition-normal" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-primary group-hover:brand-primary transition-colors transition-normal">
                  AI Configuration
                </h3>
                {showDescription && (
                  <p className="text-muted mt-1">
                    Configure your AI provider and model settings
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced AI Enable Toggle */}
      <div className="glass-surface border border-subtle rounded-xl shadow-brand-lg overflow-hidden">
        <div className="surface-secondary border-b border-subtle p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 brand-primary animate-pulse" />
            <h4 className="text-lg font-semibold text-primary">AI Features</h4>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 group">
              <div className="w-10 h-10 bg-gradient-brand rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-all transition-normal shadow-brand">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-primary group-hover:brand-primary transition-colors transition-normal">
                  Enable AI Features
                </h4>
                <p className="text-muted text-sm">
                  Use AI to generate flashcards from your content
                </p>
              </div>
            </div>
            <button
              onClick={() => setAIEnabled(!aiEnabled)}
              className={cn(
                "relative inline-flex h-7 w-12 items-center rounded-full transition-all transition-normal",
                "focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-primary",
                "transform hover:scale-105",
                aiEnabled
                  ? "bg-gradient-brand shadow-brand"
                  : "surface-elevated border border-secondary"
              )}
            >
              <span
                className={cn(
                  "inline-block h-5 w-5 transform rounded-full bg-white transition-transform transition-normal shadow-sm",
                  aiEnabled ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </CardContent>
      </div>

      {aiEnabled && (
        <>
          {/* Enhanced Provider Selection */}
          <div className="glass-surface border border-subtle rounded-xl shadow-brand-lg overflow-hidden">
            <div className="surface-secondary border-b border-subtle p-6">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 brand-primary" />
                <h4 className="text-lg font-semibold text-primary">
                  AI Provider
                </h4>
                <Badge
                  variant="outline"
                  className="ml-auto surface-elevated text-secondary border-secondary"
                >
                  {getAvailableAIProviders().length} available
                </Badge>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid gap-4">
                {getAvailableAIProviders().map(
                  (provider: AIProviderInfo, index: number) => (
                    <div
                      key={provider.id}
                      className={cn(
                        "group relative overflow-hidden rounded-xl p-6 cursor-pointer transition-all transition-normal transform",
                        "glass-surface border-2 hover:scale-[1.02] hover:shadow-brand",
                        localConfig.provider === provider.id
                          ? "border-brand bg-gradient-glass shadow-brand"
                          : "border-secondary hover:border-brand",
                        provider.isDeveloperOnly && "border-amber-500/30"
                      )}
                      onClick={() => handleProviderChange(provider.id)}
                      style={{
                        animation: `slideInLeft 0.5s ease-out ${
                          index * 0.1
                        }s both`,
                      }}
                    >
                      {/* Selection indicator glow */}
                      {localConfig.provider === provider.id && (
                        <div className="absolute -inset-0.5 bg-gradient-brand rounded-xl blur opacity-30" />
                      )}

                      <div className="relative z-10 flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all transition-normal",
                                "group-hover:scale-110 transform",
                                localConfig.provider === provider.id
                                  ? "bg-gradient-brand text-white shadow-brand"
                                  : "surface-elevated border border-secondary text-muted group-hover:border-brand group-hover:text-brand-primary"
                              )}
                            >
                              <Brain className="w-5 h-5" />
                            </div>
                            <h5
                              className={cn(
                                "font-bold text-lg transition-colors transition-normal",
                                localConfig.provider === provider.id
                                  ? "text-white"
                                  : "text-primary group-hover:brand-primary"
                              )}
                            >
                              {provider.name}
                            </h5>
                            {provider.isDeveloperOnly && (
                              <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-xs font-medium">
                                <Shield className="w-3 h-3 mr-1" />
                                DEV
                              </Badge>
                            )}
                            {provider.website && (
                              <a
                                href={provider.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={cn(
                                  "transition-colors transition-normal transform hover:scale-110",
                                  localConfig.provider === provider.id
                                    ? "text-white/70 hover:text-white"
                                    : "text-muted hover:brand-primary"
                                )}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                          <p
                            className={cn(
                              "text-sm leading-relaxed transition-colors transition-normal",
                              localConfig.provider === provider.id
                                ? "text-white/80"
                                : "text-secondary group-hover:text-primary"
                            )}
                          >
                            {provider.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                              <span
                                className={cn(
                                  "font-medium transition-colors transition-normal",
                                  localConfig.provider === provider.id
                                    ? "text-white/70"
                                    : "text-muted group-hover:text-secondary"
                                )}
                              >
                                {provider.models.length} model
                                {provider.models.length === 1 ? "" : "s"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-brand-secondary rounded-full animate-pulse" />
                              <span
                                className={cn(
                                  "font-medium transition-colors transition-normal",
                                  localConfig.provider === provider.id
                                    ? "text-white/70"
                                    : "text-muted group-hover:text-secondary"
                                )}
                              >
                                {provider.requiresApiKey
                                  ? "API key required"
                                  : "No API key needed"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-center">
                          {localConfig.provider === provider.id ? (
                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center animate-pulse">
                              <CheckCircle2 className="w-4 h-4 text-brand-primary" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 border-2 border-secondary rounded-full group-hover:border-brand transition-colors transition-normal" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </div>

          {/* Provider Configuration */}
          {selectedProvider && (
            <Card
              className={
                isOnboarding
                  ? "bg-slate-800/60 border-slate-600"
                  : "bg-slate-800/40 border-slate-700"
              }
            >
              <CardHeader>
                <CardTitle className="text-white">
                  {selectedProvider.name} Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Model
                  </label>
                  <select
                    value={localConfig.model}
                    onChange={(e) =>
                      handleConfigChange("model", e.target.value)
                    }
                    className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700 text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                  >
                    {availableModels.map(
                      (model: {
                        id: string;
                        name: string;
                        description?: string;
                      }) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      )
                    )}
                  </select>
                  {localConfig.model && (
                    <p className="text-xs text-slate-400 mt-1">
                      {
                        availableModels.find(
                          (m: {
                            id: string;
                            name: string;
                            description?: string;
                          }) => m.id === localConfig.model
                        )?.description
                      }
                    </p>
                  )}
                </div>

                {/* Custom Model Name */}
                {localConfig.model === "custom" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      Custom Model Name
                    </label>
                    <Input
                      value={localConfig.customModelName || ""}
                      onChange={(e) =>
                        handleConfigChange("customModelName", e.target.value)
                      }
                      placeholder="Enter the exact model name"
                      className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Enter the exact model name as expected by your provider
                    </p>
                  </div>
                )}

                {/* Provider-specific Configuration Fields */}
                {selectedProvider.configFields.map((field: AIProviderField) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-slate-200 mb-2">
                      {field.label}
                      {field.required && (
                        <span className="text-red-400 ml-1">*</span>
                      )}
                    </label>
                    <div className="relative">
                      <Input
                        type={
                          field.type === "password" && !showApiKey
                            ? "password"
                            : "text"
                        }
                        value={
                          (localConfig[
                            field.key as keyof typeof localConfig
                          ] as string) || ""
                        }
                        onChange={(e) =>
                          handleConfigChange(field.key, e.target.value)
                        }
                        placeholder={field.placeholder}
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      />
                      {field.type === "password" && (
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showApiKey ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                    {field.description && (
                      <p className="text-xs text-slate-400 mt-1">
                        {field.description}
                      </p>
                    )}
                  </div>
                ))}

                {/* Advanced Settings */}
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-slate-200 hover:text-white">
                    Advanced Settings
                  </summary>
                  <div className="mt-4 space-y-4">
                    {/* Temperature */}
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        Temperature: {localConfig.temperature || 0.7}
                      </label>
                      <input
                        type="range"
                        value={localConfig.temperature || 0.7}
                        onChange={(e) =>
                          handleConfigChange(
                            "temperature",
                            parseFloat(e.target.value)
                          )
                        }
                        min="0"
                        max="2"
                        step="0.1"
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>Focused</span>
                        <span>Creative</span>
                      </div>
                    </div>

                    {/* Max Tokens */}
                    <div>
                      <label className="block text-sm font-medium text-slate-200 mb-2">
                        Max Tokens
                      </label>
                      <Input
                        type="number"
                        value={localConfig.maxTokens || 2000}
                        onChange={(e) =>
                          handleConfigChange(
                            "maxTokens",
                            parseInt(e.target.value)
                          )
                        }
                        min="100"
                        max="200000"
                        placeholder="2000"
                        className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                      />
                    </div>
                  </div>
                </details>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center space-x-2">
                    {isValid ? (
                      <div className="flex items-center space-x-1 text-green-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm">Configuration valid</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-yellow-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">
                          Please complete all required fields
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      disabled={saving}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Reset
                    </Button>

                    {isValid && !isOnboarding && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTestConnection}
                        disabled={testing || saving}
                        className="border-violet-600 text-violet-300 hover:bg-violet-600/10"
                      >
                        {testing ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Test Connection
                      </Button>
                    )}

                    <Button
                      onClick={handleSave}
                      disabled={saving || !isValid}
                      className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Settings className="w-4 h-4 mr-2" />
                          Save Configuration
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
