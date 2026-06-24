/**
 * GENAI MUSIC (GA-MUSIC GM-2/3) — capture an era-appropriate Lyria score per ambient-track slot and write it
 * as a WAV to public/assets/audio/<track>.wav. The AudioEngine loads <track>.ogg → <track>.wav → a synth
 * chord (fallback chain), so these GenAI beds drop straight in. Offline/cached, idempotent.
 *
 *   pnpm vite-node scripts/genai-music.ts -- [--track <t>] [--seconds N] [--force]
 *
 * Lyria is a realtime stream (~1× wall-clock), so capturing all 10 tracks at the default length takes minutes.
 */

import "./env";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEFAULT_MUSIC_MODEL,
  geminiCaptureMusic,
  LYRIA_CHANNELS,
  LYRIA_SAMPLE_RATE,
} from "../src/sim/genai/client";
import { buildMusicPrompt, type MusicTrack, MUSIC_TRACKS } from "../src/sim/music/genaiMusic";

const OUT_DIR = "public/assets/audio";

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const FORCE = process.argv.includes("--force");
const SECONDS = arg("seconds") ? Number(arg("seconds")) : 30;

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
    console.error("GEMINI_API_KEY not set — music capture needs a Gemini key.");
    process.exit(1);
  }
  const capture = geminiCaptureMusic(key, process.env.GEMINI_MUSIC_MODEL || DEFAULT_MUSIC_MODEL);
  mkdirSync(OUT_DIR, { recursive: true });

  const trackFlag = arg("track") as MusicTrack | undefined;
  const tracks = trackFlag ? [trackFlag] : MUSIC_TRACKS;

  let made = 0;
  for (const track of tracks) {
    const abs = join(OUT_DIR, `${track}.wav`);
    if (!FORCE && existsSync(abs)) {
      console.error(`  · ${track}: exists, skipping`);
      continue;
    }
    console.error(`  … ${track}: capturing ${SECONDS}s …`);
    const pcm = await capture(buildMusicPrompt(track), SECONDS);
    if (pcm.length === 0) {
      console.error(`  ✗ ${track}: no audio captured`);
      continue;
    }
    writeFileSync(abs, pcmToWav(pcm, LYRIA_SAMPLE_RATE, LYRIA_CHANNELS));
    made++;
    console.error(`  ✓ ${track}: ${(pcm.length / 1024).toFixed(0)} KiB PCM → ${track}.wav`);
  }
  console.error(`Music capture complete: ${made} written.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
