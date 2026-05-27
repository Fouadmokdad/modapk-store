// =============================================================================
// Queue Module — Background Job Queue Manager (Redis & In-Memory Fallback)
// =============================================================================
import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";

// Global instances
let redisConnection: Redis | null = null;
let useRedis = false;

// In-Memory Fallback Queue State
interface InMemoryJob {
  id: string;
  name: string;
  data: any;
  status: "pending" | "active" | "completed" | "failed";
  error?: string;
}
const inMemoryQueue: InMemoryJob[] = [];
let isProcessingInMemory = false;

// Define job processing handlers
const jobHandlers: Record<string, (data: any) => Promise<any>> = {
  // Phase 12 & 18: Extraction queue
  extraction: async (data: { url: string }) => {
    const { importAppMetadataFromUrl } = await import("../importers");
    return importAppMetadataFromUrl(data.url);
  },
  // Phase 15: AI SEO generation queue
  seo: async (data: any) => {
    const { generateAISeoContent } = await import("../seo/seoGenerator");
    return generateAISeoContent(data);
  },
  // Phase 14: Mirror Health Check queue
  mirrorCheck: async () => {
    const { runMirrorHealthChecker } = await import("../cron/mirrorHealthCheck");
    return runMirrorHealthChecker();
  },
  // Phase 18: Update Crawler queue
  updateCrawler: async () => {
    const { runAutoUpdateCrawler } = await import("../cron/updateCrawler");
    return runAutoUpdateCrawler();
  },
  // Telegram Posting queue
  telegramPost: async (data: { logId: string }) => {
    const { processTelegramPost } = await import("../telegram/telegramQueue");
    return processTelegramPost(data.logId);
  },
};

/**
 * Initialize connection and setup queues
 */
export function initQueueEngine() {
  if (redisConnection) return;

  const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

  try {
    // Attempt Redis connection
    redisConnection = new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      connectTimeout: 2000, // Quick timeout to fallback fast
    });

    redisConnection.on("error", (err) => {
      console.warn("[QueueEngine] Redis connection error, falling back to In-Memory Queue:", err.message);
      useRedis = false;
      startInMemoryProcessor();
    });

    redisConnection.on("connect", () => {
      console.log("[QueueEngine] Connected to Redis successfully.");
      useRedis = true;
      setupRedisWorkers();
    });
  } catch (err) {
    console.warn("[QueueEngine] Failed to initialize Redis, using In-Memory fallback:", err);
    useRedis = false;
    startInMemoryProcessor();
  }
}

/**
 * Registers Redis-based Queue Workers
 */
function setupRedisWorkers() {
  if (!useRedis || !redisConnection) return;

  const queues = ["extractionQueue", "seoQueue", "mirrorCheckQueue", "updateCrawlerQueue", "telegramQueue"];

  queues.forEach((queueName) => {
    new Worker(
      queueName,
      async (job: Job) => {
        console.log(`[QueueEngine-Redis] Processing job ${job.id} (${job.name}) in ${queueName}`);
        const handler = jobHandlers[job.name];
        if (handler) {
          return await handler(job.data);
        }
        throw new Error(`No registered handler found for job name: ${job.name}`);
      },
      { connection: redisConnection as any }
    );
  });
}

/**
 * Processes in-memory tasks sequentially
 */
async function startInMemoryProcessor() {
  if (isProcessingInMemory) return;
  isProcessingInMemory = true;

  console.log("[QueueEngine-Memory] In-Memory Background Job Worker active.");

  while (!useRedis) {
    const nextJob = inMemoryQueue.find((j) => j.status === "pending");
    
    if (nextJob) {
      nextJob.status = "active";
      console.log(`[QueueEngine-Memory] Processing job ${nextJob.id} (${nextJob.name})`);

      try {
        const handler = jobHandlers[nextJob.name];
        if (handler) {
          await handler(nextJob.data);
          nextJob.status = "completed";
          console.log(`[QueueEngine-Memory] Job ${nextJob.id} completed successfully.`);
        } else {
          throw new Error(`Handler not found for: ${nextJob.name}`);
        }
      } catch (err: any) {
        nextJob.status = "failed";
        nextJob.error = err.message || String(err);
        console.error(`[QueueEngine-Memory] Job ${nextJob.id} failed:`, err);
      }
    } else {
      // Sleep for 2 seconds before checking queue again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  isProcessingInMemory = false;
}

/**
 * Pushes a background job to the active queue (Redis or In-Memory)
 */
export async function addJobToQueue(queueName: string, jobName: string, data: any): Promise<string> {
  // Ensure the engine is initialized
  initQueueEngine();

  if (useRedis && redisConnection) {
    try {
      const q = new Queue(queueName, { connection: redisConnection as any });
      const job = await q.add(jobName, data);
      return job.id || "redis-job";
    } catch (err) {
      console.warn("[QueueEngine] Failed to add job to Redis queue. Redirecting to memory:", err);
    }
  }

  // In-Memory fallback pushing
  const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  inMemoryQueue.push({
    id,
    name: jobName,
    data,
    status: "pending",
  });

  return id;
}

/**
 * Gets the current status list of all background jobs (Useful for admin monitor dashboard)
 */
export function getQueueStatusReport() {
  return {
    engineMode: useRedis ? "REDIS_ENTERPRISE" : "IN_MEMORY_FALLBACK",
    queueLength: inMemoryQueue.length,
    activeJobs: inMemoryQueue.filter(j => j.status === "active"),
    failedJobs: inMemoryQueue.filter(j => j.status === "failed"),
    completedJobsCount: inMemoryQueue.filter(j => j.status === "completed").length,
  };
}
