/* ================= MAIN USER KEYBOARD ================= */

export function getKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "▶️ Start Attempt", callback_data: "/start_attempt" },
        { text: "⏹ Stop Attempt", callback_data: "/stop_attempt" }
      ],
      [
        { text: "💸 Withdraw", callback_data: "/withdraw" },
        { text: "💰 Balance", callback_data: "/balance" }
      ],
      [
        { text: "📊 Today", callback_data: "/today" },
        { text: "📆 Weekly", callback_data: "/weekly" }
      ],
      [
        { text: "🗓 Monthly", callback_data: "/monthly" },
        { text: "🆘 Help", callback_data: "/help" }
      ]
    ]
  };
}

/* ================= PROFIT / LOSS KEYBOARD ================= */

export function profitLossKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "🟢 Profit", callback_data: "RESULT_PROFIT" },
        { text: "🔴 Loss", callback_data: "RESULT_LOSS" }
      ]
    ]
  };
}

/* ================= ADMIN KEYBOARD ================= */

export function adminKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "👥 Users", callback_data: "/admin_users" },
        { text: "📊 Summary", callback_data: "/admin_summary" }
      ]
    ]
  };
    }
