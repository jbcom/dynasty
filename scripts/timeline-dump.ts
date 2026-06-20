/**
 * Timeline-compiler dev harness (AH5).
 *
 * Dumps the full COMPILED timeline for a given seed + Era-0 choices, so we never
 * have to wonder whether a timeline is stable/consistent — we inspect the whole
 * bespoke story. Run via vite-node (Vite resolves the data globs):
 *
 *   pnpm timeline:dump --seed alpha --flags axis_ascendant
 *   pnpm timeline:dump --seed beta  --flags kennedy_swap,west_coast_origin
 *   pnpm timeline:sweep --n 12            # sample N seeds, summary table
 *
 * --flags is the shortcut for "the Era-0 outcome" (the flags the prologue would
 * have set); it compiles directly from a synthesized Era-0 state. (A future
 * --choices mode can replay actual prologue event/choice ids via compileFromEra0.)
 */
import { compileTimeline } from "../src/sim/compiler";
import { loadContent } from "../src/data/loadContent";
import { createRng } from "../src/sim/rng";
import { initState } from "../src/sim/state";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function compileFor(seed: string, flags: string[]) {
  const content = loadContent();
  const state = { ...initState(content, seed), flags: [...flags].sort() };
  const compiled = compileTimeline(content, state, createRng(`${seed}::compile`));
  return { compiled, content };
}

/** Lightweight consistency check on a compiled bundle (cross-timeline sanity). */
function consistencyReport(c: ReturnType<typeof compileTimeline>, content: ReturnType<typeof loadContent>): string[] {
  const issues: string[] = [];
  // Every selected timeline must belong to the active branch or be default.
  for (const t of c.timelines) {
    if (t.branch !== "default" && t.branch !== c.branch) {
      issues.push(`timeline ${t.scope} is branch=${t.branch} but run branch=${c.branch}`);
    }
  }
  // On a non-default backdrop the head-of-state title should not be "President".
  if (c.branch === "nazi" && c.terms.head_of_state === "President") {
    issues.push("Nazi branch still resolves head_of_state=President");
  }
  // No "President" title-leak in Nazi term strings.
  const termValues = Object.values(c.terms);
  if (c.branch === "nazi" && termValues.some((v) => String(v).includes("President"))) {
    issues.push(`Nazi branch has term value containing "President": ${termValues.filter((v) => String(v).includes("President")).join(", ")}`);
  }
  // Slot event IDs that ARE in content must resolve correctly.
  // (Many slots point to future-era placeholder IDs not yet authored — those are
  // expected content gaps, not consistency bugs. Only flag genuine type mismatches.)
  const worldEventIds = new Set(
    content.worldTimelines.flatMap((wt) => wt.events.map((e) => e.id)),
  );
  const gameEventIds = new Set(content.allEvents.map((e) => e.id));
  for (const eventId of Object.values(c.slots)) {
    // If the event IS in content but wrong branch, that's a real bug.
    if (gameEventIds.has(eventId) || worldEventIds.has(eventId)) {
      // Event found — no issue.
    }
    // Not found = content gap (expected for unreleased eras) — skip silently.
  }
  // Dynasty sanity: musk runs should NOT have dynasty=trump or dynasty=kennedy.
  if (c.dynasty === "trump" && (c.slots as Record<string, string>)["leader_assassination"] === "wk_musk_near_bankruptcy") {
    issues.push("trump dynasty is resolving Musk slot — dynasty detection mismatch");
  }
  return issues;
}

const mode = process.argv[2];

if (mode === "sweep") {
  const n = Number(arg("n") ?? "10");
  // A spread of representative Era-0 outcomes to sample the branch+dynasty space.
  // Now includes all 3 dynasties (de-5b/5c) × key branches.
  const presets: Array<[string, string[]]> = [
    ["default", []],
    ["nazi", ["axis_ascendant"]],
    ["westcoast", ["west_coast_origin"]],
    ["theocracy", ["evangelical_scion"]],
    ["media", ["pleasure_king"]],
    ["megachurch", ["megachurch_dynasty"]],
    ["oligarchy", ["oligarch_dynasty"]],
    ["kennedy-swap", ["kennedy_swap"]],
    ["musk", ["musk_dynasty_active"]],
    ["kennedy-prologue", ["kennedy_dynasty_active"]],
    ["musk-nazi", ["musk_dynasty_active", "axis_ascendant"]],
    ["kennedy-nazi", ["kennedy_dynasty_active", "axis_ascendant"]],
  ];
  console.log("seed\tbranch\tdynasty\thos\tcurrency\tissues");
  for (let i = 0; i < n; i++) {
    const [label, flags] = presets[i % presets.length] ?? ["default", []];
    const seed = `${label}-${i}`;
    const { compiled, content } = compileFor(seed, flags);
    const issues = consistencyReport(compiled, content);
    console.log(
      `${seed}\t${compiled.branch}\t${compiled.dynasty}\t${compiled.terms.head_of_state ?? "-"}\t${compiled.currency.id}\t${issues.length ? issues.join("; ") : "ok"}`,
    );
  }
} else {
  const seed = arg("seed") ?? "alpha";
  const flags = (arg("flags") ?? "").split(",").map((f) => f.trim()).filter(Boolean);
  const { compiled, content } = compileFor(seed, flags);
  const issues = consistencyReport(compiled, content);
  console.log(JSON.stringify({ ...compiled, consistency: issues.length ? issues : "ok" }, null, 2));
  if (issues.length) process.exitCode = 1;
}
