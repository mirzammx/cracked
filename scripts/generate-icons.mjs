// Generates the PWA icon PNGs (public/icon-192.png, icon-512.png,
// apple-icon.png) as static files, run once with `node scripts/generate-icons.mjs`.
//
// Why not next/og's ImageResponse (the usual way to do this in App Router)?
// Next 14.2.15's bundled @vercel/og tries to load its default font via a
// file:// URL built with Windows backslashes, which throws `ERR_INVALID_URL`
// at import time on Windows, regardless of the `fonts` option — a platform
// bug, not something callers can route around. Since the icon has no text
// anyway (just the "Split" mark's geometry), this rasterizes the same
// shapes directly and hand-encodes a PNG with only Node built-ins (fs,
// zlib) — no new dependency, and it works identically on every OS.
//
// Geometry mirrors lib/iconMark.tsx / app/icon.svg: a rounded-square
// background plus 5 round-capped straight-line strokes, scaled from the
// original 100x100 viewBox and its `translate(50 52) scale(0.72)
// translate(-50 -52)` group transform.
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import path from "node:path";

const BG = hex("#1c1c17");

const STROKES = [
  { pts: [[50, 94], [50, 58]], color: hex("#f5f4f0"), width: 9 },
  { pts: [[50, 58], [26, 40], [14, 16]], color: hex("#7c9df0"), width: 8 },
  { pts: [[26, 40], [38, 16]], color: hex("#dd8de6"), width: 8 },
  { pts: [[50, 58], [74, 40], [62, 16]], color: hex("#6dd6a0"), width: 8 },
  { pts: [[74, 40], [86, 16]], color: hex("#f2977a"), width: 8 },
];

function hex(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function distToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const abLen2 = abx * abx + aby * aby;
  let t = abLen2 > 0 ? (apx * abx + apy * aby) / abLen2 : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * abx;
  const cy = ay + t * aby;
  return Math.hypot(px - cx, py - cy);
}

function insideRoundedRect(px, py, w, h, r) {
  if (px < 0 || py < 0 || px > w || py > h) return false;
  const dx = Math.max(r - px, px - (w - r), 0);
  const dy = Math.max(r - py, py - (h - r), 0);
  return dx * dx + dy * dy <= r * r;
}

function render(size) {
  const scaleCanvas = size / 100;
  const scaleG = 0.72;
  const SS = 4; // supersample factor per axis, for antialiased edges
  const buf = new Uint8Array(size * size * 4);

  const segs = [];
  for (const s of STROKES) {
    const tp = s.pts.map(([x, y]) => {
      const gx = 50 + scaleG * (x - 50);
      const gy = 52 + scaleG * (y - 52);
      return [gx * scaleCanvas, gy * scaleCanvas];
    });
    const hw = (s.width * scaleG * scaleCanvas) / 2;
    for (let i = 0; i < tp.length - 1; i++) {
      segs.push({ a: tp[i], b: tp[i + 1], hw, color: s.color });
    }
  }
  const radius = 24 * scaleCanvas;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = px + (sx + 0.5) / SS;
          const y = py + (sy + 0.5) / SS;
          let [cr, cg, cb] = BG;
          let ca = insideRoundedRect(x, y, size, size, radius) ? 255 : 0;
          for (const seg of segs) {
            if (distToSegment(x, y, seg.a[0], seg.a[1], seg.b[0], seg.b[1]) <= seg.hw) {
              [cr, cg, cb] = seg.color;
              ca = 255;
            }
          }
          r += cr;
          g += cg;
          b += cb;
          a += ca;
        }
      }
      const n = SS * SS;
      const idx = (py * size + px) * 4;
      buf[idx] = Math.round(r / n);
      buf[idx + 1] = Math.round(g / n);
      buf[idx + 2] = Math.round(b / n);
      buf[idx + 3] = Math.round(a / n);
    }
  }
  return buf;
}

let crcTable;
function crc32(buf) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(size, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const stride = size * 4;
  const raw = Buffer.alloc(size * (1 + stride));
  const rgbaBuf = Buffer.from(rgba.buffer, rgba.byteOffset, rgba.byteLength);
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + stride);
    raw[rowStart] = 0; // filter type: none
    rgbaBuf.copy(raw, rowStart + 1, y * stride, (y + 1) * stride);
  }
  const idat = deflateSync(raw);

  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

for (const [name, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-icon.png", 180],
]) {
  const png = encodePNG(size, render(size));
  writeFileSync(path.join(publicDir, name), png);
  console.log(`wrote public/${name} (${png.length} bytes)`);
}
