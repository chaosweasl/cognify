"use client";

import React, { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  X,
  Zap,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useAISettings } from "@/hooks/useAISettings";
import { useTokenUsage, estimateTokenCost } from "@/hooks/useTokenUsage";
import { validateAIConfig } from "@/lib/ai/types";
import { AIErrorHandler } from "@/src/components/ai/AIErrorHandler";
import { AIError, AIFallbackSuggestion } from "@/lib/utils/aiErrorHandling";

interface PDFUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onFlashcardsGenerated: (flashcards: GeneratedFlashcard[]) => void;
}

interface GeneratedFlashcard {
  id: string;
  front: string;
  back: string;
}

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "extracting" | "generating" | "completed" | "error";
  extractedText?: string;
  error?: string;
  aiError?: AIError;
  fallbackSuggestions?: AIFallbackSuggestion[];
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const SUPPORTED_TYPES = ["application/pdf"];
const MAX_FILES = 5;

export function PDFUploadModal({
  isOpen,
  onClose,
  projectId,
  onFlashcardsGenerated,
}: PDFUploadModalProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showAIError, setShowAIError] = useState(false);
  const [currentAIError, setCurrentAIError] = useState<{
    error: AIError;
    suggestions: AIFallbackSuggestion[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { currentConfig, isConfigValid } = useAISettings();
  const { addUsage, isOverDailyLimit, getRemainingDailyTokens } =
    useTokenUsage();
  const aiConfigValid = isConfigValid() && validateAIConfig(currentConfig);

  const generateFileId = () => Math.random().toString(36).substr(2, 9);

  const validateFile = (file: File): string | null => {
    if (!SUPPORTED_TYPES.includes(file.type)) {
      return "Only PDF files are supported";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }
    return null;
  };

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const newFiles: UploadedFile[] = [];
      const currentCount = uploadedFiles.length;

      for (
        let i = 0;
        i < files.length && newFiles.length + currentCount < MAX_FILES;
        i++
      ) {
        const file = files[i];
        const error = validateFile(file);

        if (error) {
          toast.error(`${file.name}: ${error}`);
          continue;
        }

        // Check for duplicates
        const isDuplicate = uploadedFiles.some(
          (existing) =>
            existing.file.name === file.name && existing.file.size === file.size
        );

        if (isDuplicate) {
          toast.warning(`${file.name}: File already uploaded`);
          continue;
        }

        newFiles.push({
          file,
          id: generateFileId(),
          progress: 0,
          status: "pending",
        });
      }

      if (newFiles.length + currentCount >= MAX_FILES) {
        toast.warning(`Maximum ${MAX_FILES} files allowed`);
      }

      setUploadedFiles((prev) => [...prev, ...newFiles]);

      if (newFiles.length > 0) {
        toast.success(
          `${newFiles.length} PDF${
            newFiles.length > 1 ? "s" : ""
          } added for processing`
        );
      }
    },
    [uploadedFiles]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const processFiles = async () => {
    if (!aiConfigValid) {
      toast.error("Please configure your AI settings first");
      return;
    }

    if (uploadedFiles.length === 0) {
      toast.error("Please upload at least one PDF file");
      return;
    }

    // Check token limits
    if (isOverDailyLimit()) {
      toast.error(
        "Daily token limit exceeded. Please try again tomorrow or increase your limits in settings."
      );
      return;
    }

    setIsProcessing(true);

    try {
      let allGeneratedFlashcards: GeneratedFlashcard[] = [];
      let totalTokensUsed = 0;

      for (const fileData of uploadedFiles) {
        if (fileData.status !== "pending") continue;

        // Step 1: Extract text from PDF
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? { ...f, status: "extracting", progress: 20 }
              : f
          )
        );

        const formData = new FormData();
        formData.append("file", fileData.file);
        formData.append("projectId", projectId);

        const extractResponse = await fetch("/api/ai/extract-pdf", {
          method: "POST",
          body: formData,
        });

        if (!extractResponse.ok) {
          const errorData = await extractResponse.json();
          throw new Error(errorData.error || "Failed to extract text from PDF");
        }

        const { text } = await extractResponse.json();

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? { ...f, extractedText: text, progress: 60 }
              : f
          )
        );

        // Step 2: Generate flashcards with AI
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? { ...f, status: "generating", progress: 80 }
              : f
          )
        );

        const generateResponse = await fetch("/api/ai/generate-flashcards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            projectId,
            fileName: fileData.file.name,
            config: currentConfig,
          }),
        });

        if (!generateResponse.ok) {
          const errorData = await generateResponse.json();
          
          // Check for enhanced AI error handling
          if (errorData.aiError && errorData.fallbackSuggestions) {
            // Store enhanced error data for display
            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.id === fileData.id
                  ? { 
                      ...f, 
                      status: "error",
                      error: errorData.error || "AI generation failed",
                      aiError: errorData.aiError,
                      fallbackSuggestions: errorData.fallbackSuggestions,
                    }
                  : f
              )
            );
            
            // Don't throw here - let the enhanced error be displayed in UI
            continue; // Skip to next file
          } else {
            throw new Error(errorData.error || "Failed to generate flashcards");
          }
        }

        const { flashcards, metadata } = await generateResponse.json();
        allGeneratedFlashcards = [...allGeneratedFlashcards, ...flashcards];

        // Track token usage
        if (metadata?.tokensUsed && metadata?.provider && metadata?.model) {
          totalTokensUsed += metadata.tokensUsed;
          addUsage({
            provider: metadata.provider,
            model: metadata.model,
            tokensUsed: metadata.tokensUsed,
            cost: estimateTokenCost(
              metadata.tokensUsed,
              metadata.provider,
              metadata.model
            ),
          });
        }

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? { ...f, status: "completed", progress: 100 }
              : f
          )
        );
      }

      // Call the callback with all generated flashcards
      onFlashcardsGenerated(allGeneratedFlashcards);
      toast.success(
        `Successfully generated ${allGeneratedFlashcards.length} flashcards using ${totalTokensUsed} tokens!`
      );

      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error("PDF processing error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process PDFs"
      );

      // Mark failed files
      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.status === "extracting" || f.status === "generating"
            ? {
                ...f,
                status: "error",
                error:
                  error instanceof Error ? error.message : "Processing failed",
              }
            : f
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const resetUpload = () => {
    setUploadedFiles([]);
    setShowAIError(false);
    setCurrentAIError(null);
  };

  const handleShowAIError = (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file?.aiError && file?.fallbackSuggestions) {
      setCurrentAIError({
        error: file.aiError,
        suggestions: file.fallbackSuggestions,
      });
      setShowAIError(true);
    }
  };

  const handleRetryGeneration = async () => {
    setShowAIError(false);
    // Reset failed files and retry generation
    setUploadedFiles(prev => 
      prev.map(f => f.aiError ? { ...f, status: "pending" as const, error: undefined, aiError: undefined, fallbackSuggestions: undefined } : f)
    );
    await processFiles();
  };
    setIsProcessing(false);
  };

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "pending":
        return <FileText className="w-4 h-4 text-brand-primary" />;
      case "extracting":
      case "generating":
        return <Loader2 className="w-4 h-4 text-status-warning animate-spin" />;
      case "completed":
        return <CheckCircle2 className="w-4 h-4 text-status-success" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-status-error" />;
    }
  };

  const getStatusText = (status: UploadedFile["status"]) => {
    switch (status) {
      case "pending":
        return "Ready to process";
      case "extracting":
        return "Extracting text...";
      case "generating":
        return "Generating flashcards...";
      case "completed":
        return "Completed";
      case "error":
        return "Failed";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] surface-elevated border-subtle">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-white">
            <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-500 rounded-md flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span>AI-Powered PDF to Flashcards</span>
          </DialogTitle>
          <DialogDescription className="text-muted">
            Upload PDF files to automatically generate flashcards using AI.
            Maximum {MAX_FILES} files, up to 50MB each.
            {!isOverDailyLimit() && (
              <span className="block mt-1 text-xs">
                Daily tokens remaining:{" "}
                {getRemainingDailyTokens().toLocaleString()}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* AI Configuration Warning */}
          {!aiConfigValid && (
            <Card className="border-status-warning surface-elevated">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2 text-status-warning">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    AI configuration required
                  </span>
                </div>
                <p className="text-sm text-muted mt-1">
                  Please configure your AI settings before uploading PDFs.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Token Limit Warning */}
          {isOverDailyLimit() && (
            <Card className="border-status-error/50 surface-elevated">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2 text-status-error">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Daily token limit exceeded
                  </span>
                </div>
                <p className="text-sm text-muted mt-1">
                  You&apos;ve reached your daily token limit. Please try again
                  tomorrow or increase your limits in settings.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Upload Area */}
          {uploadedFiles.length < MAX_FILES &&
            !isProcessing &&
            !isOverDailyLimit() && (
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
                  dragActive
                    ? "border-brand-accent surface-elevated"
                    : "border-subtle hover:border-brand"
                }`}
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted" />
                  <div className="mt-4">
                    <p className="text-sm text-secondary">
                      Drop PDF files here, or{" "}
                      <button
                        type="button"
                        className="text-brand-accent hover:text-brand-accent font-medium"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-xs text-muted mt-1">
                      PDF only, max 50MB per file, up to {MAX_FILES} files
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={(e) => handleFiles(e.target.files)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            )}

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-white">
                  Uploaded Files ({uploadedFiles.length}/{MAX_FILES})
                </h4>
                {!isProcessing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetUpload}
                    className="text-muted hover:text-primary"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {uploadedFiles.map((fileData) => (
                  <Card
                    key={fileData.id}
                    className="surface-secondary border-subtle"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          {getStatusIcon(fileData.status)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-primary truncate">
                              {fileData.file.name}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <p className="text-xs text-muted">
                                {(fileData.file.size / (1024 * 1024)).toFixed(
                                  1
                                )}{" "}
                                MB
                              </p>
                              <Badge
                                variant={
                                  fileData.status === "completed"
                                    ? "default"
                                    : fileData.status === "error"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {getStatusText(fileData.status)}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {!isProcessing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(fileData.id)}
                            className="text-muted hover:text-primary ml-2"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      {(fileData.status === "extracting" ||
                        fileData.status === "generating") && (
                        <Progress
                          value={fileData.progress}
                          className="mt-3 h-2"
                        />
                      )}

                      {fileData.error && (
                        <div className="mt-2">
                          <p className="text-xs text-status-error">
                            {fileData.error}
                          </p>
                          {fileData.aiError && fileData.fallbackSuggestions && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShowAIError(fileData.id)}
                              className="mt-2 text-xs"
                            >
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Show Solutions
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-subtle">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isProcessing}
              className="text-muted hover:text-primary"
            >
              Cancel
            </Button>
            <Button
              onClick={processFiles}
              disabled={
                uploadedFiles.length === 0 ||
                !aiConfigValid ||
                isProcessing ||
                isOverDailyLimit()
              }
              className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Flashcards
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* AI Error Handler Modal */}
      {showAIError && currentAIError && (
        <Dialog open={showAIError} onOpenChange={setShowAIError}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader className="mb-4">
              <DialogTitle>AI Generation Failed</DialogTitle>
              <DialogDescription>
                The AI couldn't generate flashcards directly. Here are some solutions:
              </DialogDescription>
            </DialogHeader>
            <AIErrorHandler
              error={currentAIError.error}
              suggestions={currentAIError.suggestions}
              onRetry={handleRetryGeneration}
              onDismiss={() => setShowAIError(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
