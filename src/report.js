import {
  earningsByDate,
  sumWithdrawals,
  getBaseAmount
} from "./queries";

/* ---------------- HELPERS ---------------- */

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function splitProfitLoss(rows) {
  let profit = 0;
  let loss = 0;

  for (const r of rows) {
    if (r.total > 0) profit += r.total;
    if (r.total < 0) loss += Math.abs(r.total);
  }

  return { profit, loss };
}

/* ---------------- TODAY REPORT ---------------- */

export async function todayReport(env, chatId, userId) {
  const date = today();
  const rows = await earningsByDate(env, userId, date);

  const base = await getBaseAmount(env, userId);
  const withdrawn = await sumWithdrawals(env, userId, date);

  const { profit, loss } = splitProfitLoss(rows);
  const net = base + profit - loss - withdrawn;

  return send(
    env,
    chatId,
    `📅 Today Report (${date})

💰 Base: ₹${base}
📈 Profit: ₹${profit}
📉 Loss: ₹${loss}
💸 Withdrawn: ₹${withdrawn}
━━━━━━━━━━━━━━
💼 Net Balance: ₹${net}`
  );
}

/* ---------------- WEEKLY REPORT ---------------- */

export async function weeklyReport(env, chatId, userId) {
  const fromDate = daysAgo(6);
  const rows = await earningsByDate(env, userId, fromDate);

  if (!rows.length) {
    return send(env, chatId, "📆 Weekly Report\n\nNo data available.");
  }

  const base = await getBaseAmount(env, userId);
  const withdrawn = await sumWithdrawals(env, userId);

  let text = "📆 Weekly Report\n\n";
  let grouped = {};

  for (const r of rows) {
    if (!grouped[r.date]) grouped[r.date] = [];
    grouped[r.date].push(r);
  }

  let totalProfit = 0;
  let totalLoss = 0;

  for (const date in grouped) {
    const { profit, loss } = splitProfitLoss(grouped[date]);
    totalProfit += profit;
    totalLoss += loss;

    text += `📅 ${date}\n`;
    text += `  📈 Profit: ₹${profit}\n`;
    text += `  📉 Loss: ₹${loss}\n\n`;
  }

  const net = base + totalProfit - totalLoss - withdrawn;

  text += `━━━━━━━━━━━━━━\n`;
  text += `💰 Base: ₹${base}\n`;
  text += `📈 Total Profit: ₹${totalProfit}\n`;
  text += `📉 Total Loss: ₹${totalLoss}\n`;
  text += `💸 Withdrawn: ₹${withdrawn}\n`;
  text += `💼 Net Balance: ₹${net}`;

  return send(env, chatId, text);
}

/* ---------------- MONTHLY REPORT ---------------- */

export async function monthlyReport(env, chatId, userId) {
  const fromDate = daysAgo(29);
  const rows = await earningsByDate(env, userId, fromDate);

  if (!rows.length) {
    return send(env, chatId, "🗓 Monthly Report\n\nNo data available.");
  }

  const base = await getBaseAmount(env, userId);
  const withdrawn = await sumWithdrawals(env, userId);

  let grouped = {};
  for (const r of rows) {
    if (!grouped[r.date]) grouped[r.date] = [];
    grouped[r.date].push(r);
  }

  let totalProfit = 0;
  let totalLoss = 0;

  for (const date in grouped) {
    const { profit, loss } = splitProfitLoss(grouped[date]);
    totalProfit += profit;
    totalLoss += loss;
  }

  const net = base + totalProfit - totalLoss - withdrawn;

  return send(
    env,
    chatId,
    `🗓 Monthly Report

📅 Active Days: ${Object.keys(grouped).length}
💰 Base: ₹${base}
📈 Total Profit: ₹${totalProfit}
📉 Total Loss: ₹${totalLoss}
💸 Withdrawn: ₹${withdrawn}
━━━━━━━━━━━━━━
💼 Net Balance: ₹${net}`
  );
}

/* ---------------- SEND HELPER ---------------- */

async function send(env, chatId, text) {
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
}
