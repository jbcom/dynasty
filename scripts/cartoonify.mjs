#!/usr/bin/env node
/**
 * Convert real (public-domain / CC0) source photos into stylized cartoon
 * portraits at build time. The cartoon look = posterized color + boosted
 * saturation/contrast with a dark edge overlay (Sobel). This keeps shipped art
 * derived-and-stylized rather than raw photographs, matching the caricature
 * brand while staying anchored to genuinely free source images.
 *
 * Usage: node scripts/cartoonify.mjs
 *   Reads  public/assets/photos/*.jpg
 *   Writes public/assets/portraits/<name>.cartoon.png
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Jimp } from "jimp";

const SRC_DIR = "public/assets/photos";
const OUT_DIR = "public/assets/portraits";
const LEVELS = 5; // color posterization steps per channel

function posterize(value, levels) {
  const step = 255 / (levels - 1);
  return Math.round(Math.round(value / step) * step);
}

/** Sobel edge magnitude at (x,y) on a grayscale copy. */
function edgeAt(gray, x, y, w, h) {
  if (x <= 0 || y <= 0 || x >= w - 1 || y >= h - 1) return 0;
  const g = (dx, dy) => gray[(y + dy) * w + (x + dx)];
  const gx =
    -g(-1, -1) - 2 * g(-1, 0) - g(-1, 1) + g(1, -1) + 2 * g(1, 0) + g(1, 1);
  const gy =
    -g(-1, -1) - 2 * g(0, -1) - g(1, -1) + g(-1, 1) + 2 * g(0, 1) + g(1, 1);
  return Math.sqrt(gx * gx + gy * gy);
}

async function cartoonify(srcPath, outPath) {
  const img = await Jimp.read(srcPath);
  const { width: w, height: h } = img.bitmap;

  // Precompute grayscale for edge detection.
  const gray = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) << 2;
      const d = img.bitmap.data;
      gray[y * w + x] = (d[idx] * 0.299 + d[idx + 1] * 0.587 + d[idx + 2] * 0.114) | 0;
    }
  }

  const EDGE_THRESHOLD = 90;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) << 2;
      const d = img.bitmap.data;
      const edge = edgeAt(gray, x, y, w, h);
      if (edge > EDGE_THRESHOLD) {
        // Ink the outline.
        d[idx] = 20;
        d[idx + 1] = 16;
        d[idx + 2] = 24;
      } else {
        // Posterize + saturate.
        d[idx] = posterize(d[idx], LEVELS);
        d[idx + 1] = posterize(d[idx + 1], LEVELS);
        d[idx + 2] = posterize(d[idx + 2], LEVELS);
      }
    }
  }

  img.contrast(0.12);
  await img.write(outPath);
  return `${w}x${h}`;
}

async function main() {
  if (!existsSync(SRC_DIR)) {
    console.error(`No source dir ${SRC_DIR}`);
    process.exit(1);
  }
  const files = readdirSync(SRC_DIR).filter((f) => /\.(jpe?g|png)$/i.test(f));
  if (files.length === 0) {
    console.log("No source photos to cartoonify.");
    return;
  }
  for (const file of files) {
    const base = file.replace(/\.(jpe?g|png)$/i, "");
    const out = join(OUT_DIR, `${base}.cartoon.png`);
    const dims = await cartoonify(join(SRC_DIR, file), out);
    console.log(`cartoonified ${file} -> ${out} (${dims})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
