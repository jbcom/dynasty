import { GoogleGenAI } from "@google/genai";

/**
 * GENAI CLIENT (EX-4) — the thin, key-gated wrapper around `@google/genai` (the
 * Gemini SDK, per the design spec). This is the ONLY impure part of the toolkit;
 * everything else (prompt building, validation) is pure and testable without it.
 * The dev-bulk pipeline injects a `GenerateFn` so the orchestrator + validation gate
 * are exercised in tests with a stub, and only the real run needs a key + network.
 */

/** The pluggable generation function: (system, prompt) → raw model text. */
export type GenerateFn = (system: string, prompt: string) => Promise<string>;

/**
 * Current GA Gemini model — used for BOTH bulk generation and the editorial QA pass.
 * 3.5-flash is the newest frontier-class Flash and outperforms the older 3.1-pro, so one
 * model serves both tiers. Override with GEMINI_MODEL (generation) / GEMINI_QA_MODEL (QA).
 */
export const DEFAULT_GEN_MODEL = "gemini-3.5-flash";
/** The model used for the editorial QA pass. Same frontier Flash. Override with GEMINI_QA_MODEL. */
export const DEFAULT_QA_MODEL = "gemini-3.5-flash";

/** The IMAGE-generation model (VL-2) — Imagen 4 fast. Override with GEMINI_IMAGE_MODEL. */
export const DEFAULT_IMAGE_MODEL = "imagen-4.0-fast-generate-001";

/** The MUSIC model (GA-MUSIC) — Lyria realtime. Override with GEMINI_MUSIC_MODEL. */
export const DEFAULT_MUSIC_MODEL = "models/lyria-realtime-exp";

/** The VIDEO model (GA-VIDEO) — Veo. Override with GEMINI_VIDEO_MODEL. */
export const DEFAULT_VIDEO_MODEL = "veo-3.0-generate-001";

/** Generate one short video → raw mp4 bytes, or null on no video. (impl, key-gated.) */
export type GenerateVideoFn = (prompt: string) => Promise<Uint8Array | null>;

/**
 * Build a Veo video generator (GA-VIDEO, key-gated). generateVideos returns a long-running operation; this
 * polls it to completion, then returns the first video's decoded mp4 bytes (inline videoBytes, or downloaded
 * from its uri). Offline tooling — never called at sim runtime. `pollMs`/`maxPolls` bound the wait.
 */
export function geminiGenerateVideo(
  apiKey: string,
  model = DEFAULT_VIDEO_MODEL,
  pollMs = 10_000,
  maxPolls = 60,
): GenerateVideoFn {
  if (!apiKey)
    throw new Error("geminiGenerateVideo: missing API key — video generation needs a Gemini key");
  const ai = new GoogleGenAI({ apiKey });
  return async (prompt) => {
    let op = await ai.models.generateVideos({
      model,
      source: { prompt },
      config: { numberOfVideos: 1 },
    });
    for (let i = 0; i < maxPolls && !op.done; i++) {
      await new Promise((r) => setTimeout(r, pollMs));
      op = await ai.operations.getVideosOperation({ operation: op });
    }
    // Distinguish the three "no bytes" cases so a slow Veo run is debuggable (review: flatten-to-null hid them):
    // a surfaced op.error is a real failure (throw, loud); a still-running op is a timeout (throw, name the bound);
    // a done op with no video is a genuine empty result (return null, the soft "produced nothing" path).
    if (op.error) {
      throw new Error(
        `geminiGenerateVideo: Veo operation failed — ${op.error.message ?? "unknown error"}`,
      );
    }
    if (!op.done) {
      throw new Error(
        `geminiGenerateVideo: Veo operation did not finish within ${maxPolls} polls (${(maxPolls * pollMs) / 1000}s)`,
      );
    }
    const video = op.response?.generatedVideos?.[0]?.video;
    if (!video) return null;
    if (video.videoBytes) return Buffer.from(video.videoBytes, "base64");
    // A uri result must be fetched with the key. Pass it in the x-goog-api-key HEADER, never as a `?key=` query
    // param — a query string leaks the secret into network/server logs and history (CWE-598; review: amazon-q).
    if (video.uri) {
      const res = await fetch(video.uri, { headers: { "x-goog-api-key": apiKey } });
      if (!res.ok) return null;
      return new Uint8Array(await res.arrayBuffer());
    }
    return null;
  };
}

/** Lyria streams 48kHz stereo 16-bit PCM. The capture wraps the concatenated chunks in a WAV with this format. */
export const LYRIA_SAMPLE_RATE = 48_000;
export const LYRIA_CHANNELS = 2;

/** Capture `seconds` of a Lyria score for a prompt → raw concatenated PCM bytes (s16le, 48kHz stereo). */
export type CaptureMusicFn = (prompt: string, seconds: number) => Promise<Uint8Array>;

/**
 * Build a Lyria music-capture function (GA-MUSIC, key-gated). Connects to the realtime music stream, sets
 * the weighted prompt, plays for `seconds`, concatenates the base64 PCM audio chunks, and returns the raw
 * PCM (the offline script wraps it in a WAV/OGG). Offline tooling only — never called at sim runtime.
 */
export function geminiCaptureMusic(apiKey: string, model = DEFAULT_MUSIC_MODEL): CaptureMusicFn {
  if (!apiKey)
    throw new Error("geminiCaptureMusic: missing API key — music capture needs a Gemini key");
  const ai = new GoogleGenAI({ apiKey, apiVersion: "v1alpha" });
  return async (prompt, seconds) => {
    const chunks: Buffer[] = [];
    let closed = false;
    const session = await ai.live.music.connect({
      model,
      callbacks: {
        onmessage: (msg) => {
          for (const c of msg.serverContent?.audioChunks ?? []) {
            if (c.data) chunks.push(Buffer.from(c.data, "base64"));
          }
        },
        onerror: () => {
          closed = true;
        },
        onclose: () => {
          closed = true;
        },
      },
    });
    await session.setWeightedPrompts({ weightedPrompts: [{ text: prompt, weight: 1 }] });
    session.play();
    // Collect for `seconds` (the stream is realtime ~1×), then stop. A small poll keeps it simple + bounded.
    const deadline = seconds * 1000;
    const step = 250;
    for (let t = 0; t < deadline && !closed; t += step) {
      await new Promise((r) => setTimeout(r, step));
    }
    // Guard + settle stop(): if the session already closed (onerror/onclose set `closed`, the path that exits
    // the poll early), stop() can throw OR (the SDK is experimental, typed `void` but may return a promise)
    // reject — both would crash the capture sweep. `Promise.resolve(...)` awaits a promise if one is returned
    // and no-ops a void, and the await+catch absorbs either failure (review: Amazon-Q + the linter's no-await).
    if (!closed) {
      try {
        await Promise.resolve(session.stop());
      } catch {
        // already closed
      }
    }
    return Buffer.concat(chunks);
  };
}

/** Generate one image → raw PNG/JPEG bytes (Uint8Array), or null on no image. (impl, key-gated.) */
export type GenerateImageFn = (prompt: string) => Promise<Uint8Array | null>;

/**
 * Build a live image generator backed by Imagen (VL-2 — the visual layer). Throws without a key. Returns
 * the first generated image's decoded bytes (the SDK gives base64), or null if the model produced none.
 */
export function geminiGenerateImage(apiKey: string, model = DEFAULT_IMAGE_MODEL): GenerateImageFn {
  if (!apiKey)
    throw new Error("geminiGenerateImage: missing API key — image generation needs a Gemini key");
  const ai = new GoogleGenAI({ apiKey });
  return async (prompt) => {
    const res = await ai.models.generateImages({
      model,
      prompt,
      config: { numberOfImages: 1 },
    });
    const b64 = res?.generatedImages?.[0]?.image?.imageBytes;
    return b64 ? Buffer.from(b64, "base64") : null;
  };
}

/**
 * Build a live GenerateFn backed by Gemini. Throws if no key — generation is opt-in
 * and never silently no-ops. `model` defaults to the current GA Gemini model id.
 */
export function geminiGenerate(apiKey: string, model = DEFAULT_GEN_MODEL): GenerateFn {
  if (!apiKey) throw new Error("geminiGenerate: missing API key — generation needs a Gemini key");
  const ai = new GoogleGenAI({ apiKey });
  return async (system, prompt) => {
    const res = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { systemInstruction: system, responseMimeType: "application/json" },
    });
    return res.text ?? "";
  };
}

/** Parse a model response (expected: a JSON array of event objects) into raw items. */
export function parseGenerated(text: string): unknown[] {
  // Tolerate accidental markdown fences or leading prose by extracting the array.
  const trimmed = text.trim();
  const start = trimmed.indexOf("[");
  const end = trimmed.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return [];
  try {
    const arr = JSON.parse(trimmed.slice(start, end + 1));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** Extract a single JSON OBJECT from a generation (the scene mode emits one act-file object, not an array). */
export function parseGeneratedObject(text: string): unknown | null {
  const trimmed = text.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
}
