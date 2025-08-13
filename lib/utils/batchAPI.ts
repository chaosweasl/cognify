/**
 * Batch API Utilities for Cognify
 * 
 * Provides utilities to consolidate multiple database operations into single API calls
 * Prevents N+1 query problems and reduces database load
 * 
 * Key features:
 * - Automatic request batching with configurable delays
 * - Deduplication of identical requests
 * - Batch size limits with automatic splitting
 * - Error handling with partial success support
 * - TypeScript-first design with proper interfaces
 */

// Batch request configuration
interface BatchOptions {
  maxBatchSize?: number; // Maximum items per batch (default: 100)
  debounceMs?: number; // Debounce delay in milliseconds (default: 50)
  maxWaitMs?: number; // Maximum wait time before forcing batch (default: 200)
}

// Batch request item
interface BatchRequestItem<TInput, TOutput> {
  input: TInput;
  resolve: (result: TOutput) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

// Batch result with partial success support
interface BatchResult<TOutput> {
  success: TOutput[];
  errors: { index: number; error: Error }[];
}

// Generic batch processor function type
type BatchProcessor<TInput, TOutput> = (
  inputs: TInput[]
) => Promise<BatchResult<TOutput>>;

/**
 * Generic batch manager for consolidating API requests
 */
class BatchManager<TInput, TOutput> {
  private queue: BatchRequestItem<TInput, TOutput>[] = [];
  private processor: BatchProcessor<TInput, TOutput>;
  private options: Required<BatchOptions>;
  private timeoutId: NodeJS.Timeout | null = null;

  constructor(
    processor: BatchProcessor<TInput, TOutput>,
    options: BatchOptions = {}
  ) {
    this.processor = processor;
    this.options = {
      maxBatchSize: options.maxBatchSize ?? 100,
      debounceMs: options.debounceMs ?? 50,
      maxWaitMs: options.maxWaitMs ?? 200,
    };
  }

  /**
   * Add a request to the batch queue
   */
  async request(input: TInput): Promise<TOutput> {
    return new Promise<TOutput>((resolve, reject) => {
      // Check for duplicate requests (deduplication)
      const existingRequest = this.queue.find(
        item => JSON.stringify(item.input) === JSON.stringify(input)
      );
      
      if (existingRequest) {
        // Piggyback on existing request
        const originalResolve = existingRequest.resolve;
        const originalReject = existingRequest.reject;
        
        existingRequest.resolve = (result: TOutput) => {
          originalResolve(result);
          resolve(result);
        };
        
        existingRequest.reject = (error: Error) => {
          originalReject(error);
          reject(error);
        };
        
        return;
      }

      // Add new request to queue
      this.queue.push({
        input,
        resolve,
        reject,
        timestamp: Date.now(),
      });

      // Schedule batch processing
      this.scheduleBatch();
    });
  }

  /**
   * Schedule batch processing with debouncing
   */
  private scheduleBatch(): void {
    // Clear existing timeout
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Check if we should process immediately
    const shouldProcessImmediately = 
      this.queue.length >= this.options.maxBatchSize ||
      this.hasOldRequests();

    if (shouldProcessImmediately) {
      this.processBatch();
      return;
    }

    // Schedule debounced processing
    this.timeoutId = setTimeout(() => {
      this.processBatch();
    }, this.options.debounceMs);
  }

  /**
   * Check if queue has requests older than maxWaitMs
   */
  private hasOldRequests(): boolean {
    if (this.queue.length === 0) return false;
    
    const now = Date.now();
    return this.queue.some(
      item => now - item.timestamp > this.options.maxWaitMs
    );
  }

  /**
   * Process the current batch
   */
  private async processBatch(): Promise<void> {
    if (this.queue.length === 0) return;

    // Take items to process
    const itemsToProcess = this.queue.splice(0, this.options.maxBatchSize);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📦 Processing batch of ${itemsToProcess.length} items`);
    }

    try {
      // Extract inputs for processing
      const inputs = itemsToProcess.map(item => item.input);
      
      // Process the batch
      const result = await this.processor(inputs);
      
      // Resolve successful results
      result.success.forEach((output, index) => {
        if (itemsToProcess[index]) {
          itemsToProcess[index].resolve(output);
        }
      });
      
      // Reject failed items
      result.errors.forEach(({ index, error }) => {
        if (itemsToProcess[index]) {
          itemsToProcess[index].reject(error);
        }
      });
      
    } catch (error) {
      // If entire batch fails, reject all items
      const batchError = error instanceof Error ? error : new Error(String(error));
      itemsToProcess.forEach(item => item.reject(batchError));
    }

    // Process remaining items if any
    if (this.queue.length > 0) {
      this.scheduleBatch();
    }
  }

  /**
   * Get current queue size (for monitoring)
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Clear the queue (for cleanup)
   */
  clear(): void {
    this.queue.forEach(item => 
      item.reject(new Error('Batch manager cleared'))
    );
    this.queue = [];
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

/**
 * Project statistics batch processor
 */
interface ProjectStatsInput {
  projectId: string;
  userId: string;
}

interface ProjectStatsOutput {
  projectId: string;
  stats: {
    totalCards: number;
    newCards: number;
    learningCards: number;
    reviewCards: number;
    dueCards: number;
  };
}

// Create batch manager for project statistics
const projectStatsBatchProcessor: BatchProcessor<ProjectStatsInput, ProjectStatsOutput> = async (
  inputs
) => {
  try {
    // Make single API call for all project stats
    const response = await fetch('/api/projects/batch-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        projectIds: inputs.map(input => input.projectId)
      }),
    });

    if (!response.ok) {
      throw new Error(`Batch stats API failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Map results back to inputs
    const success: ProjectStatsOutput[] = [];
    const errors: { index: number; error: Error }[] = [];

    inputs.forEach((input, index) => {
      const project = data.projects?.find((p: { id: string; stats: unknown }) => p.id === input.projectId);
      
      if (project && project.stats) {
        success.push({
          projectId: input.projectId,
          stats: project.stats,
        });
      } else {
        errors.push({
          index,
          error: new Error(`Stats not found for project ${input.projectId}`),
        });
      }
    });

    return { success, errors };
    
  } catch (error) {
    // If API call fails entirely, mark all as errors
    const errors = inputs.map((_, index) => ({
      index,
      error: error instanceof Error ? error : new Error(String(error)),
    }));
    
    return { success: [], errors };
  }
};

const projectStatsBatchManager = new BatchManager(
  projectStatsBatchProcessor,
  {
    maxBatchSize: 50, // Reasonable limit for project stats
    debounceMs: 100, // Slightly longer debounce for stats
    maxWaitMs: 300, // Max wait for stats batching
  }
);

/**
 * Flashcard creation batch processor
 */
interface FlashcardInput {
  projectId: string;
  front: string;
  back: string;
  extra?: string;
}

interface FlashcardOutput {
  id: string;
  projectId: string;
  front: string;
  back: string;
  extra?: string;
  createdAt: string;
}

const flashcardBatchProcessor: BatchProcessor<FlashcardInput, FlashcardOutput> = async (
  inputs
) => {
  try {
    const response = await fetch('/api/flashcards/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flashcards: inputs }),
    });

    if (!response.ok) {
      throw new Error(`Batch flashcard creation failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: data.flashcards || [],
      errors: data.errors || [],
    };
    
  } catch (error) {
    const errors = inputs.map((_, index) => ({
      index,
      error: error instanceof Error ? error : new Error(String(error)),
    }));
    
    return { success: [], errors };
  }
};

const flashcardBatchManager = new BatchManager(
  flashcardBatchProcessor,
  {
    maxBatchSize: 100, // Higher limit for flashcard creation
    debounceMs: 50, // Quick batching for user interactions
    maxWaitMs: 200, // Fast response for UI
  }
);

/**
 * Public API for batch operations
 */
export const BatchAPI = {
  /**
   * Get project statistics (batched)
   */
  getProjectStats: async (projectId: string, userId: string): Promise<ProjectStatsOutput['stats']> => {
    const result = await projectStatsBatchManager.request({ projectId, userId });
    return result.stats;
  },

  /**
   * Create flashcard (batched)
   */
  createFlashcard: async (flashcard: FlashcardInput): Promise<FlashcardOutput> => {
    return await flashcardBatchManager.request(flashcard);
  },

  /**
   * Get batch manager statistics (for monitoring)
   */
  getStats: () => ({
    projectStatsQueue: projectStatsBatchManager.getQueueSize(),
    flashcardQueue: flashcardBatchManager.getQueueSize(),
  }),

  /**
   * Clear all batch queues (for cleanup)
   */
  clearAll: () => {
    projectStatsBatchManager.clear();
    flashcardBatchManager.clear();
  },
};

/**
 * React hook for batch API utilities
 */
export const useBatchAPI = () => {
  return {
    ...BatchAPI,
    
    // Reactive stats (could be enhanced with zustand subscription)
    stats: BatchAPI.getStats(),
  };
};

/**
 * Batch operation helper for generic use cases
 */
export function createBatchManager<TInput, TOutput>(
  processor: BatchProcessor<TInput, TOutput>,
  options?: BatchOptions
): BatchManager<TInput, TOutput> {
  return new BatchManager(processor, options);
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    BatchAPI.clearAll();
  });
  
  // Make batch utilities available in development
  if (process.env.NODE_ENV === 'development') {
    (window as Window & { cognifyBatch?: unknown }).cognifyBatch = {
      api: BatchAPI,
      stats: BatchAPI.getStats,
    };
  }
}

export { BatchManager };
export type { BatchOptions, BatchProcessor, BatchResult };