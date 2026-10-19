// Minimal node:test shim for tests/browser.html.
const queue = [];
export function test(name, fn) { queue.push({ name, fn }); }
export async function results() {
  const out = [];
  for (const t of queue) { try { await t.fn(); out.push({ name: t.name, ok: true }); } catch (e) { out.push({ name: t.name, ok: false, err: e.message }); } }
  return out;
}
