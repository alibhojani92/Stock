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
      reply_markup: kb
    })
  });
}

export async function handleUpdate(update, env) {
  try {
    const msg = update.message;
    const cb = update.callback_query;

    // ACK inline button
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
    const command = msg?.text || cb?.data;

    if (!chatId || !userId || !command) return;

    /* -------- CORE COMMANDS -------- */

    if (command === "/start") {
      await send(
        env,
        chatId,
        "Welcome 👋\nUse buttons or commands below.",
        getKeyboard()
      );
      return;
    }

    if (command === "/help") {
      await send(env, chatId, "Use buttons or commands.", getKeyboard());
      return;
    }

    /* -------- FEATURE COMMANDS -------- */

    if (command === "/start_attempt") {
      await L.startAttempt(env, chatId, userId);
      return;
    }

    if (command === "/stop_attempt") {
      await L.stopAttempt(env, chatId, userId);
      return;
    }

    if (command === "/withdraw") {
      await L.withdrawStart(env, chatId, userId);
      return;
    }

    if (command === "/balance") {
      await L.balance(env, chatId, userId);
      return;
    }

    if (command === "/today") {
      await R.todayReport(env, chatId, userId);
      return;
    }

    if (command === "/weekly") {
      await R.weeklyReport(env, chatId, userId);
      return;
    }

    if (command === "/monthly") {
      await R.monthlyReport(env, chatId, userId);
      return;
    }

    /* -------- NUMBER INPUT LAST -------- */

    if (/^\d+$/.test(command)) {
      await L.handleAmount(env, chatId, userId, Number(command));
      return;
    }

    await send(env, chatId, "❓ Unknown command. Use /help");

  } catch (err) {
    console.error("BOT ERROR:", err);
  }
                            }
