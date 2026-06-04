import fs from "fs";

const text = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const line of text.split(/\r?\n/)) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const key = line.slice(0, i);
  let val = line.slice(i + 1);
  if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
  env[key] = val;
}

for (const k of [
  "TURSO_DATABASE_URL",
  "TURSO_AUTH_TOKEN",
  "JWT_ACCESS_SECRET",
  "SETUP_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
]) {
  const v = env[k];
  console.log(k, v?.length ? `set(${v.length})` : "MISSING");
}
