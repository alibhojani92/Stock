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
      console.error("Invalid JSON");
      return new Response("Bad Request", { status: 400 });
    }

    ctx.waitUntil(
      handleUpdate(update, env).catch(err => {
        console.error("HANDLE UPDATE ERROR:", err);
      })
    );

    return new Response("OK");
  }
};
