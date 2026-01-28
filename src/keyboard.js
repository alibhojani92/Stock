/* ================= REPLY (ARROW) KEYBOARD ================= */
/* Main navigation – always visible */

export function replyKeyboard() {
  return {
    keyboard: [
      ["▶️ Start Attempt", "⏹ Stop Attempt"],
      ["💰 Balance", "💸 Withdraw"],
      ["📊 Reports", "🔄 Reset Base"],
      ["🆘 Help"]
    ],
    resize_keyboard: true,
    one_time_keyboard: false
  };
}

/* ================= INLINE KEYBOARDS ================= */
/* State / decision based */

/* Profit / Loss (after stop attempt) */
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

/* Reports inline selector */
export function reportInlineKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "📅 Today", callback_data: "/today" },
        { text: "📆 Weekly", callback_data: "/weekly" }
      ],
      [
        { text: "🗓 Monthly", callback_data: "/monthly" }
      ],
      [
        { text: "💰 Base History", callback_data: "/base_history" }
      ],
      [
        { text: "📊 Capital Stats", callback_data: "/capital_stats" }
      ]
    ]
  };
}

/* Reset confirmation inline keyboard */
export function resetConfirmKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "✅ Yes Reset", callback_data: "CONFIRM_RESET" },
        { text: "❌ Cancel", callback_data: "CANCEL_RESET" }
      ]
    ]
  };
}

/* Admin inline keyboard */
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
