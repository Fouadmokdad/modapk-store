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

  const includeImage = settings.telegramIncludeImage ?? true;
  let photoToSend = includeImage ? options.photoUrl : null;

  // Resolve relative URLs to absolute site URLs if needed
  if (photoToSend && photoToSend.startsWith("/")) {
    photoToSend = `${settings.siteUrl.replace(/\/+$/, "")}${photoToSend}`;
  }

  // If the image URL is not public (e.g. localhost), sendPhoto will fail.
  // We will try sendPhoto first, and if it fails, fallback to sendMessage.
  if (photoToSend && (photoToSend.startsWith("http://") || photoToSend.startsWith("https://"))) {
    try {
      console.log(`[TelegramService] Attempting to send photo post to chat: ${chatId}`);
      const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          photo: photoToSend,
          caption: options.text,
          parse_mode: "HTML",
          reply_markup: options.reply_markup,
          disable_notification: silent,
        }),
      });

      const json = await response.json();
      if (json.ok) {
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
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: options.text,
      parse_mode: "HTML",
      reply_markup: options.reply_markup,
      disable_notification: silent,
    }),
  });

  const json = await response.json();
  if (!json.ok) {
    throw new Error(json.description || "Failed to send message via Telegram Bot API");
  }

  // Handle post pinning as a bonus feature if enabled
  if (settings.telegramPinPost && json.result?.message_id) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/pinChatMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: json.result.message_id,
          disable_notification: true,
        }),
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

  const response = await fetch(`https://api.telegram.org/bot${cleanToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: testMessage,
      parse_mode: "HTML",
    }),
  });

  const json = await response.json();
  if (!json.ok) {
    throw new Error(json.description || "Failed to connect to Telegram chat");
  }

  return true;
}
