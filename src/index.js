import { handleUpdate } from "./bot";

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("OK");
    }

    try {
      const update = await request.json();
      return await handleUpdate(update, env);
    } catch (err) {
      console.error("Update error:", err);
      return new Response("Error", { status: 500 });
    }
  }
};
