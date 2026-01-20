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
