import { getKeyboard, profitLossKeyboard } from "./keyboard";
import * as L from "./logic";
import * as R from "./report";

async function send(env, chatId, text, kb = null) {
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

    // ACK callback immediately
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
    const firstName =
      msg?.from?.first_name || cb?.from?.first_name || "Friend";

    if (!chatId || !userId || !text) return;

    /* ================= CORE ================= */

    if (text === "/start") {
      await send(
        env,
        chatId,
        `👋 Welcome, ${firstName}!

🚀 Welcome to Compounding Tracking Bot 📈
Build discipline. Let compounding do the rest 💎`,
        getKeyboard()
      );
      return;
    }

    if (text === "/help") {
      await send(env, chatId, "🆘 Use the buttons below.", getKeyboard());
      return;
    }

    /* ================= ATTEMPTS ================= */

    if (text === "/start_attempt") {
      await L.startAttempt(env, chatId, userId);
      return;
    }

    if (text === "/stop_attempt") {
      await L.stopAttempt(env, chatId, userId);

      // ✅ FIX: show PROFIT / LOSS buttons
      await send(
        env,
        chatId,
        "🟢 Select PROFIT or 🔴 LOSS",
        profitLossKeyboard()
      );
      return;
    }

    /* ================= PROFIT / LOSS BUTTON ================= */

    if (text === "RESULT_PROFIT") {
      await L.selectResult(env, chatId, userId, "PROFIT");
      return;
    }

    if (text === "RESULT_LOSS") {
      await L.selectResult(env, chatId, userId, "LOSS");
      return;
    }

    /* ================= WALLET ================= */

    if (text === "/withdraw") {
      await L.withdrawStart(env, chatId, userId);
      return;
    }

    if (text === "/balance") {
      await L.balance(env, chatId, userId);
      return;
    }

    /* ================= REPORTS ================= */

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

    /* ================= NUMBER INPUT (LAST) ================= */

    if (/^\d+$/.test(text)) {
      await L.handleAmount(env, chatId, userId, Number(text));
      return;
    }

    await send(env, chatId, "❓ Unknown command. Use /help");
  } catch (err) {
    console.error("BOT ERROR:", err);
  }
}
