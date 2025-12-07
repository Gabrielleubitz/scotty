// Firestore utility functions with retry logic and rate limiting protection
import { 
  DocumentReference, 
  CollectionReference, 
  Query,
  QuerySnapshot,
  DocumentSnapshot,
  WriteBatch,
  Transaction
} from 'firebase/firestore';

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2
};

/**
 * Exponential backoff utility for retrying failed operations
 */
export class FirestoreRetryUtil {
  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static calculateDelay(attempt: number, options: Required<RetryOptions>): number {
    const delay = options.baseDelay * Math.pow(options.backoffMultiplier, attempt);
    return Math.min(delay, options.maxDelay);
  }

  private static isRetryableError(error: any): boolean {
    if (!error) return false;
    
    const code = error.code || error.status;
    const message = error.message || '';
    
    // Retry on rate limits, network issues, and temporary server errors
    return (
      code === 'resource-exhausted' || // Firestore rate limit
      code === 429 || // HTTP 429 Too Many Requests
      code === 'unavailable' || // Service temporarily unavailable
      code === 'deadline-exceeded' || // Request timeout
      code === 'internal' || // Internal server error
      code === 500 || // HTTP 500
      code === 502 || // HTTP 502 Bad Gateway
      code === 503 || // HTTP 503 Service Unavailable
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('rate limit')
    );
  }

  /**
   * Retry a Firestore operation with exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: any;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        console.warn(`Firestore operation failed (attempt ${attempt + 1}/${config.maxRetries + 1}):`, error);
        
        // Don't retry on the last attempt or non-retryable errors
        if (attempt === config.maxRetries || !this.isRetryableError(error)) {
          break;
        }
        
        const delay = this.calculateDelay(attempt, config);
        console.log(`Retrying in ${delay}ms...`);
        await this.delay(delay);
      }
    }
    
    throw lastError;
  }
}

/**
 * Rate limiting utility to prevent excessive Firestore operations
 */
export class FirestoreRateLimit {
  private static operationCounts = new Map<string, { count: number; resetTime: number }>();
  private static readonly WINDOW_SIZE = 60000; // 1 minute window
  private static readonly MAX_OPERATIONS_PER_MINUTE = 50; // Conservative limit

  static canPerformOperation(operationType: string): boolean {
    const now = Date.now();
    const key = operationType;
    const current = this.operationCounts.get(key);

    // Reset counter if window has passed
    if (!current || now >= current.resetTime) {
      this.operationCounts.set(key, { count: 1, resetTime: now + this.WINDOW_SIZE });
      return true;
    }

    // Check if under limit
    if (current.count < this.MAX_OPERATIONS_PER_MINUTE) {
      current.count++;
      return true;
    }

    console.warn(`Rate limit reached for ${operationType}. Try again in ${Math.ceil((current.resetTime - now) / 1000)} seconds.`);
    return false;
  }

  static recordOperation(operationType: string): void {
    const now = Date.now();
    const key = operationType;
    const current = this.operationCounts.get(key);

    if (!current || now >= current.resetTime) {
      this.operationCounts.set(key, { count: 1, resetTime: now + this.WINDOW_SIZE });
    } else {
      current.count++;
    }
  }
}

/**
 * Batched operations utility to reduce individual Firestore calls
 */
export class FirestoreBatchUtil {
  private static pendingViewIncrements = new Map<string, number>();
  private static batchTimeout: number | null = null;
  private static readonly BATCH_DELAY = 2000; // 2 seconds
  private static readonly MAX_BATCH_SIZE = 500; // Firestore batch limit
  private static incrementPostViewsFunction: ((postId: string, increment: number) => Promise<void>) | null = null;

  /**
   * Set the increment post views function to avoid circular dependency
   */
  static setIncrementPostViewsFunction(fn: (postId: string, increment: number) => Promise<void>): void {
    this.incrementPostViewsFunction = fn;
  }

  /**
   * Queue a view increment to be batched
   */
  static queueViewIncrement(postId: string, increment: number = 1): void {
    const current = this.pendingViewIncrements.get(postId) || 0;
    this.pendingViewIncrements.set(postId, current + increment);

    // Clear existing timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    // Set new timeout or process immediately if batch is full
    if (this.pendingViewIncrements.size >= this.MAX_BATCH_SIZE) {
      this.processBatch();
    } else {
      this.batchTimeout = setTimeout(() => this.processBatch(), this.BATCH_DELAY);
    }
  }

  /**
   * Process the batched view increments
   */
  private static async processBatch(): Promise<void> {
    if (this.pendingViewIncrements.size === 0) return;
    if (!this.incrementPostViewsFunction) {
      console.error('incrementPostViewsFunction not set in FirestoreBatchUtil');
      return;
    }

    const batch = new Map(this.pendingViewIncrements);
    this.pendingViewIncrements.clear();

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    try {
      console.log(`Processing batched view increments for ${batch.size} posts`);
      
      // Process in smaller chunks to avoid overwhelming Firestore
      const entries = Array.from(batch.entries());
      const chunkSize = 10;
      
      for (let i = 0; i < entries.length; i += chunkSize) {
        const chunk = entries.slice(i, i + chunkSize);
        
        await Promise.allSettled(
          chunk.map(async ([postId, increment]) => {
            try {
              await FirestoreRetryUtil.withRetry(async () => {
                await this.incrementPostViewsFunction!(postId, increment);
              });
            } catch (error) {
              console.error(`Failed to increment views for post ${postId}:`, error);
            }
          })
        );
        
        // Small delay between chunks
        if (i + chunkSize < entries.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Successfully processed ${batch.size} view increments`);
    } catch (error) {
      console.error('Failed to process batched view increments:', error);
      
      // Re-queue failed operations
      batch.forEach((increment, postId) => {
        const current = this.pendingViewIncrements.get(postId) || 0;
        this.pendingViewIncrements.set(postId, current + increment);
      });
    }
  }

  /**
   * Force process any pending batches (useful for cleanup)
   */
  static async flushPendingOperations(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    await this.processBatch();
  }

}