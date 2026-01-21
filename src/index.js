import { handleUpdate } from "./bot.js";

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("OK");
    }

    let update;
    try {
      update = await request.json();
    } catch {
      return new Response("Bad Request", { status: 400 });
    }

    // ultra-fast response, background processing
    ctx.waitUntil(handleUpdate(update, env));

    return new Response("OK");
  }
};
