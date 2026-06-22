import { buildCorpus, type SagaCorpus } from "../sim/saga/player";
import {
  type ActChapter,
  type CodexEntry,
  CodexEntrySchema,
  SagaFileSchema,
  type Scene,
} from "../sim/saga/schema";

/**
 * Load + validate the NOVEL saga corpus from `src/data/saga/**`. Each `<wave>/<archetype>.act.json`
 * file holds its act chapters + the scenes they reference (Narrative Acts model). The glob is eager
 * so the corpus bundles at build time (no async fetch on a mobile cold start); zod throws loudly on
 * any malformed scene rather than silently serving a half-built act. Codex lore loads separately.
 */
const actGlob = import.meta.glob("./saga/**/*.act.json", { eager: true });
const codexGlob = import.meta.glob("./saga/codex/*.json", { eager: true });

interface RawActFile {
  default: unknown;
}

/** Build the indexed, validated saga corpus from every authored act file. Pure given the glob. */
export function loadSaga(): SagaCorpus {
  const acts: ActChapter[] = [];
  const scenes: Scene[] = [];
  for (const [path, mod] of Object.entries(actGlob)) {
    const parsed = SagaFileSchema.safeParse((mod as RawActFile).default);
    if (!parsed.success) {
      throw new Error(`Invalid saga act file ${path}: ${parsed.error.message}`);
    }
    acts.push(...parsed.data.acts);
    scenes.push(...parsed.data.scenes);
  }
  return buildCorpus(acts, scenes);
}

/** Load the optional codex lore entries (Suzerain briefs) — never required to read in play. */
export function loadCodex(): CodexEntry[] {
  const out: CodexEntry[] = [];
  for (const [path, mod] of Object.entries(codexGlob)) {
    const raw = (mod as RawActFile).default;
    const list = Array.isArray(raw) ? raw : ((raw as { entries?: unknown[] }).entries ?? []);
    for (const e of list) {
      const parsed = CodexEntrySchema.safeParse(e);
      if (!parsed.success) {
        throw new Error(`Invalid codex entry in ${path}: ${parsed.error.message}`);
      }
      out.push(parsed.data);
    }
  }
  return out;
}
