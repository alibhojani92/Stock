export function getDB(env) {
  if (!env.DB) {
    throw new Error("D1 database binding not found");
  }
  return env.DB;
}
