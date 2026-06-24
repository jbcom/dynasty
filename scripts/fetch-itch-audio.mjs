#!/usr/bin/env node
/**
 * Pull a curated allow-list of OWNED itch.io audio packs into raw-assets/
 * (gitignored), then extract. Adapted from a-good-old-fashioned-adventure's
 * fetch-itch-assets.mjs. Only curated keepers are later promoted to
 * public/assets/audio/ with an assets.json entry — the manifest test refuses
 * unmanifested assets.
 *
 * The allow-list targets MAGA Money Moves' tone: energetic / high-stakes /
 * dark-ambient beds that fit a rise-to-power-and-beyond arc.
 *
 * Usage:
 *   node scripts/fetch-itch-audio.mjs --dry   # list what would download
 *   node scripts/fetch-itch-audio.mjs         # download + extract
 */
import "./env.mjs";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ARCHIVES = join(ROOT, "raw-assets", "archives");
const EXTRACTED = join(ROOT, "raw-assets", "extracted");
const LIBRARY = join(ROOT, ".itch-cache", "library.json");
const DRY = process.argv.includes("--dry");

function readApiKey() {
  if (process.env.ITCH_API_KEY) return process.env.ITCH_API_KEY;
  const envPath = join(ROOT, ".env");
  if (!existsSync(envPath)) return undefined;
  return readFileSync(envPath, "utf8").match(/ITCH_API_KEY=(\S+)/)?.[1];
}
const KEY = readApiKey();
if (!KEY) {
  console.error("ITCH_API_KEY missing — set the env var or add it to .env");
  process.exit(1);
}

// Energetic / high-stakes / dark-ambient beds mapped to the era arc:
//   rise (combat/boss) · spectacle (upbeat) · downfall + atomic horror (dark
//   ambient / horror) · victory stingers · UI cues.
const ALLOW_LIST = new Set([
  "Retro Boss Battle Music Pack – $4.99 Chiptune Loops",
  "Retro Combat Music Pack - 12 Chiptune Battle Loops",
  "Casual Upbeat Game Music Pack – 10 Happy Loops",
  "Victory & Level Complete Music Pack – 24 Game Stingers",
  "Dark Ambient Game Music Pack – Mystery & Horror Loops",
  "Horror Dark Ambient Music Pack – 20 Creepy Tracks",
  "UI Sound Effects Pack – 40 Game Interface Sounds (WAV + MP3)",
  "Cinematic Whoosh SFX Pack – 42 Fast Transition Sounds",
]);

if (!existsSync(LIBRARY)) {
  console.error(`No library cache at ${LIBRARY}. Run scripts/itch-library.mjs first.`);
  process.exit(1);
}
const library = JSON.parse(readFileSync(LIBRARY, "utf8"));
const packs = library.filter((p) => ALLOW_LIST.has(p.title));
const missing = [...ALLOW_LIST].filter((t) => !packs.some((p) => p.title === t));
if (missing.length > 0) {
  console.warn(`allow-list titles not in library cache (skipped):\n  ${missing.join("\n  ")}`);
}
console.log(`Processing ${packs.length} allow-listed packs (dry=${DRY})`);

mkdirSync(ARCHIVES, { recursive: true });
mkdirSync(EXTRACTED, { recursive: true });

const ARCHIVE_RE = /\.(zip|rar|7z)$/i;
const LOOSE_RE = /\.(wav|mp3|ogg)$/i;
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

let downloaded = 0;
let skipped = 0;
let failed = 0;

for (const pack of packs) {
  const uploadsResp = await apiGet(
    `/api/1/key/game/${pack.gameId}/uploads?download_key_id=${pack.keyId}`,
  );
  const all = uploadsResp?.uploads ?? [];
  const archives = all.filter((u) => ARCHIVE_RE.test(u.filename ?? ""));
  const uploads = archives.length > 0 ? archives : all.filter((u) => LOOSE_RE.test(u.filename ?? ""));
  if (uploads.length === 0) {
    console.warn(`  [${pack.title}] no usable uploads`);
    failed++;
    continue;
  }
  for (const upload of uploads) {
    const isArchive = ARCHIVE_RE.test(upload.filename);
    const looseDir = join(EXTRACTED, slugify(pack.title));
    if (!isArchive && !DRY) mkdirSync(looseDir, { recursive: true });
    const safeName = basename(upload.filename);
    const dest = isArchive ? join(ARCHIVES, safeName) : join(looseDir, safeName);

    if (existsSync(dest) && statSync(dest).size === upload.size) {
      const md5 = createHash("md5").update(readFileSync(dest)).digest("hex");
      if (md5 === upload.md5_hash) {
        skipped++;
        continue;
      }
    }
    if (DRY) {
      console.log(`  WOULD DOWNLOAD: ${upload.filename} (${upload.size}B) ← ${pack.title}`);
      downloaded++;
      continue;
    }
    const dlInfo = await apiGet(
      `/api/1/key/upload/${upload.id}/download?download_key_id=${pack.keyId}`,
    );
    if (!dlInfo?.url || !dlInfo.url.startsWith("https://")) {
      console.error(`  [${pack.title}] no/invalid signed URL`);
      failed++;
      continue;
    }
    const result = spawnSync(
      "curl",
      ["-sS", "-fL", "--proto", "=https", "--proto-redir", "=https", "-o", dest, dlInfo.url],
      { stdio: "inherit" },
    );
    if (result.status !== 0 || statSync(dest).size !== upload.size) {
      console.error(`  [${pack.title}] download failed/size mismatch: ${upload.filename}`);
      failed++;
      continue;
    }
    console.log(`  ✓ ${upload.filename} ← ${pack.title}`);
    downloaded++;
  }
}

if (!DRY) {
  console.log("\nExtracting…");
  for (const f of readdirSync(ARCHIVES)) {
    if (!ARCHIVE_RE.test(f)) continue;
    const slug = slugify(f.replace(ARCHIVE_RE, ""));
    const target = join(EXTRACTED, slug);
    if (existsSync(target) && statSync(target).mtimeMs >= statSync(join(ARCHIVES, f)).mtimeMs) continue;
    mkdirSync(target, { recursive: true });
    try {
      if (/\.zip$/i.test(f)) {
        execFileSync("unzip", ["-q", "-o", join(ARCHIVES, f), "-d", target], { stdio: "inherit" });
      } else {
        execFileSync("unar", ["-quiet", "-o", target, join(ARCHIVES, f)], { stdio: "inherit" });
      }
      console.log(`  ✓ extracted ${f} → ${slug}`);
    } catch {
      console.error(`  ✗ failed to extract ${f}`);
    }
  }
}

console.log(`\nDone. downloaded=${downloaded} skipped=${skipped} failed=${failed}`);
console.log("Curate keepers into public/assets/audio/ and add manifest entries.");

async function apiGet(path) {
  const result = spawnSync(
    "curl",
    ["-sS", "-fL", "-H", `Authorization: Bearer ${KEY}`, `https://itch.io${path}`],
    { encoding: "utf8" },
  );
  if (result.status !== 0) return null;
  try {
    return JSON.parse(result.stdout);
  } catch {
    return null;
  }
}
