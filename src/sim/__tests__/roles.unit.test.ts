import { describe, expect, it } from "vitest";
import { buildContent } from "../content";
import { resolveRoles } from "../roles";
import { initState } from "../state";
import { validRaw } from "./fixtures";

const base = () => initState(buildContent(validRaw()), "seed");

function withFlags(...flags: string[]) {
  return { ...base(), flags: [...flags].sort() };
}

describe("role-swap invariant (P7)", () => {
  it("leaves early/childhood states untouched (no role resolved yet)", () => {
    const s = withFlags("born_advantaged");
    expect(resolveRoles(s)).toBe(s); // identity — nothing to derive
  });

  it("Donald consolidating power makes him political and Musk commercial", () => {
    const next = resolveRoles(withFlags("consolidated_power"));
    expect(next.flags).toContain("trump_political");
    expect(next.flags).toContain("musk_commercial_path");
    expect(next.flags).not.toContain("role_flip");
    expect(next.flags).not.toContain("trump_commercial_path");
  });

  it("the early-1990s presidency branch counts as Donald taking the political road", () => {
    const next = resolveRoles(withFlags("early_presidency"));
    expect(next.flags).toContain("trump_political");
    expect(next.flags).toContain("musk_commercial_path");
  });

  it("Musk taking power flips Donald to the commercial path", () => {
    const next = resolveRoles(withFlags("musk_takes_power"));
    expect(next.flags).toContain("musk_political");
    expect(next.flags).toContain("trump_commercial_path");
    expect(next.flags).toContain("role_flip");
  });

  it("the flip wins even if Donald also has a political signal (one seat of power)", () => {
    const next = resolveRoles(withFlags("musk_takes_power", "consolidated_power"));
    expect(next.flags).toContain("musk_political");
    expect(next.flags).toContain("trump_commercial_path");
    // Mutual exclusion: he cannot be both political and on the commercial path.
    expect(next.flags).not.toContain("trump_political");
  });

  it("an explicit commercial choice commits Donald to the empire without a flip", () => {
    const next = resolveRoles(withFlags("walked_away"));
    expect(next.flags).toContain("trump_commercial_path");
    expect(next.flags).not.toContain("role_flip");
    expect(next.flags).not.toContain("musk_political");
  });

  it("is idempotent — re-resolving a settled state changes nothing", () => {
    const once = resolveRoles(withFlags("musk_takes_power"));
    const twice = resolveRoles(once);
    expect(twice.flags).toEqual(once.flags);
  });
});
