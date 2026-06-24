/**
 * GENAI NARRATION (GA-TTS GT-2) — synthesize the period-voice reads for the saga's key beats via Gemini TTS,
 * keyed by `narrationKey` (beat × era), and wrap the returned PCM as a WAV at
 * public/assets/audio/narration/<key>.wav (the AudioEngine.playNarration lookup, `:` → `_`). Offline/cached,
 * idempotent. Gemini TTS returns 24kHz mono s16le PCM.
 *
 *   pnpm vite-node scripts/genai-narration.ts -- [--beat <founding|finale>] [--era <eraBand>] [--force]
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEFAULT_TTS_MODEL,
  geminiGenerateSpeech,
  TTS_CHANNELS,
  TTS_SAMPLE_RATE,
} from "../src/sim/genai/client";
import { allNarrationJobs } from "../src/sim/narration/genaiNarration";

const OUT_DIR = "public/assets/audio/narration";

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const FORCE = process.argv.includes("--force");

/** Wrap raw s16le PCM in a minimal WAV (RIFF) container. */
function pcmToWav(pcm: Uint8Array, sampleRate: number, channels: number): Buffer {
  const bytesPerSample = 2; // s16le
  const blockAlign = channels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // PCM fmt chunk size
  header.writeUInt16LE(1, 20); // audio format = PCM
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bytesPerSample * 8, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, Buffer.from(pcm)]);
}

async function main(): Promise<void> {
  const key = process.env.GEMINI_API_KEY ?? "";
  if (!key) {
    console.error("GEMINI_API_KEY not set — narration synthesis needs a Gemini key.");
    process.exit(1);
  }
  const genSpeech = geminiGenerateSpeech(key, process.env.GEMINI_TTS_MODEL || DEFAULT_TTS_MODEL);
  mkdirSync(OUT_DIR, { recursive: true });

  const beatFlag = arg("beat");
  const eraFlag = arg("era");
  const jobs = allNarrationJobs().filter(
    (j) => (!beatFlag || j.beat === beatFlag) && (!eraFlag || j.eraBand === eraFlag),
  );
  if (jobs.length === 0) {
    console.error("No narration jobs match the flags.");
    process.exit(1);
  }

  let made = 0;
  for (const job of jobs) {
    const stem = job.key.replace(/:/g, "_");
    const abs = join(OUT_DIR, `${stem}.wav`);
    if (!FORCE && existsSync(abs)) {
      console.error(`  · ${stem}: exists, skipping`);
      continue;
    }
    console.error(`  … ${stem}: synthesizing (${job.voice}) …`);
    const pcm = await genSpeech(job.text, job.voice);
    if (!pcm) {
      console.error(`  ✗ ${stem}: no audio produced`);
      continue;
    }
    writeFileSync(abs, pcmToWav(pcm, TTS_SAMPLE_RATE, TTS_CHANNELS));
    made++;
    console.error(`  ✓ ${stem}: ${(pcm.length / 1024).toFixed(0)} KiB PCM → ${stem}.wav`);
  }
  console.error(`Narration synthesis complete: ${made} written.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
