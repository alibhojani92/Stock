import { getDB } from "./db";

/* ---------------- ATTEMPTS ---------------- */

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

// Insert new attempt
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

// Sum earnings (optionally by date)
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

// Earnings grouped by date (for weekly/monthly)
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

/* ---------------- WITHDRAWALS ---------------- */

// Insert withdrawal
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

// Sum withdrawals (optionally by date)
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
