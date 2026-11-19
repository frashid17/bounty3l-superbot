// Entry for make.fun's news-image-20261119 bounty:
// "Sum up 19 November's world news in one image" (https://make.fun/bounty/news-image-20261119).
//
// The image is entry.png beside this file, the day's front-page rendering prepared for
// this bounty. The program validates it as a whole image — the format the gate takes:
//
// - a PNG: every chunk walked, each one's CRC32 checked, dimensions read from the IHDR,
//   and IEND the last chunk with nothing after it;
// - or a JPEG (the name stays entry.png either way): the marker segments walked from SOI,
//   dimensions read from the frame-header marker, and EOI ending the file exactly.
//
// Both sit inside the gate's caps: at most 1024x1024 pixels and 1 MiB. The validated
// bytes are then written byte for byte and deterministically to /output/entry.png (or
// $MAKEFUN_OUTPUT_DIR/entry.png outside the grader's container). Two runs must write the
// same bytes: the input is read fully into memory and never touched.
//
// Node 22, standard library only, no network.

import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MAX_BYTES = 1_048_576; // 1 MiB
const MAX_DIMENSION = 1024;

// Table-driven CRC32 as the PNG chunk checksum defines it.
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf, start, end) {
  let c = 0xffffffff;
  for (let i = start; i < end; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function checkDimensions(width, height) {
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    throw new Error(`entry.png is ${width}x${height}; must be at most ${MAX_DIMENSION}x${MAX_DIMENSION}`);
  }
}

function validatePng(png) {
  // The IHDR chunk (mandatory, first) names the true dimensions.
  if (png.readUInt32BE(8) !== 13) {
    throw new Error(`entry.png IHDR has length ${png.readUInt32BE(8)}, expected 13`);
  }
  const ihdrType = png.toString('latin1', 12, 16);
  if (ihdrType !== 'IHDR') {
    throw new Error(`entry.png's first chunk is ${ihdrType}, expected IHDR`);
  }
  checkDimensions(png.readUInt32BE(16), png.readUInt32BE(20));

  // Walk every chunk and verify its CRC, through to IEND with nothing after.
  let pos = 8;
  let lastChunk = '';
  while (pos < png.length) {
    const length = png.readUInt32BE(pos);
    const end = pos + 12 + length;
    if (length > 0x7fffffff || end > png.length) {
      throw new Error(`entry.png chunk ${png.toString('latin1', pos + 4, pos + 8)} runs past the file`);
    }
    const expected = png.readUInt32BE(pos + 8 + length);
    const actual = crc32(png, pos + 4, pos + 8 + length);
    if (expected !== actual) {
      throw new Error(`entry.png chunk ${png.toString('latin1', pos + 4, pos + 8)} fails its CRC`);
    }
    lastChunk = png.toString('latin1', pos + 4, pos + 8);
    pos = end;
  }
  if (lastChunk !== 'IEND') {
    throw new Error(`entry.png ends on chunk ${lastChunk}, expected IEND`);
  }
}

function validateJpeg(jpg) {
  // Walk the marker segments from just past the SOI; no payload-bearing marker may run
  // past the file, and the walk must end at EOI, the file's last two bytes.
  const standalone = new Set([0xd8, 0xd9, 0x01]); // SOI, EOI, TEM
  let pos = 2;
  let width = null;
  let height = null;
  while (pos < jpg.length) {
    if (jpg[pos] !== 0xff) throw new Error(`entry.png: stray byte 0x${jpg[pos].toString(16)} at ${pos}, expected a JPEG marker`);
    while (jpg[pos] === 0xff) pos++;
    const marker = jpg[pos++];
    if (standalone.has(marker)) {
      if (marker === 0xd9 && pos !== jpg.length) throw new Error('entry.png: bytes follow the JPEG EOI marker');
      if (marker === 0xd9) break;
      continue;
    }
    if (marker >= 0xd0 && marker <= 0xd7) continue; // restart markers carry no payload
    if (pos + 2 > jpg.length) throw new Error('entry.png: truncated JPEG segment header');
    const segLen = jpg.readUInt16BE(pos);
    if (segLen < 2 || pos + segLen > jpg.length) throw new Error(`entry.png: JPEG segment at ${pos} runs past the file`);
    // A frame header (C0, C1, C2, ... a lossless frame except DAC/DHT/RST classes) carries the dimensions.
    if ((marker >= 0xc0 && marker <= 0xcf) && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      if (segLen < 7) throw new Error('entry.png: JPEG frame header too short');
      height = jpg.readUInt16BE(pos + 3);
      width = jpg.readUInt16BE(pos + 5);
    }
    pos += segLen;
    if (marker === 0xda) break; // entropy-coded scan data: only the EOI trail remains
  }
  if (height === null || width === null) throw new Error('entry.png: JPEG frame header never appeared');
  checkDimensions(width, height);
}

const source = new URL('./entry.png', import.meta.url);
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const image = readFileSync(source);

// The gate's size cap.
const bytes = statSync(source).size;
if (image.length !== bytes || image.length > MAX_BYTES) {
  throw new Error(`entry.png is ${image.length} bytes; must be a whole file of at most ${MAX_BYTES}`);
}

// Tell it apart by its first bytes: PNG's signature, or a JPEG's SOI (FF D8 FF).
const isPng = image.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
const isJpeg = image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff;

if (isPng) {
  validatePng(image);
} else if (isJpeg) {
  validateJpeg(image);
} else {
  throw new Error('entry.png is neither a PNG nor a JPEG by its first bytes');
}

console.log(`entry.png validated: ${image.length} bytes (${isPng ? 'PNG' : 'JPEG'})`);

// A deterministic write: the exact validated bytes, nothing derived from the clock.
mkdirSync(outputDir, { recursive: true });
const destination = join(outputDir, 'entry.png');
writeFileSync(destination, image, { mode: 0o644 });
console.log(`wrote ${destination}`);
