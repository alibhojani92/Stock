import {
  replyKeyboard,
  profitLossKeyboard,
  reportInlineKeyboard,
  adminKeyboard
} from "./keyboard";
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

    // ACK callback instantly
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

    /* ================= START / HELP ================= */

    if (text === "/start") {
      await send(
        env,
        chatId,
        `👋 Welcome, ${firstName}!

🚀 Compounding Tracking Bot 📈
Discipline today → Wealth tomorrow 💎`,
        replyKeyboard()
      );
      return;
    }

    if (text === "/help" || text === "🆘 Help") {
      await send(
        env,
        chatId,
        "🆘 Use the buttons below to control the bot.",
        replyKeyboard()
      );
      return;
    }

    /* ================= REPLY KEYBOARD MAPPING ================= */
    // Arrow keyboard sends plain text, map it to commands

    if (text === "▶️ Start Attempt") {
      await L.startAttempt(env, chatId, userId);
      return;
    }

    if (text === "⏹ Stop Attempt") {
      await L.stopAttempt(env, chatId, userId);
      await send(
        env,
        chatId,
        "🟢 Select PROFIT or 🔴 LOSS",
        profitLossKeyboard()
      );
      return;
    }

    if (text === "💰 Balance") {
      await L.balance(env, chatId, userId);
      return;
    }

    if (text === "💸 Withdraw") {
      await L.withdrawStart(env, chatId, userId);
      return;
    }

    if (text === "📊 Reports") {
      await send(
        env,
        chatId,
        "📊 Select report type:",
        reportInlineKeyboard()
      );
      return;
    }

    /* ================= INLINE CALLBACKS ================= */

    if (text === "RESULT_PROFIT") {
      await L.selectResult(env, chatId, userId, "PROFIT");
      return;
    }

    if (text === "RESULT_LOSS") {
      await L.selectResult(env, chatId, userId, "LOSS");
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

    /* ================= ADMIN ================= */

    const ADMIN_ID = env.ADMIN_ID;

    if (text === "/admin" && String(userId) === String(ADMIN_ID)) {
      await send(env, chatId, "🔐 Admin Panel", adminKeyboard());
      return;
    }

    if (text === "/admin_users" && String(userId) === String(ADMIN_ID)) {
      await L.adminUsers(env, chatId);
      return;
    }

    if (text === "/admin_summary" && String(userId) === String(ADMIN_ID)) {
      await L.adminSummary(env, chatId, userId);
      return;
    }

    /* ================= NUMBER INPUT ================= */

    if (/^\d+$/.test(text)) {
      await L.handleAmount(env, chatId, userId, Number(text));
      return;
    }

    await send(env, chatId, "❓ Unknown input. Use the buttons below.", replyKeyboard());
  } catch (err) {
    console.error("BOT ERROR:", err);
  }
                            }
