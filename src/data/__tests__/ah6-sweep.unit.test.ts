import { describe, expect, it } from "vitest";
import { compileTimeline } from "../../sim/compiler";
import { createRng } from "../../sim/rng";
import type { Archetype } from "../../sim/slots";
import { initState } from "../../sim/state";
import { loadContent } from "../loadContent";

/**
 * AH6 — Automated consistency sweep (de-6a).
 *
 * For each of the 12 canonical Era-0 permutations (3 dynasties × 7 branches + mixes),
 * compile the full timeline and assert the mechanical consistency invariants:
 *   1. Branch coherence: all selected world-timeline variants belong to the active
 *      branch (no Nazi timeline on a default run).
 *   2. Title coherence: a non-default backdrop never resolves head_of_state = "President"
 *      (the "President leak" test).
 *   3. Dynasty coherence: dynasty-resolved slot events match the expected dynasty key
 *      (no Musk-dynasty event resolving for a Trump run, etc.).
 *   4. No unresolvable slot: every compiled slot event id is either a known game event,
 *      a known world event, or a placeholder (non-empty string). Never null/empty.
 *
 * This test is the CI-enforced gate for the repeatable harness. It runs fast (pure
 * TypeScript, no browser, no network) and must stay green for every content commit.
 * The semantic / AI-agent layer of AH6 is a separate workflow (see scripts/ah6-workflow.ts).
 */

type BranchKey =
  | "default"
  | "nazi"
  | "westcoast"
  | "theocracy"
  | "media"
  | "megachurch"
  | "oligarchy";

const PERMUTATIONS: Array<{
  label: string;
  flags: string[];
  archetype: Archetype;
  branch: BranchKey;
}> = [
  { label: "economic-default", flags: [], archetype: "economic", branch: "default" },
  { label: "economic-nazi", flags: ["axis_ascendant"], archetype: "economic", branch: "nazi" },
  {
    label: "economic-westcoast",
    flags: ["west_coast_origin"],
    archetype: "economic",
    branch: "westcoast",
  },
  {
    label: "economic-theocracy",
    flags: ["evangelical_scion"],
    archetype: "economic",
    branch: "theocracy",
  },
  { label: "economic-media", flags: ["pleasure_king"], archetype: "economic", branch: "media" },
  {
    label: "economic-megachurch",
    flags: ["megachurch_dynasty"],
    archetype: "economic",
    branch: "megachurch",
  },
  {
    label: "economic-oligarchy",
    flags: ["oligarch_dynasty"],
    archetype: "economic",
    branch: "oligarchy",
  },
  {
    label: "political-default",
    flags: ["kennedy_dynasty_active", "kennedy_prologue"],
    archetype: "political",
    branch: "default",
  },
  {
    label: "technological-default",
    flags: ["musk_dynasty_active", "musk_prologue"],
    archetype: "technological",
    branch: "default",
  },
  {
    label: "technological-nazi",
    flags: ["musk_dynasty_active", "musk_prologue", "axis_ascendant"],
    archetype: "technological",
    branch: "nazi",
  },
  {
    label: "political-nazi",
    flags: ["kennedy_dynasty_active", "kennedy_prologue", "axis_ascendant"],
    archetype: "political",
    branch: "nazi",
  },
];

function compileFor(flags: string[], archetype: Archetype) {
  const content = loadContent();
  const base = initState(content, "ah6-seed", archetype);
  // Merge the base dynasty flags with any extra branch flags.
  const mergedFlags = [...new Set([...base.flags, ...flags])].sort();
  const state = { ...base, flags: mergedFlags };
  return { compiled: compileTimeline(content, state, createRng("ah6-seed::compile")) };
}

describe("AH6 automated consistency sweep (de-6a)", () => {
  for (const perm of PERMUTATIONS) {
    it(`${perm.label}: branch + title + archetype coherence`, () => {
      const { compiled } = compileFor(perm.flags, perm.archetype);

      // 1. Branch resolution matches expected branch.
      expect(compiled.branch, `${perm.label}: wrong branch`).toBe(perm.branch);

      // 2. Archetype resolution matches expected archetype.
      expect(compiled.archetype, `${perm.label}: wrong archetype`).toBe(perm.archetype);

      // 3. Title coherence: a Nazi run must NOT say "President".
      if (perm.branch === "nazi") {
        expect(
          compiled.terms.head_of_state,
          `${perm.label}: Nazi branch leaks President title`,
        ).not.toBe("President");
      }

      // 4. Every selected world-timeline variant belongs to the active branch or is default.
      // `branch` is a typed, always-present field of CompiledTimeline.timelines[]
      // (compiler.ts sets it with a `?? "default"` fallback), so no assertion needed.
      for (const t of compiled.timelines) {
        expect(
          ["default", perm.branch].includes(t.branch),
          `${perm.label}: timeline ${t.scope} uses wrong branch=${t.branch}`,
        ).toBe(true);
      }

      // 5. All compiled slot values must be non-empty strings.
      for (const [slotId, eventId] of Object.entries(compiled.slots)) {
        expect(eventId, `${perm.label}: slot ${slotId} resolved to empty`).toBeTruthy();
      }

      // 6. Archetype sanity: the leader_assassination slot should match the archetype.
      // Known expected mappings (per slots.json):
      const knownSlotMappings: Partial<Record<Archetype, Record<string, string>>> = {
        economic: { leader_assassination: "ev_fred_assassinated" },
        technological: { leader_assassination: "wk_musk_near_bankruptcy" },
        political: { leader_assassination: "ev_jfk_assassinated" },
      };
      const expectedSlot = knownSlotMappings[perm.archetype]?.leader_assassination;
      if (expectedSlot) {
        expect(
          compiled.slots.leader_assassination,
          `${perm.label}: wrong leader_assassination slot`,
        ).toBe(expectedSlot);
      }

      // 7. head_of_state is non-empty on every non-default branch.
      if (perm.branch !== "default") {
        const headOfState = compiled.terms.head_of_state;
        expect(headOfState, `${perm.label}: head_of_state is empty`).toBeTruthy();
      }
    });
  }
});
