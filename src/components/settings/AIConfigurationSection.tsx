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
} from "lucide-react";
import { toast } from "sonner";
import { useAIConfig } from "@/hooks/useAISettings";
import { validateAIConfig } from "@/lib/ai/types";
import { getAvailableAIProviders } from "@/lib/ai/developer";

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
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              AI Configuration
            </h3>
            {showDescription && (
              <p className="text-sm text-slate-400">
                Configure your AI provider and model settings
              </p>
            )}
          </div>
        </div>
      )}

      {/* AI Enable Toggle */}
      <Card
        className={
          isOnboarding
            ? "bg-slate-800/60 border-slate-600"
            : "bg-slate-800/40 border-slate-700"
        }
      >
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5 text-violet-400" />
              <div>
                <h4 className="font-medium text-white">Enable AI Features</h4>
                <p className="text-sm text-slate-400">
                  Use AI to generate flashcards from your content
                </p>
              </div>
            </div>
            <button
              onClick={() => setAIEnabled(!aiEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                aiEnabled ? "bg-violet-500" : "bg-slate-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  aiEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {aiEnabled && (
        <>
          {/* Provider Selection */}
          <Card
            className={
              isOnboarding
                ? "bg-slate-800/60 border-slate-600"
                : "bg-slate-800/40 border-slate-700"
            }
          >
            <CardHeader>
              <CardTitle className="text-white">AI Provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {getAvailableAIProviders().map((provider: AIProviderInfo) => (
                  <div
                    key={provider.id}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-violet-400 ${
                      localConfig.provider === provider.id
                        ? "border-violet-500 bg-violet-500/10"
                        : "border-slate-600 bg-slate-700/30"
                    } ${provider.isDeveloperOnly ? "border-amber-500/50" : ""}`}
                    onClick={() => handleProviderChange(provider.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-white">
                            {provider.name}
                          </h4>
                          {provider.isDeveloperOnly && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-amber-500/20 text-amber-400"
                            >
                              DEV
                            </Badge>
                          )}
                          <a
                            href={provider.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-slate-400 hover:text-violet-400 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                        <p className="text-sm text-slate-400">
                          {provider.description}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-slate-500">
                          <span>
                            {provider.models.length} model
                            {provider.models.length === 1 ? "" : "s"}
                          </span>
                          <span>•</span>
                          <span>
                            {provider.requiresApiKey
                              ? "API key required"
                              : "No API key needed"}
                          </span>
                        </div>
                      </div>
                      {localConfig.provider === provider.id && (
                        <CheckCircle2 className="w-5 h-5 text-violet-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
