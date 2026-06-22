/**
 * GENAI EDITORIAL QA PASS — lift EXISTING act files to frontier literary quality IN PLACE.
 *
 * The bulk sweep (`genai-expand --type scene`) drafts acts; this pass re-reads each act file already
 * on disk, asks the QA model to REVISE it (richer prose, sharper voice, biting choices) while
 * preserving the exact skeleton (ids, scene order, sense, beat/decision shape), then re-runs the SAME
 * validation gate (`validateSceneFile`: schema + leak floor + act-id match). On success the revised
 * act is merged back over the original; on ANY failure the original is kept untouched — the pass never
 * degrades the corpus.
 *
 * Concurrency: a bounded pool so many acts revise at once. Idempotent + resumable — re-running re-QAs
 * (the model polishes again); pass `--cls`/`--wave` to scope, or default to every act file.
 *
 * Usage:
 *   GEMINI_API_KEY=… pnpm genai:qa                      # dry-run over every act file (no write)
 *   GEMINI_API_KEY=… pnpm genai:qa --write              # QA + overwrite every act file
 *   GEMINI_API_KEY=… pnpm genai:qa --cls middle --write # only the middle track
 *   GEMINI_API_KEY=… pnpm genai:qa --wave baghdad --write
 *   GEMINI_MODEL / GEMINI_QA_MODEL override the model id.
 */

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  DEFAULT_QA_MODEL,
  geminiGenerate,
  parseGeneratedObject,
} from "../src/sim/genai/client";
import type { Rung } from "../src/sim/classRung";
import type { Archetype } from "../src/sim/slots";
import {
  buildQaPrompt,
  mergeSceneFile,
  qaSystemInstruction,
  type SceneRequest,
  validateSceneFile,
} from "../src/sim/genai/scene";

const argv = process.argv.slice(2);
const WRITE = argv.includes("--write");
const arg = (name: string, dflt?: string): string | undefined => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};
/** Bounded concurrency — keep well under the API's rate ceiling while keeping the pass fast. */
const CONCURRENCY = Number(arg("concurrency", "4"));

const SAGA_ROOT = "src/data/saga";
/** Act files are `<wave>/<archetype>.<cls>.act.json`. Parse the cell back out of the path. */
const ACT_FILE = /^(?<archetype>[a-z_]+)\.(?<cls>poor|middle)\.act\.json$/;

interface ActFileRef {
  path: string;
  wave: string;
  archetype: Archetype;
  cls: Rung;
}

/** Enumerate every on-disk act file, scoped by optional --wave / --cls / --archetype filters. */
function discoverActFiles(): ActFileRef[] {
  const onlyWave = arg("wave");
  const onlyCls = arg("cls");
  const onlyArch = arg("archetype");
  const refs: ActFileRef[] = [];
  for (const wave of readdirSync(SAGA_ROOT, { withFileTypes: true })) {
    if (!wave.isDirectory() || wave.name === "codex") continue;
    if (onlyWave && wave.name !== onlyWave) continue;
    for (const f of readdirSync(join(SAGA_ROOT, wave.name))) {
      const m = ACT_FILE.exec(f);
      if (!m?.groups) continue;
      const { archetype, cls } = m.groups;
      if (onlyCls && cls !== onlyCls) continue;
      if (onlyArch && archetype !== onlyArch) continue;
      refs.push({
        path: join(SAGA_ROOT, wave.name, f),
        wave: wave.name,
        archetype: archetype as Archetype,
        cls: cls as Rung,
      });
    }
  }
  return refs.sort((a, b) => a.path.localeCompare(b.path));
}

/** The reach tiers present in an act file — every act's tier. The QA prompt revises the whole file. */
function tiersIn(file: { acts?: Array<{ tier?: number }> }): number[] {
  return (file.acts ?? []).map((a) => a.tier ?? 0);
}

type Generate = ReturnType<typeof geminiGenerate>;

/** Retry transient API errors (429/5xx/timeout) with backoff; surface real errors. */
async function callResilient(
  generate: Generate,
  system: string,
  prompt: string,
  label: string,
): Promise<string | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await generate(system, prompt);
    } catch (e) {
      const transient = /\b(429|500|502|503|504|overload|rate|timeout|ECONN|ETIMEDOUT)\b/i.test(
        (e as Error).message,
      );
      if (!transient || attempt === 3) {
        console.error(`  ✗ ${label}: ${(e as Error).message} (gave up after ${attempt + 1})`);
        return null;
      }
      const waitMs = 2000 * 2 ** attempt;
      console.error(`  … ${label}: transient (${(e as Error).message}); retry in ${waitMs}ms`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  return null;
}

/** QA one act file: revise → validate each act → merge accepted revisions, keep originals on failure. */
async function qaFile(ref: ActFileRef, generate: Generate): Promise<"revised" | "kept" | "failed"> {
  const label = `${ref.wave}/${ref.archetype}.${ref.cls}`;
  let existing: { acts?: unknown[]; scenes?: unknown[] };
  try {
    existing = JSON.parse(readFileSync(ref.path, "utf8"));
  } catch (e) {
    console.error(`  ✗ ${label}: unreadable (${(e as Error).message})`);
    return "failed";
  }

  let working: unknown = existing;
  let anyRevised = false;
  // Revise per tier-act so a single bad act can't sink the whole file's polish.
  for (const tier of tiersIn(existing as { acts?: Array<{ tier?: number }> })) {
    const req: SceneRequest = { wave: ref.wave, cls: ref.cls, archetype: ref.archetype, tier };
    const raw = await callResilient(
      generate,
      qaSystemInstruction(),
      buildQaPrompt(req, working),
      `${label} t${tier}`,
    );
    if (!raw) continue; // keep prior version for this tier
    const obj = parseGeneratedObject(raw);
    if (!obj) {
      console.error(`  ✗ ${label} t${tier}: no JSON object in response (kept)`);
      continue;
    }
    const v = validateSceneFile(obj, req);
    if (!v.ok) {
      console.error(`  ✗ ${label} t${tier}: ${v.reasons.join("; ")} (kept original)`);
      continue;
    }
    working = mergeSceneFile(working, v.file); // revised act replaces the original by id
    anyRevised = true;
  }

  if (!anyRevised) return "kept";
  if (!WRITE) {
    console.error(`  ✓ ${label}: would revise (dry-run)`);
    return "revised";
  }
  writeFileSync(ref.path, `${JSON.stringify(working, null, 2)}\n`);
  console.error(`  ✓ ${label}: revised → ${ref.path}`);
  return "revised";
}

/** Run `worker` over `items` with at most `n` in flight at once. */
async function pool<T>(items: T[], n: number, worker: (item: T) => Promise<void>): Promise<void> {
  let idx = 0;
  const runners = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (idx < items.length) {
      const i = idx++;
      await worker(items[i]);
    }
  });
  await Promise.all(runners);
}

async function main() {
  const key = process.env.GEMINI_API_KEY ?? "";
  if (!key) {
    console.error("GEMINI_API_KEY not set — QA is opt-in and needs a key.");
    process.exit(1);
  }
  const model = process.env.GEMINI_QA_MODEL || process.env.GEMINI_MODEL || DEFAULT_QA_MODEL;
  const generate = geminiGenerate(key, model);
  const files = discoverActFiles();
  console.error(
    `QA editorial pass on model ${model}: ${files.length} act file(s)` +
      `${WRITE ? "" : " (DRY RUN — pass --write to overwrite)"}, concurrency ${CONCURRENCY}…`,
  );

  const tally = { revised: 0, kept: 0, failed: 0 };
  await pool(files, CONCURRENCY, async (ref) => {
    const r = await qaFile(ref, generate);
    tally[r] += 1;
  });

  console.error(
    `\nQA complete: ${tally.revised} revised, ${tally.kept} kept, ${tally.failed} failed.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
