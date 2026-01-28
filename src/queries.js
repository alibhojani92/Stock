import { getDB } from "./db";

/* ================= ATTEMPTS ================= */

export async function getTodayAttemptCount(env, userId, date) {
  const db = getDB(env);
  const res = await db
    .prepare(
      "SELECT COUNT(*) as count FROM attempts WHERE user_id = ? AND date = ?"
    )
    .bind(userId, date)
    .first();
  return res?.count || 0;
}

export async function insertAttempt(env, userId, date, attemptNo, amount) {
  const db = getDB(env);
  await db
    .prepare(
      `INSERT INTO attempts (user_id, date, attempt_no, amount)
       VALUES (?, ?, ?, ?)`
    )
    .bind(userId, date, attemptNo, amount)
    .run();
}

/* ================= PROFIT / LOSS ================= */

export async function sumProfit(env, userId, date = null) {
  const db = getDB(env);
  const q = date
    ? "SELECT SUM(amount) as total FROM attempts WHERE user_id=? AND amount>0 AND date=?"
    : "SELECT SUM(amount) as total FROM attempts WHERE user_id=? AND amount>0";
  const res = date
    ? await db.prepare(q).bind(userId, date).first()
    : await db.prepare(q).bind(userId).first();
  return res?.total || 0;
}

export async function sumLoss(env, userId, date = null) {
  const db = getDB(env);
  const q = date
    ? "SELECT SUM(ABS(amount)) as total FROM attempts WHERE user_id=? AND amount<0 AND date=?"
    : "SELECT SUM(ABS(amount)) as total FROM attempts WHERE user_id=? AND amount<0";
  const res = date
    ? await db.prepare(q).bind(userId, date).first()
    : await db.prepare(q).bind(userId).first();
  return res?.total || 0;
}

export async function earningsByDate(env, userId, fromDate) {
  const db = getDB(env);
  const res = await db
    .prepare(
      `SELECT date,
              SUM(CASE WHEN amount>0 THEN amount ELSE 0 END) as profit,
              SUM(CASE WHEN amount<0 THEN ABS(amount) ELSE 0 END) as loss
       FROM attempts
       WHERE user_id=? AND date>=?
       GROUP BY date
       ORDER BY date ASC`
    )
    .bind(userId, fromDate)
    .all();
  return res?.results || [];
}

/* ================= BASE AMOUNT (ACCUMULATED) ================= */

export async function setBaseAmount(env, userId, amount) {
  const db = getDB(env);

  await db
    .prepare(
      `INSERT INTO base_amounts (user_id, amount)
       VALUES (?, ?)
       ON CONFLICT(user_id)
       DO UPDATE SET amount = amount + ?`
    )
    .bind(userId, amount, amount)
    .run();

  // history
  await db
    .prepare(
      `INSERT INTO base_history (user_id, date, amount)
       VALUES (?, DATE('now'), ?)`
    )
    .bind(userId, amount)
    .run();
}

export async function getBaseAmount(env, userId) {
  const db = getDB(env);
  const res = await db
    .prepare("SELECT amount FROM base_amounts WHERE user_id=?")
    .bind(userId)
    .first();
  return res?.amount || 0;
}

export async function getBaseHistory(env, userId) {
  const db = getDB(env);
  const res = await db
    .prepare(
      `SELECT date, amount
       FROM base_history
       WHERE user_id=?
       ORDER BY date ASC`
    )
    .bind(userId)
    .all();
  return res?.results || [];
}

/* ================= WITHDRAWALS ================= */

export async function insertWithdrawal(env, userId, date, amount) {
  const db = getDB(env);
  await db
    .prepare(
      `INSERT INTO withdrawals (user_id, date, amount)
       VALUES (?, ?, ?)`
    )
    .bind(userId, date, amount)
    .run();
}

export async function sumWithdrawals(env, userId) {
  const db = getDB(env);
  const res = await db
    .prepare("SELECT SUM(amount) as total FROM withdrawals WHERE user_id=?")
    .bind(userId)
    .first();
  return res?.total || 0;
}

/* ================= RESET ================= */

export async function resetUserCycle(env, userId) {
  const db = env.DB;
  await db.prepare("DELETE FROM attempts WHERE user_id=?").bind(userId).run();
  await db.prepare("DELETE FROM withdrawals WHERE user_id=?").bind(userId).run();
  await db.prepare("DELETE FROM attempt_session WHERE user_id=?").bind(userId).run();
}

/* ================= ADMIN / STATS ================= */

export async function getCapitalStats(env, userId) {
  const [base, profit, loss, withdrawn] = await Promise.all([
    getBaseAmount(env, userId),
    sumProfit(env, userId),
    sumLoss(env, userId),
    sumWithdrawals(env, userId)
  ]);

  const net = base + profit - loss - withdrawn;
  const roi = base > 0 ? ((profit - loss) / base) * 100 : 0;

  return {
    base,
    profit,
    loss,
    withdrawn,
    net,
    roi: Number(roi.toFixed(2))
  };
    }
