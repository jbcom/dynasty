/**
 * GA-NEWS (GN-2) — load the GenAI period "Dispatches" (generated offline by scripts/genai-news.ts, keyed
 * era × mood via newsDispatchKey). Bundled JSON map, like the dossier briefs + scene corpus — no API at
 * runtime (sim purity). Returns [] for an unauthored key, so the NewsTicker simply shows no dispatch layer.
 */
import dispatches from "../data/genaiNews.json" with { type: "json" };

const MAP = dispatches as Record<string, string[]>;

/** The period dispatch headlines for an (era × mood) key, or [] if not generated yet. */
export function loadNewsDispatch(key: string): string[] {
  return MAP[key] ?? [];
}
