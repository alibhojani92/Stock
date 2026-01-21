import {
  getTodayAttemptCount,
  insertAttempt,
  sumEarnings,
  insertWithdrawal,
  sumWithdrawals
} from "./queries";

const MAX_ATTEMPTS = 8;

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function send(env, chatId, text) {
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

/* ---------- START ATTEMPT ---------- */
export async function startAttempt(env, chatId, userId) {
  const date = today();
  const count = await getTodayAttemptCount(env, userId, date);

  if (count >= MAX_ATTEMPTS) {
    await send(env, chatId, "⚠️ Daily limit reached (8)");
    return;
  }

  await send(env, chatId, `✅ Attempt #${count + 1} started`);
}

/* ---------- STOP ATTEMPT ---------- */
export async function stopAttempt(env, chatId) {
  await send(env, chatId, "✍️ Enter earned amount");
}

/* ---------- WITHDRAW ---------- */
export async function withdrawStart(env, chatId) {
  await send(env, chatId, "✍️ Enter withdrawal amount");
}

/* ---------- HANDLE NUMBER INPUT ---------- */
export async function handleAmount(env, chatId, userId, amount) {
  const date = today();

  const earned = await sumEarnings(env, userId);
  const withdrawn = await sumWithdrawals(env, userId);
  const balance = earned - withdrawn;

  // withdrawal
  if (amount <= balance) {
    await insertWithdrawal(env, userId, date, amount);
    await send(env, chatId, `💸 Withdrawn ₹${amount}\nBalance ₹${balance - amount}`);
    return;
  }

  // earning
  const count = await getTodayAttemptCount(env, userId, date);
  if (count >= MAX_ATTEMPTS) {
    await send(env, chatId, "⚠️ Daily limit reached");
    return;
  }

  await insertAttempt(env, userId, date, count + 1, amount);
  await send(env, chatId, `💰 Earned ₹${amount}`);
}

/* ---------- BALANCE ---------- */
export async function balance(env, chatId, userId) {
  const earned = await sumEarnings(env, userId);
  const withdrawn = await sumWithdrawals(env, userId);
  await send(
    env,
    chatId,
    `💼 Wallet\nEarned ₹${earned}\nWithdrawn ₹${withdrawn}\n━━━━━━\n₹${earned - withdrawn}`
  );
    }
