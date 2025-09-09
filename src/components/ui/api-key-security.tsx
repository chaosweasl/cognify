"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Eye,
  EyeOff,
  Shield,
  AlertTriangle,
  Info,
  Trash2,
  Key,
  Lock,
  ShieldAlert,
  CheckCircle,
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

// Security Consent Modal Component
interface SecurityConsentModalProps {
  open: boolean;
  onClose: () => void;
  onConsent: () => void;
  providerName: string;
}

function SecurityConsentModal({
  open,
  onClose,
  onConsent,
  providerName,
}: SecurityConsentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-status-warning/10 rounded-lg flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-status-warning" />
            </div>
            <div>
              <DialogTitle className="text-lg">Security Notice</DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-left space-y-3">
            <p>
              You're about to store your <strong>{providerName}</strong> API key
              in your browser's localStorage.
            </p>
            <div className="p-3 border border-status-warning/30 bg-status-warning/5 rounded-lg space-y-2">
              <h4 className="font-semibold text-status-warning text-sm">
                What this means:
              </h4>
              <ul className="text-sm space-y-1 text-secondary">
                <li>• Key persists until you clear it or browser data</li>
                <li>• Only accessible to Cognify on this device</li>
                <li>• Never sent to our servers or shared</li>
                <li>• You can enable ephemeral mode for higher security</li>
              </ul>
            </div>
            <div className="p-3 border border-brand/30 bg-brand/5 rounded-lg">
              <p className="text-sm text-secondary">
                <strong className="text-brand">Recommended:</strong> Use API
                keys with limited scope and monitor your provider's billing.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConsent} className="bg-brand text-white">
            <CheckCircle className="w-4 h-4 mr-2" />I Understand & Consent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
  const [hasConsentedToStorage, setHasConsentedToStorage] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

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
    if (enabled && !hasConsentedToStorage) {
      setShowSecurityModal(true);
      return;
    }

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

  const handleConsentToStorage = () => {
    setHasConsentedToStorage(true);
    setShowSecurityModal(false);
    setRememberKey(true);

    if (currentKey.trim()) {
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
      {/* Enhanced Security Warning Banner */}
      {showSecurityWarning && (
        <Card className="border-status-warning/40 bg-gradient-to-r from-status-warning/5 to-orange-500/5 mb-4 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-status-warning/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Lock className="w-4 h-4 text-status-warning" />
              </div>
              <div className="space-y-3 flex-1">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-status-warning flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Bring Your Own API Key (BYO) Model
                  </h4>
                  <div className="text-sm text-secondary space-y-2">
                    <p>
                      <strong>Your security, your control:</strong> API keys are
                      stored locally in your browser only and never sent to our
                      servers.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      <div className="space-y-1">
                        <h5 className="font-medium text-status-success text-xs flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          What we DO:
                        </h5>
                        <ul className="text-xs text-secondary space-y-1 ml-4">
                          <li>• Store keys locally only</li>
                          <li>• Provide ephemeral mode</li>
                          <li>• Direct browser-to-AI requests</li>
                          <li>• Full code transparency</li>
                        </ul>
                      </div>
                      <div className="space-y-1">
                        <h5 className="font-medium text-status-error text-xs flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          What we DON'T do:
                        </h5>
                        <ul className="text-xs text-secondary space-y-1 ml-4">
                          <li>• Store keys on our servers</li>
                          <li>• Log your API usage</li>
                          <li>• Access your AI accounts</li>
                          <li>• Share keys between users</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSecurityWarning(false)}
                    className="text-status-warning border-status-warning/30 hover:bg-status-warning/10"
                  >
                    I Understand
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open("/docs/api-keys", "_blank")}
                    className="text-muted hover:text-primary"
                  >
                    Learn More
                  </Button>
                </div>
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

        {/* Enhanced Key Storage Status */}
        <div className="flex items-start gap-3 p-4 surface-elevated rounded-lg border border-subtle">
          <div className="flex-shrink-0 mt-1">
            {ephemeralMode ? (
              <div className="w-3 h-3 rounded-full bg-status-warning animate-pulse" />
            ) : rememberKey && hasStoredKey ? (
              <div className="w-3 h-3 rounded-full bg-status-success" />
            ) : rememberKey && currentKey ? (
              <div className="w-3 h-3 rounded-full bg-status-info animate-pulse" />
            ) : (
              <div className="w-3 h-3 rounded-full bg-muted" />
            )}
          </div>
          <div className="text-xs text-muted flex-1">
            <p className="font-medium text-secondary mb-1">Storage Status:</p>
            {ephemeralMode ? (
              <div className="space-y-1">
                <p className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-status-warning" />
                  <span className="text-status-warning font-medium">
                    Maximum Security Mode
                  </span>
                </p>
                <p>Key will be cleared after session ends</p>
              </div>
            ) : rememberKey && hasStoredKey ? (
              <div className="space-y-1">
                <p className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-status-success" />
                  <span className="text-status-success font-medium">
                    Stored Securely
                  </span>
                </p>
                <p>Key persists in browser localStorage</p>
              </div>
            ) : rememberKey && currentKey ? (
              <div className="space-y-1">
                <p className="flex items-center gap-1">
                  <Info className="w-3 h-3 text-status-info" />
                  <span className="text-status-info font-medium">
                    Pending Storage
                  </span>
                </p>
                <p>Key will be stored when you save configuration</p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="flex items-center gap-1">
                  <Eye className="w-3 h-3 text-muted" />
                  <span className="text-muted font-medium">Session Only</span>
                </p>
                <p>Key will be cleared after session ends</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Security Consent Modal */}
      <SecurityConsentModal
        open={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        onConsent={handleConsentToStorage}
        providerName={providerName}
      />
    </div>
  );
}
