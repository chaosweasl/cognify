"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  EyeOff,
  Shield,
  AlertTriangle,
  Info,
  Trash2,
  Key,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { aiKeyStorage } from "@/hooks/useAISettings";

interface ApiKeySecurityProps {
  providerId: string;
  providerName: string;
  currentKey?: string;
  onKeyChange: (key: string) => void;
  placeholder?: string;
  className?: string;
}

export function ApiKeySecurityInput({
  providerId,
  providerName,
  currentKey = "",
  onKeyChange,
  placeholder = "Enter API key...",
  className = "",
}: ApiKeySecurityProps) {
  const [showKey, setShowKey] = useState(false);
  const [rememberKey, setRememberKey] = useState(
    Boolean(aiKeyStorage.getApiKey(providerId))
  );
  const [ephemeralMode, setEphemeralMode] = useState(false);
  const [showSecurityWarning, setShowSecurityWarning] = useState(
    !aiKeyStorage.getApiKey(providerId)
  );

  const handleKeyChange = (value: string) => {
    onKeyChange(value);

    if (ephemeralMode) {
      // Don't store in localStorage for ephemeral mode
      aiKeyStorage.removeApiKey(providerId);
    } else if (rememberKey && value.trim()) {
      // Store in localStorage if remember is enabled
      aiKeyStorage.setApiKey(providerId, value);
    } else if (!rememberKey) {
      // Remove from localStorage if remember is disabled
      aiKeyStorage.removeApiKey(providerId);
    }
  };

  const handleRememberToggle = (enabled: boolean) => {
    setRememberKey(enabled);

    if (!enabled) {
      // Clear from localStorage when disabled
      aiKeyStorage.removeApiKey(providerId);
      toast.info("API key removed from browser storage");
    } else if (currentKey.trim()) {
      // Save to localStorage when enabled
      aiKeyStorage.setApiKey(providerId, currentKey);
      toast.success("API key saved to browser storage");
    }
  };

  const handleEphemeralToggle = (enabled: boolean) => {
    setEphemeralMode(enabled);

    if (enabled) {
      setRememberKey(false);
      aiKeyStorage.removeApiKey(providerId);
      toast.info("Ephemeral mode enabled - key will not be stored");
    }
  };

  const handleClearKey = () => {
    onKeyChange("");
    aiKeyStorage.removeApiKey(providerId);
    toast.success("API key cleared");
  };

  const hasStoredKey = Boolean(aiKeyStorage.getApiKey(providerId));

  return (
    <div className={className}>
      {/* Security Warning Banner */}
      {showSecurityWarning && (
        <Card className="border-status-warning/30 bg-status-warning/5 mb-4">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-status-warning mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-status-warning">
                  API Key Security Notice
                </h4>
                <div className="text-sm text-secondary space-y-1">
                  <p>• Your API key is stored locally in your browser only</p>
                  <p>
                    • It's never sent to our servers or stored in our database
                  </p>
                  <p>• Consider using ephemeral mode for enhanced security</p>
                  <p>• You can clear stored keys anytime from this interface</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSecurityWarning(false)}
                  className="text-status-warning border-status-warning/30 hover:bg-status-warning/10"
                >
                  I understand
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Key Input */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-primary">
            {providerName} API Key
            <span className="text-status-error ml-1">*</span>
          </label>
          <div className="flex items-center gap-2">
            {hasStoredKey && (
              <Badge
                variant="outline"
                className="text-xs text-status-success border-status-success/30"
              >
                <Key className="w-3 h-3 mr-1" />
                Stored
              </Badge>
            )}
            {ephemeralMode && (
              <Badge
                variant="outline"
                className="text-xs text-status-info border-status-info/30"
              >
                <Shield className="w-3 h-3 mr-1" />
                Ephemeral
              </Badge>
            )}
          </div>
        </div>

        <div className="relative">
          <Input
            type={showKey ? "text" : "password"}
            value={currentKey}
            onChange={(e) => handleKeyChange(e.target.value)}
            placeholder={placeholder}
            className="surface-secondary border-primary text-primary placeholder-muted pr-12"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-muted hover:text-primary p-1"
              title={showKey ? "Hide API key" : "Show API key"}
            >
              {showKey ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
            {currentKey && (
              <button
                type="button"
                onClick={handleClearKey}
                className="text-muted hover:text-status-error p-1"
                title="Clear API key"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Storage Options */}
        <div className="space-y-3 p-3 surface-elevated rounded-lg border border-subtle">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Shield className="w-4 h-4" />
            <span className="font-medium">Storage Options</span>
          </div>

          {/* Remember Key Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-primary">
                  Remember API key
                </label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Store in browser localStorage
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-xs text-muted">
                Store in browser localStorage for future sessions
              </p>
            </div>
            <Switch
              checked={rememberKey && !ephemeralMode}
              onCheckedChange={handleRememberToggle}
              disabled={ephemeralMode}
            />
          </div>

          {/* Ephemeral Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-primary">
                  Ephemeral mode
                </label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertTriangle className="w-3 h-3 text-status-warning" />
                    </TooltipTrigger>
                    <TooltipContent>High security mode</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-xs text-muted">
                Never store key - enter each session (most secure)
              </p>
            </div>
            <Switch
              checked={ephemeralMode}
              onCheckedChange={handleEphemeralToggle}
            />
          </div>
        </div>

        {/* Key Storage Status */}
        <div className="flex items-start gap-2 p-3 surface-elevated rounded-lg border border-subtle">
          <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse mt-2" />
          <div className="text-xs text-muted">
            <p className="font-medium text-secondary mb-1">Storage Status:</p>
            {ephemeralMode ? (
              <p>🛡️ Ephemeral mode - key not stored anywhere</p>
            ) : rememberKey && hasStoredKey ? (
              <p>💾 Key stored in browser localStorage</p>
            ) : rememberKey && currentKey ? (
              <p>⚠️ Key will be stored when you save configuration</p>
            ) : (
              <p>🔑 Key will be cleared after session ends</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
