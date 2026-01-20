import {
  getTodayAttemptCount,
  insertAttempt,
  sumEarnings,
  insertWithdrawal,
  sumWithdrawals
} from "./queries";

const MAX_ATTEMPTS = 8;

/* ---------------- HELPERS ---------------- */

function today() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/* ---------------- START ATTEMPT ---------------- */

export async function startAttempt(env, chatId, userId) {
  const date = today();

  const count = await getTodayAttemptCount(env, userId, date);

  if (count >= MAX_ATTEMPTS) {
    return send(env, chatId,
      "⚠️ Daily Limit Reached\n\nYou have already completed 8 attempts today."
    );
  }

  return send(
    env,
    chatId,
    `✅ Attempt #${count + 1} started\n\n⏹ Press Stop when you finish`
  );
}

/* ---------------- STOP ATTEMPT ---------------- */

export async function stopAttempt(env, chatId, userId) {
  return send(
    env,
    chatId,
    "✍️ Enter earned amount\n(Example: 250)"
  );
}

/* ---------------- WITHDRAW START ---------------- */

export async function startWithdraw(env, chatId) {
  return send(
    env,
    chatId,
    "✍️ Enter withdrawal amount"
  );
}

/* ---------------- HANDLE AMOUNT INPUT ---------------- */

export async function handleWithdrawAmount(env, chatId, userId, amount) {
  const date = today();

  // Calculate balance
  const earned = await sumEarnings(env, userId);
  const withdrawn = await sumWithdrawals(env, userId);
  const balance = earned - withdrawn;

  // If amount <= balance → treat as withdrawal
  if (amount <= balance) {
    await insertWithdrawal(env, userId, date, amount);

    return send(
      env,
      chatId,
      `✅ Withdrawal Successful\n\n💸 Withdrawn: ₹${amount}\n💰 Remaining Balance: ₹${balance - amount}`
    );
  }

  // Otherwise treat as attempt earning
  const count = await getTodayAttemptCount(env, userId, date);

  if (count >= MAX_ATTEMPTS) {
    return send(env, chatId,
      "⚠️ Cannot add earning\nDaily limit reached"
    );
  }

  await insertAttempt(env, userId, date, count + 1, amount);

  return send(
    env,
    chatId,
    `✅ Attempt #${count + 1} completed\n\n💰 Earned: ₹${amount}`
  );
}

/* ---------------- BALANCE ---------------- */

export async function getBalance(env, chatId, userId) {
  const earned = await sumEarnings(env, userId);
  const withdrawn = await sumWithdrawals(env, userId);
  const balance = earned - withdrawn;

  return send(
    env,
    chatId,
    `💼 Wallet Summary\n\n💰 Total Earned: ₹${earned}\n💸 Total Withdrawn: ₹${withdrawn}\n━━━━━━━━━━━━━━\n✅ Current Balance: ₹${balance}`
  );
}

/* ---------------- SEND HELPER ---------------- */

async function send(env, chatId, text) {
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text
    })
  });

  return new Response("OK");
}
