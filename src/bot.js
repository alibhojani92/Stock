import {
  replyKeyboard,
  profitLossKeyboard,
  reportInlineKeyboard,
  resetConfirmKeyboard,
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

    if (text === "/start") {
      await send(
        env,
        chatId,
        `👋 Welcome, ${firstName}!\n\n🚀 Compounding Tracking Bot 📈`,
        replyKeyboard()
      );
      return;
    }

    if (text === "/help" || text === "🆘 Help") {
      await send(env, chatId, "🆘 Use buttons below.", replyKeyboard());
      return;
    }

    if (text === "▶️ Start Attempt") {
      await L.startAttempt(env, chatId, userId);
      return;
    }

    if (text === "⏹ Stop Attempt") {
      await L.stopAttempt(env, chatId, userId, profitLossKeyboard());
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
      await send(env, chatId, "📊 Select report:", reportInlineKeyboard());
      return;
    }

    if (text === "🔄 Reset Base") {
      await send(
        env,
        chatId,
        "⚠️ This will reset everything. Are you sure?",
        resetConfirmKeyboard()
      );
      return;
    }

    if (text === "CONFIRM_RESET") {
      await L.confirmReset(env, chatId, userId);
      return;
    }

    if (text === "CANCEL_RESET") {
      await send(env, chatId, "❎ Reset cancelled.", replyKeyboard());
      return;
    }

    if (text === "RESULT_PROFIT") {
      await L.selectResult(env, chatId, userId, "PROFIT");
      return;
    }

    if (text === "RESULT_LOSS") {
      await L.selectResult(env, chatId, userId, "LOSS");
      return;
    }

    if (text === "/today") return R.todayReport(env, chatId, userId);
    if (text === "/weekly") return R.weeklyReport(env, chatId, userId);
    if (text === "/monthly") return R.monthlyReport(env, chatId, userId);
    if (text === "/base_history") return L.baseHistory(env, chatId, userId);
    if (text === "/capital_stats") return L.capitalStats(env, chatId, userId);

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

    if (/^\d+$/.test(text)) {
      await L.handleAmount(env, chatId, userId, Number(text));
      return;
    }

    await send(env, chatId, "❓ Unknown input.", replyKeyboard());
  } catch (err) {
    console.error("BOT ERROR:", err);
  }
  }
