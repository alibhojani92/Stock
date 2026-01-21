export async function handleUpdate(update, env) {
  try {
    const msg = update.message;
    const cb = update.callback_query;

    // ACK callback (must)
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

    switch (command) {
      case "/start":
        await send(
          env,
          chatId,
          "Welcome 👋\nUse buttons or commands below.",
          getKeyboard()
        );
        return;

      case "/help":
        await send(env, chatId, "Use buttons or commands.", getKeyboard());
        return;

      case "/start_attempt":
        await L.startAttempt(env, chatId, userId);
        return;

      case "/stop_attempt":
        await L.stopAttempt(env, chatId, userId);
        return;

      case "/withdraw":
        await L.withdrawStart(env, chatId, userId);
        return;

      case "/balance":
        await L.balance(env, chatId, userId);
        return;

      case "/today":
        await R.todayReport(env, chatId, userId);
        return;

      case "/weekly":
        await R.weeklyReport(env, chatId, userId);
        return;

      case "/monthly":
        await R.monthlyReport(env, chatId, userId);
        return;

      default:
        if (/^\d+$/.test(command)) {
          await L.handleAmount(env, chatId, userId, Number(command));
          return;
        }
        await send(env, chatId, "❓ Unknown command. Use /help");
    }

  } catch (err) {
    // 🔥 THIS IS WHY EVERYTHING WAS FAILING
    console.error("BOT ERROR:", err);

    // optional: notify admin/user
    try {
      const chatId =
        update?.message?.chat?.id ||
        update?.callback_query?.message?.chat?.id;

      if (chatId) {
        await send(env, chatId, "⚠️ Internal error. Please try again.");
      }
    } catch {}
  }
}
