export async function handleUpdate(update, env) {
  const msg = update.message;
  const cb = update.callback_query;

  // ACK callback
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

  /* ---------- COMMANDS FIRST ---------- */

  if (text === "/start") {
    await send(env, chatId, "Welcome 👋", getKeyboard());
    return;
  }

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

  if (text === "/help") {
    await send(env, chatId, "Use buttons or commands", getKeyboard());
    return;
  }

  /* ---------- NUMBER INPUT LAST ---------- */

  if (/^\d+$/.test(text)) {
    await L.handleAmount(env, chatId, userId, Number(text));
    return;
  }

  // fallback
  await send(env, chatId, "❓ Unknown command. Use /help");
}
