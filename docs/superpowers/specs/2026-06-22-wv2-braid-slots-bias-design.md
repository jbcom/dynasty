---
title: WV-2 — Braid Slots + Bias-Weighted Emergent Weaving
updated: 2026-06-22
status: draft
domain: technical
---

# WV-2 — braid slots + bias-weighted weaving (the emergent intersection model)

Replaces WV-1's interim curated `INTERSECTION_POINTS` table. The user's model: GenAI tags prose with
braid SLOTS; at runtime, bias-weighted era-gated dynasty pairs weave at those slots, BORROWING the other
line's already-authored copy — so almost no bespoke per-pair writing.
([[braid-slots-genai-architecture]], [[emergent-cause-effect-sim]], [[intersections-woven-not-walls]])

## Use cases (enumerate first)

1. A scene paragraph is a place another line could ENTER the player's story (a street corner, a market,
   a dock) → a **destination anchor**.
2. A scene paragraph is a vignette of the played line OTHERS could meet (the Jewish peddler selling
   wares) → a **source position** (its prose is borrowable by another line's destination anchor).
3. At a move, decide IF a crossing fires (bias-weighted, seeded) and WHICH line — from the era-eligible
   pool (later dynasties auto-enter past their era), weighted by place/archetype/class overlap.
4. When it fires: borrow the chosen source line's slot prose, weave it at this scene's destination
   anchor (WV-1 render). When it doesn't: the scene reads as authored (no crossing).
5. Determinism: the fire/which rolls are seeded via createRng — emergent but replay-identical.

## Schema

Extend `SceneSchema` with `braidSlots`:

```ts
export const BraidSlotSchema = z.object({
  kind: z.enum(["source", "destination"]),
  at: z.number().int().min(0),        // paragraph index in scene.prose the slot sits at/after
  // What KIND of meeting this slot supports (a market, a journey, a workplace…) — used to match a
  // source to a plausible destination, and to bias by place/era.
  setting: z.string().min(1),
  // For a source: a one-line borrowable vignette of this line at that setting (the peddler line).
  // For a destination: absent (it borrows the source's vignette).
  vignette: z.string().optional(),
});
export type BraidSlot = z.infer<typeof BraidSlotSchema>;
// SceneSchema gains: braidSlots: z.array(BraidSlotSchema).default([])
```

`ThreadRef` (WV-1) stays the runtime carrier — the selector builds a ThreadRef from a matched
(source slot → destination slot) pair, putting the borrowed vignette into `crossing`.

## GenAI slot-tagging pass (scoped-QA)

A new pass in the scoped-QA pipeline ([[mmm-scoped-qa-pipeline]], gemini-3.5-flash): given a scene's
prose, tag paragraphs with braid slots — destination anchors where another line could plausibly enter,
source positions (with a borrowable vignette) where this line is doing something meetable. Scoped at the
SCENE level (a slot is a per-scene property). Output validated by zod; merged into the scene like the
other passes (no loader change — same merge path as `thread[]`).

## Runtime selector (bias-weighted, era-gated)

At each move, for the player's current scene's destination anchors:
- Build the eligible partner pool: lines whose era window includes the current year (LATER dynasties
  auto-enter past their founding era).
- For each, compute a BIAS weight = overlap of (place × archetype × class × setting) — how likely these
  two plausibly meet here.
- Seeded roll (createRng.fork("braid")) against the summed weights decides IF + WHICH partner.
- On a hit: pick a matching source slot from the partner's corpus (same `setting`), build a ThreadRef
  with the borrowed `vignette` as `crossing` + a relation derived from the two lines' strategies, set it
  on the scene's `thread[]`. WV-1's render weaves it in.
- No hit: no thread; scene reads as authored.

Bias tuning + slot tagging is the only "curation" — far lighter than per-pair prose.

## Build order

1. Schema: `BraidSlotSchema` + `SceneSchema.braidSlots`; unit-test parse/defaults.
2. Runtime selector (pure, seeded): eligible-pool + bias-weight + roll + ThreadRef build; unit-test
   determinism + era-gating + that no-hit leaves the scene unthreaded.
3. Wire the selector into the move/clock path (replaces the curated weaveThreads as the thread source).
4. GenAI slot-tagging pass in scoped-QA + a small authored seed set so it works before a full pass.
5. Live-verify in Chrome: reach a destination anchor; confirm a bias-eligible partner sometimes weaves
   in (seed-varied), borrowing real copy; sometimes the scene reads alone.

Keep the rolls seeded (replay-identical) and the weave render Svelte+CSS (no asset).
