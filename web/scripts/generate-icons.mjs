/**
 * Circular favicon + PWA icons from public/brand-logo.png
 */
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

const root = join(import.meta.dirname, "..");
const src = join(root, "public", "brand-logo.png");
const appDir = join(root, "src", "app");
const publicDir = join(root, "public");
const sizes = [32, 48, 180, 192, 512];

function circleMask(size) {
  const r = size / 2;
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">` +
      `<circle cx="${r}" cy="${r}" r="${r}" fill="#fff"/></svg>`,
  );
}

async function circularPng(size) {
  const mask = circleMask(size);
  return sharp(src)
    .resize(size, size, { fit: "cover", position: "centre" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function writeIco(pngBuffers) {
  const images = pngBuffers.map((buf, i) => ({ size: sizes[i], buf }));
  const headerSize = 6 + images.length * 16;
  let offset = headerSize;
  const entries = images.map(({ size, buf }) => {
    const entry = {
      size,
      buf,
      offset,
      byteSize: buf.length,
    };
    offset += buf.length;
    return entry;
  });

  const out = Buffer.alloc(offset);
  out.writeUInt16LE(0, 0);
  out.writeUInt16LE(1, 2);
  out.writeUInt16LE(entries.length, 4);

  entries.forEach((e, i) => {
    const base = 6 + i * 16;
    const dim = e.size >= 256 ? 0 : e.size;
    out[base] = dim;
    out[base + 1] = dim;
    out[base + 2] = 0;
    out[base + 3] = 0;
    out.writeUInt16LE(1, base + 4);
    out.writeUInt16LE(32, base + 6);
    out.writeUInt32LE(e.byteSize, base + 8);
    out.writeUInt32LE(e.offset, base + 12);
  });

  entries.forEach((e) => e.buf.copy(out, e.offset));
  return out;
}

const logo = await readFile(src);
if (!logo.length) throw new Error("brand-logo.png missing");

const fav32 = await circularPng(32);
const fav48 = await circularPng(48);
const apple180 = await circularPng(180);
const ico = await writeIco([fav32, fav48]);

/** Next.js reads tab icons from src/app/, not public/ */
await writeFile(join(appDir, "favicon.ico"), ico);
await writeFile(join(appDir, "icon.png"), fav32);
await writeFile(join(appDir, "apple-icon.png"), apple180);
console.log("[icons] src/app/favicon.ico");
console.log("[icons] src/app/icon.png");
console.log("[icons] src/app/apple-icon.png");

for (const size of [48, 192, 512]) {
  const buf = await circularPng(size);
  const name = size === 512 ? "icon-512.png" : size === 192 ? "icon-192.png" : "icon-48.png";
  await writeFile(join(publicDir, name), buf);
  console.log(`[icons] public/${name}`);
}
