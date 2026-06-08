export async function onRequestGet() {
  return Response.json({ ok: true, source: "cloudflare-function" });
}