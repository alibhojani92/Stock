export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("OK");
    }

    const update = await request.json();

    // 🔥 Run bot logic in background
    ctx.waitUntil(handleUpdate(update, env));

    // 🔥 Immediately respond to Telegram
    return new Response("OK");
  }
};
