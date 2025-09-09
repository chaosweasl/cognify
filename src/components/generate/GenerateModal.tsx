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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FileText,
  X,
  Zap,
  AlertCircle,
  CheckCircle2,
  Loader2,
  BookOpen,
  PuzzleIcon as Quiz,
  CreditCard,
} from "lucide-react";
import { useAISettings } from "@/hooks/useAISettings";
import { useTokenUsage, estimateTokenCost } from "@/hooks/useTokenUsage";
import { validateAIConfig } from "@/lib/ai/types";

type ContentType = "flashcards" | "cheatsheets" | "quizzes";

// Simple label component
const Label = ({
  htmlFor,
  className,
  children,
}: {
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) => (
  <label htmlFor={htmlFor} className={className}>
    {children}
  </label>
);

interface GenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onFlashcardsGenerated?: (flashcards: GeneratedFlashcard[]) => void;
  onCheatsheetGenerated?: (cheatsheet: GeneratedCheatsheet) => void;
  onQuizGenerated?: (quiz: GeneratedQuiz) => void;
}

interface GeneratedFlashcard {
  id: string;
  front: string;
  back: string;
}

interface GeneratedCheatsheet {
  title: string;
  content: {
    sections: Array<{
      id: string;
      title: string;
      content: string;
      keyPoints: string[];
      examples?: string[];
    }>;
    summary?: string;
    metadata?: {
      sourceFile?: string;
      generatedAt: string;
      style: string;
    };
  };
  tags?: string[];
}

interface GeneratedQuiz {
  title: string;
  questions: Array<{
    id: string;
    type: "multiple-choice" | "true-false" | "short-answer" | "fill-blank";
    question: string;
    options?: string[];
    correctAnswer: string | string[];
    explanation?: string;
    points: number;
    difficulty: string;
  }>;
  settings: {
    timeLimit?: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    passingScore: number;
    allowRetakes: boolean;
    showCorrectAnswers: boolean;
    metadata: {
      sourceFile: string;
      generatedAt: string;
      totalPoints: number;
      questionTypes: string[];
    };
  };
  tags?: string[];
}

interface UploadedFile {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "extracting" | "generating" | "completed" | "error";
  extractedText?: string;
  error?: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const SUPPORTED_TYPES = ["application/pdf"];
const MAX_FILES = 5;

const contentTypeConfig = {
  flashcards: {
    title: "Flashcards",
    icon: CreditCard,
    description:
      "Generate question-answer pairs for spaced repetition learning",
    endpoint: "/api/ai/generate-flashcards",
    defaultOptions: { maxCards: 20, difficulty: "intermediate" as const },
    optionFields: [
      {
        key: "maxCards",
        label: "Max Cards",
        type: "number",
        min: 1,
        max: 50,
        default: 20,
      },
      {
        key: "difficulty",
        label: "Difficulty",
        type: "select",
        options: ["beginner", "intermediate", "advanced"],
        default: "intermediate",
      },
    ],
  },
  cheatsheets: {
    title: "Cheatsheets",
    icon: BookOpen,
    description:
      "Generate organized reference sheets with key concepts and information",
    endpoint: "/api/ai/generate-cheatsheets",
    defaultOptions: { sections: 5, style: "bullet-points" as const },
    optionFields: [
      {
        key: "sections",
        label: "Sections",
        type: "number",
        min: 1,
        max: 10,
        default: 5,
      },
      {
        key: "style",
        label: "Style",
        type: "select",
        options: ["bullet-points", "detailed", "visual"],
        default: "bullet-points",
      },
    ],
  },
  quizzes: {
    title: "Quizzes",
    icon: Quiz,
    description:
      "Generate interactive quizzes with multiple question types and scoring",
    endpoint: "/api/ai/generate-quizzes",
    defaultOptions: { questionCount: 10, difficulty: "intermediate" as const },
    optionFields: [
      {
        key: "questionCount",
        label: "Questions",
        type: "number",
        min: 1,
        max: 25,
        default: 10,
      },
      {
        key: "difficulty",
        label: "Difficulty",
        type: "select",
        options: ["beginner", "intermediate", "advanced"],
        default: "intermediate",
      },
      {
        key: "timeLimit",
        label: "Time Limit (min)",
        type: "number",
        min: 1,
        max: 120,
        default: undefined,
      },
    ],
  },
};

export function GenerateModal({
  isOpen,
  onClose,
  projectId,
  onFlashcardsGenerated,
  onCheatsheetGenerated,
  onQuizGenerated,
}: GenerateModalProps) {
  const [contentType, setContentType] = useState<ContentType>("flashcards");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [options, setOptions] = useState<
    Record<string, string | number | boolean>
  >({});
  const [focusAreas, setFocusAreas] = useState("");
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

    if (isOverDailyLimit()) {
      toast.error(
        "Daily token limit exceeded. Please try again tomorrow or increase your limits in settings."
      );
      return;
    }

    setIsProcessing(true);

    try {
      let allGeneratedContent: (
        | GeneratedFlashcard
        | GeneratedCheatsheet
        | GeneratedQuiz
      )[] = [];
      let totalTokensUsed = 0;

      const config = contentTypeConfig[contentType];
      const mergedOptions: Record<string, unknown> = {
        ...config.defaultOptions,
        ...options,
      };
      if (focusAreas.trim()) {
        mergedOptions.focusAreas = focusAreas
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s);
      }

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

        // Step 2: Generate content with AI
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileData.id
              ? { ...f, status: "generating", progress: 80 }
              : f
          )
        );

        const generateResponse = await fetch(config.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            projectId,
            fileName: fileData.file.name,
            config: currentConfig,
            options: mergedOptions,
          }),
        });

        if (!generateResponse.ok) {
          const errorData = await generateResponse.json();
          throw new Error(
            errorData.error || `Failed to generate ${contentType}`
          );
        }

        const responseData = await generateResponse.json();

        // Handle different content types
        if (contentType === "flashcards") {
          allGeneratedContent = [
            ...allGeneratedContent,
            ...responseData.flashcards,
          ];
        } else if (contentType === "cheatsheets") {
          allGeneratedContent.push(responseData.cheatsheet);
        } else if (contentType === "quizzes") {
          allGeneratedContent.push(responseData.quiz);
        }

        // Track token usage
        if (
          responseData.metadata?.tokensUsed &&
          responseData.metadata?.provider &&
          responseData.metadata?.model
        ) {
          totalTokensUsed += responseData.metadata.tokensUsed;
          addUsage({
            provider: responseData.metadata.provider,
            model: responseData.metadata.model,
            tokensUsed: responseData.metadata.tokensUsed,
            cost: estimateTokenCost(
              responseData.metadata.tokensUsed,
              responseData.metadata.provider,
              responseData.metadata.model
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

      // Call the appropriate callback
      if (contentType === "flashcards" && onFlashcardsGenerated) {
        onFlashcardsGenerated(allGeneratedContent as GeneratedFlashcard[]);
      } else if (
        contentType === "cheatsheets" &&
        onCheatsheetGenerated &&
        allGeneratedContent[0]
      ) {
        onCheatsheetGenerated(allGeneratedContent[0] as GeneratedCheatsheet);
      } else if (
        contentType === "quizzes" &&
        onQuizGenerated &&
        allGeneratedContent[0]
      ) {
        onQuizGenerated(allGeneratedContent[0] as GeneratedQuiz);
      }

      toast.success(
        `Successfully generated ${contentType} using ${totalTokensUsed} tokens!`
      );

      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Content generation error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to generate ${contentType}`
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
        return `Generating ${contentType}...`;
      case "completed":
        return "Completed";
      case "error":
        return "Failed";
    }
  };

  const updateOption = (key: string, value: string | number | boolean) => {
    setOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const config = contentTypeConfig[contentType];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto surface-elevated border-subtle">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-white">
            <div className="w-6 h-6 bg-gradient-brand rounded-md flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span>AI Content Generator</span>
          </DialogTitle>
          <DialogDescription className="text-muted">
            Upload PDF files to automatically generate learning content using
            AI. Maximum {MAX_FILES} files, up to 50MB each.
            {!isOverDailyLimit() && (
              <span className="block mt-1 text-xs">
                Daily tokens remaining:{" "}
                {getRemainingDailyTokens().toLocaleString()}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={contentType}
          onValueChange={(value) => setContentType(value as ContentType)}
        >
          <TabsList className="grid w-full grid-cols-3">
            {(Object.keys(contentTypeConfig) as ContentType[]).map((type) => {
              const typeConfig = contentTypeConfig[type];
              const TypeIcon = typeConfig.icon;
              return (
                <TabsTrigger
                  key={type}
                  value={type}
                  className="flex items-center gap-2"
                >
                  <TypeIcon className="w-4 h-4" />
                  {typeConfig.title}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {(Object.keys(contentTypeConfig) as ContentType[]).map((type) => {
            const typeConfig = contentTypeConfig[type];
            return (
              <TabsContent key={type} value={type} className="space-y-6">
                {/* Content Type Description */}
                <Card className="p-4 bg-gradient-to-r from-brand-primary/5 to-brand-accent/5 border-brand-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-brand rounded-lg">
                      <typeConfig.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-brand-primary">
                        {typeConfig.title}
                      </h3>
                      <p className="text-sm text-muted">
                        {typeConfig.description}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Configuration Options */}
                <Card className="p-4">
                  <h4 className="font-semibold text-secondary mb-3">
                    Generation Options
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {typeConfig.optionFields.map((field) => (
                      <div key={field.key}>
                        <Label
                          htmlFor={field.key}
                          className="text-sm font-medium"
                        >
                          {field.label}
                        </Label>
                        {field.type === "number" ? (
                          <Input
                            id={field.key}
                            type="number"
                            min={field.min}
                            max={field.max}
                            value={String(options[field.key] ?? field.default)}
                            onChange={(e) =>
                              updateOption(
                                field.key,
                                parseInt(e.target.value) ||
                                  (field.default as number) ||
                                  0
                              )
                            }
                            className="mt-1"
                          />
                        ) : field.type === "select" ? (
                          <Select
                            value={String(options[field.key] ?? field.default)}
                            onValueChange={(value) =>
                              updateOption(field.key, value)
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option.charAt(0).toUpperCase() +
                                    option.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id={field.key}
                            value={String(
                              options[field.key] ?? field.default ?? ""
                            )}
                            onChange={(e) =>
                              updateOption(field.key, e.target.value)
                            }
                            className="mt-1"
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Focus Areas */}
                  <div className="mt-4">
                    <Label htmlFor="focusAreas" className="text-sm font-medium">
                      Focus Areas (optional)
                    </Label>
                    <Input
                      id="focusAreas"
                      placeholder="Enter focus areas separated by commas..."
                      value={focusAreas}
                      onChange={(e) => setFocusAreas(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted mt-1">
                      Specify topics or concepts to emphasize during generation
                    </p>
                  </div>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>

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
                        <p className="text-xs text-status-error mt-2">
                          {fileData.error}
                        </p>
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
              className="bg-gradient-brand hover:bg-gradient-brand-hover"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate {config.title}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
