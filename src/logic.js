import {
  getTodayAttemptCount,
  insertAttempt,
  sumProfit,
  sumLoss,
  insertWithdrawal,
  sumWithdrawals,
  setSession,
  getSession,
  clearSession,
  setTempState,
  getTempState,
  clearTempState,
  getBaseAmount,
  setBaseAmount,
  getAllUsers,
  getUserSummary
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

async function send(env, chatId, text) {
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}

/* ================= BASE AMOUNT ================= */

export async function ensureBaseAmount(env, chatId, userId) {
  const base = await getBaseAmount(env, userId);
  const profit = await sumProfit(env, userId);
  const loss = await sumLoss(env, userId);
  const withdrawn = await sumWithdrawals(env, userId);

  const balance = base + profit - loss - withdrawn;

  if (!base || balance <= 0) {
    await setTempState(env, userId, "SET_BASE");
    await send(
      env,
      chatId,
      "💰 Your balance is ₹0\nEnter new base amount to continue:"
    );
    return false;
  }
  return true;
}

/* ================= START ATTEMPT ================= */

export async function startAttempt(env, chatId, userId) {
  if (!(await ensureBaseAmount(env, chatId, userId))) return;

  // ✅ DUPLICATE ATTEMPT DETECTION
  const active = await getSession(env, userId);
  if (active) {
    await send(
      env,
      chatId,
      "⚠️ An attempt is already running.\nStop it before starting a new one."
    );
    return;
  }

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
  const mins = Math.floor(diff / 60000);
  const hr = Math.floor(mins / 60);
  const min = mins % 60;

  const total =
    hr.toString().padStart(2, "0") +
    ":" +
    min.toString().padStart(2, "0");

  await clearSession(env, userId);
  await setTempState(env, userId, "WAIT_RESULT");

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

/* ================= RESULT SELECTION ================= */

export async function selectResult(env, chatId, userId, type) {
  await setTempState(env, userId, type); // PROFIT / LOSS
  await send(
    env,
    chatId,
    `✍️ Enter ${type === "LOSS" ? "loss" : "profit"} amount`
  );
}

/* ================= WITHDRAW ================= */

export async function withdrawStart(env, chatId, userId) {
  if (!(await ensureBaseAmount(env, chatId, userId))) return;
  await setTempState(env, userId, "WITHDRAW");
  await send(env, chatId, "✍️ Enter withdrawal amount");
}

/* ================= HANDLE NUMBER INPUT ================= */

export async function handleAmount(env, chatId, userId, amount) {
  const state = await getTempState(env, userId);
  const date = today();

  /* ----- SET BASE (FIXED LOOP BUG) ----- */
  if (state === "SET_BASE") {
    await setBaseAmount(env, userId, amount);
    await clearTempState(env, userId); // ✅ VERY IMPORTANT
    await send(
      env,
      chatId,
      `✅ Base amount set to ₹${amount}\n🚀 You can start a new attempt now`
    );
    return;
  }

  /* ----- WITHDRAW ----- */
  if (state === "WITHDRAW") {
    const base = await getBaseAmount(env, userId);
    const profit = await sumProfit(env, userId);
    const loss = await sumLoss(env, userId);
    const withdrawn = await sumWithdrawals(env, userId);
    const balance = base + profit - loss - withdrawn;

    if (amount > balance) {
      await send(env, chatId, "❌ Insufficient balance");
      return;
    }

    await insertWithdrawal(env, userId, date, amount);
    await clearTempState(env, userId);

    await send(
      env,
      chatId,
      `💸 Withdraw Successful
Amount: ₹${amount}
Remaining Balance: ₹${balance - amount}`
    );
    return;
  }

  /* ----- PROFIT / LOSS ----- */
  if (state === "PROFIT" || state === "LOSS") {
    const count = await getTodayAttemptCount(env, userId, date);
    if (count >= MAX_ATTEMPTS) {
      await send(env, chatId, "⚠️ Daily limit reached (8 attempts max)");
      return;
    }

    const signedAmount = state === "LOSS" ? -amount : amount;
    await insertAttempt(env, userId, date, count + 1, signedAmount);
    await clearTempState(env, userId);

    await send(
      env,
      chatId,
      `✅ Attempt #${count + 1} recorded
${state === "LOSS" ? "📉 Loss" : "📈 Profit"}: ₹${amount}

${pick(PRAISE)}`
    );
    return;
  }

  await send(env, chatId, "⚠️ Unexpected input. Use buttons.");
}

/* ================= PROFILE / BALANCE ================= */

export async function balance(env, chatId, userId) {
  const base = await getBaseAmount(env, userId);
  const profit = await sumProfit(env, userId);
  const loss = await sumLoss(env, userId);
  const withdrawn = await sumWithdrawals(env, userId);

  const finalBalance = base + profit - loss - withdrawn;

  await send(
    env,
    chatId,
    `👤 Profile Summary

💰 Base: ₹${base}
📈 Total Profit: ₹${profit}
📉 Total Loss: ₹${loss}
💸 Withdrawn: ₹${withdrawn}
━━━━━━━━━━━━
💼 Balance: ₹${finalBalance}`
  );
}

/* ================= ADMIN ================= */

export async function adminUsers(env, chatId) {
  const users = await getAllUsers(env);
  let text = "👥 Users\n\n";
  users.forEach(u => (text += `• ${u.user_id}\n`));
  await send(env, chatId, text);
}

export async function adminSummary(env, chatId, userId) {
  const s = await getUserSummary(env, userId);
  await send(
    env,
    chatId,
    `📊 User Summary

💰 Base: ₹${s.base}
📈 Profit: ₹${s.profit}
📉 Loss: ₹${s.loss}
💸 Withdrawn: ₹${s.withdrawn}
━━━━━━━━━━━━
💼 Balance: ₹${s.balance}`
  );
}
