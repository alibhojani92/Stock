import {
  getTodayAttemptCount,
  insertAttempt,
  sumEarnings,
  insertWithdrawal,
  sumWithdrawals,
  setSession,
  getSession,
  clearSession
} from "./queries";

const MAX_ATTEMPTS = 8;

/* ================= HELPERS ================= */

function today() {
  return new Date().toISOString().slice(0, 10);
}

// IST time WITHOUT seconds
function formatIST(time) {
  return new Date(time).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

const MOTIVATION = [
  "🔥 Great start! Consistency beats motivation every time 💪",
  "📈 Small progress daily creates massive results!",
  "🚀 You showed up today, that’s what matters!",
  "💎 Discipline today = Freedom tomorrow",
  "🧠 Compounding is silent but powerful, keep going!",
  "👏 One attempt closer to your big goal!",
  "⚡ Focus. Execute. Repeat.",
  "🌱 Small actions daily grow into big success"
];

const PRAISE = [
  "👏 Well done! Another brick added to your future 🧱",
  "🔥 Excellent! Keep the streak alive!",
  "💰 Income grows when discipline stays!",
  "🚀 Proud of you! Most people quit early, you didn’t.",
  "📊 This is how compounding works — step by step!",
  "💪 Strong work! Stay consistent."
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function send(env, chatId, text) {
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

/* ================= START ATTEMPT ================= */

export async function startAttempt(env, chatId, userId) {
  const start = Date.now();
  await setSession(env, userId, start);

  await send(
    env,
    chatId,
    `⏱ Attempt Started
Start Time: ${formatIST(start)}

${pick(MOTIVATION)}`
  );
}

/* ================= STOP ATTEMPT ================= */

export async function stopAttempt(env, chatId, userId) {
  const session = await getSession(env, userId);

  if (!session) {
    await send(env, chatId, "⚠️ No active attempt found.");
    return;
  }

  const start = session.start_time;
  const stop = Date.now();

  const diff = stop - start;
  const minutes = Math.floor(diff / (1000 * 60));
  const hr = Math.floor(minutes / 60);
  const min = minutes % 60;

  const total =
    hr.toString().padStart(2, "0") +
    ":" +
    min.toString().padStart(2, "0");

  await clearSession(env, userId);

  await send(
    env,
    chatId,
    `⏹ Attempt Stopped
Start Time: ${formatIST(start)}
Stop Time: ${formatIST(stop)}
⏳ Total Time: ${total}`
  );

  // motivation after stop
  await send(env, chatId, pick(PRAISE));

  // ask amount
  await send(env, chatId, "✍️ Enter earned amount");
}

/* ================= WITHDRAW ================= */

export async function withdrawStart(env, chatId) {
  await send(env, chatId, "✍️ Enter withdrawal amount");
}

/* ================= HANDLE NUMBER INPUT ================= */

export async function handleAmount(env, chatId, userId, amount) {
  const date = today();

  const earned = await sumEarnings(env, userId);
  const withdrawn = await sumWithdrawals(env, userId);
  const balance = earned - withdrawn;

  // withdrawal
  if (amount <= balance) {
    await insertWithdrawal(env, userId, date, amount);
    await send(
      env,
      chatId,
      `💸 Withdrawn ₹${amount}
Balance ₹${balance - amount}`
    );
    return;
  }

  // earning (daily limit check)
  const count = await getTodayAttemptCount(env, userId, date);
  if (count >= MAX_ATTEMPTS) {
    await send(
      env,
      chatId,
      "⚠️ Daily limit reached\nMaximum 8 attempts per day 💪"
    );
    return;
  }

  await insertAttempt(env, userId, date, count + 1, amount);

  await send(
    env,
    chatId,
    `✅ Attempt #${count + 1} completed
💰 Earned ₹${amount}

${pick(PRAISE)}`
  );
}

/* ================= BALANCE ================= */

export async function balance(env, chatId, userId) {
  const earned = await sumEarnings(env, userId);
  const withdrawn = await sumWithdrawals(env, userId);

  await send(
    env,
    chatId,
    `💼 Wallet
Earned ₹${earned}
Withdrawn ₹${withdrawn}
━━━━━━━━━━
₹${earned - withdrawn}`
  );
}
