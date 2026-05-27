// =============================================================================
// AI Retry & Fallback Engine — Production-Grade Resilience
// =============================================================================
import { logError } from "./error-utils";

export interface AIGenerationResult {
  success: boolean;
  shortDescription: { en: string; ar: string };
  fullDescription: { en: string; ar: string };
  source: "openai" | "gemini" | "local" | "cached";
}

// ---------------------------------------------------------------------------
// Exponential backoff retry wrapper
// ---------------------------------------------------------------------------
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // 429 = rate limited — use longer delay
      const isRateLimit = lastError.message.includes("429") || lastError.message.includes("rate limit");
      const delay = isRateLimit
        ? baseDelay * Math.pow(2, attempt) + 2000 // extra 2s for rate limits
        : baseDelay * Math.pow(2, attempt);

      if (attempt < retries - 1) {
        logError("AI_RETRY", `Attempt ${attempt + 1} failed, waiting ${delay}ms...`, { error: lastError.message });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error("All retry attempts failed");
}

// ---------------------------------------------------------------------------
// OpenAI API caller with retry
// ---------------------------------------------------------------------------
export async function callOpenAIWithRetry(
  prompt: string,
  apiKey: string
): Promise<{ shortDescription: { en: string; ar: string }; fullDescription: { en: string; ar: string } }> {
  return withRetry(async () => {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are a JSON-only generating assistant that returns app descriptions in bilingual formats.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || `OpenAI returned status ${response.status}`;
      throw new Error(`${response.status}: ${msg}`);
    }

    const data = await response.json();
    const contentStr = data?.choices?.[0]?.message?.content;
    if (!contentStr) {
      throw new Error("No content returned from AI");
    }

    const result = JSON.parse(contentStr);
    return {
      shortDescription: {
        en: cleanOutputString(result?.shortDescription?.en || ""),
        ar: cleanOutputString(result?.shortDescription?.ar || ""),
      },
      fullDescription: {
        en: cleanOutputString(result?.fullDescription?.en || ""),
        ar: cleanOutputString(result?.fullDescription?.ar || ""),
      },
    };
  }, 3, 1500);
}

// ---------------------------------------------------------------------------
// Gemini API caller (fallback provider)
// ---------------------------------------------------------------------------
export async function callGemini(
  prompt: string,
  apiKey: string
): Promise<{ shortDescription: { en: string; ar: string }; fullDescription: { en: string; ar: string } }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 4000,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini returned status ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!text) throw new Error("No content returned from Gemini");

  // Extract JSON from markdown code fences if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonStr = jsonMatch ? jsonMatch[1] : text;
  const parsed = JSON.parse(jsonStr);

  return {
    shortDescription: {
      en: cleanOutputString(parsed?.shortDescription?.en || ""),
      ar: cleanOutputString(parsed?.shortDescription?.ar || ""),
    },
    fullDescription: {
      en: cleanOutputString(parsed?.fullDescription?.en || ""),
      ar: cleanOutputString(parsed?.fullDescription?.ar || ""),
    },
  };
}

// ---------------------------------------------------------------------------
// Clean OpenAI output strings
// ---------------------------------------------------------------------------
export function cleanOutputString(str: string): string {
  if (!str) return "";
  return str
    .replace(/^```[a-zA-Z]*\n/g, "")
    .replace(/\n```$/g, "")
    .replace(/```/g, "")
    .trim();
}

// ---------------------------------------------------------------------------
// Local fallback generator (never fails, always returns content)
// ---------------------------------------------------------------------------
export function generateLocalFallback(
  appTitleEn: string,
  appTitleAr: string,
  relType: string,
  catName: string,
  features: string[],
  currentShortEn: string,
  currentShortAr: string,
  currentFullEn: string,
  currentFullAr: string,
  action: string
): { shortDescription: { en: string; ar: string }; fullDescription: { en: string; ar: string } } {
  const modFeaturesListEn = features.length > 0 ? features : ["Premium Unlocked", "No Ads", "Unlimited Resources"];
  const modFeaturesListAr = features.length > 0 ? features : ["بريميوم مفتوح", "بدون إعلانات", "موارد غير محدودة"];

  let rewrittenShortEn = currentShortEn;
  let rewrittenShortAr = currentShortAr;

  if (action === "rewrite" || action === "rewrite-short" || action === "meta-desc") {
    if (relType === "MOD") {
      rewrittenShortEn = `Download ${appTitleEn} MOD APK for Android to access premium unlocked features, ad-free usage, and exclusive ${modFeaturesListEn[0]} enhancements instantly.`;
      rewrittenShortAr = `تحميل ${appTitleAr} مهكر للأندرويد برابط مباشر للاستمتاع بكافة مميزات النسخة المدفوعة بدون إعلانات وبشكل مجاني بالكامل.`;
    } else if (relType === "BETA") {
      rewrittenShortEn = `Download ${appTitleEn} Beta APK for Android to test experimental updates, early access features, and upcoming options before the official release.`;
      rewrittenShortAr = `تحميل النسخة التجريبية ${appTitleAr} Beta للأندرويد لتجربة المزايا والخيارات المستقبلية قيد التطوير قبل الجميع.`;
    } else {
      rewrittenShortEn = `Download ${appTitleEn} official APK for Android with secure installation, official Play Store build parameters, and complete device safety.`;
      rewrittenShortAr = `تحميل ${appTitleAr} الأصلي للأندرويد بأحدث إصدار رسمي آمن وخالٍ من الفيروسات مباشرة من خوادم التنزيل السريعة.`;
    }
    if (rewrittenShortEn.length > 220) rewrittenShortEn = rewrittenShortEn.substring(0, 217) + "...";
    if (rewrittenShortAr.length > 220) rewrittenShortAr = rewrittenShortAr.substring(0, 217) + "...";
  }

  if (action === "meta-desc") {
    rewrittenShortEn = `Download ${appTitleEn} ${relType} APK. Premium features, ad-free, safe verified download.`;
    rewrittenShortAr = `تحميل ${appTitleAr} ${relType === "MOD" ? "مهكر" : "الأصلي"} بأحدث إصدار آمن ومفحوص.`;
  }

  return {
    shortDescription: { en: rewrittenShortEn || currentShortEn, ar: rewrittenShortAr || currentShortAr },
    fullDescription: { en: currentFullEn, ar: currentFullAr },
  };
}
