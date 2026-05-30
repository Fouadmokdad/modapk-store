// =============================================================================
// AI Utilities — Retry, Rate Limiting, Caching, Multi-Provider
// =============================================================================
import { logError, logWarn, logInfo, cacheGet, cacheSet } from "./error-utils";

// ---------------------------------------------------------------------------
// Rate Limiter — per-admin cooldown tracking
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_COOLDOWN_MS = 3000;

export function checkRateLimit(adminKey: string): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const lastRequest = rateLimitMap.get(adminKey);
  if (lastRequest && now - lastRequest < RATE_LIMIT_COOLDOWN_MS) {
    return { allowed: false, retryAfterMs: RATE_LIMIT_COOLDOWN_MS - (now - lastRequest) };
  }
  rateLimitMap.set(adminKey, now);
  return { allowed: true, retryAfterMs: 0 };
}

// ---------------------------------------------------------------------------
// Exponential Backoff Retry
// ---------------------------------------------------------------------------
interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 15000,
  shouldRetry: (error: unknown) => {
    // Retry on network errors and 429/5xx status
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("429") || msg.includes("rate limit") || msg.includes("too many")) return true;
      if (msg.includes("500") || msg.includes("502") || msg.includes("503")) return true;
      if (msg.includes("network") || msg.includes("timeout") || msg.includes("econnrefused")) return true;
    }
    return false;
  },
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt >= opts.maxRetries) break;
      if (opts.shouldRetry && !opts.shouldRetry(error, attempt)) break;

      const delay = Math.min(
        opts.baseDelayMs * Math.pow(2, attempt) + Math.random() * 500,
        opts.maxDelayMs
      );

      logWarn("RetryBackoff", `Attempt ${attempt + 1} failed, retrying in ${Math.round(delay)}ms`, {
        error: error instanceof Error ? error.message : String(error),
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// OpenAI API Call with Retry + 429 Handling
// ---------------------------------------------------------------------------
interface OpenAICallOptions {
  apiKey: string;
  baseUrl?: string;
  extraHeaders?: Record<string, string>;
  model?: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: string };
}

export async function callOpenAI(options: OpenAICallOptions): Promise<string> {
  const {
    apiKey,
    baseUrl = "https://api.openai.com/v1/chat/completions",
    extraHeaders = {},
    model = "gpt-4o-mini",
    systemPrompt,
    userPrompt,
    temperature = 0.8,
    maxTokens = 4000,
    responseFormat,
  } = options;

  return retryWithBackoff(
    async () => {
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...extraHeaders,
        },
        body: JSON.stringify({
          model,
          ...(responseFormat ? { response_format: responseFormat } : {}),
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
        logWarn("OpenAI", `Rate limited (429). Retry-After: ${retryAfter || "not specified"}`);
        throw new Error(`429 Rate Limited. Retry after ${waitMs}ms`);
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const errMsg = (errData as Record<string, Record<string, string>>)?.error?.message 
          || `OpenAI returned status ${response.status}`;
        throw new Error(errMsg);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("No content returned from OpenAI");
      }

      return content;
    },
    {
      maxRetries: 2,
      baseDelayMs: 2000,
      maxDelayMs: 30000,
      shouldRetry: (error) => {
        if (error instanceof Error) {
          const msg = error.message;
          return msg.includes("429") || msg.includes("500") || msg.includes("502") ||
            msg.includes("503") || msg.includes("timeout") || msg.includes("network");
        }
        return false;
      },
    }
  );
}

// ---------------------------------------------------------------------------
// Cached AI Content Generation
// ---------------------------------------------------------------------------
const AI_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function generateCacheKey(params: Record<string, unknown>): string {
  return `ai:${JSON.stringify(params)}`;
}

export async function cachedAICall<T>(
  cacheKeyParams: Record<string, unknown>,
  generator: () => Promise<T>,
  fallback: T
): Promise<T> {
  const key = generateCacheKey(cacheKeyParams);

  // Check cache first
  const cached = cacheGet<T>(key);
  if (cached !== null) {
    logInfo("AI-Cache", `Cache hit for key: ${key.substring(0, 50)}...`);
    return cached;
  }

  try {
    const result = await generator();
    cacheSet(key, result, AI_CACHE_TTL_MS);
    return result;
  } catch (error) {
    logError("AI-Cache", error, { key: key.substring(0, 50) });
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Clean AI output — strips code fences and artifacts
// ---------------------------------------------------------------------------
export function cleanAIOutput(str: string): string {
  if (!str) return "";
  return str
    .replace(/^```[a-zA-Z]*\n/g, "")
    .replace(/\n```$/g, "")
    .replace(/```/g, "")
    .trim();
}
