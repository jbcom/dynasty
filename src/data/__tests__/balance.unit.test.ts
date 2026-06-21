import { describe, expect, it } from "vitest";
import { EraEventsSchema, type GameEvent } from "../../sim/schema";

/**
 * DE-3a — balance guards: no choice should be a STRICT FREE LUNCH.
 *
 * A choice is "strictly dominant" if, compared to a sibling, it is at least as
 * good on every meter (treating heat as a cost — more heat is worse) AND
 * strictly better on at least one, while offering NO distinguishing flags or
 * personality shaping that would justify the sibling as a different *kind* of
 * decision. When that holds, the sibling is a trap with no reason to ever pick
 * it — the choice carries no real tradeoff. Forks (choices that set different
 * flags / shape personality differently) are legitimate even when meters look
 * one-sided, because the decision is about WHICH PATH, not which payoff.
 */

const eraModules = import.meta.glob("../eras/**/*.json", { eager: true }) as Record<
  string,
  { default: unknown }
>;

function allEvents(): GameEvent[] {
  return Object.entries(eraModules)
    .filter(([p]) => !p.endsWith("index.json"))
    .flatMap(([, m]) => EraEventsSchema.parse((m as { default: unknown }).default).events);
}

const METERS = ["money", "power", "reputation", "loyalty", "health", "heat"] as const;

/** Signed "goodness" of a meter delta — heat is a cost, so its sign flips. */
function good(meter: string, v: number): number {
  return meter === "heat" ? -v : v;
}

/** Does choice A weakly dominate B on all meters and strictly on at least one? */
function dominates(a: GameEvent["choices"][number], b: GameEvent["choices"][number]): boolean {
  let strictlyBetter = false;
  for (const m of METERS) {
    const av = good(m, a.effects[m] ?? 0);
    const bv = good(m, b.effects[m] ?? 0);
    if (av < bv) return false; // A worse on some meter → not dominant
    if (av > bv) strictlyBetter = true;
  }
  return strictlyBetter;
}

/** A choice is a "distinct kind of decision" if it shapes flags/personality. */
function hasIdentity(c: GameEvent["choices"][number]): boolean {
  return (c.setFlags?.length ?? 0) > 0 || Object.keys(c.personality ?? {}).length > 0;
}

describe("DE-3a — no strictly-dominant free-lunch choices", () => {
  it("no choice strictly dominates a sibling without either of them carrying a distinct identity", () => {
    const offenders: string[] = [];
    for (const ev of allEvents()) {
      const cs = ev.choices;
      for (let i = 0; i < cs.length; i++) {
        for (let j = 0; j < cs.length; j++) {
          if (i === j) continue;
          const a = cs[i];
          const b = cs[j];
          if (!a || !b) continue;
          // A trap exists only if A dominates B AND neither offers a distinct
          // path identity (flags/personality) that would justify B's existence.
          if (dominates(a, b) && !hasIdentity(a) && !hasIdentity(b)) {
            offenders.push(`${ev.id}: "${a.id}" strictly dominates "${b.id}" (pure free lunch)`);
          }
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
