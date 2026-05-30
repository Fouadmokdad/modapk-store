// =============================================================================
// Telegram Bot Webhook API — Processes callback queries for custom reactions
// =============================================================================
import { NextRequest, NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/settings";
import { decrypt } from "@/lib/encryption";

export async function POST(request: NextRequest) {
  try {
    const update = await request.json().catch(() => null);
    if (!update) {
      return NextResponse.json({ ok: true });
    }

    console.log("[TelegramWebhook] Received update:", JSON.stringify(update));

    const callbackQuery = update.callback_query;
    if (!callbackQuery || !callbackQuery.data) {
      return NextResponse.json({ ok: true });
    }

    const data: string = callbackQuery.data;
    if (!data.startsWith("react:")) {
      return NextResponse.json({ ok: true });
    }

    const emoji = data.split(":")[1];
    const message = callbackQuery.message;
    if (!message || !message.reply_markup || !message.reply_markup.inline_keyboard) {
      return NextResponse.json({ ok: true });
    }

    // 1. Fetch site settings and decrypt token
    const settings = await getSiteSettings();
    if (!settings.telegramBotToken) {
      console.error("[TelegramWebhook] Bot token is missing in settings");
      return NextResponse.json({ ok: true });
    }
    const token = decrypt(settings.telegramBotToken);

    // 2. Clone and update keyboard reply markup
    const inlineKeyboard = JSON.parse(JSON.stringify(message.reply_markup.inline_keyboard));
    let buttonFound = false;

    for (let r = 0; r < inlineKeyboard.length; r++) {
      const row = inlineKeyboard[r];
      for (let c = 0; c < row.length; c++) {
        const btn = row[c];
        if (btn.callback_data === data) {
          buttonFound = true;
          const currentText = btn.text;
          const match = currentText.match(/\d+$/);
          let count = 0;
          if (match) {
            count = parseInt(match[0], 10);
          }
          count += 1;
          btn.text = `${emoji} ${count}`;
          break;
        }
      }
      if (buttonFound) break;
    }

    if (!buttonFound) {
      console.warn("[TelegramWebhook] Clicked reaction button not found in keyboard markup");
      return NextResponse.json({ ok: true });
    }

    // 3. Edit message reply markup to update reaction counts on Telegram
    const editMarkupRes = await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: message.chat.id,
        message_id: message.message_id,
        reply_markup: { inline_keyboard: inlineKeyboard }
      })
    });
    const editMarkupJson = await editMarkupRes.json();
    console.log("[TelegramWebhook] editMessageReplyMarkup response:", editMarkupJson);

    // 4. Answer the callback query to dismiss loading state in Telegram client
    const answerRes = await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQuery.id,
        text: `You reacted with ${emoji}!`
      })
    });
    const answerJson = await answerRes.json();
    console.log("[TelegramWebhook] answerCallbackQuery response:", answerJson);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[TelegramWebhook] Webhook endpoint error:", err);
    return NextResponse.json({ error: err.message || "Webhook error" }, { status: 500 });
  }
}
