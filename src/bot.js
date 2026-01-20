import { getKeyboard } from "./keyboard";
import {
  startAttempt,
  stopAttempt,
  startWithdraw,
  handleWithdrawAmount,
  getBalance
} from "./logic";
import {
  todayReport,
  weeklyReport,
  monthlyReport
} from "./report";

export async function handleUpdate(update, env) {
  const message = update.message;
  const callback = update.callback_query;

  // 👉 Detect chat + user
  const chatId = message?.chat?.id || callback?.message?.chat?.id;
  const userId = message?.from?.id || callback?.from?.id;

  if (!chatId || !userId) {
    return new Response("No chat/user");
  }

  // 👉 Text command
  if (message?.text) {
    return await handleCommand(
      message.text.trim(),
      chatId,
      userId,
      env
    );
  }

  // 👉 Inline button (callback)
  if (callback?.data) {
    return await handleCommand(
      callback.data,
      chatId,
      userId,
      env,
      true
    );
  }

  return new Response("OK");
}

async function handleCommand(text, chatId, userId, env, isCallback = false) {
  switch (text) {

    case "/start":
      return sendMessage(env, chatId,
        "Welcome 👋\nUse buttons or commands to continue.",
        getKeyboard()
      );

    case "/help":
      return sendMessage(env, chatId, getHelpText());

    case "/start_attempt":
      return startAttempt(env, chatId, userId);

    case "/stop_attempt":
      return stopAttempt(env, chatId, userId);

    case "/withdraw":
      return startWithdraw(env, chatId, userId);

    case "/balance":
      return getBalance(env, chatId, userId);

    case "/today":
      return todayReport(env, chatId, userId);

    case "/weekly":
      return weeklyReport(env, chatId, userId);

    case "/monthly":
      return monthlyReport(env, chatId, userId);

    default:
      // If number input (amount)
      if (/^\d+$/.test(text)) {
        return handleWithdrawAmount(env, chatId, userId, Number(text));
      }

      return sendMessage(env, chatId, "❓ Unknown command. Type /help");
  }
}

/* ---------------- HELP TEXT ---------------- */

function getHelpText() {
  return `
🆘 Help – Available Commands

/start_attempt
Start a new attempt (Max 8 per day)

/stop_attempt
Stop current attempt and enter earned amount

/withdraw
Withdraw amount from balance

/balance
Check available balance

/today
Today report

/weekly
Weekly report

/monthly
Monthly report

/help
Show this help
`;
}

/* ---------------- SEND MESSAGE ---------------- */

async function sendMessage(env, chatId, text, replyMarkup = null) {
  const payload = {
    chat_id: chatId,
    text,
    reply_markup: replyMarkup
  };

  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return new Response("OK");
}
