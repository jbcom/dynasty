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
 * Build a live GenerateFn backed by Gemini. Throws if no key — generation is opt-in
 * and never silently no-ops. `model` defaults to a current Gemini model id.
 */
export function geminiGenerate(apiKey: string, model = "gemini-2.5-flash"): GenerateFn {
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
