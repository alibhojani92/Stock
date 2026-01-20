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
  const msg = update.message;
  const cb = update.callback_query;

  // ✅ ACK callback (must)
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

  /* ---------- CORE ---------- */

  switch (command) {
    case "/start":
      await send(
        env,
        chatId,
        "Welcome 👋\nUse buttons or commands below.",
        getKeyboard()
      );
      break;

    case "/help":
      await send(env, chatId, "Use buttons or commands.", getKeyboard());
      break;

    case "/start_attempt":
      await L.startAttempt(env, chatId, userId);
      break;

    case "/stop_attempt":
      await L.stopAttempt(env, chatId, userId);
      break;

    case "/withdraw":
      await L.withdrawStart(env, chatId, userId);
      break;

    case "/balance":
      await L.balance(env, chatId, userId);
      break;

    case "/today":
      await R.todayReport(env, chatId, userId);
      break;

    case "/weekly":
      await R.weeklyReport(env, chatId, userId);
      break;

    case "/monthly":
      await R.monthlyReport(env, chatId, userId);
      break;

    default:
      // 👇 number input LAST
      if (/^\d+$/.test(command)) {
        await L.handleAmount(env, chatId, userId, Number(command));
      } else {
        await send(env, chatId, "❓ Unknown command. Use /help");
      }
  }
}
