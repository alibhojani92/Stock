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
function formatIST(time) {
  return new Date(time).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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

/* ---------- START ATTEMPT ---------- */


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
import { setSession } from "./queries";

export async function startAttempt(env, chatId, userId) {
  const start = Date.now();
  await setSession(env, userId, start);

  const time = formatIST(start);
  await send(env, chatId, `⏱ Attempt Started\nStart Time: ${time}`);
    }
import { getSession, clearSession } from "./queries";

export async function stopAttempt(env, chatId, userId) {
  const session = await getSession(env, userId);

  if (!session) {
    await send(env, chatId, "⚠️ No active attempt found.");
    return;
  }

  const start = session.start_time;
  const stop = Date.now();

  const diff = stop - start;
  const sec = Math.floor(diff / 1000) % 60;
  const min = Math.floor(diff / (1000 * 60)) % 60;
  const hr = Math.floor(diff / (1000 * 60 * 60));

  const total =
    `${hr.toString().padStart(2, "0")}:` +
    `${min.toString().padStart(2, "0")}:` +
    `${sec.toString().padStart(2, "0")}`;

  await clearSession(env, userId);

  // 1️⃣ Time summary
  await send(
    env,
    chatId,
    `⏹ Attempt Stopped
Start Time: ${formatIST(start)}
Stop Time: ${formatIST(stop)}
⏳ Total Time: ${total}`
  );

  // 2️⃣ Ask amount (THIS WAS MISSING)
  await send(env, chatId, "✍️ Enter earned amount");
}
