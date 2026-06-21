/**
 * FD-11 — the Gemini client wrapper for the dev AI toolkit. Thin, dependency-light
 * wrapper over @google/genai: schema-forced generation + the critique call. All
 * jobs (gap-fill, slot-detect, trope-retag, error-correct) call generateJSON.
 *
 * Needs GEMINI_API_KEY in the env (dev-only; never bundled into the game).
 */
import { GoogleGenAI } from "@google/genai";
import { buildCritiquePrompt } from "./prompt.mjs";

// gemini-3.5-flash handles BOTH bulk generation AND the review/self-critique pass
// (it's the current model available on this key; 3.5-pro / 3-*-preview 404 here).
// The critique pass runs it with thinking enabled for extra rigor (see critiqueEvent).
const FLASH = "gemini-3.5-flash"; // bulk generation
const PRO = "gemini-3.5-flash"; // self-critique / review (thinking on)

let _ai = null;
function ai() {
  if (!_ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY not set — the extrapolate toolkit is dev-only.");
    }
    _ai = new GoogleGenAI({});
  }
  return _ai;
}

/**
 * Generate schema-forced JSON. `responseJsonSchema` makes Gemini return valid
 * JSON matching the schema; we still zod-validate downstream before committing.
 */
export async function generateJSON({ system, prompt, schema, model = FLASH, thinking }) {
  const res = await ai().models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: system,
      responseMimeType: "application/json",
      responseJsonSchema: schema,
      ...(thinking !== undefined ? { thinkingConfig: { thinkingBudget: thinking } } : {}),
    },
  });
  const text = res.text ?? "";
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(`Gemini returned non-JSON: ${String(e)}\n--- raw ---\n${text.slice(0, 500)}`);
  }
}

const CRITIQUE_SCHEMA = {
  type: "object",
  properties: {
    score: { type: "integer", description: "0-100 quality score" },
    keep: { type: "boolean", description: "true only if score>=70 and it adds something new" },
    why: { type: "string", description: "one-line justification" },
  },
  required: ["score", "keep", "why"],
};

/**
 * The self-critique pass (PRO model): score one generated event for coherence,
 * tone, choice-tradeoff quality, and non-duplication vs recent events. Returns
 * { score, keep, why }. Used to gate which generated events commit.
 */
export async function critiqueEvent({ event, recentEvents }) {
  return generateJSON({
    system:
      "You are a ruthless but fair quality reviewer for the Dynasty game. Score honestly; reject the mediocre.",
    prompt: buildCritiquePrompt({ event, recentEvents }),
    schema: CRITIQUE_SCHEMA,
    model: PRO,
    thinking: 1024,
  });
}

export { FLASH, PRO };
