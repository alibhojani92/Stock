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

function formatIST(time) {
  return new Date(time).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

const MOTIVATION = [
  "🔥 Consistency today = freedom tomorrow",
  "💎 Discipline is the real compounding",
  "🚀 You showed up — that’s power",
  "📈 Small steps daily, big future",
  "💪 Stay focused, stay consistent"
];

const PRAISE = [
  "👏 Well done! Keep compounding",
  "🔥 Strong discipline!",
  "🚀 Proud of your consistency",
  "📊 This is how growth works",
  "💪 One step closer to your goal"
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

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

  // 🔥 Motivation + Profit/Loss instruction (NO amount here)
  await send(
    env,
    chatId,
    `⏹ Attempt Stopped
Start Time: ${formatIST(start)}
Stop Time: ${formatIST(stop)}
⏳ Total Time: ${total}

${pick(PRAISE)}

🟢 Select PROFIT or 🔴 LOSS from buttons below`
  );
}

/* ================= WITHDRAW ================= */

export async function withdrawStart(env, chatId) {
  await send(env, chatId, "✍️ Enter withdrawal amount");
}

/* ================= HANDLE NUMBER INPUT ================= */

export async function handleAmount(env, chatId, userId, amount, type = "PROFIT") {
  const date = today();

  // PROFIT / LOSS handling
  const signedAmount = type === "LOSS" ? -amount : amount;

  const count = await getTodayAttemptCount(env, userId, date);
  if (count >= MAX_ATTEMPTS) {
    await send(
      env,
      chatId,
      "⚠️ Daily limit reached\nMaximum 8 attempts per day 💪"
    );
    return;
  }

  await insertAttempt(env, userId, date, count + 1, signedAmount);

  await send(
    env,
    chatId,
    `✅ Attempt #${count + 1} completed
${type === "LOSS" ? "📉 Loss" : "📈 Profit"}: ₹${amount}

${pick(PRAISE)}`
  );
}

/* ================= BALANCE / PROFILE ================= */

export async function balance(env, chatId, userId) {
  const net = await sumEarnings(env, userId);
  const withdrawn = await sumWithdrawals(env, userId);

  const profit = net > 0 ? net : 0;
  const loss = net < 0 ? Math.abs(net) : 0;
  const finalBalance = net - withdrawn;

  await send(
    env,
    chatId,
    `👤 Profile Summary

📈 Profit: ₹${profit}
📉 Loss: ₹${loss}
💸 Withdrawn: ₹${withdrawn}
━━━━━━━━━━━━
💼 Balance: ₹${finalBalance}`
  );
  }
