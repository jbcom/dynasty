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
