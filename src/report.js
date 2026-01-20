import {
  sumEarnings,
  sumWithdrawals,
  earningsByDate
} from "./queries";

/* ---------------- HELPERS ---------------- */

function today() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/* ---------------- TODAY REPORT ---------------- */

export async function todayReport(env, chatId, userId) {
  const date = today();

  const earned = await sumEarnings(env, userId, date);
  const withdrawn = await sumWithdrawals(env, userId, date);
  const balance = earned - withdrawn;

  return send(
    env,
    chatId,
    `📅 Today Report (${date})

💰 Earned Today: ₹${earned}
💸 Withdrawn Today: ₹${withdrawn}
━━━━━━━━━━━━━━
✅ Balance Today: ₹${balance}`
  );
}

/* ---------------- WEEKLY REPORT ---------------- */

export async function weeklyReport(env, chatId, userId) {
  const fromDate = daysAgo(6); // last 7 days including today
  const rows = await earningsByDate(env, userId, fromDate);

  if (!rows.length) {
    return send(env, chatId, "📆 Weekly Report\n\nNo data available.");
  }

  let text = "📆 Weekly Report\n\n";
  let total = 0;

  for (const r of rows) {
    text += `${r.date} → ₹${r.total}\n`;
    total += r.total;
  }

  text += `\n💰 Total: ₹${total}`;

  return send(env, chatId, text);
}

/* ---------------- MONTHLY REPORT ---------------- */

export async function monthlyReport(env, chatId, userId) {
  const fromDate = daysAgo(29); // last 30 days
  const rows = await earningsByDate(env, userId, fromDate);

  if (!rows.length) {
    return send(env, chatId, "🗓 Monthly Report\n\nNo data available.");
  }

  let total = 0;
  let days = new Set();

  for (const r of rows) {
    total += r.total;
    days.add(r.date);
  }

  return send(
    env,
    chatId,
    `🗓 Monthly Report

📅 Active Days: ${days.size}
💰 Total Earned: ₹${total}`
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
