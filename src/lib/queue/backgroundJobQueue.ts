// =============================================================================
// Queue Module — Background Job Queue Manager (Redis & In-Memory Fallback)
// =============================================================================
import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";
import { logError, logWarn, logInfo } from "../error-utils";

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
      logWarn("QueueEngine", `Redis connection error, falling back to In-Memory Queue: ${err.message}`);
      useRedis = false;
      startInMemoryProcessor();
    });

    redisConnection.on("connect", () => {
      logInfo("QueueEngine", "Connected to Redis successfully.");
      useRedis = true;
      setupRedisWorkers();
    });
  } catch (err: any) {
    logWarn("QueueEngine", `Failed to initialize Redis, using In-Memory fallback: ${err.message || err}`);
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
        logInfo("QueueEngine-Redis", `Processing job ${job.id} (${job.name}) in ${queueName}`);
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

  logInfo("QueueEngine-Memory", "In-Memory Background Job Worker active.");

  while (!useRedis) {
    const nextJob = inMemoryQueue.find((j) => j.status === "pending");
    
    if (nextJob) {
      nextJob.status = "active";
      logInfo("QueueEngine-Memory", `Processing job ${nextJob.id} (${nextJob.name})`);

      try {
        const handler = jobHandlers[nextJob.name];
        if (handler) {
          await handler(nextJob.data);
          nextJob.status = "completed";
          logInfo("QueueEngine-Memory", `Job ${nextJob.id} completed successfully.`);
        } else {
          throw new Error(`Handler not found for: ${nextJob.name}`);
        }
      } catch (err: any) {
        nextJob.status = "failed";
        nextJob.error = err.message || String(err);
        logError("QueueEngine-Memory", err, { jobId: nextJob.id });
      } finally {
        // Clean up completed and failed history to keep memory bounded (keep max 100 finished jobs)
        const finishedCount = inMemoryQueue.filter((j) => j.status === "completed" || j.status === "failed").length;
        if (finishedCount > 100) {
          const firstFinishedIdx = inMemoryQueue.findIndex((j) => j.status === "completed" || j.status === "failed");
          if (firstFinishedIdx !== -1) {
            inMemoryQueue.splice(firstFinishedIdx, 1);
          }
        }
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
      logWarn("QueueEngine", "Failed to add job to Redis queue. Redirecting to memory:");
    }
  }

  // Deduplication for in-memory queue (prevent same job being queued twice)
  const isDuplicate = inMemoryQueue.some(
    (j) => j.status === "pending" && j.name === jobName && JSON.stringify(j.data) === JSON.stringify(data)
  );
  if (isDuplicate) {
    logInfo("QueueEngine-Memory", `Duplicate job ignored: ${jobName}`);
    return "duplicate-ignored";
  }

  // Cap in-memory queue length to prevent overflow (e.g. max 500 pending jobs)
  const pendingCount = inMemoryQueue.filter((j) => j.status === "pending").length;
  if (pendingCount >= 500) {
    logWarn("QueueEngine-Memory", `Queue limit reached. Rejecting job: ${jobName}`);
    throw new Error("Background queue is full. Please try again later.");
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
 * Gets the current status list of all background jobs
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

/**
 * Gets queue health and stats for admin monitor page
 */
export function getQueueHealth() {
  return {
    healthy: useRedis ? (redisConnection?.status === "ready" || redisConnection?.status === "connect") : true,
    mode: useRedis ? "REDIS" : "MEMORY",
    redisStatus: useRedis ? redisConnection?.status || "disconnected" : "n/a",
    waiting: inMemoryQueue.filter(j => j.status === "pending").length,
    active: inMemoryQueue.filter(j => j.status === "active").map(j => ({ id: j.id, name: j.name, data: j.data })),
    failed: inMemoryQueue.filter(j => j.status === "failed").map(j => ({ id: j.id, name: j.name, error: j.error })),
    completed: inMemoryQueue.filter(j => j.status === "completed").map(j => ({ id: j.id, name: j.name })),
  };
}
