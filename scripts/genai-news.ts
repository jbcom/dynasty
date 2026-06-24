/**
 * GENAI NEWS DISPATCHES (GA-NEWS GN-3) — generate the period "Dispatches" headlines via Gemini text, keyed
 * era × mood (newsDispatchKey), into src/data/genaiNews.json (loaded at runtime by loadNewsDispatch — no API
 * at sim runtime). Offline/cached, idempotent. Commit-before-run; the JSON diff is the review.
 *
 *   pnpm vite-node scripts/genai-news.ts -- [--era <band>] [--mood rising|steady|falling] [--force]
 */

import "./env";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { DEFAULT_GEN_MODEL, geminiGenerate } from "../src/sim/genai/client";
import { ERA_BAND_ORDER, type EraBand } from "../src/sim/genai/portrait";
import {
  buildNewsDispatchPrompt,
  type NewsMood,
  newsDispatchKey,
  newsDispatchSystem,
} from "../src/sim/news/genaiNews";

const NEWS_JSON = "src/data/genaiNews.json";

const arg = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const FORCE = process.argv.includes("--force");
const MOODS: NewsMood[] = ["rising", "steady", "falling"];

/** Split the model reply into headline lines. Defensively unwraps a JSON-array reply (some models return
 *  `["h1","h2","h3"]` despite the prompt) + strips code fences + list numbering before splitting. */
function toHeadlines(text: string): string[] {
  const body = text.trim().replace(/^```\w*\s*|\s*```$/g, "");
  // If the model returned a JSON array of strings, use it directly.
  if (body.startsWith("[")) {
    try {
      const arr = JSON.parse(body) as unknown;
      if (Array.isArray(arr)) {
        const lines = arr.filter((x): x is string => typeof x === "string").map((s) => s.trim());
        if (lines.length > 0) return lines.slice(0, 3);
      }
    } catch {
      // not valid JSON — fall through to line splitting
    }
  }
  return body
    .split(/\n+/)
    // Strip a leading list marker AND any trailing markdown emphasis (** or _ from a bolded headline).
    .map((l) =>
      l
        .replace(/^\s*[-*\d.)\]]+\s*/, "")
        .replace(/[*_]+$/, "")
        .trim(),
    )
    .filter((l) => l.length > 0 && l !== "[" && l !== "]")
    .slice(0, 3);
}

async function main(): Promise<void> {
  const key = process.env.GEMINI_API_KEY ?? "";
  if (!key) {
    console.error("GEMINI_API_KEY not set — news dispatch generation needs a key.");
    process.exit(1);
  }
  const genText = geminiGenerate(key, process.env.GEMINI_MODEL || DEFAULT_GEN_MODEL);
  const map: Record<string, string[]> = existsSync(NEWS_JSON)
    ? JSON.parse(readFileSync(NEWS_JSON, "utf8"))
    : {};

  const eraFlag = arg("era") as EraBand | undefined;
  const moodFlag = arg("mood") as NewsMood | undefined;
  const eras = eraFlag ? [eraFlag] : ERA_BAND_ORDER;
  const moods = moodFlag ? [moodFlag] : MOODS;

  let made = 0;
  for (const eraBand of eras) {
    for (const mood of moods) {
      const k = newsDispatchKey(eraBand, mood);
      if (!FORCE && map[k]?.length) {
        console.error(`  · ${k}: exists, skipping`);
        continue;
      }
      const text = await genText(newsDispatchSystem(), buildNewsDispatchPrompt(eraBand, mood));
      const lines = toHeadlines(text);
      if (lines.length === 0) {
        console.error(`  ✗ ${k}: empty`);
        continue;
      }
      map[k] = lines;
      made++;
      console.error(`  ✓ ${k}: ${lines.length} headlines`);
      writeFileSync(NEWS_JSON, `${JSON.stringify(map, null, 2)}\n`);
    }
  }
  console.error(`News dispatch generation complete: ${made} written.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
