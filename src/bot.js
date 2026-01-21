import { getKeyboard } from "./keyboard";

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
  console.log("UPDATE RECEIVED");

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
  const text = msg?.text || cb?.data;

  if (!chatId || !text) return;

  if (text === "/start") {
    await send(env, chatId, "✅ BOT IS ALIVE", getKeyboard());
    return;
  }

  await send(env, chatId, "Echo: " + text);
}
