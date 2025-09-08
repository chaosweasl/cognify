"use client";

import { toast } from "sonner";
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";

/* =========================== 
   ENHANCED TOAST SYSTEM
   Better user feedback with progress, undo, and clear messaging
   =========================== */

// User-friendly error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Oops! Check your internet connection and try again.",
  AUTH_ERROR: "We couldn't log you in. Please check your credentials.",
  UPLOAD_ERROR:
    "Having trouble uploading your file. Make sure it's a PDF under 10MB.",
  GENERATION_ERROR:
    "Our AI is taking a quick break. Please try generating flashcards again.",
  SAVE_ERROR:
    "We couldn't save your changes right now. Don't worry, try again in a moment.",
  DELETE_ERROR: "Something went wrong while deleting. Please try again.",
  UPDATE_ERROR:
    "Unable to update right now. Please check your connection and retry.",
  PERMISSION_ERROR: "You don't have permission to perform this action.",
  RATE_LIMIT_ERROR:
    "You're doing that a bit too fast. Please wait a moment and try again.",
  SERVER_ERROR: "Our servers are having a moment. Please try again shortly.",
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  SAVED: "Success! Your changes have been saved.",
  UPLOADED: "File uploaded successfully!",
  CREATED: "Created successfully!",
  UPDATED: "Updated successfully!",
  DELETED: "Deleted successfully.",
  GENERATED: "Flashcards generated successfully!",
  COPIED: "Copied to clipboard!",
  IMPORTED: "Import completed successfully!",
  EXPORTED: "Export completed successfully!",
} as const;

// Helpful placeholders and hints
export const HELPFUL_PLACEHOLDERS = {
  PROJECT_NAME: "e.g., Biology Midterm, Spanish Vocabulary",
  PROJECT_DESCRIPTION:
    "Brief description to help you remember what this project is for...",
  FLASHCARD_FRONT: "What question do you want to ask?",
  FLASHCARD_BACK: "What's the answer or explanation?",
  SEARCH: "Search your projects and flashcards...",
  TAG: "Add tags to organize your content...",
} as const;

export const useEnhancedToast = () => {
  const showSuccess = (message: string = SUCCESS_MESSAGES.SAVED) => {
    return toast.success(message, {
      icon: <CheckCircle className="h-4 w-4" />,
      duration: 3000,
      className: "toast-success",
    });
  };

  const showError = (message: string = ERROR_MESSAGES.SERVER_ERROR) => {
    return toast.error(message, {
      icon: <XCircle className="h-4 w-4" />,
      duration: 5000,
      className: "toast-error",
      action: {
        label: "Dismiss",
        onClick: () => toast.dismiss(),
      },
    });
  };

  const showWarning = (message: string) => {
    return toast.warning(message, {
      icon: <AlertCircle className="h-4 w-4" />,
      duration: 4000,
      className: "toast-warning",
    });
  };

  const showInfo = (message: string) => {
    return toast.info(message, {
      icon: <Info className="h-4 w-4" />,
      duration: 3000,
      className: "toast-info",
    });
  };

  const showProgress = (message: string, promise: Promise<any>) => {
    return toast.promise(promise, {
      loading: message,
      success: "Success! Your action completed successfully.",
      error: (error) => error.message || ERROR_MESSAGES.SERVER_ERROR,
    });
  };

  const showUndo = (
    message: string,
    undoAction: () => void | Promise<void>,
    options: {
      duration?: number;
      undoLabel?: string;
    } = {}
  ) => {
    const { duration = 8000, undoLabel = "Undo" } = options;

    return toast(message, {
      icon: <CheckCircle className="h-4 w-4" />,
      duration,
      action: {
        label: undoLabel,
        onClick: async () => {
          try {
            toast.dismiss();
            await undoAction();
            toast.success("Action undone successfully!");
          } catch (error) {
            toast.error("Failed to undo action. Please try again.");
          }
        },
      },
      className: "toast-undo",
    });
  };

  const showFileUpload = (fileName: string, uploadPromise: Promise<any>) => {
    return toast.promise(uploadPromise, {
      loading: `Uploading ${fileName}...`,
      success: `${fileName} has been uploaded successfully.`,
      error: (error) => error.message || ERROR_MESSAGES.UPLOAD_ERROR,
    });
  };

  const showAIGeneration = (generationPromise: Promise<any>) => {
    return toast.promise(generationPromise, {
      loading: "AI is working its magic...",
      success: (data) => `Created ${data?.count || "several"} new flashcards.`,
      error: (error) => error.message || ERROR_MESSAGES.GENERATION_ERROR,
    });
  };

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showProgress,
    showUndo,
    showFileUpload,
    showAIGeneration,
  };
};

/* =========================== 
   PROGRESS INDICATOR HOOK
   For long-running operations
   =========================== */

export const useProgressIndicator = () => {
  const showUploadProgress = (
    file: File,
    uploadFn: (
      file: File,
      onProgress: (progress: number) => void
    ) => Promise<any>
  ) => {
    let progressToast: string | number | undefined;

    const uploadPromise = new Promise(async (resolve, reject) => {
      try {
        progressToast = toast.loading("Uploading...", {
          description: `0% complete`,
        });

        const result = await uploadFn(file, (progress) => {
          if (progressToast) {
            toast.loading("Uploading...", {
              id: progressToast,
              description: `${Math.round(progress)}% complete`,
            });
          }
        });

        if (progressToast) {
          toast.dismiss(progressToast);
        }
        toast.success("Upload complete!", {
          description: `${file.name} uploaded successfully.`,
        });

        resolve(result);
      } catch (error) {
        if (progressToast) {
          toast.dismiss(progressToast);
        }
        reject(error);
      }
    });

    return uploadPromise;
  };

  const showOperationProgress = (
    operation: string,
    steps: string[],
    operationFn: (onStep: (stepIndex: number) => void) => Promise<any>
  ) => {
    let progressToast: string | number | undefined;

    const operationPromise = new Promise(async (resolve, reject) => {
      try {
        progressToast = toast.loading(operation, {
          description: steps[0],
        });

        const result = await operationFn((stepIndex) => {
          if (stepIndex < steps.length && progressToast) {
            toast.loading(operation, {
              id: progressToast,
              description: steps[stepIndex],
            });
          }
        });

        if (progressToast) {
          toast.dismiss(progressToast);
        }
        toast.success(`${operation} complete!`);

        resolve(result);
      } catch (error) {
        if (progressToast) {
          toast.dismiss(progressToast);
        }
        reject(error);
      }
    });

    return operationPromise;
  };

  return {
    showUploadProgress,
    showOperationProgress,
  };
};

/* =========================== 
   CONFIRMATION UTILITIES
   =========================== */

export const useConfirmation = () => {
  const confirmDelete = (
    itemName: string,
    onConfirm: () => void | Promise<void>,
    options: {
      title?: string;
      description?: string;
      confirmLabel?: string;
      cancelLabel?: string;
    } = {}
  ) => {
    const {
      title = `Delete ${itemName}?`,
      description = "This action cannot be undone.",
      confirmLabel = "Delete",
      cancelLabel = "Cancel",
    } = options;

    return toast(title, {
      description,
      duration: 10000,
      action: {
        label: confirmLabel,
        onClick: async () => {
          try {
            toast.dismiss();
            await onConfirm();
            toast.success(`${itemName} deleted successfully.`);
          } catch (error) {
            toast.error(`Failed to delete ${itemName}.`);
          }
        },
      },
      cancel: {
        label: cancelLabel,
        onClick: () => toast.dismiss(),
      },
      className: "toast-confirmation",
    });
  };

  const confirmAction = (
    title: string,
    description: string,
    onConfirm: () => void | Promise<void>,
    options: {
      confirmLabel?: string;
      cancelLabel?: string;
      variant?: "default" | "destructive";
    } = {}
  ) => {
    const {
      confirmLabel = "Confirm",
      cancelLabel = "Cancel",
      variant = "default",
    } = options;

    return toast(title, {
      description,
      duration: 10000,
      action: {
        label: confirmLabel,
        onClick: async () => {
          try {
            toast.dismiss();
            await onConfirm();
            toast.success("Action completed successfully.");
          } catch (error) {
            toast.error("Action failed. Please try again.");
          }
        },
      },
      cancel: {
        label: cancelLabel,
        onClick: () => toast.dismiss(),
      },
      className: `toast-confirmation ${
        variant === "destructive" ? "toast-destructive" : ""
      }`,
    });
  };

  return {
    confirmDelete,
    confirmAction,
  };
};

/* =========================== 
   BATCH OPERATION UTILITIES
   =========================== */

export const useBatchOperations = () => {
  const showBatchProgress = async <T,>(
    items: T[],
    operation: string,
    processFn: (item: T, index: number) => Promise<void>
  ) => {
    let progressToast: string | number | undefined;
    let completed = 0;

    try {
      progressToast = toast.loading(`${operation}...`, {
        description: `Processing 0 of ${items.length} items`,
      });

      for (let i = 0; i < items.length; i++) {
        await processFn(items[i], i);
        completed++;

        if (progressToast) {
          toast.loading(`${operation}...`, {
            id: progressToast,
            description: `Processing ${completed} of ${items.length} items`,
          });
        }
      }

      if (progressToast) {
        toast.dismiss(progressToast);
      }
      toast.success(`${operation} complete!`, {
        description: `Successfully processed ${completed} items.`,
      });
    } catch (error) {
      if (progressToast) {
        toast.dismiss(progressToast);
      }
      toast.error(`${operation} failed`, {
        description: `Completed ${completed} of ${items.length} items before error.`,
        action: {
          label: "Retry",
          onClick: () =>
            showBatchProgress(items.slice(completed), operation, processFn),
        },
      });
      throw error;
    }
  };

  return {
    showBatchProgress,
  };
};
