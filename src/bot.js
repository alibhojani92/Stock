import { getKeyboard } from "./keyboard";
import * as L from "./logic";
import * as R from "./report";

async function send(env, chatId, text, kb) {
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: kb || undefined
    })
  });
}

export async function handleUpdate(update, env) {
  try {
    const msg = update.message;
    const cb = update.callback_query;

    // ACK callback (MANDATORY)
    if (cb?.id) {
      await fetch(
        `https://api.telegram.org/bot${env.BOT_TOKEN}/answerCallbackQuery`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callback_query_id: cb.id })
        }
      );
    }

    const chatId = msg?.chat?.id || cb?.message?.chat?.id;
    const userId = msg?.from?.id || cb?.from?.id;
    const text = msg?.text || cb?.data;

    if (!chatId || !userId || !text) return;

    /* ---------- BASIC COMMANDS ---------- */

    if (text === "/start") {
      await send(
        env,
        chatId,
        "Welcome 👋\nUse buttons or commands below.",
        getKeyboard()
      );
      return;
    }

    if (text === "/help") {
      await send(env, chatId, "Use buttons or commands.", getKeyboard());
      return;
    }

    /* ---------- FEATURE COMMANDS ---------- */

    if (text === "/start_attempt") {
      await L.startAttempt(env, chatId, userId);
      return;
    }

    if (text === "/stop_attempt") {
      await L.stopAttempt(env, chatId, userId);
      return;
    }

    if (text === "/withdraw") {
      await L.withdrawStart(env, chatId, userId);
      return;
    }

    if (text === "/balance") {
      await L.balance(env, chatId, userId);
      return;
    }

    if (text === "/today") {
      await R.todayReport(env, chatId, userId);
      return;
    }

    if (text === "/weekly") {
      await R.weeklyReport(env, chatId, userId);
      return;
    }

    if (text === "/monthly") {
      await R.monthlyReport(env, chatId, userId);
      return;
    }

    /* ---------- NUMBER INPUT LAST ---------- */

    if (/^\d+$/.test(text)) {
      await L.handleAmount(env, chatId, userId, Number(text));
      return;
    }

    /* ---------- FALLBACK ---------- */

    await send(env, chatId, "❓ Unknown command. Type /help");

  } catch (err) {
    // 🔥 THIS WILL SAVE YOU
    console.error("BOT ERROR:", err);
  }
    }
