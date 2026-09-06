// Generates simple PNG app icons with no external dependencies (just zlib).
// Design: warm gradient-ish flat background + a friendly rounded "10" mark.
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = [];
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function writePng(filePath, size, draw) {
  const width = size;
  const height = size;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = draw(x, y, width, height);
      const off = rowStart + 1 + x * 4;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
      raw[off + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = zlib.deflateSync(raw, { level: 9 });
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  fs.writeFileSync(filePath, png);
  console.log("wrote", filePath);
}

// Colors
const BG = [255, 140, 66]; // warm orange
const BG2 = [255, 94, 98]; // warm coral (for gradient feel via diagonal blend)
const FG = [255, 255, 255];

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

// Draw a rounded-square background with a simple "10" glyph made of blocks,
// plus a small circle (checkmark-ish dot) — friendly, legible at small sizes.
function makeDraw({ padding = 0.14, maskable = false } = {}) {
  return (x, y, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const t = (x + y) / (w + h);
    const bg = mix(BG, BG2, t);

    const pad = maskable ? w * 0.22 : w * padding;
    const radius = maskable ? 0 : w * 0.22;

    // rounded rect mask for the whole icon (skip rounding for maskable safe-zone icons)
    let inside = true;
    if (!maskable) {
      const rx = Math.min(Math.max(x, radius), w - radius);
      const ry = Math.min(Math.max(y, radius), h - radius);
      const dx = x - rx;
      const dy = y - ry;
      inside = dx * dx + dy * dy <= radius * radius + 1;
    }
    if (!inside) return [0, 0, 0, 0];

    // "10" glyph: two vertical bars for "1", an oval ring for "0"
    const gw = w - pad * 2;
    const gh = h - pad * 2;
    const gx = pad;
    const gy = pad;

    // "1": a bar at ~28% width
    const oneX = gx + gw * 0.22;
    const oneWidth = gw * 0.14;
    const inOne = x >= oneX - oneWidth / 2 && x <= oneX + oneWidth / 2 && y >= gy && y <= gy + gh;

    // "0": ring centered at ~68% width
    const zeroCx = gx + gw * 0.66;
    const zeroCy = gy + gh * 0.5;
    const zeroRx = gw * 0.24;
    const zeroRy = gh * 0.5;
    const ndx = (x - zeroCx) / zeroRx;
    const ndy = (y - zeroCy) / zeroRy;
    const dist = ndx * ndx + ndy * ndy;
    const ringThickness = 0.42; // relative
    const inZero = dist <= 1 && dist >= (1 - ringThickness) * (1 - ringThickness);

    if (inOne || inZero) {
      return [...FG, 255];
    }
    return [...bg, 255];
  };
}

const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });

const sizes = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
  { file: "favicon-32.png", size: 32 },
  { file: "favicon-16.png", size: 16 },
];

for (const { file, size } of sizes) {
  writePng(path.join(outDir, file), size, makeDraw({}));
}

// Maskable icon needs safe-zone padding (content within ~40% radius of center)
writePng(path.join(outDir, "icon-maskable-512.png"), 512, makeDraw({ maskable: true }));

console.log("Done generating icons.");
