import { describe, expect, it } from "vitest";
import { buildContent } from "../content";
import {
  applyDelta,
  clampMeter,
  initMeters,
  isCritHigh,
  isCritLow,
  meterFraction,
} from "../meters";
import type { MeterDef } from "../schema";
import { validRaw } from "./fixtures";

const meters = (): MeterDef[] => buildContent(validRaw()).meters;
const byId = (id: string): MeterDef => {
  const def = meters().find((m) => m.id === id);
  if (!def) throw new Error(`no meter ${id}`);
  return def;
};

describe("meters", () => {
  it("initMeters seeds every meter at its clamped start", () => {
    const m = initMeters(meters());
    expect(m.health).toBe(100);
    expect(m.money).toBe(1000);
    expect(m.reputation).toBe(0);
  });

  it("clampMeter respects min and max", () => {
    const health = byId("health");
    expect(clampMeter(health, 150)).toBe(100);
    expect(clampMeter(health, -20)).toBe(0);
    expect(clampMeter(health, 55)).toBe(55);
  });

  it("applyDelta is pure and clamps results", () => {
    const m = initMeters(meters());
    const next = applyDelta(meters(), m, { health: -200, power: 10 });
    expect(next.health).toBe(0); // clamped at min
    expect(next.power).toBe(15);
    expect(m.health).toBe(100); // original untouched
  });

  it("applyDelta allows negative reputation (signed meter)", () => {
    const m = initMeters(meters());
    const next = applyDelta(meters(), m, { reputation: -40 });
    expect(next.reputation).toBe(-40);
  });

  it("applyDelta ignores unknown meter keys", () => {
    const m = initMeters(meters());
    const next = applyDelta(meters(), m, { bogus: 5 } as unknown as Record<string, number>);
    expect(next).toEqual(m);
  });

  it("meterFraction is 0..1 and monotonic for linear meters", () => {
    const power = byId("power");
    expect(meterFraction(power, 0)).toBe(0);
    expect(meterFraction(power, 100)).toBe(1);
    expect(meterFraction(power, 50)).toBeCloseTo(0.5, 5);
  });

  it("meterFraction handles log-scaled money", () => {
    const money = byId("money");
    const low = meterFraction(money, 1000);
    const high = meterFraction(money, 1e9);
    expect(high).toBeGreaterThan(low);
    expect(high).toBeLessThanOrEqual(1);
    expect(low).toBeGreaterThanOrEqual(0);
  });

  it("crit bands flag correctly", () => {
    const health = byId("health");
    const heat = byId("heat");
    expect(isCritLow(health, 10)).toBe(true);
    expect(isCritLow(health, 50)).toBe(false);
    expect(isCritHigh(heat, 85)).toBe(true);
    expect(isCritHigh(heat, 20)).toBe(false);
  });
});
