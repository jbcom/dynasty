import { describe, expect, it } from "vitest";
import slotsJson from "../../data/slots.json";
import { SlotsFileSchema } from "../schema";
import { resolveSlot, resolveSlots } from "../slots";

const slots = SlotsFileSchema.parse(slotsJson).slots;
const slotById = (id: string) => {
  const s = slots.find((x) => x.id === id);
  if (!s) throw new Error(`no slot ${id}`);
  return s;
};

describe("slot-event resolution (alt-history AH7)", () => {
  it("the real slots.json validates and defines the leader-assassination archetype", () => {
    expect(slotById("leader_assassination").default.event).toBe("ev_jfk_assassinated");
  });

  it("dynasty resolution wins: the leader-assassination slot is Fred Trump on the Trump path", () => {
    const slot = slotById("leader_assassination");
    expect(resolveSlot(slot, "default", "trump").event).toBe("ev_fred_assassinated");
    // ...and IS JFK on the Kennedy dynasty path.
    expect(resolveSlot(slot, "default", "kennedy").event).toBe("ev_jfk_assassinated");
  });

  it("branch resolution applies when no dynasty override: Nazi → a Commissar purge", () => {
    const slot = slotById("leader_assassination");
    // musk has no dynasty override here, so the Nazi branch resolution applies.
    expect(resolveSlot(slot, "nazi", "musk").event).toBe("wun_commissar_purge_1955");
  });

  it("falls back to default when neither dynasty nor branch overrides", () => {
    const slot = slotById("the_crash");
    expect(resolveSlot(slot, "westcoast", "musk").event).toBe("ev_great_depression_1929");
    expect(resolveSlot(slot, "nazi", "musk").event).toBe("wun_reich_war_economy");
  });

  it("resolveSlots maps every archetype to a concrete event for a branch+dynasty", () => {
    const map = resolveSlots(slots, "nazi", "trump");
    // dynasty(trump) wins over the nazi branch for leader_assassination
    expect(map.leader_assassination).toBe("ev_fred_assassinated");
    // the_crash has no trump dynasty override → nazi branch resolution
    expect(map.the_crash).toBe("wun_reich_war_economy");
    expect(Object.keys(map).length).toBe(slots.length);
  });
});
