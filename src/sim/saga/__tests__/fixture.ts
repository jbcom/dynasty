import { SagaFileSchema } from "../schema";

/**
 * A self-contained authored act fixture for the saga MODEL tests (player/runner/reader). Using a
 * fixture instead of the live `src/data/saga/**` corpus keeps these tests deterministic — the
 * GenAI-fleshed corpus is regenerated freely, so model tests must not depend on its exact ids/shape.
 * Corpus-integrity tests (loadSaga) test the live data; everything else tests the model on this.
 *
 * Shape mirrors the real model: 3 scenes — a no-decision opening whose weave beats are ALTERNATIVES,
 * a scene with a secondary decision, and a closing scene with a major decision + a succession effect.
 */
export const FIXTURE_ACT = SagaFileSchema.parse({
  acts: [
    {
      id: "act:fix:economic:t0",
      wave: "fix",
      archetype: "economic",
      tier: 0,
      macroAct: "convergence",
      title: "Act I — The Fixture",
      scenes: ["sc:fix:open", "sc:fix:rising", "sc:fix:close"],
    },
  ],
  scenes: [
    {
      id: "sc:fix:open",
      sense: "smell",
      prose: [
        "The hold smells of tar and brine and the breath of too many bodies in too little air, a reek you {family_name}s will carry in memory long after the crossing is done.",
        "Your mother's hands are folded in the dark, and you understand without being told that whatever is built now is built from nothing but will.",
      ],
      beats: [
        {
          prose: ["You count the few coins in the sack the way a priest counts a rosary."],
          choice: {
            text: "Money, you decide, is the only thing that was ever truly safe.",
            motivatorShift: { wealth: 12, power: 6 },
            setFlags: ["counts_the_coin"],
          },
        },
        {
          prose: ["You watch the others instead, and learn whose word the cabin follows."],
          choice: {
            text: "People, you decide, are the only thing that was ever truly safe.",
            motivatorShift: { lineage: 10 },
            setFlags: ["reads_the_room"],
          },
        },
      ],
      next: "sc:fix:rising",
    },
    {
      id: "sc:fix:rising",
      sense: "touch",
      prose: [
        "On the eleventh day a fever moves through the steerage like weather, and the crew stop coming below.",
        "A girl your own age shares her water without being asked; you will remember who is owed what.",
      ],
      decision: {
        tier: "secondary",
        prompt:
          "The crew want hands to carry the dead up to the rail, for a shilling and a place near the air.",
        options: [
          {
            text: "Take the work. A shilling is a shilling.",
            motivatorShift: { wealth: 6, honor: 4 },
            setFlags: ["did_the_hard_work"],
          },
          {
            text: "Stay below with your mother.",
            motivatorShift: { lineage: 8, wealth: -4 },
            setFlags: ["kept_the_family_close"],
          },
        ],
      },
      next: "sc:fix:close",
    },
    {
      id: "sc:fix:close",
      sense: "taste",
      prose: [
        "Years later the salt of the harbour gives way to the dust of a city that does not know your name yet.",
        "What you pass on now will outlast you — a foothold, a name, a hunger handed down.",
      ],
      decision: {
        tier: "major",
        prompt: "The line must carry forward. What do you build it on?",
        options: [
          {
            text: "Take a partner; raise heirs to inherit the ledger.",
            motivatorShift: { lineage: 10, wealth: 4 },
            setFlags: ["founded_household"],
            succession: { takesPartner: true, begets: 2 },
          },
          {
            text: "Spend your years building alone; let the heirs come later.",
            motivatorShift: { power: 6 },
            setFlags: ["built_alone"],
          },
          {
            text: "Take in a younger cousin's children as your own.",
            motivatorShift: { lineage: 6, honor: 4 },
            setFlags: ["adopted_kin"],
            succession: { takesPartner: false, begets: 1 },
          },
        ],
      },
    },
  ],
});
