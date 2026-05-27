// =============================================================================
// Telegram Posting Queue — Background Task Runner & Retry Handler
// =============================================================================
import { db } from "../db";
import { getSiteSettings } from "../settings";
import { 
  renderTelegramTemplate, 
  generateTelegramButtons, 
  DEFAULT_TEMPLATE_SETTINGS 
} from "./telegramTemplates";
import { sendTelegramMessage } from "./telegram.service";
import { addJobToQueue } from "../queue/backgroundJobQueue";

/**
 * Prepares and queues a Telegram post in the database (PENDING status)
 */
export async function queueTelegramPost(appId: string, versionId?: string) {
  let appName = `App ID: ${appId}`;
  let versionName: string | null = null;
  let text = "";
  let photoUrl: string | null = null;
  let reply_markup: any = null;
  let currentApp: any = null;

  try {
    const settings = await getSiteSettings();
    if (!settings.telegramEnabled) {
      console.log(`[TelegramQueue] Global auto-posting integration is disabled. Skipping.`);
      return null;
    }

    // Try fetching the app first to get a proper app name for logging if we fail later
    const app = await db.app.findUnique({
      where: { id: appId },
      include: {
        category: true,
        tags: { include: { tag: true } },
      },
    });

    if (!app) {
      const errMsg = `App not found for ID: ${appId}`;
      console.error(`[TelegramQueue] ${errMsg}`);
      
      // Since app doesn't exist, we log a general failure
      await db.telegramLog.create({
        data: {
          appId: null,
          appName: `Unknown App (ID: ${appId})`,
          versionName: null,
          status: "FAILED",
          retryCount: 0,
          errorDetails: errMsg,
        }
      });
      return null;
    }

    currentApp = app;
    appName = (app.title as any).en || app.slug;

    // Fetch specific or latest version
    let version = null;
    if (versionId) {
      version = await db.appVersion.findUnique({
        where: { id: versionId },
      });
    } else {
      version = await db.appVersion.findFirst({
        where: { appId },
        orderBy: { createdAt: "desc" },
      });
    }
    if (version) {
      versionName = version.versionName || null;
    }

    // Fetch Template Settings from DB
    let templateSettings = await db.telegramSettings.findUnique({
      where: { id: "global" },
    });

    if (!templateSettings) {
      try {
        templateSettings = await db.telegramSettings.create({
          data: {
            id: "global",
            ...DEFAULT_TEMPLATE_SETTINGS,
            categoryEmojis: DEFAULT_TEMPLATE_SETTINGS.categoryEmojis as any,
          },
        });
      } catch (createErr) {
        templateSettings = DEFAULT_TEMPLATE_SETTINGS as any;
      }
    }

    if (!templateSettings?.enabled) {
      const errMsg = `Telegram template posting is disabled in Telegram Settings.`;
      console.log(`[TelegramQueue] ${errMsg}`);
      await db.telegramLog.create({
        data: {
          appId: app.id,
          appName,
          versionName,
          status: "FAILED",
          retryCount: 0,
          errorDetails: errMsg,
        }
      });
      return null;
    }

    if (app.status !== "PUBLISHED") {
      const errMsg = `App "${appName}" is not published (Status: ${app.status}). Skipping post.`;
      console.log(`[TelegramQueue] ${errMsg}`);
      // If Telegram is enabled, create a log with status failed so admin knows why it wasn't sent
      await db.telegramLog.create({
        data: {
          appId: app.id,
          appName,
          versionName,
          status: "FAILED",
          retryCount: 0,
          errorDetails: errMsg,
        }
      });
      return null;
    }

    // Map DB fields into TelegramPostData
    const modFeaturesArray = app.modFeatures && Array.isArray(app.modFeatures)
      ? app.modFeatures.map((f: any) => f.en || f.ar || "")
      : [];

    const postData = {
      appName: app.slug,
      appTitleEn: (app.title as any).en || "",
      appTitleAr: (app.title as any).ar || "",
      slug: app.slug,
      categoryNameEn: (app.category?.name as any)?.en || "",
      tags: app.tags.map((t) => (t.tag.name as any)?.en || ""),
      releaseType: app.releaseType,
      modFeatures: modFeaturesArray,
      versionName: version?.versionName || undefined,
      apkSize: version?.apkSize || version?.size || undefined,
      androidRequirement: version?.androidRequirement || version?.minAndroid || undefined,
      changelogEn: (version?.changelog as any)?.en || undefined,
      changelogAr: (version?.changelog as any)?.ar || undefined,
      developer: app.developer || undefined,
      downloadCount: app.downloadCount ?? 0,
      publishedAt: app.publishedAt || undefined,
    };

    // Format post text and reply buttons dynamically with try-catch
    try {
      text = renderTelegramTemplate(postData, templateSettings as any);
      reply_markup = generateTelegramButtons(app.slug, {
        ...templateSettings,
        siteUrl: settings.siteUrl,
      } as any);
    } catch (renderErr: any) {
      const errMsg = `Template rendering failed: ${renderErr.message}`;
      console.error(`[TelegramQueue] ${errMsg}`);
      await db.telegramLog.create({
        data: {
          appId: app.id,
          appName,
          versionName,
          status: "FAILED",
          retryCount: 0,
          errorDetails: errMsg,
        }
      });
      return null;
    }

    // Determine if photo should be attached
    photoUrl = settings.telegramIncludeImage
      ? (app.iconUrl || app.headerImageUrl || null)
      : null;

    // Save PENDING log in database
    const log = await db.telegramLog.create({
      data: {
        appId: app.id,
        appName,
        versionName,
        status: "PENDING",
        retryCount: 0,
        payload: {
          text,
          photoUrl,
          reply_markup,
        } as any,
      },
    });

    console.log(`[TelegramQueue] Queued dynamic template post for "${log.appName}" (Log ID: ${log.id})`);

    // Dispatch background job
    await addJobToQueue("telegramQueue", "telegramPost", { logId: log.id });

    return log.id;
  } catch (err: any) {
    console.error("[TelegramQueue] Failed to queue Telegram post:", err);
    try {
      await db.telegramLog.create({
        data: {
          appId: currentApp?.id || null,
          appName,
          versionName,
          status: "FAILED",
          retryCount: 0,
          errorDetails: err.message || String(err),
          payload: text ? ({ text, photoUrl, reply_markup } as any) : undefined,
        }
      });
    } catch (dbErr) {
      console.error("[TelegramQueue] Failed to create fail-log:", dbErr);
    }
    return null;
  }
}

/**
 * Background worker task handler that processes and sends the Telegram post with retries
 */
export async function processTelegramPost(logId: string) {
  console.log(`[TelegramQueue] Worker received task for Log ID: ${logId}`);
  
  const log = await db.telegramLog.findUnique({
    where: { id: logId },
  });

  if (!log) {
    console.error(`[TelegramQueue] TelegramLog not found for ID: ${logId}`);
    return;
  }

  if (log.status === "POSTED") {
    console.log(`[TelegramQueue] Post was already sent (Log ID: ${logId}). Skipping.`);
    return;
  }

  const payload = log.payload as any;
  if (!payload || !payload.text) {
    console.error(`[TelegramQueue] Empty payload text in Log ID: ${logId}`);
    await db.telegramLog.update({
      where: { id: logId },
      data: {
        status: "FAILED",
        errorDetails: "Empty message payload.",
      },
    });
    return;
  }

  let success = false;
  let lastError = "";
  let responseJson = null;
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Update retry count and status in DB
      await db.telegramLog.update({
        where: { id: logId },
        data: {
          retryCount: attempt + 1,
          status: "PENDING",
        },
      });

      console.log(`[TelegramQueue] Post attempt ${attempt + 1}/${maxRetries} for Log ID: ${logId}...`);
      
      const res = await sendTelegramMessage({
        text: payload.text,
        photoUrl: payload.photoUrl,
        reply_markup: payload.reply_markup,
      });

      success = true;
      responseJson = res;
      break;
    } catch (err: any) {
      lastError = err.message || String(err);
      console.warn(`[TelegramQueue] Attempt ${attempt + 1} failed: ${lastError}`);
      
      if (attempt < maxRetries - 1) {
        // Wait 5 seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  if (success) {
    console.log(`[TelegramQueue] Post sent successfully (Log ID: ${logId})`);
    await db.telegramLog.update({
      where: { id: logId },
      data: {
        status: "POSTED",
        telegramResponse: responseJson || {},
        errorDetails: null,
      },
    });
  } else {
    console.error(`[TelegramQueue] All posting attempts failed (Log ID: ${logId}). Error: ${lastError}`);
    await db.telegramLog.update({
      where: { id: logId },
      data: {
        status: "FAILED",
        errorDetails: lastError,
      },
    });
  }
}
