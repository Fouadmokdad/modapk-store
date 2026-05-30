// =============================================================================
// Telegram Core Service — API Client & Connection Manager
// =============================================================================
import { decrypt } from "../encryption";
import { getSiteSettings } from "../settings";

interface SendTelegramOptions {
  text: string;
  photoUrl?: string | null;
  reply_markup?: any;
}

/**
 * Helper to fetch from Telegram Bot API with automatic 429 rate-limiting retry mechanism
 */
async function fetchTelegram(url: string, body: Record<string, any>, retries = 2): Promise<{ ok: boolean; json: any }> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await response.json().catch(() => ({ ok: false, description: "Invalid JSON response" }));

      if (response.status === 429 || json.error_code === 429) {
        const retryAfter = json.parameters?.retry_after || 5; // seconds
        console.warn(`[TelegramService] Rate limited (429). Retrying in ${retryAfter}s... (Attempt ${attempt + 1}/${retries + 1})`);
        
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
      }

      return { ok: response.ok && json.ok, json };
    } catch (err) {
      if (attempt < retries) {
        console.warn(`[TelegramService] Fetch error on attempt ${attempt + 1}, retrying in 2s...`, err);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }
      throw err;
    }
  }
  return { ok: false, json: { ok: false, description: "Failed after max rate limit retries" } };
}

/**
 * Sends a message or photo post to the configured Telegram Channel or Group
 */
export async function sendTelegramMessage(options: SendTelegramOptions) {
  const settings = await getSiteSettings();
  
  if (!settings.telegramEnabled || !settings.telegramBotToken || !settings.telegramChatId) {
    throw new Error("Telegram auto-posting is disabled or settings are incomplete.");
  }

  // Decrypt bot token
  const token = decrypt(settings.telegramBotToken);
  const chatId = settings.telegramChatId;
  const silent = settings.telegramSilentPost ?? false;

  // Asynchronously register the webhook to handle reaction callback queries
  if (settings.siteUrl) {
    registerTelegramWebhook(token, settings.siteUrl).catch((err) => {
      console.error("[TelegramService] registerTelegramWebhook background error:", err);
    });
  }

  const includeImage = settings.telegramIncludeImage ?? true;
  let photoToSend = includeImage ? options.photoUrl : null;

  // Resolve relative URLs to absolute site URLs if needed
  if (photoToSend && photoToSend.startsWith("/")) {
    const siteUrl = settings.siteUrl || "http://localhost:3000";
    photoToSend = `${String(siteUrl).replace(/\/+$/, "")}${photoToSend}`;
  }

  // If the image URL is not public (e.g. localhost), sendPhoto will fail.
  // We will try sendPhoto first, and if it fails, fallback to sendMessage.
  if (photoToSend && (photoToSend.startsWith("http://") || photoToSend.startsWith("https://"))) {
    try {
      console.log(`[TelegramService] Attempting to send photo post to chat: ${chatId}`);
      const { ok, json } = await fetchTelegram(`https://api.telegram.org/bot${token}/sendPhoto`, {
        chat_id: chatId,
        photo: photoToSend,
        caption: options.text,
        parse_mode: "HTML",
        reply_markup: options.reply_markup,
        disable_notification: silent,
      });

      if (ok) {
        return json;
      }
      
      console.warn(`[TelegramService] sendPhoto failed with response:`, json);
      console.warn(`[TelegramService] Falling back to sendMessage...`);
    } catch (err) {
      console.error(`[TelegramService] Error in sendPhoto request, falling back:`, err);
    }
  }

  // Fallback to standard Text Message
  console.log(`[TelegramService] Sending standard text message to chat: ${chatId}`);
  const { ok, json } = await fetchTelegram(`https://api.telegram.org/bot${token}/sendMessage`, {
    chat_id: chatId,
    text: options.text,
    parse_mode: "HTML",
    reply_markup: options.reply_markup,
    disable_notification: silent,
  });

  if (!ok) {
    throw new Error(json.description || "Failed to send message via Telegram Bot API");
  }

  // Handle post pinning as a bonus feature if enabled
  if (settings.telegramPinPost && json.result?.message_id) {
    try {
      await fetchTelegram(`https://api.telegram.org/bot${token}/pinChatMessage`, {
        chat_id: chatId,
        message_id: json.result.message_id,
        disable_notification: true,
      });
      console.log(`[TelegramService] Successfully pinned message: ${json.result.message_id}`);
    } catch (pinErr) {
      console.error("[TelegramService] Failed to pin message:", pinErr);
    }
  }

  return json;
}

/**
 * Tests connection to Telegram by sending a test message
 */
export async function testTelegramConnection(token: string, chatId: string): Promise<boolean> {
  if (!token || !chatId) {
    throw new Error("Bot Token and Chat ID are required for testing connection.");
  }

  // If token is masked (meaning it's loaded from DB and saved), decrypt it
  let cleanToken = token;
  if (token.startsWith("__MASKED__") || token.includes("•••")) {
    const settings = await getSiteSettings();
    if (settings.telegramBotToken) {
      cleanToken = decrypt(settings.telegramBotToken);
    } else {
      throw new Error("No saved bot token found to decrypt.");
    }
  }

  console.log(`[TelegramService] Testing connection for chat: ${chatId}`);
  const testMessage = `🔌 <b>MOD APK Store — Telegram Integration Test</b>\n\nConnection successful! Auto posting is active and ready to publish.`;

  const { ok, json } = await fetchTelegram(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
    chat_id: chatId,
    text: testMessage,
    parse_mode: "HTML",
  });

  if (!ok) {
    throw new Error(json.description || "Failed to connect to Telegram chat");
  }

  // Asynchronously register the webhook
  const settings = await getSiteSettings();
  if (settings.siteUrl) {
    registerTelegramWebhook(cleanToken, settings.siteUrl).catch((err) => {
      console.error("[TelegramService] registerTelegramWebhook test background error:", err);
    });
  }

  return true;
}

/**
 * Register the bot webhook with Telegram Bot API
 */
export async function registerTelegramWebhook(token: string, siteUrl: string) {
  if (!token || !siteUrl) return;
  const cleanUrl = String(siteUrl).replace(/\/+$/, "");
  const webhookUrl = `${cleanUrl}/api/telegram/webhook`;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl })
    });
    const json = await res.json();
    console.log(`[TelegramService] setWebhook registered at ${webhookUrl}:`, json);
  } catch (err) {
    console.error(`[TelegramService] Failed to set webhook:`, err);
  }
}
