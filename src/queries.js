import { getDB } from "./db";

/* ================= ATTEMPTS ================= */

// Count today's attempts
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

// Insert new attempt (amount can be +profit or -loss)
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

// Sum earnings (profit - loss combined)
export async function sumEarnings(env, userId, date = null) {
  const db = getDB(env);

  const query = date
    ? "SELECT SUM(amount) as total FROM attempts WHERE user_id = ? AND date = ?"
    : "SELECT SUM(amount) as total FROM attempts WHERE user_id = ?";

  const stmt = date
    ? db.prepare(query).bind(userId, date)
    : db.prepare(query).bind(userId);

  const res = await stmt.first();
  return res?.total || 0;
}

// Earnings grouped by date (weekly/monthly)
export async function earningsByDate(env, userId, fromDate) {
  const db = getDB(env);
  const res = await db
    .prepare(
      `SELECT date, SUM(amount) as total
       FROM attempts
       WHERE user_id = ? AND date >= ?
       GROUP BY date
       ORDER BY date ASC`
    )
    .bind(userId, fromDate)
    .all();

  return res?.results || [];
}

/* ================= BASE AMOUNT ================= */

// Set base amount (only once or when balance = 0)
export async function setBaseAmount(env, userId, amount) {
  const db = getDB(env);
  await db
    .prepare(
      `INSERT INTO base_amounts (user_id, amount)
       VALUES (?, ?)
       ON CONFLICT(user_id) DO UPDATE SET amount = ?`
    )
    .bind(userId, amount, amount)
    .run();
}

// Get base amount
export async function getBaseAmount(env, userId) {
  const db = getDB(env);
  const res = await db
    .prepare("SELECT amount FROM base_amounts WHERE user_id = ?")
    .bind(userId)
    .first();

  return res?.amount || 0;
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

export async function sumWithdrawals(env, userId, date = null) {
  const db = getDB(env);

  const query = date
    ? "SELECT SUM(amount) as total FROM withdrawals WHERE user_id = ? AND date = ?"
    : "SELECT SUM(amount) as total FROM withdrawals WHERE user_id = ?";

  const stmt = date
    ? db.prepare(query).bind(userId, date)
    : db.prepare(query).bind(userId);

  const res = await stmt.first();
  return res?.total || 0;
}

/* ================= ATTEMPT SESSION (TIME) ================= */

export async function setSession(env, userId, startTime) {
  const db = env.DB;
  await db
    .prepare(
      "INSERT INTO attempt_session (user_id, start_time) VALUES (?, ?) " +
      "ON CONFLICT(user_id) DO UPDATE SET start_time=?"
    )
    .bind(userId, startTime, startTime)
    .run();
}

export async function getSession(env, userId) {
  const db = env.DB;
  return await db
    .prepare("SELECT start_time FROM attempt_session WHERE user_id=?")
    .bind(userId)
    .first();
}

export async function clearSession(env, userId) {
  const db = env.DB;
  await db
    .prepare("DELETE FROM attempt_session WHERE user_id=?")
    .bind(userId)
    .run();
}

/* ================= ADMIN ================= */

// All users
export async function getAllUsers(env) {
  const db = getDB(env);
  const res = await db
    .prepare("SELECT DISTINCT user_id FROM attempts")
    .all();
  return res?.results || [];
}

// Per-user summary
export async function getUserSummary(env, userId) {
  const db = getDB(env);

  const [base, profit] = await Promise.all([
    getBaseAmount(env, userId),
    sumEarnings(env, userId)
  ]);

  return {
    base,
    profit,
    balance: base + profit
  };
    }
