import { handleUpdate } from "./bot";

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("OK");
    }

    let update;
    try {
      update = await request.json();
    } catch (e) {
      return new Response("Invalid JSON", { status: 400 });
    }

    // 🔥 Run bot logic safely in background
    ctx.waitUntil(
      handleUpdate(update, env).catch(err => {
        console.error("Bot error:", err);
      })
    );

    // 🔥 Telegram gets instant response
    return new Response("OK");
  }
};
