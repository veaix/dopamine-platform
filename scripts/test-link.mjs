/**
 * Quick API smoke test (no launcher required).
 * Usage: node scripts/test-link.mjs [baseUrl]
 */
const base = process.argv[2] || "http://localhost:3000";

async function json(path, init) {
  const res = await fetch(`${base}${path}`, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} ${res.status} ${JSON.stringify(body)}`);
  return body;
}

const email = `test_${Date.now()}@example.com`;
const password = "TestPass123!";

console.log("Register", email);
await json("/api/auth/register", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password }),
});

const link = await json("/api/devices/link-code", {
  method: "POST",
  headers: { cookie: "" },
});

// link-code needs session cookie from register - use login instead
await json("/api/auth/login", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password }),
});

console.log("Note: link-code requires browser session. Test device link with manual code from dashboard.");
console.log("Public stats:", await json("/api/stats/public"));
